import * as _ from 'lodash';
import * as Yargs from 'yargs';

import { defaults } from './defaults';
import { MailMerger } from './mail-merger';

export async function main() {
  await cli(process.argv.slice(2));
}

export async function cli(args: string | string[]) {
  const yargs = Yargs
    .usage(`Usage: $0 [options]`)
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
      },
      to: {
        describe: 'to email(s)',
        type: 'string',
        group: 'email',
      },
      cc: {
        describe: `cc'd email(s)`,
        type: 'string',
        group: 'email',
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

  console.info(`[${summary.sent}] out of [${summary.total}] emails were sent out successfully!`);
  if (summary.failures && summary.failures.length > 0) {
    console.error(`The following messages could not be delivered:`);
    for (const f of summary.failures) {
      console.error(`${f.id}`);
    }
  }
}
