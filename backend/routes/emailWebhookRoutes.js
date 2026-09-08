import express from "express";
import EmailService from "../services/email/EmailService.js";

const router = express.Router();

/** Resend webhook — verify signature if RESEND_WEBHOOK_SECRET is set */
router.post("/resend", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.type) {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const sig = req.headers["resend-signature"] || req.headers["svix-signature"];
      if (!sig) {
        return res.status(401).json({ message: "Missing webhook signature" });
      }
    }

    await EmailService.handleWebhookEvent(payload.type, payload.data);
    res.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Resend error:", err.message);
    res.status(500).json({ message: "Webhook processing failed" });
  }
});

export default router;
