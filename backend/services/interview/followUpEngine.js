/**
 * Decides the next conversational move after each candidate answer.
 */

import { classifyAnswer, detectSpeechSignals } from "./answerAnalyzer.js";

export const INTERVIEW_PHASES = [
  "preparing",
  "welcome",
  "introduction",
  "warmup",
  "technical",
  "behavioral",
  "situational",
  "candidate_questions",
  "closing",
  "complete",
];

export const decideNextAction = ({
  classification,
  evaluation = {},
  session = {},
  followUpCount = 0,
  primaryQuestionCount = 0,
}) => {
  const maxFollowUps = 2;
  const interviewType = session.interviewType || "mixed";

  if (classification === "INCOMPLETE" || classification === "UNCLEAR") {
    return { action: "clarify", reason: "Answer needs clarification" };
  }

  if (classification === "OFF_TOPIC") {
    return { action: "redirect", reason: "Answer drifted off topic" };
  }

  if (
    (classification === "EXCELLENT" || classification === "GOOD") &&
    followUpCount < maxFollowUps &&
    (evaluation.followUpRequired || classification === "EXCELLENT")
  ) {
    return { action: "follow_up", reason: "Strong answer — explore deeper" };
  }

  if (
    (classification === "WEAK" || classification === "INCORRECT" || classification === "AVERAGE") &&
    followUpCount < 1
  ) {
    return { action: "follow_up", reason: "Probe or reframe the answer" };
  }

  if (classification === "WEAK" && followUpCount >= 1) {
    return { action: "encourage_and_advance", reason: "Move on after supportive follow-up" };
  }

  let nextPhase = session.conversationState?.phase || "warmup";
  if (primaryQuestionCount >= 2 && interviewType !== "hr") nextPhase = "technical";
  if (primaryQuestionCount >= 4) nextPhase = "behavioral";
  if (primaryQuestionCount >= 6) nextPhase = "situational";
  if (primaryQuestionCount >= 8) nextPhase = "closing";

  return { action: "next_question", reason: "Advance interview", nextPhase };
};

export const emotionForContext = ({ classification, signals = {}, action }) => {
  if (action === "clarify") return "curious";
  if (action === "redirect") return "serious";
  if (action === "encourage_and_advance") return "encouraging";
  if (classification === "EXCELLENT") return "impressed";
  if (classification === "GOOD") return "curious";
  if (signals.hesitation || signals.uncertainty) return "encouraging";
  if (signals.stress) return "encouraging";
  if (classification === "WEAK" || classification === "INCORRECT") return "serious";
  return "listening";
};

export const analyzeTurn = (transcript, evaluation, session, questionRecord) => {
  const classification = classifyAnswer(transcript, evaluation);
  const signals = detectSpeechSignals(transcript);

  const followUpCount = (session.questions || []).filter(
    (q) => q.isFollowUp && q.parentIndex === session.questions.indexOf(questionRecord)
  ).length;

  const primaryQuestionCount = (session.questions || []).filter((q) => !q.isFollowUp && q.answer?.transcript).length;

  const decision = decideNextAction({
    classification,
    evaluation,
    session,
    followUpCount,
    primaryQuestionCount,
  });

  const emotion = emotionForContext({ classification, signals, action: decision.action });

  return { classification, signals, decision, emotion };
};

export default { decideNextAction, analyzeTurn, emotionForContext, INTERVIEW_PHASES };
