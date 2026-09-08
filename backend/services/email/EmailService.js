import EmailLog from "../../models/EmailLog.js";
import EmailTemplate from "../../models/EmailTemplate.js";
import { renderDefaultTemplate, getDefaultTemplate } from "./emailTemplates.js";
import { renderTemplateString } from "./templateRenderer.js";
import ResendEmailProvider from "./providers/ResendEmailProvider.js";

const provider = new ResendEmailProvider();
const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 4 * 60 * 60_000];

class EmailService {
  static isConfigured() {
    return provider.isConfigured();
  }

  /** Seed default templates into DB if missing */
  static async seedTemplates() {
    const { DEFAULT_TEMPLATES } = await import("./emailTemplates.js");
    for (const def of DEFAULT_TEMPLATES) {
      const existing = await EmailTemplate.findOne({ key: def.key });
      if (!existing) {
        const sample = def.build({ user_name: "Rahul", job_title: "AI/ML Intern", company_name: "Example Company" });
        await EmailTemplate.create({
          key: def.key,
          name: def.name,
          subject: def.subject,
          htmlBody: sample.html,
          textBody: sample.text,
          category: def.category || "transactional",
          variables: def.variables || [],
          description: def.description || "",
        });
      }
    }
  }

  /** Render template from DB or fallback to code defaults */
  static async renderTemplate(templateKey, variables = {}) {
    const dbTemplate = await EmailTemplate.findOne({ key: templateKey, isActive: true });
    if (dbTemplate) {
      const subject = renderTemplateString(dbTemplate.subject, variables);
      const html = renderTemplateString(dbTemplate.htmlBody, variables);
      const text = renderTemplateString(dbTemplate.textBody || "", variables);
      return { subject, html, text };
    }
    const rendered = renderDefaultTemplate(templateKey, variables);
    if (!rendered) throw new Error(`Unknown email template: ${templateKey}`);
    return rendered;
  }

  /**
   * Queue an email for async delivery (non-blocking).
   * Returns EmailLog document.
   */
  static async queueEmail({
    userId = null,
    recipient,
    eventType,
    templateKey,
    variables = {},
    idempotencyKey = null,
    isTest = false,
    metadata = {},
  }) {
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      console.warn(`[EmailService] Invalid recipient skipped: ${recipient}`);
      return null;
    }

    if (idempotencyKey) {
      const dup = await EmailLog.findOne({ idempotencyKey });
      if (dup) {
        console.log(`[EmailService] Duplicate skipped: ${idempotencyKey}`);
        return dup;
      }
    }

    let subject, html, text;
    try {
      const rendered = await this.renderTemplate(templateKey, variables);
      subject = rendered.subject;
      html = rendered.html;
      text = rendered.text;
      if (isTest) {
        subject = `[TEST] ${subject}`;
        html = html.replace("<body", '<body data-test="true"');
      }
    } catch (err) {
      console.error(`[EmailService] Template render failed (${templateKey}):`, err.message);
      return null;
    }

