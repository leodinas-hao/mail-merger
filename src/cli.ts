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
      },
      subject: {
        alias: 's',
        describe: 'email subject',
        type: 'string',
        group: 'email',
        default: defaults.mail.subject,
      },
    })
    .version()
    .showHelpOnFail(true)
    .strict()
    .help();

  // parse args
  const argv = yargs.parse(args);

  const mm = new MailMerger(argv['smtp'] ? { smtp: argv['smtp'] } : undefined);
  const mail = {
    from: argv['from'] || defaults.mail.from,
    to: argv['to'] || defaults.mail.to,
    cc: argv['cc'] || defaults.mail.cc,
    bcc: argv['bcc'] || defaults.mail.bcc,
    subject: argv['subject'] || defaults.mail.subject,
  };

  const summary = await mm.send(
    argv['context'],
    { html: argv['template'], attachments: argv['attachments'] },
    mail,
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
