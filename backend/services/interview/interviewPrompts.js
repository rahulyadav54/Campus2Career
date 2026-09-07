/**
 * Shared interview AI prompts — extracted for modular reuse.
 */

import { chatWithGemini, isGeminiConfigured } from "../geminiService.js";
import { getRequiredSkillsForRole } from "../roleSkillMap.js";
import { memoryContextBlock } from "./interviewMemory.js";

const personalityDescription = {
  professional: "You are a calm, professional interviewer. Be concise and respectful. Never sound like a chatbot or virtual assistant.",
  friendly: "You are a warm but professional interviewer. Put the candidate at ease without being overly enthusiastic.",
  strict: "You are a direct, challenging interviewer. Probe deeply and maintain high standards.",
  technical: "You are a senior technical interviewer. Focus on depth, trade-offs, and real implementation experience.",
  "hr-manager": "You are an experienced HR interviewer focused on communication, teamwork, motivation, and behavioural fit.",
};

const BANNED_PHRASES = [
  "Sure!",
  "Absolutely!",
  "That's a great question!",
  "How can I help you?",
  "Of course!",
  "As an AI",
  "I'm an AI",
];

export const buildSystemPrompt = (session) => {
  const persona = personalityDescription[session.personality] || personalityDescription.professional;
  const roleSkills = getRequiredSkillsForRole(session.targetRole) || [];
  const skillList = roleSkills.slice(0, 8).join(", ") || "general software skills";
  const missingSkills = session.skillGapContext?.missingSkills?.slice(0, 4) || [];
  const gapHint = missingSkills.length
    ? `Validate these skill gaps: ${missingSkills.join(", ")}.`
    : "";

  const resumeHint = session.resumeBased && session.resumeContext?.skills?.length
    ? `Resume skills: ${session.resumeContext.skills.slice(0, 6).join(", ")}. ` +
      (session.resumeContext.projects?.length
        ? `Projects: ${session.resumeContext.projects.slice(0, 2).map((p) => p.title || p).join(", ")}.`
        : "")
    : "";

  const jobHint = session.jobDescription
    ? `Job description focus: ${String(session.jobDescription).slice(0, 500)}`
    : "";

  const memoryHint = memoryContextBlock(session.conversationMemory || {});

  return `You are a LIVE human interviewer conducting a ${session.targetRole} interview on Campus2Career.

${persona}

Context:
- Role: ${session.targetRole}
- Type: ${session.interviewType}
- Difficulty: ${session.difficulty}
- Key skills: ${skillList}
${gapHint}
${resumeHint}
${jobHint}
${memoryHint}

RULES:
1. Sound like a real interviewer in a video call — not ChatGPT, not a voice assistant.
2. NEVER use: ${BANNED_PHRASES.join(", ")}
3. Use natural interviewer language: "Alright", "I see", "Let's dig into that", "Take your time".
4. Ask ONE question at a time. Keep spoken lines under 80 words.
5. Reference specific details the candidate mentioned earlier when relevant.
6. Do not reveal scores, rubrics, or that you are an AI system.
7. When the candidate struggles, be encouraging but still professional.`;
};

export const extractJSON = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const stripped = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
};

const STARTUP_AI_TIMEOUT_MS = Number(process.env.INTERVIEW_START_AI_TIMEOUT_MS || 2000);

export const withInterviewTimeout = (promise, fallback, timeoutMs = STARTUP_AI_TIMEOUT_MS) =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);

export const getInstantOpeningGreeting = (session, candidateName = "") => {
  const name = candidateName || session.conversationMemory?.candidateName || "there";
  return `Hi ${name}, welcome. I'm going to ask you a few questions about your experience and skills for the ${session.targetRole} role. If you need a moment to think, that's completely fine. Are you ready to begin?`;
};

export const getInstantFirstQuestion = (session) => {
  const phase = session.conversationState?.phase || session.interviewType || "warmup";
  const fallbacks = {
    warmup: `Before we go deeper, tell me what drew you to the ${session.targetRole} role.`,
    technical: `Walk me through a technical challenge you solved recently and how you approached it.`,
    behavioral: `Tell me about a time you had to work under pressure. What was your approach?`,
    situational: `If you joined our team next month, what would you focus on in your first 30 days?`,
    hr: `What motivates you about this ${session.targetRole} opportunity?`,
    mixed: `Describe a project you're proud of and your specific contribution.`,
    introduction: `To start, tell me a little about yourself and your background relevant to ${session.targetRole}.`,
  };
  const section = fallbacks[phase] ? phase : "warmup";
  return { question: fallbacks[section] || fallbacks.mixed, section };
};

export const generateOpeningGreeting = async (session, candidateName = "") => {
  const fallback = getInstantOpeningGreeting(session, candidateName);

  if (!isGeminiConfigured()) return fallback;

  const name = candidateName || session.conversationMemory?.candidateName || "there";
  const prompt = `Generate a natural video-interview opening for ${name} applying for ${session.targetRole}.
Include: brief welcome, explain you'll ask about experience and skills, say thinking time is fine.
End by asking if they are ready to begin. Under 55 words.
Do NOT say "Sure" or "Absolutely". Sound human.
Return ONLY the spoken text.`;

  try {
    const result = await chatWithGemini({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: buildSystemPrompt(session),
      temperature: 0.75,
      maxTokens: 150,
    });
    return result.response?.trim() || fallback;
  } catch {
    return fallback;
  }
};

