/**
 * Safe template variable substitution.
 * Missing variables render as empty string.
 */
export function renderTemplateString(template, variables = {}) {
  if (!template) return "";
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = variables[key];
    if (val === undefined || val === null) return "";
    return String(val);
  });
}

export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildEmailLayout({ title, bodyHtml, ctaLabel, ctaUrl, footerNote }) {
  const safeTitle = escapeHtml(title);
  const prefsUrl = `${(process.env.FRONTEND_URLS || "http://localhost:5173").split(",")[0].trim()}/student/profile`;
  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<p style="margin:28px 0 0;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">${escapeHtml(ctaLabel)}</a></p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#4f46e5;padding:20px 28px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Campus2Career</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">Campus2Career — Your campus-to-career platform</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                <a href="${prefsUrl}" style="color:#6366f1;text-decoration:none;">Notification preferences</a>
                &nbsp;·&nbsp; Support: support@campus2career.com
              </p>
              ${footerNote ? `<p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">${escapeHtml(footerNote)}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildBodyParagraphs(paragraphs = []) {
  return paragraphs
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${p}</p>`)
    .join("");
}
