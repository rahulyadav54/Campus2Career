/**
 * Resume template definitions — Campus2Career ATS is the default.
 */

export const RESUME_TEMPLATES = [
  {
    templateId: "campus2career_ats",
    name: "Campus2Career ATS",
    description: "Official ATS-friendly template — single column, categorized skills, professional layout.",
    pageSize: "A4",
    referencePdf: "RESUME TEMPLATE/RAHUL_KUMAR_YADAV_ (1).pdf",
    isDefault: true,
    layout: {
      columns: 1,
      marginMm: 15,
      headerAlign: "center",
      fontFamily: "Calibri, Arial, Helvetica, sans-serif",
      fontSize: 10.5,
      lineHeight: 1.25,
      sectionHeading: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        borderBottom: "1px solid #000000",
        marginTop: 12,
        marginBottom: 6,
        color: "#000000",
      },
      name: { fontSize: 18, fontWeight: 700, textTransform: "uppercase", color: "#000000" },
      tagline: { fontSize: 10.5, fontWeight: 400, color: "#000000" },
      contact: { fontSize: 9.5, color: "#000000" },
      experienceDateAlign: "right",
      skillsLayout: "categorized-grid",
    },
    sections: [
      { id: "header", type: "header", label: "Header", editable: true, required: true },
      { id: "summary", type: "summary", label: "Professional Summary", editable: true },
      { id: "experience", type: "experience", label: "Experience", editable: true, repeatable: true },
      { id: "education", type: "education", label: "Education", editable: true, repeatable: true },
      { id: "skills", type: "skills", label: "Technical Skills", editable: true },
      { id: "certifications", type: "certifications", label: "Certifications", editable: true, repeatable: true },
      { id: "languages", type: "languages", label: "Languages", editable: true },
      { id: "projects", type: "projects", label: "Projects", editable: true, repeatable: true },
      { id: "achievements", type: "achievements", label: "Achievements", editable: true, repeatable: true },
    ],
    defaultSectionOrder: [
      "header", "summary", "experience", "education", "skills",
      "certifications", "languages", "projects", "achievements",
    ],
    atsSafe: true,
  },
];

export const getTemplateById = (id) =>
  RESUME_TEMPLATES.find((t) => t.templateId === id) || RESUME_TEMPLATES[0];

export const getDefaultTemplate = () => RESUME_TEMPLATES.find((t) => t.isDefault) || RESUME_TEMPLATES[0];

export default { RESUME_TEMPLATES, getTemplateById, getDefaultTemplate };
