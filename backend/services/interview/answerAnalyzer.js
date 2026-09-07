/**
 * Classifies candidate answers for conversational follow-up decisions.
 */

export const ANSWER_CLASSES = [
  "EXCELLENT",
  "GOOD",
  "AVERAGE",
  "WEAK",
  "UNCLEAR",
  "INCORRECT",
  "INCOMPLETE",
  "OFF_TOPIC",
];

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);

export const classifyAnswer = (transcript = "", evaluation = {}) => {
  const text = String(transcript || "").trim();
  const score = clamp(Number(evaluation.overallScore ?? 0));

  if (!text || text.length < 8) return "INCOMPLETE";
  if (text.split(/\s+/).length < 4) return "INCOMPLETE";

  const lower = text.toLowerCase();
  if (/i don'?t know|not sure|no idea|can'?t remember|haven'?t done/i.test(lower)) {
    return score < 45 ? "WEAK" : "UNCLEAR";
  }
  if (evaluation.relevance !== undefined && evaluation.relevance < 35) return "OFF_TOPIC";
  if (evaluation.technicalKnowledge !== undefined && evaluation.technicalKnowledge < 40 && score < 50) {
    return "INCORRECT";
  }
  if (score >= 88) return "EXCELLENT";
  if (score >= 75) return "GOOD";
  if (score >= 58) return "AVERAGE";
  if (score >= 40) return "WEAK";
  if (/maybe|i think|probably|sort of|kind of/i.test(lower)) return "UNCLEAR";
  return "WEAK";
};

export const detectSpeechSignals = (transcript = "") => {
  const text = String(transcript || "").trim();
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    wordCount,
    hesitation: /um+|uh+|er+|like,|you know/i.test(lower),
    uncertainty: /i think|maybe|not sure|i guess|probably/i.test(lower),
    enthusiasm: /excited|passionate|love|enjoy|proud/i.test(lower),
    stress: /difficult|challenging|struggled|hard time/i.test(lower),
    longAnswer: wordCount > 120,
  };
};

export default { classifyAnswer, detectSpeechSignals, ANSWER_CLASSES };
