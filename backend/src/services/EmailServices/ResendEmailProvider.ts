import { Resend } from "resend";
import { EmailProvider, ProviderMessage } from "./EmailProvider";

class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: ProviderMessage): Promise<{ id: string }> {
    const { data, error } = await this.client.emails.send({
      from: message.from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      attachments: message.attachments
    });
    if (error) throw new Error(error.message);
    if (!data?.id) throw new Error("Provedor nao retornou o id da mensagem");
    return { id: data.id };
  }
}

export default ResendEmailProvider;
