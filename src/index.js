const DEFAULT_BASE_URL = 'https://api.mailbridgeapi.com';

export class MailBridgeAPIError extends Error {
  constructor(message, {status = 0, response = null, requestId = null} = {}) {
    super(message);
    this.name = 'MailBridgeAPIError';
    this.status = status;
    this.response = response;
    this.requestId = requestId;
  }
}

export class MailBridgeAPI {
  constructor({
    accountKey,
    mailboxKey,
    baseUrl = DEFAULT_BASE_URL,
    timeout = 30_000,
    fetchImpl = globalThis.fetch,
  }) {
    if (!accountKey || !mailboxKey) {
      throw new TypeError('accountKey and mailboxKey are required.');
    }
    if (typeof fetchImpl !== 'function') {
      throw new TypeError('A Fetch API implementation is required.');
    }
    this.accountKey = accountKey;
    this.mailboxKey = mailboxKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeout = timeout;
    this.fetch = fetchImpl;
  }

  health() {
    return this.#request('GET', '/health/', {authenticated: false});
  }

  mailboxStatus() {
    return this.#request('GET', '/mailbox/status/');
  }

  mailboxInsights(days = 30) {
    return this.#request('GET', '/mailbox/insights/', {query: {days}});
  }

  async sendEmail(message) {
    for (const field of ['recipient_email', 'mail_subject', 'mail_body']) {
      if (!String(message?.[field] ?? '').trim()) {
        throw new TypeError(`${field} is required.`);
      }
    }
    const body = new URLSearchParams({
      apikey: this.accountKey,
      apikeybox: this.mailboxKey,
      ...Object.fromEntries(
        Object.entries(message).map(([key, value]) => [key, String(value)]),
      ),
    });
    const response = await this.#request('POST', '/sendemail/', {
      authenticated: false,
      body,
      contentType: 'application/x-www-form-urlencoded',
    });
    if (String(response?.result?.error ?? '1') !== '0') {
      throw new MailBridgeAPIError(
        response?.result?.sent ?? 'Email delivery failed.',
        {status: 200, response},
      );
    }
    return response;
  }

  getEmail({folder = 'INBOX', start = 0} = {}) {
    return this.#request('GET', '/getemail/', {
      authenticated: false,
      query: {
        apikey: this.accountKey,
        apikeybox: this.mailboxKey,
        mbox: folder,
        start,
      },
    });
  }

  listUnsubscribed({email} = {}) {
    return this.#request('GET', '/email/unsubscribed/', {
      authenticated: false,
      query: {
        apikey: this.accountKey,
        apikeybox: this.mailboxKey,
        ...(email ? {email} : {}),
      },
    });
  }

  listSent(filters = {}) {
    return this.#request('GET', '/email/sent/', {query: filters});
  }

  listReceived(filters = {}) {
    return this.#request('GET', '/email/received/', {query: filters});
  }

  getMessage({direction, id}) {
    if (!['sent', 'received'].includes(direction)) {
      throw new TypeError('direction must be sent or received.');
    }
    return this.#request('GET', '/email/message/', {query: {direction, id}});
  }

  searchEmails(query, filters = {}) {
    if (!String(query).trim()) throw new TypeError('query is required.');
    return this.#request('GET', '/email/search/', {
      query: {...filters, query},
    });
  }

  activity(days = 30) {
    return this.#request('GET', '/email/activity/', {query: {days}});
  }

  validateEmail(message) {
    return this.#request('POST', '/email/validate/', {body: message});
  }

  async #request(
    method,
    path,
    {query = {}, body, contentType = 'application/json', authenticated = true} = {},
  ) {
    const url = new URL(this.baseUrl + '/' + path.replace(/^\/+/, ''));
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    const headers = {Accept: 'application/json'};
    if (authenticated) {
      headers['X-API-Key'] = this.accountKey;
      headers['X-Mailbox-Key'] = this.mailboxKey;
    }
    let requestBody;
    if (body !== undefined) {
      headers['Content-Type'] = contentType;
      requestBody = contentType === 'application/json' ? JSON.stringify(body) : body;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    let response;
    try {
      response = await this.fetch(url, {
        method,
        headers,
        body: requestBody,
        signal: controller.signal,
      });
    } catch (error) {
      const message =
        error?.name === 'AbortError'
          ? 'MailBridgeAPI request timed out.'
          : `MailBridgeAPI network error: ${error?.message ?? 'unknown error'}`;
      throw new MailBridgeAPIError(message);
    } finally {
      clearTimeout(timer);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new MailBridgeAPIError('MailBridgeAPI returned invalid JSON.', {
        status: response.status,
      });
    }

    if (!response.ok || (authenticated && data?.ok === false)) {
      throw new MailBridgeAPIError(
        data?.error?.message ?? 'MailBridgeAPI request failed.',
        {
          status: response.status,
          response: data,
          requestId: data?.meta?.request_id ?? null,
        },
      );
    }
    return data;
  }
}

