import { assert } from 'chai';
import { pending, suite, test } from 'mocha-typescript';

import { MailMerger } from './mail-merger';

@suite('MailMerger Tester')
class MailMergerTester {
  @pending
  @test('should sent email')
  public async sendEmail() {
    const smtp = 'smtp://username:password@your_smtp_server:port/?pool=true&secure=false';
    const merger = new MailMerger(smtp);

    // or place your smtp url into .env file "MM_SMTP", then init MailMerger as below
    // const merger = new MailMerger();

    const ctx = './templates/data.csv';
    const tmp = {
      html: './templates/sample.html',
      attachments: [
        './templates/tick.png',
      ],
    };
    const mail = {
      from: 'sample@sampleonly.com',
      bcc: 'sample@sampleonly.com',
      subject: 'Test - from mail-merger [{{id}}]',
    };

    const summary = await merger.send(ctx, tmp, mail);
    assert.equal(summary.total, 2);
    console.log(summary);
  }
}
