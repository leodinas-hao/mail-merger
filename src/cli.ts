import Table = require('cli-table');
import * as _ from 'lodash';
import * as Yargs from 'yargs';

import { defaults } from './defaults';
import { MailMerger } from './mail-merger';

export async function main() {
  await cli(process.argv.slice(2));
}

export async function cli(args: string | string[]) {
  const yargs = Yargs
    .usage(`Usage: mail-merger [options]`)
    .options({
      smtp: {
        describe: 'connection url of the smtp server',
        type: 'string',
        group: 'smtp',
      },
      context: {
        alias: 'c',
        describe: 'context of the emails. It can be a path to json/csv file or a json string',
        type: 'string',
        demandOption: true,
        group: 'email',
      },
      template: {
        alias: ['html', 'h', 't'],
        describe: 'email template. It can be html or a path to html file',
        type: 'string',
        demandOption: true,
        group: 'email',
      },
      attachments: {
        alias: ['a'],
        describe: 'an array of file paths as email attachments',
        type: 'array',
        string: true,
        group: 'email',
      },
      from: {
        describe: 'from email',
        type: 'string',
        group: 'email',
        default: defaults.mail.from,
      },
      to: {
        describe: 'to email(s)',
        type: 'string',
        group: 'email',
        default: defaults.mail.to,
      },
      cc: {
        describe: `cc'd email(s)`,
        type: 'string',
        group: 'email',
        default: defaults.mail.cc,
      },
      bcc: {
        describe: `bcc'd email(s)`,
        type: 'string',
        group: 'email',
        default: defaults.mail.bcc,
      },
      subject: {
        alias: 's',
        describe: 'email subject',
        type: 'string',
        group: 'email',
        default: defaults.mail.subject,
      },
      merge: {
        describe: 'indicate if to merge csv rows',
        type: 'boolean',
        default: defaults.context.merge,
        group: 'merging',
      },
      key: {
        describe: 'indicate which field is the key for csv row merging',
        type: 'string',
        default: defaults.context.key,
        group: 'merging',
      },
    })
    .version()
    .showHelpOnFail(true)
    .strict()
    .help();

  // parse args
  const argv = yargs.parse(args);

  const mail = {
    from: argv['from'],
    to: argv['to'],
    cc: argv['cc'],
    bcc: argv['bcc'],
    subject: argv['subject'],
  };

  const opts = {
    smtp: argv['smtp'] || undefined,
    mail,
    context: {
      key: argv['key'],
      merge: argv['merge'],
    },
  };

  const mm = new MailMerger(opts);

  const summary = await mm.send(
    argv['context'],
    { html: argv['template'], attachments: argv['attachments'] },
  );

  let table = new Table({ head: ['Total', 'Sent', 'Failure'] });
  table.push([summary.total, summary.sent, summary.failures ? summary.failures.length : 0]);
  console.error('$mail-merger delivery summary:');
  console.info(table.toString());

  if (summary.failures && summary.failures.length > 0) {
    console.error(`The following messages could not be delivered:`);
    table = new Table({ head: ['Id', 'Error'] });
    for (const f of summary.failures) {
      table.push([f.id, f.error]);
    }
    console.log(table.toString());
  }
}
