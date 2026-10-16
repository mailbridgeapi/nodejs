import test from 'node:test';
import assert from 'node:assert/strict';
import {MailBridgeAPI, MailBridgeAPIError} from '../src/index.js';

test('mailboxStatus sends both authentication headers', async () => {
  let observed;
  const client = new MailBridgeAPI({
    accountKey: 'account_test',
    mailboxKey: 'mailbox_test',
    fetchImpl: async (url, options) => {
      observed = {url: String(url), options};
      return new Response(JSON.stringify({ok: true, data: {}, meta: {}}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      });
    },
  });
  await client.mailboxStatus();
  assert.equal(observed.url, 'https://api.mailbridgeapi.com/mailbox/status/');
  assert.equal(observed.options.headers['X-API-Key'], 'account_test');
  assert.equal(observed.options.headers['X-Mailbox-Key'], 'mailbox_test');
});

test('sendEmail uses legacy form fields and checks the result', async () => {
  let body;
  const client = new MailBridgeAPI({
    accountKey: 'account_test',
    mailboxKey: 'mailbox_test',
    fetchImpl: async (_url, options) => {
      body = options.body;
      return new Response(
        JSON.stringify({result: {error: '0', sent: 'OK', id: 'message_1'}}),
        {status: 200, headers: {'Content-Type': 'application/json'}},
      );
    },
  });
  const result = await client.sendEmail({
    recipient_email: 'customer@example.com',
    mail_subject: 'Hello',
    mail_body: 'Test',
  });
  assert.equal(body.get('apikey'), 'account_test');
  assert.equal(body.get('apikeybox'), 'mailbox_test');
  assert.equal(result.result.id, 'message_1');
});

test('modern API errors expose the request id', async () => {
  const client = new MailBridgeAPI({
    accountKey: 'account_test',
    mailboxKey: 'mailbox_test',
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          ok: false,
          error: {code: 'invalid_parameter', message: 'Invalid value.'},
          meta: {request_id: 'req_123'},
        }),
        {status: 400, headers: {'Content-Type': 'application/json'}},
      ),
  });
  await assert.rejects(
    () => client.mailboxStatus(),
    error => error instanceof MailBridgeAPIError && error.requestId === 'req_123',
  );
});

