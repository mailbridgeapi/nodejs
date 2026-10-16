export interface MailBridgeAPIOptions {
  accountKey: string;
  mailboxKey: string;
  baseUrl?: string;
  timeout?: number;
  fetchImpl?: typeof fetch;
}

export interface SendEmailInput {
  recipient_email: string;
  mail_subject: string;
  mail_body: string;
  format?: 'html' | 'text';
  sender_name?: string;
  sender_email?: string;
  reply_name?: string;
  reply_email?: string;
  from_source?: string;
  skip_sent_copy?: boolean | number;
  [key: string]: string | number | boolean | undefined;
}

export class MailBridgeAPIError extends Error {
  status: number;
  response: unknown;
  requestId: string | null;
}

export class MailBridgeAPI {
  constructor(options: MailBridgeAPIOptions);
  health(): Promise<any>;
  mailboxStatus(): Promise<any>;
  mailboxInsights(days?: number): Promise<any>;
  sendEmail(message: SendEmailInput): Promise<any>;
  getEmail(options?: {folder?: string; start?: number}): Promise<any>;
  listUnsubscribed(options?: {email?: string}): Promise<any>;
  listSent(filters?: Record<string, string | number | boolean>): Promise<any>;
  listReceived(filters?: Record<string, string | number | boolean>): Promise<any>;
  getMessage(options: {direction: 'sent' | 'received'; id: string}): Promise<any>;
  searchEmails(query: string, filters?: Record<string, string | number | boolean>): Promise<any>;
  activity(days?: number): Promise<any>;
  validateEmail(message: SendEmailInput): Promise<any>;
}

