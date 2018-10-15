import './env-loader';

export const defaults = {
  url: process.env.MM_SMTP, // url of smtp connection, can be placed in .env as MM_SMTP
  smtp: {
    pool: true,
    auth: {
      user: process.env.MM_USER, // should be placed in .env as MM_USER
      pass: process.env.MM_PASS, // should be placed in .env as MM_PASS
    },
  },
  mail: {
    to: '{{to}}',
    from: '{{from}}',
    cc: '{{cc}}',
    bcc: undefined, // '{{bcc}}',
    subject: '{{subject}}',
  },
  // only when the both of the following being set, the csv parser will combine rows
  // this is helpful when you have parent-child relationship in your context data
  // i.e. multiple families in the household
  // id,familyName,members_
  // 1,SMITH,JIM
  // 1,SMITH,TOM
  // 2,JONES,JOHN
  // => [{id: 1, familyName: 'SMITH', members: ['JIM', 'TOM']},
  // =>  {id: 2, familyName: 'JONES', members: ['JOHN']}]
  csv: {
    key: 'id',  // acts like primary key, when multiple rows with the same key, they will be considered as one object
    indicator: /_$/,  // indicates which columns should be considered as array, the indicator will be removed while parsing csv
  },
};

// following is to overcome the bug of NodeMailer. `createTransport` complaints no auth information even when only use as defaults
if (!defaults.smtp.auth.pass && !defaults.smtp.auth.user) {
  delete defaults.smtp.auth;
}
