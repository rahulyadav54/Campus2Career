import { chatWithNemotron, isNemotronConfigured } from "../nemotronService.js";
import { chatWithGemini, isGeminiConfigured } from "../geminiService.js";
import { resumeContentToText } from "./resumeSchema.js";

const SECTION_PROMPTS = {
  improve: "Improve this section to be more professional and ATS-friendly. Do NOT invent companies, projects, metrics, or skills.",
  shorten: "Make this more concise while keeping key facts. Do NOT add new information.",
  professional: "Rewrite in a professional tone suitable for job applications. Do NOT fabricate experience.",
  ats: "Optimize for ATS readability using clear keywords already present in the content. Do NOT keyword-stuff or invent skills.",
  technical: "Add more technical detail ONLY from information already implied. Do NOT invent technologies.",
  impact: "Rewrite to emphasize impact using ACTION + TECHNOLOGY + RESULT structure. Do NOT invent metrics — suggest adding metrics if unknown.",
  concise: "Make this bullet more concise. Keep facts accurate.",
  rewrite: "Rewrite for clarity and professionalism. Never fabricate information.",
};

const callAI = async (systemPrompt, userPrompt) => {
  if (isNemotronConfigured()) {
    const result = await chatWithNemotron({
      messages: [{ role: "user", content: userPrompt }],
      systemPrompt,
      temperature: 0.4,
      maxTokens: 800,
    });
    return result.response?.trim() || "";
  }
  if (isGeminiConfigured()) {
    const result = await chatWithGemini({
      messages: [{ role: "user", content: userPrompt }],
      systemPrompt,
      temperature: 0.4,
      maxTokens: 800,
    });
    return result.response?.trim() || "";
  }
  return null;
};

const ANTI_HALLUCINATION_SYSTEM = `You are a resume writing assistant for Campus2Career.

ABSOLUTE RULES:
- NEVER invent companies, job titles, projects, certifications, achievements, technologies, or metrics.
- ONLY use information provided by the user or present in their resume.
- If metrics are unknown, say "Consider adding a measurable result if you have one."
- Return valid JSON only when asked for structured output.
- Explain what you changed briefly.`;

/**
 * Improve a resume section with AI — returns suggestion for user approval.
 */
export const improveSection = async ({
  sectionType,
  sectionContent,
  action = "improve",
  targetRole = "",
  jobDescription = "",
  fullResumeContext = "",
}) => {
  const actionPrompt = SECTION_PROMPTS[action] || SECTION_PROMPTS.improve;
  const context = fullResumeContext || resumeContentToText(sectionContent);

  const userPrompt = `Target role: ${targetRole || "Not specified"}
${jobDescription ? `Job description excerpt: ${jobDescription.slice(0, 1500)}` : ""}

Section type: ${sectionType}
Current content:
${typeof sectionContent === "string" ? sectionContent : JSON.stringify(sectionContent, null, 2)}

Task: ${actionPrompt}

Return JSON:
{
  "original": "<original text>",
  "suggested": "<improved text>",
  "changes": ["<what changed 1>", "<what changed 2>"],
  "truthCheck": "<reminder not to add unverified info>"
}`;

  const raw = await callAI(ANTI_HALLUCINATION_SYSTEM, userPrompt);

  if (!raw) {
    const text = typeof sectionContent === "string" ? sectionContent : JSON.stringify(sectionContent);
    return {
      original: text,
      suggested: text,
      changes: ["AI service unavailable — please edit manually"],
      truthCheck: "Verify all changes before accepting.",
      aiAvailable: false,
    };
  }

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return { ...JSON.parse(jsonMatch[0]), aiAvailable: true };
  } catch {
    /* fall through */
  }

  const text = typeof sectionContent === "string" ? sectionContent : JSON.stringify(sectionContent);
  return {
    original: text,
    suggested: raw,
    changes: ["AI rewrite applied — please review carefully"],
    truthCheck: "Verify all facts before accepting this suggestion.",
    aiAvailable: true,
  };
};

/**
 * Generate resume content from user-provided facts only.
 */
export const generateFromFacts = async ({
  facts = {},
  targetRole = "",
  jobDescription = "",
}) => {
  const userPrompt = `Generate resume content using ONLY these verified facts. Do NOT invent anything.

Facts provided:
${JSON.stringify(facts, null, 2)}

Target role: ${targetRole || "General"}
${jobDescription ? `Job description: ${jobDescription.slice(0, 2000)}` : ""}

Return JSON matching this structure:
{
  "summary": "",
  "skills": [],
  "experience": [{ "company": "", "title": "", "bullets": [] }],
  "projects": [{ "name": "", "technologies": [], "bullets": [] }],
  "education": [{ "institution": "", "degree": "", "field": "" }],
  "certifications": [{ "name": "", "issuer": "" }],
  "achievements": [{ "title": "", "description": "" }],
  "warnings": ["fields that need user review"]
}

If a field has no data, leave it empty or omit it. Never fabricate.`;

  const raw = await callAI(ANTI_HALLUCINATION_SYSTEM, userPrompt);
  if (!raw) return { success: false, message: "AI service unavailable" };

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return { success: true, content: JSON.parse(jsonMatch[0]) };
  } catch {
    /* ignore */
  }
  return { success: false, message: "Could not parse AI response" };
};

/**
 * Tailor resume for a job — returns proposed changes for approval.
 */
export const tailorForJob = async ({ content, jobDescription, jobTitle = "", company = "" }) => {
  const resumeText = resumeContentToText(content);

  const userPrompt = `Job: ${jobTitle} at ${company}
Job Description:
${jobDescription.slice(0, 3000)}

Current Resume:
${resumeText.slice(0, 4000)}

Suggest tailored changes. NEVER invent experience or skills.

Return JSON:
{
  "changes": [
    {
      "section": "summary|skills|experience|projects",
      "field": "specific field",
      "original": "...",
      "suggested": "...",
      "reason": "why this helps match the job"
    }
  ],
  "matchedKeywords": [],
  "missingKeywords": [],
  "estimatedImprovement": 0
}`;

  const raw = await callAI(ANTI_HALLUCINATION_SYSTEM, userPrompt);
  if (!raw) return { changes: [], message: "AI unavailable" };

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    /* ignore */
  }
  return { changes: [], message: "Could not generate tailoring suggestions" };
};

export default { improveSection, generateFromFacts, tailorForJob };
