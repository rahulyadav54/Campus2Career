/**
 * Maintains conversational memory across an interview session.
 */

const uniquePush = (arr, value, limit = 20) => {
  if (!value || typeof value !== "string") return arr;
  const v = value.trim();
  if (!v || arr.includes(v)) return arr;
  return [...arr, v].slice(-limit);
};

const extractTechnologies = (text = "") => {
  const known = [
    "React", "Node", "Python", "Java", "JavaScript", "TypeScript", "SQL", "MongoDB",
    "AWS", "Docker", "Kubernetes", "Gemini", "OpenAI", "TensorFlow", "PyTorch",
    "Firebase", "Tailwind", "Express", "Next.js", "Vue", "Angular", "C++", "Go",
    "Redis", "PostgreSQL", "GraphQL", "REST", "Machine Learning", "Deep Learning",
  ];
  const found = [];
  const lower = text.toLowerCase();
  for (const tech of known) {
    if (lower.includes(tech.toLowerCase())) found.push(tech);
  }
  return found;
};

export const createEmptyMemory = (candidateName = "") => ({
  candidateName,
  skillsMentioned: [],
  projectsMentioned: [],
  technologiesMentioned: [],
  topicsCovered: [],
  strongAreas: [],
  weakAreas: [],
  keyQuotes: [],
  questionsAsked: [],
});

export const updateInterviewMemory = (memory = {}, { question, answer, evaluation, classification }) => {
  const next = { ...createEmptyMemory(memory.candidateName), ...memory };
  const answerText = String(answer || "").trim();

  if (question) {
    next.questionsAsked = uniquePush(next.questionsAsked || [], question, 30);
  }

  if (answerText) {
    next.keyQuotes = uniquePush(next.keyQuotes || [], answerText.slice(0, 160), 8);
    const techs = extractTechnologies(answerText);
    next.technologiesMentioned = [...new Set([...(next.technologiesMentioned || []), ...techs])].slice(0, 15);

    if (/project|built|developed|created|engineered|designed/i.test(answerText)) {
      const snippet = answerText.split(/[.!?]/)[0]?.slice(0, 100);
      if (snippet) next.projectsMentioned = uniquePush(next.projectsMentioned || [], snippet, 8);
    }
  }

  if (evaluation?.strengths?.length) {
    next.strongAreas = [...new Set([...(next.strongAreas || []), ...evaluation.strengths])].slice(0, 10);
  }
  if (evaluation?.improvements?.length) {
    next.weakAreas = [...new Set([...(next.weakAreas || []), ...evaluation.improvements])].slice(0, 10);
  }

  if (classification === "EXCELLENT" || classification === "GOOD") {
    next.strongAreas = uniquePush(next.strongAreas || [], question?.slice(0, 80) || "", 10);
  }
  if (["WEAK", "UNCLEAR", "INCORRECT", "INCOMPLETE", "OFF_TOPIC"].includes(classification)) {
    next.weakAreas = uniquePush(next.weakAreas || [], question?.slice(0, 80) || "", 10);
  }

  return next;
};

export const memoryContextBlock = (memory = {}) => {
  const lines = [];
  if (memory.candidateName) lines.push(`Candidate name: ${memory.candidateName}`);
  if (memory.technologiesMentioned?.length) {
    lines.push(`Technologies mentioned: ${memory.technologiesMentioned.join(", ")}`);
  }
  if (memory.projectsMentioned?.length) {
    lines.push(`Projects discussed: ${memory.projectsMentioned.slice(0, 3).join(" | ")}`);
  }
  if (memory.strongAreas?.length) {
    lines.push(`Strong areas so far: ${memory.strongAreas.slice(0, 3).join("; ")}`);
  }
  if (memory.weakAreas?.length) {
    lines.push(`Areas needing depth: ${memory.weakAreas.slice(0, 3).join("; ")}`);
  }
  if (memory.questionsAsked?.length) {
    lines.push(`Questions already asked (${memory.questionsAsked.length}): do not repeat.`);
  }
  return lines.join("\n");
};

export default { createEmptyMemory, updateInterviewMemory, memoryContextBlock };
