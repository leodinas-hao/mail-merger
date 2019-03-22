import './env-loader';

export const defaults = {
  smtp: process.env.MM_SMTP, // NodeMailer SMTP transport options or smtp server connection url. Refer: https://nodemailer.com/smtp/
  mail: {
    to: '{{to}}',
    from: '{{from}}',
    cc: '{{cc}}',
    bcc: undefined, // '{{bcc}}',
    subject: '{{subject}}',
  },
  // this is helpful when you have parent-child relationship in your context data
  // i.e. multiple families in the household
  // id,familyName,members_
  // 1,SMITH,JIM
  // 1,SMITH,TOM
  // 2,JONES,JOHN
  // => [{id: 1, familyName: 'SMITH', members: ['JIM', 'TOM']},
  // =>  {id: 2, familyName: 'JONES', members: ['JOHN']}]
  context: {
    key: process.env.MM_KEY || 'id',  // name of the field which is unique (like PK in DB). Default: `id` or set it by env file MM_KEY
    merge: true,  // when true, the csv parser will merge multiple rows with the same key to one record (send out in one email)
    arrayIndicator: /_$/, // indicates which columns should be considered as array, the indicator will be removed while parsing csv
  },
};
