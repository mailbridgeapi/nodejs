<p align="center">
  <img src="https://raw.githubusercontent.com/mailbridgeapi/mailbridgeapi/main/assets/logo-mark.png" alt="MailBridgeAPI logo" width="112">
</p>

# MailBridgeAPI for JavaScript

Official JavaScript and TypeScript client for all public MailBridgeAPI endpoints. It uses the native Fetch API and requires no runtime dependency.

## Requirements

- Node.js 18 or newer
- A MailBridgeAPI account key and mailbox key

## Installation

```bash
npm install @mailbridgeapi/client
```

Until the first npm release, install directly from this GitHub repository.

## Send an email

```js
import {MailBridgeAPI} from '@mailbridgeapi/client';

const mail = new MailBridgeAPI({
  accountKey: process.env.MAILBRIDGE_ACCOUNT_KEY,
  mailboxKey: process.env.MAILBRIDGE_MAILBOX_KEY,
});

const result = await mail.sendEmail({
  recipient_email: 'customer@example.com',
  mail_subject: 'Order update',
  mail_body: '<p>Your order is ready.</p>',
  format: 'html',
  from_source: 'node-application',
});

console.log(result.result.id);
```

## Read and monitor

```js
const status = await mail.mailboxStatus();
const received = await mail.listReceived({per_page: 10});
const errors = await mail.listSent({status: 'error'});
const activity = await mail.activity(30);
const matches = await mail.searchEmails('order 12345');
```

All methods are typed through the included TypeScript declarations. See the [complete API documentation](https://github.com/mailbridgeapi/mailbridgeapi).

## Security

Use this client in server-side Node.js code. Do not place account or mailbox keys in browser bundles.

