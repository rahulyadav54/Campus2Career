/**
 * Campus2Career ATS Template — single A4 page, ATS-friendly layout.
 * Fully editable text — not a flattened PDF background.
 */

import { SKILL_CATEGORIES, CAMPUS2CAREER_SECTION_ORDER } from "./constants";

const FONT = "Calibri, Arial, Helvetica, sans-serif";

function Editable({ value, onChange, multiline = false, placeholder = "", className = "", style = {} }) {
  if (!onChange) return <span style={style}>{value}</span>;
  if (multiline) {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent border-none outline-none resize-none focus:ring-1 focus:ring-indigo-200 rounded ${className}`}
        style={{ fontFamily: FONT, ...style }}
        rows={Math.max(2, String(value || "").split("\n").length)}
      />
    );
  }
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-200 rounded ${className}`}
      style={{ fontFamily: FONT, ...style }}
    />
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: "10pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        borderBottom: "1px solid #000",
        paddingBottom: "1px",
        marginTop: "8px",
        marginBottom: "4px",
        color: "#000",
        fontFamily: FONT,
      }}
    >
      {children}
    </h2>
  );
}

export default function Campus2CareerTemplate({
  content,
  zoom = 100,
  onChange,
  editMode = true,
}) {
  const p = content?.personal || {};
  const fmt = content?.formatting || {};
  const margin = fmt.marginMm || 10;
  const fontSize = fmt.fontSize || 9.5;
  const bodyStyle = { fontFamily: FONT, fontSize: `${fontSize}pt`, lineHeight: 1.15, color: "#000" };

  const patchContent = (mutator) => {
    if (!onChange) return;
    const next = JSON.parse(JSON.stringify(content));
    mutator(next);
    onChange(next);
  };

  const update = (path, value) => {
    patchContent((next) => {
      const keys = path.split(".");
      let ref = next;
      for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]];
      ref[keys[keys.length - 1]] = value;
    });
  };

  const updateItem = (section, index, field, value) => {
    patchContent((next) => {
      next[section][index][field] = value;
    });
  };

  const patchItem = (section, index, fields) => {
    patchContent((next) => {
      Object.assign(next[section][index], fields);
    });
  };

  const patchPersonal = (fields) => {
    patchContent((next) => {
      next.personal = { ...next.personal, ...fields };
    });
  };

  const updateBullet = (section, itemIndex, bulletIndex, value) => {
    patchContent((next) => {
      if (!next[section][itemIndex].bullets) next[section][itemIndex].bullets = [];
      next[section][itemIndex].bullets[bulletIndex] = value;
    });
  };

  const skillCategories = content.skillCategories?.length
    ? content.skillCategories
    : SKILL_CATEGORIES.map((cat) => ({ id: cat, category: cat, items: [] }));

  const updateSkillCategory = (index, field, value) => {
    patchContent((next) => {
      if (!next.skillCategories) next.skillCategories = skillCategories;
      if (field === "items") {
        next.skillCategories[index].items = value.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
      } else {
        next.skillCategories[index][field] = value;
      }
    });
  };

  return (
    <div className="resume-preview-outer overflow-auto bg-gray-200 rounded-xl p-4 flex justify-center">
      <div
        className="resume-page bg-white shadow-xl text-black"
        style={{
          width: "210mm",
          height: "297mm",
          maxHeight: "297mm",
          overflow: editMode ? "auto" : "hidden",
          padding: `${margin}mm`,
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top center",
          ...bodyStyle,
        }}
      >
        {/* HEADER */}
        <header className="text-center mb-2">
          <Editable
            value={p.name}
            onChange={editMode ? (v) => update("personal.name", v) : undefined}
            placeholder="YOUR NAME"
            style={{ fontSize: "18pt", fontWeight: 700, textTransform: "uppercase", textAlign: "center" }}
          />
          <Editable
            value={p.tagline}
            onChange={editMode ? (v) => update("personal.tagline", v) : undefined}
            placeholder="Software Engineer | AI & Machine Learning | Full Stack Developer"
            style={{ fontSize: "10.5pt", textAlign: "center", marginTop: "2px" }}
          />
          <div style={{ fontSize: "9.5pt", marginTop: "4px" }}>
            <Editable
              value={[p.email, p.phone, p.location].filter(Boolean).join("  \t")}
              onChange={editMode ? (v) => {
                const parts = v.split(/\t+|\s{2,}/).map((s) => s.trim());
                patchPersonal({
                  email: parts[0] || "",
                  phone: parts[1] || "",
                  location: parts[2] || "",
                });
              } : undefined}
              placeholder="email@example.com    +91 phone    City, State"
              style={{ textAlign: "center", fontSize: "9.5pt" }}
            />
          </div>
          <div style={{ fontSize: "9.5pt", marginTop: "2px" }}>
            <Editable
              value={[p.linkedin, p.github].filter(Boolean).join("  \t")}
              onChange={editMode ? (v) => {
                const parts = v.split(/\t+|\s{2,}/).map((s) => s.trim());
                patchPersonal({
                  linkedin: parts[0] || "",
                  github: parts[1] || "",
                });
              } : undefined}
              placeholder="linkedin.com/in/you    github.com/you"
              style={{ textAlign: "center", fontSize: "9.5pt" }}
            />
          </div>
        </header>

        {/* PROFESSIONAL SUMMARY */}
        <SectionTitle>Professional Summary</SectionTitle>
        <Editable
          multiline
          value={content.summary}
          onChange={editMode ? (v) => update("summary", v) : undefined}
          placeholder="Write a concise professional summary…"
          style={{ ...bodyStyle, textAlign: "justify" }}
        />

        {/* EXPERIENCE */}
        <SectionTitle>Experience</SectionTitle>
        {(content.experience || []).map((exp, i) => (
          <div key={exp.id || i} className="mb-2 relative">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <Editable
                  value={exp.title}
                  onChange={editMode ? (v) => updateItem("experience", i, "title", v) : undefined}
                  placeholder="Job Title"
                  style={{ fontWeight: 700, ...bodyStyle }}
                />
                <Editable
                  value={exp.company}
                  onChange={editMode ? (v) => updateItem("experience", i, "company", v) : undefined}
                  placeholder="Company"
                  style={bodyStyle}
                />
              </div>
              <Editable
                value={exp.startDate && (exp.endDate || exp.current) ? `${exp.startDate} – ${exp.current ? "Present" : exp.endDate}` : exp.startDate || exp.endDate || ""}
                onChange={editMode ? (v) => {
                  const [s, e] = v.split("–").map((x) => x.trim());
                  patchItem("experience", i, {
                    startDate: s || "",
                    endDate: e === "Present" ? "" : e || "",
                    current: e === "Present",
                  });
                } : undefined}
                placeholder="MM/YYYY – MM/YYYY"
                style={{ fontSize: "9.5pt", whiteSpace: "nowrap", textAlign: "right", minWidth: "100px" }}
              />
            </div>
            <ul style={{ margin: "2px 0 0 14px", padding: 0 }}>
              {(exp.bullets || [""]).map((b, bi) => (
                <li key={bi} style={{ marginBottom: "1px" }}>
                  <Editable
                    value={b}
                    onChange={editMode ? (v) => updateBullet("experience", i, bi, v) : undefined}
                    placeholder="Achievement bullet…"
                    style={bodyStyle}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* EDUCATION */}
        <SectionTitle>Education</SectionTitle>
        {(content.education || []).map((edu, i) => (
          <div key={edu.id || i} className="mb-2">
            <Editable
              value={[edu.degree, edu.field].filter(Boolean).join(" – ")}
              onChange={editMode ? (v) => updateItem("education", i, "degree", v) : undefined}
              placeholder="Degree – Field"
              style={{ fontWeight: 700, ...bodyStyle }}
            />
            <Editable
              value={edu.institution}
              onChange={editMode ? (v) => updateItem("education", i, "institution", v) : undefined}
              placeholder="Institution"
              style={bodyStyle}
            />
            <div className="flex justify-between">
              <Editable
                value={edu.gpa ? `CGPA: ${edu.gpa}` : ""}
                onChange={editMode ? (v) => updateItem("education", i, "gpa", v.replace(/^CGPA:\s*/i, "")) : undefined}
                placeholder="CGPA: 8.00/10"
                style={{ fontSize: "9.5pt" }}
              />
              <Editable
                value={[edu.endDate, edu.location].filter(Boolean).join("    ")}
                onChange={editMode ? (v) => {
                  const parts = v.split(/\s{2,}/);
                  patchItem("education", i, {
                    endDate: parts[0] || "",
                    location: parts[1] || "",
                  });
                } : undefined}
                placeholder="2028    City"
                style={{ fontSize: "9.5pt", textAlign: "right" }}
              />
            </div>
          </div>
        ))}

        {/* TECHNICAL SKILLS */}
        <SectionTitle>Technical Skills</SectionTitle>
        <div className="space-y-0.5">
          {skillCategories.map((cat, i) => (
            <div key={cat.id || cat.category || i} className="flex gap-2" style={bodyStyle}>
              <span style={{ fontWeight: 700, minWidth: "72px", flexShrink: 0 }}>
                <Editable
                  value={cat.category}
                  onChange={editMode ? (v) => updateSkillCategory(i, "category", v) : undefined}
                  style={{ fontWeight: 700, width: "72px" }}
                />
              </span>
              <Editable
                value={(cat.items || []).join(", ")}
                onChange={editMode ? (v) => updateSkillCategory(i, "items", v) : undefined}
                placeholder="Skill1, Skill2, Skill3"
                style={{ flex: 1 }}
              />
            </div>
          ))}
        </div>

        {/* CERTIFICATIONS */}
        <SectionTitle>Certifications</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {(content.certifications || []).map((cert, i) => (
            <div key={cert.id || i}>
              <Editable
                value={cert.name}
                onChange={editMode ? (v) => updateItem("certifications", i, "name", v) : undefined}
                placeholder="Certification name"
                style={{ fontWeight: 600, ...bodyStyle }}
              />
              <Editable
                value={cert.issuer}
                onChange={editMode ? (v) => updateItem("certifications", i, "issuer", v) : undefined}
                placeholder="Issuer"
                style={{ fontSize: "9.5pt" }}
              />
            </div>
          ))}
        </div>

        {/* LANGUAGES */}
        <SectionTitle>Languages</SectionTitle>
        <Editable
          value={content.spokenLanguages || (content.languages || []).map((l) => l.language || l).join(", ")}
          onChange={editMode ? (v) => update("spokenLanguages", v) : undefined}
          placeholder="English, Hindi, …"
          style={bodyStyle}
        />

        {/* PROJECTS */}
        <SectionTitle>Projects</SectionTitle>
        {(content.projects || []).map((pr, i) => (
          <div key={pr.id || i} className="mb-1">
              <Editable
                value={pr.name}
                onChange={editMode ? (v) => updateItem("projects", i, "name", v) : undefined}
                placeholder="Project Name"
                style={{ fontWeight: 700, ...bodyStyle }}
              />
              <Editable
                value={pr.techStack || (pr.technologies || []).join(" | ")}
                onChange={editMode ? (v) => updateItem("projects", i, "techStack", v) : undefined}
                placeholder="React | Node.js | MongoDB"
                style={{ fontSize: "9.5pt", fontStyle: "italic" }}
              />
              <ul style={{ margin: "2px 0 0 14px", padding: 0 }}>
                {(pr.bullets || [""]).map((b, bi) => (
                  <li key={bi}>
                    <Editable
                      value={b}
                      onChange={editMode ? (v) => updateBullet("projects", i, bi, v) : undefined}
                      placeholder="Project bullet…"
                      style={bodyStyle}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <SectionTitle>Achievements</SectionTitle>
          <ul style={{ margin: 0, paddingLeft: "14px" }}>
            {(content.achievements || []).map((a, i) => (
              <li key={a.id || i}>
                <Editable
                  value={a.title || a.description}
                  onChange={editMode ? (v) => updateItem("achievements", i, "title", v) : undefined}
                  placeholder="Achievement…"
                  style={bodyStyle}
                />
              </li>
            ))}
            {(content.achievements || []).length === 0 && editMode && (
              <li>
                <Editable
                  value=""
                  onChange={(v) => {
                    if (!v) return;
                    const next = JSON.parse(JSON.stringify(content));
                    next.achievements = [{ id: `ach_${Date.now()}`, title: v, description: "" }];
                    onChange?.(next);
                  }}
                  placeholder="Add achievement…"
                  style={bodyStyle}
                />
              </li>
            )}
          </ul>
      </div>
    </div>
  );
}