export const generateNextQuestion = async (session, avgScore = 70, memory = {}) => {
  const answeredQuestions = (session.questions || [])
    .filter((q) => q.answer?.transcript)
    .map((q, i) => `Q${i + 1}: ${q.question}\nA: ${q.answer.transcript.slice(0, 120)}`)
    .join("\n");

  const phase = session.conversationState?.phase || "warmup";
  let difficultyHint = "";
  if (avgScore >= 80) difficultyHint = "Candidate is strong — ask a deeper question.";
  else if (avgScore < 55) difficultyHint = "Candidate is struggling — ask a clearer, more foundational question.";

  const fallbacks = {
    warmup: `Before we go deeper, tell me what drew you to the ${session.targetRole} role.`,
    technical: `Walk me through a technical challenge you solved recently and how you approached it.`,
    behavioral: `Tell me about a time you had to work under pressure. What was your approach?`,
    situational: `If you joined our team next month, what would you focus on in your first 30 days?`,
    mixed: `Describe a project you're proud of and your specific contribution.`,
  };

  if (!isGeminiConfigured()) {
    return { question: fallbacks[phase] || fallbacks.mixed, section: phase };
  }

  const memoryBlock = memoryContextBlock(memory);

  const prompt = `Interview phase: ${phase}
Target role: ${session.targetRole}
Difficulty: ${session.difficulty}
${difficultyHint}

Conversation so far:
${answeredQuestions || "None yet."}

${memoryBlock}

Generate the NEXT question based on what the candidate already said. Reference their prior answers when natural.
Do NOT repeat questions. Do NOT ask generic textbook questions if they already covered the topic.

Return ONLY JSON:
{"question":"...","section":"${phase}"}`;

  try {
    const result = await chatWithGemini({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: buildSystemPrompt({ ...session, conversationMemory: memory }),
      temperature: 0.72,
      maxTokens: 200,
    });
    const parsed = extractJSON(result.response);
    if (parsed?.question) return parsed;
  } catch { /* fall through */ }

  return { question: fallbacks[phase] || fallbacks.mixed, section: phase };
};

export const generateFollowUp = async (question, answer, session, extras = {}) => {
  const { classification, memory, signals } = extras;
  if (!answer?.trim()) return "Could you expand on that with a bit more detail?";

  const templates = {
    EXCELLENT: "Good. Can you explain how you measured the impact of that?",
    GOOD: "That's interesting. What was the hardest part of that for you?",
    AVERAGE: "You mentioned a few things there. Can you focus on the part you personally owned?",
    WEAK: "That's okay. Let's approach it from another angle — what would you do differently next time?",
    UNCLEAR: "Could you explain that in a little more detail?",
    INCORRECT: "Let me challenge that a little — what makes you confident that approach would work?",
    INCOMPLETE: "I didn't quite catch that. Could you walk me through your answer again?",
    OFF_TOPIC: "Let's bring that back to the question — how does that relate to this role?",
  };

  if (!isGeminiConfigured()) {
    return templates[classification] || "Can you tell me a little more about that?";
  }

  const prompt = `Question: "${question}"
Answer: "${answer.slice(0, 500)}"
Classification: ${classification || "AVERAGE"}
${signals?.hesitation ? "Candidate sounded hesitant." : ""}

${memoryContextBlock(memory || session.conversationMemory || {})}

Generate ONE natural follow-up (under 35 words). Reference a SPECIFIC detail from their answer.
${classification === "EXCELLENT" ? "Go deeper — metrics, trade-offs, or lessons learned." : ""}
${classification === "WEAK" || classification === "INCORRECT" ? "Be supportive but probe their reasoning." : ""}
Return ONLY the question.`;

  try {
    const result = await chatWithGemini({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: buildSystemPrompt(session),
      temperature: 0.68,
      maxTokens: 100,
    });
    return result.response?.trim() || templates[classification] || templates.AVERAGE;
  } catch {
    return templates[classification] || templates.AVERAGE;
  }
};

export const generateTransition = async (evaluation, nextQuestion, session) => {
  const score = evaluation?.overallScore || 60;
  if (!isGeminiConfigured() || !nextQuestion) {
    if (score >= 80) return "That's a strong answer.";
    if (score < 50) return "That's okay.";
    return "Alright.";
  }

  const prompt = `Generate a SHORT verbal bridge (max 10 words) before the next interview question.
Score context: ${score}/100. Personality: ${session.personality}.
Next question topic: "${nextQuestion.slice(0, 80)}"
Use natural interviewer tone. Examples: "Okay.", "I see.", "Let's move on."
Return ONLY the bridge phrase.`;

  try {
    const result = await chatWithGemini({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: buildSystemPrompt(session),
      temperature: 0.7,
      maxTokens: 40,
    });
    return result.response?.trim() || "Alright.";
  } catch {
    return "Alright.";
  }
};

export default {
  buildSystemPrompt,
  generateOpeningGreeting,
  generateNextQuestion,
  generateFollowUp,
  generateTransition,
  extractJSON,
};