    try {
      const log = await EmailLog.create({
        userId,
        recipient,
        eventType,
        templateKey,
        subject,
        status: "PENDING",
        idempotencyKey: idempotencyKey || undefined,
        isTest,
        metadata: { ...metadata, variables, html, text },
      });
      // Process async — don't block caller
      setImmediate(() => this.processLog(log._id).catch((e) => console.error("[EmailService] process error:", e.message)));
      return log;
    } catch (err) {
      if (err.code === 11000) {
        console.log(`[EmailService] Idempotency conflict: ${idempotencyKey}`);
        return await EmailLog.findOne({ idempotencyKey });
      }
      console.error("[EmailService] Queue failed:", err.message);
      return null;
    }
  }

  /** Send immediately (used by queue processor and test emails) */
  static async sendNow(emailLog) {
    if (!provider.isConfigured()) {
      await EmailLog.findByIdAndUpdate(emailLog._id, {
        status: "FAILED",
        errorMessage: "Email provider not configured",
        attemptCount: (emailLog.attemptCount || 0) + 1,
      });
      return { success: false, reason: "not_configured" };
    }

    const meta = emailLog.metadata || {};
    const html = meta.html;
    const text = meta.text;

    await EmailLog.findByIdAndUpdate(emailLog._id, { status: "SENDING", attemptCount: (emailLog.attemptCount || 0) + 1 });

    try {
      const result = await provider.send({
        to: emailLog.recipient,
        subject: emailLog.subject,
        html,
        text,
        tags: { event: emailLog.eventType, template: emailLog.templateKey },
      });

      await EmailLog.findByIdAndUpdate(emailLog._id, {
        status: "SENT",
        providerMessageId: result.messageId,
        sentAt: new Date(),
        errorMessage: null,
      });

      console.log(`[EmailService] Sent ${emailLog.templateKey} → ${emailLog.recipient} (${result.messageId})`);
      return { success: true, messageId: result.messageId };
    } catch (err) {
      const attempt = (emailLog.attemptCount || 0) + 1;
      const shouldRetry = attempt < MAX_ATTEMPTS;
      const delay = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];

      await EmailLog.findByIdAndUpdate(emailLog._id, {
        status: shouldRetry ? "RETRYING" : "FAILED",
        errorMessage: err.message,
        attemptCount: attempt,
        nextRetryAt: shouldRetry ? new Date(Date.now() + delay) : null,
      });

      console.error(`[EmailService] Send failed (attempt ${attempt}):`, err.message);
      return { success: false, reason: err.message };
    }
  }

  static async processLog(logId) {
    const log = await EmailLog.findById(logId);
    if (!log || !["PENDING", "RETRYING"].includes(log.status)) return;
    if (log.nextRetryAt && log.nextRetryAt > new Date()) return;
    return this.sendNow(log);
  }

  /** Process pending/retrying emails — called by background worker */
  static async processQueue(limit = 20) {
    const now = new Date();
    const pending = await EmailLog.find({
      status: { $in: ["PENDING", "RETRYING"] },
      $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
    })
      .sort({ createdAt: 1 })
      .limit(limit);

    for (const log of pending) {
      await this.sendNow(log);
    }
    return pending.length;
  }

  /** Handle Resend webhook delivery events */
  static async handleWebhookEvent(eventType, data) {
    const messageId = data?.email_id || data?.id;
    if (!messageId) return;

    const log = await EmailLog.findOne({ providerMessageId: messageId });
    if (!log) return;

    const statusMap = {
      "email.delivered": "DELIVERED",
      "email.bounced": "BOUNCED",
      "email.complained": "COMPLAINED",
      "email.delivery_delayed": "SENT",
      "email.sent": "SENT",
    };

    const newStatus = statusMap[eventType];
    if (!newStatus) return;

    const update = { status: newStatus };
    if (newStatus === "DELIVERED") update.deliveredAt = new Date();
    if (newStatus === "BOUNCED" || newStatus === "COMPLAINED") {
      update.errorMessage = data?.bounce?.message || data?.complaint?.feedback_type || eventType;
    }

    await EmailLog.findByIdAndUpdate(log._id, update);
  }

  static async getStats({ since } = {}) {
    const filter = since ? { createdAt: { $gte: since } } : {};
    const [sent, delivered, failed, pending] = await Promise.all([
      EmailLog.countDocuments({ ...filter, status: { $in: ["SENT", "DELIVERED"] } }),
      EmailLog.countDocuments({ ...filter, status: "DELIVERED" }),
      EmailLog.countDocuments({ ...filter, status: { $in: ["FAILED", "BOUNCED"] } }),
      EmailLog.countDocuments({ ...filter, status: { $in: ["PENDING", "RETRYING", "SENDING"] } }),
    ]);
    return { sent, delivered, failed, pending, total: sent + failed + pending };
  }
}

export default EmailService;
