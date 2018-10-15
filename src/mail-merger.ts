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
   * @param {string} [url] smtp server connection url. Refer: https://nodemailer.com/smtp/
   * @param {any} [opts] global options for the MailMerger. See `defaults` for details
   */
  public constructor(url?: string, opts?: any) {
    if (url && !_.isString(url)) {
      opts = url;
      url = undefined;
    }
    if (opts) {
      this.config = _.merge({}, this.config, opts);
    }
    if (url) {
      this.config.url = url;
    }
    this.transporter = createTransport(this.config.url, this.config.smtp);
  }

  /**
   * generates & sends emails based on provided context (json or csv) & email template
   * @param {string | object} context of the emails, which can be an object or string. Accepts string: 1). path to a csv/json file; 2). json string
   * @param { html: string, attachments?: string[] } html string or path to a html file; attachments can be set by an array of file paths
   * @param {NodeMailer.SendMailOptions} can contain Handlebars templates
   * @returns {Promise<number>} number of emails sent out
   */
  public async send(
    context: string | object,
    template: { html: string, attachments?: string[] },
    mail: { from?: string, to?: string, cc?: string, bcc?: string, subject?: string }): Promise<number> {
    const ctx = await this.getContext(context);
    const html = await this.readText(template.html);
    mail['html'] = html;
    mail = _.merge({}, this.config.mail, mail);
    if (template.attachments && template.attachments.length > 0) {
      mail['attachments'] = this.prepareAttachments(template.attachments);
    }
    const arr = _.isArray(ctx) ? ctx : [ctx];
    let count = 0;
    const queue = [];
    for (const c of arr) {
      queue.push(this.sendMail(mail, c));
      count++;
    }
    await Promise.all(queue);
    return count;
  }

  private readText(path: string): Promise<string> {
    const resolvedPath = Path.resolve(path);
    if (Fs.existsSync(resolvedPath)) {
      return new Promise((resolve, reject) => {
        Fs.readFile(resolvedPath, 'utf8', (err, str) => {
          if (err) {
            reject(err);
          } else {
            resolve(str);
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
    const csvKey = this.config.csv.key;
    const indicator = this.config.csv.indicator;
    const results = [];

    return new Promise((resolve, reject) => {
      Csv().fromString(csv)
        .subscribe((json) => {
          // only combine csv rows when both primary key (id) & the indicator set
          if (csvKey && indicator) {
            // transform columns with array like headers to array
            _.keys(json).forEach((key) => {
              if (key.search(indicator) > -1) {
                json[key.replace(indicator, '')] = [json[key]];
                delete json[key];
              }
            });
            // check if duplicated item found based on the primary key field
            const found = _.find(results, (r) => {
              return r[csvKey] === json[csvKey];
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
    return arr.map((p) => {
      return {
        filename: Path.basename(p),
        path: Path.resolve(p),
        cid: Path.basename(p),
      };
    });
  }

  private sendMail(mail: SendMailOptions, context: any): Promise<void> {
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
    return this.transporter.sendMail(m);
  }

  private compile(template: string, context: any): string {
    if (template) {
      return Handlebars.compile(template)(context);
    }
  }
}