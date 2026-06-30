import { Resend } from "resend";
import { EmailProvider, ProviderMessage } from "./EmailProvider";
import { createCircuitBreaker } from "../../libs/circuitBreaker";

type SendPayload = Parameters<Resend["emails"]["send"]>[0];

const resendBreaker = createCircuitBreaker(
  "resend",
  async (client: Resend, payload: SendPayload) => {
    const { data, error } = await client.emails.send(payload);
    if (error) throw new Error(error.message);
    if (!data?.id) throw new Error("Provedor nao retornou o id da mensagem");
    return data;
  },
  { timeout: 10000 }
);

class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: ProviderMessage): Promise<{ id: string }> {
    const data = await resendBreaker.fire(this.client, {
      from: message.from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      attachments: message.attachments
    });
    return { id: data.id };
  }
}

export default ResendEmailProvider;
