import * as Csv from 'csvtojson';
import * as Fs from 'fs';
import * as Handlebars from 'handlebars';
import * as _ from 'lodash';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import * as Path from 'path';

import { defaults } from './defaults';

export class MailMerger {
  private config = defaults;
  private transporter: Transporter;

  /**
   * constructor
   * @param {string | any} [opts] global options for the MailMerger. See `defaults` for details. When string, consider it as smtp connection url
   */
  public constructor(opts?: string | any) {
    if (opts) {
      if (_.isString(opts)) {
        opts = { smtp: opts };
      }
      this.config = _.merge({}, this.config, opts);
    }
    this.transporter = createTransport(this.config.smtp);
  }

  /**
   * generates & sends emails based on provided context (json or csv) & email template
   * @param {string | object} context of the emails, which can be an object or string. Accepts string: 1). path to a csv/json file; 2). json string
   * @param { html: string, attachments?: string[] } html string or path to a html file; attachments can be set by an array of file paths
   * @param {NodeMailer.SendMailOptions} can contain Handlebars templates
   * @returns {Promise<{ total: number, sent: number, failures?: any[] }>} delivery summary with total number of mails in the delivery queue, number sent out & failures
   */
  public async send(
    context: string | object,
    template: { html: string, attachments?: string[] },
    mail?: { from?: string, to?: string, cc?: string, bcc?: string, subject?: string }
  ): Promise<{ total: number, sent: number, failures?: any[] }> {
    const ctx = await this.getContext(context);
    const html = await this.readText(template.html);
    const attachments = this.prepareAttachments(template.attachments);

    mail = _.merge({}, this.config.mail, { html, attachments }, mail);

    const arr = _.isArray(ctx) ? ctx : [ctx];
    let count = 0;
    const queue = [];
    for (const c of arr) {
      queue.push(this.sendMail(mail, c));
      count++;
    }
    const results = await Promise.all(queue);

    this.transporter.close();

    const total = count;
    const sent = results.filter((val) => !!!val.error).length;
    const failures = results.filter((val) => !!val.error).map((val) => ({ id: val.id, error: val.error.message }));

    return { total, sent, failures };
  }

  /**
   * remove BOM in UTF-8
   * @param str
   */
  private removeBom(str) {
    if (str?.charCodeAt(0) === 0xFEFF) {
      return str.slice(1);
    }
    return str;
  }

  private readText(path: string): Promise<string> {
    const resolvedPath = Path.resolve(path);
    if (Fs.existsSync(resolvedPath)) {
      return new Promise((resolve, reject) => {
        Fs.readFile(resolvedPath, 'utf8', (err, str) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.removeBom(str));
          }
        });
      });
    }
    return Promise.resolve(path);
  }

  private getContext(str: string | object): Promise<any> {
    if (_.isString(str)) {
      return this.readText(str).then((val) => {
        if (str.endsWith('.csv')) {
          // parse csv file
          return this.parseCsv(val);
        } else {
          return JSON.parse(val);
        }
      });
    } else {
      return Promise.resolve(str);
    }
  }

  private parseCsv(csv: string): Promise<any> {
    const merge = this.config.context.merge;
    const csvKey = this.config.context.key;
    const indicator = this.config.context.arrayIndicator;
    const results = [];

    return new Promise((resolve, reject) => {
      Csv({ checkType: true, ignoreEmpty: true }).fromString(csv)
        .subscribe((json) => {
          // only combine csv rows when both primary key (id) & the indicator set
          if (merge && csvKey && indicator) {
            // transform columns with array like headers to array
            _.keys(json).forEach((key) => {
              if (key.search(indicator) > -1) {
                json[key.replace(indicator, '')] = [json[key]];
                delete json[key];
              }
            });
            // check if duplicated item found based on the primary key field
            const found = _.find(results, (r) => {
              return r[csvKey] != null && r[csvKey] === json[csvKey];
            });
            if (found) {
              // merge with concat array items
              _.mergeWith(found, json, (objVal, srcVal) => {
                if (_.isArray(objVal)) {
                  return objVal.concat(srcVal);
                }
              });
            } else {
              results.push(json);
            }
          } else {
            results.push(json);
          }
        }, (err) => {
          reject(err);
        }, () => {
          resolve(results);
        });
    });
  }

  private prepareAttachments(arr: string[]): any[] {
    return arr?.map((p) => {
      return {
        filename: Path.basename(p),
        path: Path.resolve(p),
        cid: Path.basename(p),
      };
    });
  }

  private sendMail(mail: SendMailOptions, context: any): Promise<{ id: any, error?: any, info?: any }> {
    const key = this.config.context.key;
    // compile mail
    const m = {
      to: this.compile(mail.to as string, context),
      from: this.compile(mail.from as string, context),
      cc: this.compile(mail.cc as string, context),
      bcc: this.compile(mail.bcc as string, context),
      subject: this.compile(mail.subject, context),
      html: this.compile(mail.html as string, context),
      attachments: mail.attachments,
    };
    // send mail
    // always resolve the promise and indicates the failures with error message in the return result
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(m, (error, info) => {
        if (error) {
          resolve({
            id: context[key] || m.to || m.subject,
            error,
          });
        } else {
          resolve({
            id: context[key] || m.to || m.subject,
            info,
          });
        }
      });
    });
  }

  private compile(template: string, context: any): string {
    if (template) {
      return Handlebars.compile(template)(context);
    }
  }
}
