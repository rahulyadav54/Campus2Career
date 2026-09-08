/**
 * Email provider abstraction — swap Resend for another provider later.
 */
export class EmailProvider {
  async send({ to, subject, html, text, from, replyTo, tags }) {
    throw new Error("EmailProvider.send() not implemented");
  }

  isConfigured() {
    return false;
  }
}

export default EmailProvider;
