# mail-merger

[![NPM version][npm-image]][npm-url]
[![Downloads][download-badge]][npm-url]

Tool of mail merge, which takes {{mustache}} email templates and data from json or csv to generate and bulk send emails.

## Features

- Generates emails from html templates based on [handlebars](http://handlebarsjs.com/)
- Sends emails via [NodeMailer](https://nodemailer.com/)
- Parse data defined in csv file and/or json as the context of emails
- Merge/combine multiple lines of rows in csv into one big record with array properties
- Use in your scripts and/or CLI
- Supports `.env` file for security related settings (i.e. SMTP details, username & password)

## Installation
```
npm install mail-merger --save
```

## Usage

### CLI
```sh
## use `mail-merger --help` for more details
$ mail-merger -c=./data.csv -t=./sample.html -a=./img1.png -a=./img2.png
```

### API
```js
import { MailMerger } from 'mail-merger';

// refer to `defaults.ts` for all details of the options
const merger = new MailMerger(smtp, opts);
// refer to `mail-merger.spec.ts` for more details
const count = await merger.send(context, template, mailOpts);

console.log(`Total of ${count} emails have been sent.`);
```

#### NOTE
> ## Please ensure change smtps variable to your SMTP settings prior running tests ##

### Example
Please refer to the test files `cli.spec.ts` and `mail-merger.spec.ts` in the source code

## License
MIT

[npm-url]: https://www.npmjs.com/package/mail-merger
[npm-image]: https://img.shields.io/npm/v/mail-merger.svg?style=flat-square
[download-badge]: https://img.shields.io/npm/dm/mail-merger.svg?style=flat-square 