import { assert } from 'chai';
import { pending, suite, test } from 'mocha-typescript';

import { cli } from './cli';

@suite('cli tester')
class CliTester {
  @pending
  @test('should send email from cli')
  public async cliSendMail() {
    await cli([
      `--smtp=smtp://username:password@your_smtp_server:port/?pool=true&secure=false`,
      // you can also put your smtp url into .env as MM_SMTP, then you don't need the above line
      `-c=./templates/data.csv`,
      `-t=./templates/sample.html`,
      `-a=./templates/tick.png`,
      `-s=Test - from mail-merger [{{id}}]`,
      `--from=sample@sampleonly.com`,
      `--bcc=sample@sampleonly.com`,
    ]);
  }

  @test('should display help')
  public async help() {
    await cli([
      '--help',
    ]);
  }
}
