import { pending, suite, test } from '@testdeck/mocha';

import { cli } from './cli';

@suite('cli.spec')
class CliTester {
  @pending
  @test('should send email from cli')
  public async cliSendMail() {
    await cli([
      // you can also put your smtp url into .env as MM_SMTP, then you don't need the below line
      `--smtp=smtp://username:password@your_smtp_server:port/?pool=true&secure=false`,
      `-c=./templates/data.csv`,
      `-t=./templates/sample.html`,
      `-a=./templates/tick.png`,
      `-s=Test - from mail-merger [{{id}}]`,
      `--from=sample abc <sample@sampleonly.com>`,
      `--no-merge`,
      `--key=id`,
    ]);
  }

  // @pending
  @test('should display help')
  public async help() {
    await cli([
      '--help',
    ]);
  }
}
