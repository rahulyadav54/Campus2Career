/**
 * virtualInterviewService.js
 * AI orchestration facade — delegates to modular interview services.
 */

import { chatWithGemini, isGeminiConfigured } from "./geminiService.js";
import { classifyAnswer } from "./interview/answerAnalyzer.js";
import {
  generateOpeningGreeting,
  generateNextQuestion,
  generateFollowUp,
  generateTransition,
  extractJSON,
} from "./interview/interviewPrompts.js";

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);

export { generateOpeningGreeting, generateNextQuestion, generateFollowUp, generateTransition };

export const evaluateAnswer = async (question, answer, session) => {
  const defaultEval = {
    relevance: 60,
    technicalKnowledge: 60,
    communication: 60,
    clarity: 60,
    confidence: 60,
    problemSolving: 60,
    overallScore: 60,
    strengths: ["Attempted to answer the question"],
    improvements: ["Provide more specific examples"],
    followUpRequired: false,
    followUpReason: "",
    answerClassification: "AVERAGE",
  };

  if (!answer?.trim() || answer.trim().length < 10) {
    return {
      ...defaultEval,
      overallScore: 20,
      relevance: 10,
      strengths: [],
      improvements: ["No substantive answer was provided"],
      followUpRequired: true,
      followUpReason: "No answer detected",
      answerClassification: "INCOMPLETE",
    };
  }

  if (!isGeminiConfigured()) {
    const classification = classifyAnswer(answer, defaultEval);
    return {
      ...defaultEval,
      answerClassification: classification,
      followUpRequired: ["UNCLEAR", "INCOMPLETE", "WEAK", "OFF_TOPIC"].includes(classification),
    };
  }

  const prompt = `You are a STRICT interviewer evaluating a ${session.targetRole} candidate.

Question: "${question}"
Answer: "${answer.slice(0, 800)}"

Return ONLY JSON:
{
  "relevance": <0-100>,
  "technicalKnowledge": <0-100>,
  "communication": <0-100>,
  "clarity": <0-100>,
  "confidence": <0-100>,
  "problemSolving": <0-100>,
  "overallScore": <0-100>,
  "strengths": ["..."],
  "improvements": ["..."],
  "followUpRequired": <boolean>,
  "followUpReason": "<string>"
}`;

  try {
    const result = await chatWithGemini({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      maxTokens: 400,
    });
    const parsed = extractJSON(result.response);
    if (parsed && typeof parsed.overallScore === "number") {
      const fields = ["relevance", "technicalKnowledge", "communication", "clarity", "confidence", "problemSolving", "overallScore"];
      for (const f of fields) {
        parsed[f] = clamp(Number(parsed[f] ?? defaultEval[f]));
      }
      parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : defaultEval.strengths;
      parsed.improvements = Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : defaultEval.improvements;
      parsed.answerClassification = classifyAnswer(answer, parsed);
      if (!parsed.followUpRequired) {
        parsed.followUpRequired = ["UNCLEAR", "INCOMPLETE", "EXCELLENT", "GOOD"].includes(parsed.answerClassification);
      }
      return parsed;
    }
  } catch { /* fall through */ }

  const classification = classifyAnswer(answer, defaultEval);
  return { ...defaultEval, answerClassification: classification, followUpRequired: true };
};

