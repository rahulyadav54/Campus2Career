/**
 * Conversation engine — orchestrates human-like interviewer responses.
 */

import { chatWithGemini, isGeminiConfigured } from "../geminiService.js";
import { memoryContextBlock, updateInterviewMemory } from "./interviewMemory.js";
import { analyzeTurn } from "./followUpEngine.js";
import {
  generateFollowUp,
  generateNextQuestion,
  generateTransition,
  buildSystemPrompt,
} from "./interviewPrompts.js";

const MICRO_ACKS = {
  EXCELLENT: ["That's a solid explanation.", "Good.", "Okay, I see."],
  GOOD: ["Right.", "Okay.", "I understand."],
  AVERAGE: ["Alright.", "Okay.", "I see."],
  WEAK: ["That's okay.", "Alright.", "No problem."],
  UNCLEAR: ["I see.", "Okay."],
  INCORRECT: ["I see.", "Alright."],
  INCOMPLETE: ["I didn't quite catch that.", "Okay."],
  OFF_TOPIC: ["I see.", "Alright."],
};

const pickAck = (classification) => {
  const list = MICRO_ACKS[classification] || MICRO_ACKS.AVERAGE;
  return list[Math.floor(Math.random() * list.length)];
};

const thinkingPauseMs = (classification) => {
  if (classification === "EXCELLENT") return 900;
  if (classification === "UNCLEAR" || classification === "INCOMPLETE") return 1100;
  return 700;
};

export const generateClarification = async (question, answer, session) => {
  const fallbacks = [
    "Could you explain that in a little more detail?",
    "I'd like to understand that better — can you walk me through it?",
    "Take your time. What specifically was your role in that?",
  ];
  if (!isGeminiConfigured()) return fallbacks[Math.floor(Math.random() * fallbacks.length)];

  const prompt = `The interviewer asked: "${question}"
The candidate said: "${(answer || "").slice(0, 300)}"

The answer was unclear or incomplete. Generate ONE short clarification request (under 20 words).
Sound like a calm professional interviewer. No generic AI assistant phrases.
Return ONLY the sentence.`;

  try {
    const result = await chatWithGemini({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: buildSystemPrompt(session),
      temperature: 0.7,
      maxTokens: 60,
    });
    return result.response?.trim() || fallbacks[0];
  } catch {
    return fallbacks[0];
  }
};

export const generateRedirect = async (question, answer, session) => {
  if (!isGeminiConfigured()) {
    return "Let's bring it back to the question — how does that relate to your experience for this role?";
  }
  const prompt = `The candidate drifted off-topic.
Original question: "${question}"
Their answer: "${(answer || "").slice(0, 300)}"

Generate ONE polite redirect (under 22 words) that brings them back on topic.
Return ONLY the sentence.`;

  try {
    const result = await chatWithGemini({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: buildSystemPrompt(session),
      temperature: 0.65,
      maxTokens: 60,
    });
    return result.response?.trim() || "Let's focus back on the question for a moment.";
  } catch {
    return "Let's focus back on the question for a moment.";
  }
};

export const generateEncouragementAndAdvance = async (session, nextQuestion) => {
  const bridge = await generateTransition({ overallScore: 50 }, nextQuestion, session);
  return `${bridge || "That's okay. Let's approach it from another angle."} ${nextQuestion}`;
};

/**
 * Build the full spoken interviewer response for a turn.
 */
export const buildConversationalResponse = async ({
  session,
  questionRecord,
  transcript,
  evaluation,
  analysis,
  nextQuestionText,
  nextAction,
}) => {
  const { classification, decision, emotion, signals } = analysis;
  const question = questionRecord?.question || "";
  const ack = pickAck(classification);
  let spoken = "";
  let status = "speaking";

  switch (nextAction) {
    case "clarify":
      spoken = await generateClarification(question, transcript, session);
      status = "follow_up";
      break;
    case "redirect":
      spoken = await generateRedirect(question, transcript, session);
      status = "follow_up";
      break;
    case "follow_up":
      spoken = await generateFollowUp(question, transcript, session, {
        classification,
        memory: session.conversationMemory,
        signals,
      });
      if (spoken && !spoken.toLowerCase().startsWith(ack.toLowerCase().slice(0, 4))) {
        spoken = `${ack} ${spoken}`;
      }
      status = "follow_up";
      break;
    case "encourage_and_advance":
      spoken = await generateEncouragementAndAdvance(session, nextQuestionText);
      status = "transitioning";
      break;
    case "next_question":
    default: {
      const transition = await generateTransition(evaluation, nextQuestionText, session);
      if (signals.longAnswer) {
        spoken = `Got it. ${transition ? `${transition} ` : ""}${nextQuestionText}`;
      } else {
        spoken = `${ack} ${transition ? `${transition} ` : ""}${nextQuestionText}`;
      }
      status = "transitioning";
      break;
    }
  }

  if (signals.hesitation || signals.uncertainty) {
    spoken = spoken.replace(/^(Okay\.|Right\.)/, "Take your time.");
  }

  return {
    speakText: spoken.trim(),
    emotion,
    status,
    classification,
    thinkingPauseMs: thinkingPauseMs(classification),
    phase: decision.nextPhase || session.conversationState?.phase || "warmup",
  };
};

export const processInterviewTurn = async (session, questionRecord, transcript, evaluation) => {
  const analysis = analyzeTurn(transcript, evaluation, session, questionRecord);

  evaluation.answerClassification = analysis.classification;
  evaluation.speechSignals = analysis.signals;

  const memory = updateInterviewMemory(session.conversationMemory || {}, {
    question: questionRecord.question,
    answer: transcript,
    evaluation,
    classification: analysis.classification,
  });

  let nextAction = analysis.decision.action;
  let nextQuestionText = "";
  let nextQuestionSection = session.interviewType || "mixed";
  let isFollowUp = false;

  const avgScore = (session.questions || [])
    .filter((q) => q.evaluation?.overallScore > 0)
    .map((q) => q.evaluation.overallScore);
  const rollingAvg = avgScore.length
    ? Math.round(avgScore.reduce((a, b) => a + b, 0) / avgScore.length)
    : 70;

  if (nextAction === "follow_up" || nextAction === "clarify" || nextAction === "redirect") {
    isFollowUp = true;
  } else {
    const nextQ = await generateNextQuestion(session, rollingAvg, memory);
    nextQuestionText = nextQ.question;
    nextQuestionSection = nextQ.section || nextQuestionSection;
  }

  const conversational = await buildConversationalResponse({
    session: { ...session, conversationMemory: memory },
    questionRecord,
    transcript,
    evaluation,
    analysis,
    nextQuestionText,
    nextAction: isFollowUp ? nextAction : analysis.decision.action,
  });

  return {
    analysis,
    memory,
    conversational,
    nextQuestion: isFollowUp
      ? { text: conversational.speakText, section: questionRecord.section, isFollowUp: true }
      : { text: nextQuestionText, section: nextQuestionSection, isFollowUp: false },
    nextAction: isFollowUp ? "follow_up" : "next_question",
    rollingAvg,
  };
};

export default {
  processInterviewTurn,
  buildConversationalResponse,
};
