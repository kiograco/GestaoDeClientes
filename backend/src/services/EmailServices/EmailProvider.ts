export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface ProviderMessage {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface EmailProvider {
  readonly name: string;
  send(message: ProviderMessage): Promise<{ id: string }>;
}
