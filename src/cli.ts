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
      user: {
        alias: 'u',
        describe: 'user name of smtp email account',
        type: 'string',
        group: 'smtp',
      },
      pass: {
        alias: 'p',
        describe: 'password of smtp email account',
        type: 'string',
        group: 'smtp',
      },
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

  const url = argv['smtp'] || defaults.url;
  const smpt = _.merge({}, defaults.smtp);
  if (argv['user']) {
    smpt.auth.user = argv['user'];
  }
  if (argv['pass']) {
    smpt.auth.user = argv['pass'];
  }

  const mm = new MailMerger(url, smpt);
  const mail = {
    from: argv['from'] || defaults.mail.from,
    to: argv['to'] || defaults.mail.to,
    cc: argv['cc'] || defaults.mail.cc,
    bcc: argv['bcc'] || defaults.mail.bcc,
    subject: argv['subject'] || defaults.mail.subject,
  };

  const count = await mm.send(
    argv['context'],
    { html: argv['template'], attachments: argv['attachments'] },
    mail);

  console.log(`Total of ${count} emails have been sent.`);
}