export const generateFinalReport = async (session) => {
  const answered = (session.questions || []).filter(
    (q) => q.answer?.transcript?.trim() && q.evaluation?.overallScore >= 0
  );

  const avg = (field) => {
    const vals = answered.map((q) => q.evaluation?.[field] || 0).filter((v) => v > 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };

  const summary = {
    overallScore: avg("overallScore"),
    technicalScore: avg("technicalKnowledge"),
    communicationScore: avg("communication"),
    confidenceScore: avg("confidence"),
    problemSolvingScore: avg("problemSolving"),
    answerRelevanceScore: avg("relevance"),
    clarityScore: avg("clarity"),
  };

  const allStrengths = answered.flatMap((q) => q.evaluation?.strengths || []);
  const allImprovements = answered.flatMap((q) => q.evaluation?.improvements || []);
  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 4);
  const uniqueImprovements = [...new Set(allImprovements)].slice(0, 4);
  const struggledQuestions = answered
    .filter((q) => (q.evaluation?.overallScore || 0) < 60)
    .map((q) => q.question)
    .slice(0, 5);

  if (!answered.length) {
    return {
      summary,
      executiveSummary: "No substantive answers were recorded. Complete at least one spoken response for a full assessment.",
      strengths: [],
      weaknesses: ["No substantive answers were recorded during this session"],
      recommendations: ["Check microphone permissions and complete at least one spoken answer before ending the interview"],
      struggledQuestions: [],
      topicsToPractice: session.skillGapContext?.missingSkills?.slice(0, 4) || [],
      readinessLevel: "Not Yet Ready",
    };
  }

  const score = summary.overallScore;
  let readinessLevel;
  if (score >= 90) readinessLevel = "Excellent";
  else if (score >= 75) readinessLevel = "Ready with Improvement";
  else if (score >= 60) readinessLevel = "Needs More Practice";
  else readinessLevel = "Not Yet Ready";

  let recommendations = [];
  let executiveSummary = `You completed ${answered.length} interview responses with an overall score of ${score}/100.`;

  if (!isGeminiConfigured()) {
    recommendations = [
      "Practice STAR-based behavioral answers for clearer structure",
      `Strengthen your knowledge of ${session.targetRole} core skills`,
      "Prepare 2-3 concrete project examples with measurable outcomes",
      "Work on concise, confident delivery of technical explanations",
    ];
  } else {
    try {
      const qa = answered.slice(0, 6).map((q, i) =>
        `Q${i + 1}: ${q.question}\nA: ${q.answer?.transcript?.slice(0, 200) || "(no answer)"}\nScore: ${q.evaluation?.overallScore || 0}`
      ).join("\n\n");

      const prompt = `Review this ${session.interviewType} interview for ${session.targetRole}.
Avg score: ${score}/100
${qa}

Return JSON:
{
  "executiveSummary": "2-3 sentence summary",
  "recommendations": ["...", "...", "...", "..."],
  "topicsToPractice": ["...", "..."]
}`;

      const result = await chatWithGemini({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        maxTokens: 400,
      });
      const parsed = extractJSON(result.response);
      if (parsed?.executiveSummary) executiveSummary = parsed.executiveSummary;
      if (Array.isArray(parsed?.recommendations)) recommendations = parsed.recommendations.slice(0, 4);
      if (Array.isArray(parsed?.topicsToPractice)) {
        session._topicsToPractice = parsed.topicsToPractice.slice(0, 5);
      }
    } catch { /* defaults */ }

    if (!recommendations.length) {
      recommendations = [
        "Practice STAR-based behavioral answers for clearer structure",
        `Review core ${session.targetRole} concepts and prepare concrete examples`,
        "Work on concise technical explanations with measurable outcomes",
        "Prepare 2-3 signature projects that showcase your best work",
      ];
    }
  }

  return {
    summary,
    executiveSummary,
    strengths: uniqueStrengths.length ? uniqueStrengths : ["Completed the interview practice session", "Showed willingness to engage"],
    weaknesses: uniqueImprovements.length ? uniqueImprovements : ["Continue practicing for more confident responses"],
    recommendations,
    struggledQuestions,
    topicsToPractice: session._topicsToPractice || session.skillGapContext?.missingSkills?.slice(0, 4) || [],
    readinessLevel,
  };
};

export default {
  generateOpeningGreeting,
  generateNextQuestion,
  generateFollowUp,
  evaluateAnswer,
  generateFinalReport,
  generateTransition,
};
