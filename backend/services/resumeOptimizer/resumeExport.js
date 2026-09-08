import { getSkillCategories } from "./resumeSchema.js";

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const toPlainText = (content = {}) => {
  const lines = [];
  const p = content.personal || {};
  if (p.name) lines.push(p.name.toUpperCase());
  if (p.tagline) lines.push(p.tagline);
  lines.push([p.email, p.phone, p.location].filter(Boolean).join(" | "));
  lines.push([p.linkedin, p.github].filter(Boolean).join(" | "));
  lines.push("");
  if (content.summary) { lines.push("PROFESSIONAL SUMMARY"); lines.push(content.summary); lines.push(""); }
  if (content.experience?.length) {
    lines.push("EXPERIENCE");
    content.experience.forEach((e) => {
      lines.push(`${e.title} — ${e.company}  ${e.startDate || ""} – ${e.current ? "Present" : e.endDate || ""}`);
      (e.bullets || []).filter(Boolean).forEach((b) => lines.push(`  • ${b}`));
    });
    lines.push("");
  }
  if (content.education?.length) {
    lines.push("EDUCATION");
    content.education.forEach((e) => {
      lines.push(`${e.degree} — ${e.institution}`);
      if (e.gpa) lines.push(`CGPA: ${e.gpa}`);
    });
    lines.push("");
  }
  getSkillCategories(content).forEach((cat) => {
    lines.push(`${cat.category}: ${(cat.items || []).join(", ")}`);
  });
  if (content.spokenLanguages) { lines.push("LANGUAGES"); lines.push(content.spokenLanguages); }
  if (content.projects?.length) {
    lines.push("PROJECTS");
    content.projects.forEach((pr) => {
      lines.push(pr.name);
      if (pr.techStack) lines.push(pr.techStack);
      (pr.bullets || []).filter(Boolean).forEach((b) => lines.push(`  • ${b}`));
    });
  }
  return lines.join("\n");
};

/**
 * Campus2Career ATS HTML export — matches template PDF layout.
 */
export const toExportHtml = (content = {}, template = {}) => {
  const p = content.personal || {};
  const margin = content.formatting?.marginMm || 15;
  const fontSize = content.formatting?.fontSize || 10.5;
  const font = "Calibri, Arial, Helvetica, sans-serif";

  const section = (title, inner) => inner
    ? `<section style="margin-top:12px"><h2 style="font-size:11pt;font-weight:700;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px">${title}</h2>${inner}</section>`
    : "";

  let html = "";

  if (content.summary) {
    html += section("Professional Summary", `<p style="margin:0;text-align:justify">${esc(content.summary)}</p>`);
  }

  if (content.experience?.length) {
    html += section("Experience", content.experience.map((e) => `
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between">
          <div><strong>${esc(e.title)}</strong><br/>${esc(e.company)}</div>
          <div style="font-size:9.5pt;white-space:nowrap">${esc(e.startDate)} – ${e.current ? "Present" : esc(e.endDate)}</div>
        </div>
        <ul style="margin:2px 0 0 14px;padding:0">${(e.bullets || []).filter(Boolean).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      </div>`).join(""));
  }

  if (content.education?.length) {
    html += section("Education", content.education.map((e) => `
      <div style="margin-bottom:6px">
        <strong>${esc([e.degree, e.field].filter(Boolean).join(" – "))}</strong><br/>
        ${esc(e.institution)}<br/>
        <span style="font-size:9.5pt">${e.gpa ? `CGPA: ${esc(e.gpa)}` : ""} ${esc(e.endDate)} ${esc(e.location)}</span>
      </div>`).join(""));
  }

  const cats = getSkillCategories(content);
  if (cats.some((c) => c.items?.length)) {
    html += section("Technical Skills", cats.map((cat) => `
      <div style="display:flex;gap:8px;margin-bottom:2px">
        <strong style="min-width:72px">${esc(cat.category)}</strong>
        <span>${esc((cat.items || []).join(", "))}</span>
      </div>`).join(""));
  }

  if (content.certifications?.length) {
    html += section("Certifications", `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px">${content.certifications.map((c) =>
      `<div><strong>${esc(c.name)}</strong><br/><span style="font-size:9.5pt">${esc(c.issuer)}</span></div>`
    ).join("")}</div>`);
  }

  const langs = content.spokenLanguages || (content.languages || []).map((l) => l.language || l).join(", ");
  if (langs) html += section("Languages", `<p style="margin:0">${esc(langs)}</p>`);

  html += `<div style="page-break-before:always"></div>`;

  if (content.projects?.length) {
    html += section("Projects", content.projects.map((pr) => `
      <div style="margin-bottom:8px">
        <strong>${esc(pr.name)}</strong><br/>
        <em style="font-size:9.5pt">${esc(pr.techStack || (pr.technologies || []).join(" | "))}</em>
        <ul style="margin:2px 0 0 14px;padding:0">${(pr.bullets || []).filter(Boolean).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      </div>`).join(""));
  }

  if (content.achievements?.length) {
    html += section("Achievements", `<ul style="margin:0;padding-left:14px">${content.achievements.map((a) =>
      `<li>${esc(a.title || a.description)}</li>`
    ).join("")}</ul>`);
  }

  const contact1 = [p.email, p.phone, p.location].filter(Boolean).join(" &nbsp;&nbsp; ");
  const contact2 = [p.linkedin, p.github].filter(Boolean).join(" &nbsp;&nbsp; ");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(p.name || "Resume")}</title>
<style>
@page { size: A4; margin: ${margin}mm; }
body { font-family: ${font}; font-size: ${fontSize}pt; line-height: 1.25; color: #000; margin: 0; }
h1 { font-size: 18pt; font-weight: 700; text-transform: uppercase; margin: 0; text-align: center; }
.tagline { text-align: center; font-size: 10.5pt; margin-top: 2px; }
.contact { text-align: center; font-size: 9.5pt; margin-top: 4px; }
a { color: #000; text-decoration: none; }
</style></head><body>
<h1>${esc(p.name)}</h1>
${p.tagline ? `<div class="tagline">${esc(p.tagline)}</div>` : ""}
<div class="contact">${contact1}</div>
${contact2 ? `<div class="contact">${contact2}</div>` : ""}
${html}
</body></html>`;
};

export default { toPlainText, toExportHtml };
