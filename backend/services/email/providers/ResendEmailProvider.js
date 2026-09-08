import { Resend } from "resend";
import { EmailProvider } from "./EmailProvider.js";

let resendClient = null;

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export class ResendEmailProvider extends EmailProvider {
  isConfigured() {
    return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  }

  getFromAddress() {
    const email = process.env.RESEND_FROM_EMAIL;
    const name = process.env.RESEND_FROM_NAME || "Campus2Career";
    return `${name} <${email}>`;
  }

  async send({ to, subject, html, text, replyTo, tags = {} }) {
    const client = getClient();
    if (!client) {
      throw new Error("Resend is not configured (missing RESEND_API_KEY)");
    }
    if (!process.env.RESEND_FROM_EMAIL) {
      throw new Error("Resend sender not configured (missing RESEND_FROM_EMAIL)");
    }

    const payload = {
      from: this.getFromAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || undefined,
      reply_to: replyTo || undefined,
      tags: Object.entries(tags).map(([name, value]) => ({ name, value: String(value) })),
    };

    const { data, error } = await client.emails.send(payload);
    if (error) {
      const msg = error.message || JSON.stringify(error);
      throw new Error(msg);
    }
    return { messageId: data?.id || null, provider: "resend" };
  }
}

export default ResendEmailProvider;
