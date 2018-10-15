import { assert } from 'chai';
import { suite, test } from 'mocha-typescript';

import { MailMerger } from './mail-merger';

@suite('MailMerger Tester')
class MailMergerTester {
  @test('should sent email')
  public async sendEmail() {
    const smtp = 'smtp://username:password@your_smtp_server:port/?pool=true&secure=false';
    const merger = new MailMerger(smtp);

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

    const count = await merger.send(ctx, tmp, mail);
    assert.equal(count, 2);
  }
}
