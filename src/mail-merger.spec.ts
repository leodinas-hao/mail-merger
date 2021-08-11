import { pending, suite, test } from '@testdeck/mocha';
import { assert } from 'chai';

import { MailMerger } from './mail-merger';

@suite('mail-merger.spec')
class MailMergerTester {
  @pending
  @test('should sent email')
  public async sendEmail() {
    // ensure hare your smtp url in .env file "MM_SMTP"
    const merger = new MailMerger();

    // Or setup smtp inline here
    // const smtp = 'smtp://username:password@your_smtp_server:port/?pool=true&secure=false';
    // const merger = new MailMerger(smtp);

    const ctx = './templates/data.csv';
    const tmp = {
      html: './templates/sample.html',
      attachments: [
        './templates/tick.png',
      ],
    };
    const mail = {
      from: 'sample abc <sample@sampleonly.com>',
      subject: 'Test - from mail-merger [{{id}}]',
    };

    const summary = await merger.send(ctx, tmp, mail);
    assert.equal(summary.total, 2);
    console.log(summary);
  }
}
