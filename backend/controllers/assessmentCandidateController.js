import Assessment from "../models/AssessmentModel.js";
import AssessmentCandidate from "../models/AssessmentCandidateModel.js";
import AssessmentAttempt from "../models/AssessmentAttemptModel.js";
import AssessmentIntegrityEvent from "../models/AssessmentIntegrityEventModel.js";
import { Question, AssessmentTemplate } from "../models/QuestionBankModel.js";
import User from "../models/UserModel.js";

const evaluateAttempt = async (attemptId) => {
  const attempt = await AssessmentAttempt.findById(attemptId).lean();
  if (!attempt) throw new Error("Attempt not found");

  const isTemplate = !!attempt.template;
  let questions, passingScore, negativeMarking;

  if (isTemplate) {
    const template = await AssessmentTemplate.findById(attempt.template).populate("questions");
    questions = template.questions;
    passingScore = template.passingScore;
    negativeMarking = template.negativeMarking;
  } else {
    const assessment = await Assessment.findById(attempt.assessment).populate("questions");
    questions = assessment.questions;
    passingScore = assessment.passingScore;
    negativeMarking = assessment.config?.negativeMarking || false;
  }

  const marksPerQuestion = isTemplate ? null : (attempt.assessment && (await Assessment.findById(attempt.assessment).select("config"))?.config?.marksPerQuestion);

  const scores = { technical: 0, soft: 0, aptitude: 0, total: 0 };
  const maxScores = { technical: 0, soft: 0, aptitude: 0, total: 0 };
  const skillScores = {};

  const processedAnswers = attempt.answers.map((ans) => {
    const question = questions.find((q) => q._id.toString() === ans.question.toString());
    if (!question) return ans;

    const maxMarks = marksPerQuestion || question.marks;
    maxScores[question.category] = (maxScores[question.category] || 0) + maxMarks;
    maxScores.total += maxMarks;

    let isCorrect = false;
    let marksAwarded = 0;
    let negativeMarksDeducted = 0;

    if (question.type === "mcq" || question.type === "true_false") {
      const correctIdx = question.options.findIndex((o) => o.isCorrect);
      isCorrect = ans.selectedOption === correctIdx;
      marksAwarded = isCorrect ? maxMarks : 0;
      if (!isCorrect && negativeMarking) negativeMarksDeducted = question.negativeMarks || 0;
    } else if (question.type === "mcq_multi") {
      const correctIndexes = question.options.map((o, i) => o.isCorrect ? i : -1).filter((i) => i !== -1);
      const selected = ans.selectedOptions || [];
      isCorrect = correctIndexes.length === selected.length && correctIndexes.every((idx) => selected.includes(idx));
      marksAwarded = isCorrect ? maxMarks : 0;
      if (!isCorrect && negativeMarking) negativeMarksDeducted = question.negativeMarks || 0;
    } else if (question.type === "rating") {
      const ratio = (ans.ratingValue || 0) / 100;
      marksAwarded = Math.round(ratio * maxMarks);
      isCorrect = marksAwarded >= maxMarks * 0.7;
    } else if (question.type === "short_answer" || question.type === "descriptive") {
      marksAwarded = ans.marksAwarded || 0;
      isCorrect = marksAwarded >= maxMarks * 0.5;
    }

    const finalMarks = Math.max(0, marksAwarded - negativeMarksDeducted);

    scores[question.category] = (scores[question.category] || 0) + finalMarks;
    scores.total += finalMarks;

    if (!skillScores[question.skill]) skillScores[question.skill] = { earned: 0, max: 0 };
    skillScores[question.skill].earned += finalMarks;
    skillScores[question.skill].max += maxMarks;

    return {
      ...ans,
      isCorrect,
      marksAwarded: finalMarks,
      negativeMarks: negativeMarksDeducted,
    };
  });

  const percentage = maxScores.total > 0 ? Math.round((scores.total / maxScores.total) * 100) : 0;
  const passed = percentage >= passingScore;

  const strengths = Object.entries(skillScores).filter(([, v]) => v.max > 0 && (v.earned / v.max) >= 0.7).map(([k]) => k);
  const gaps = Object.entries(skillScores).filter(([, v]) => v.max > 0 && (v.earned / v.max) < 0.6).map(([k]) => k);

  await AssessmentAttempt.findByIdAndUpdate(attemptId, {
    answers: processedAnswers,
    scores,
    maxScores,
    skillScores,
    strengths,
    gaps,
    submittedAt: new Date(),
    timeTakenSeconds: Math.round((new Date() - new Date(attempt.startedAt)) / 1000),
    passed,
    percentage,
    status: "evaluated",
  });

  return { scores, maxScores, percentage, passed, strengths, gaps };
};

export const getMyAssessments = async (req, res, next) => {
  try {
    const publishedAssessments = await Assessment.find({ status: "published" })
      .populate("questions", "text type category skill difficulty marks negativeMarks options correctAnswerText explanation tags timeLimit")
      .lean();

    const candidateDocs = await AssessmentCandidate.find({ candidate: req.user._id, assessment: { $in: publishedAssessments.map((a) => a._id) } }).lean();
    const candidateMap = new Map(candidateDocs.map((c) => [c.assessment.toString(), c]));

    const now = new Date();
    const assessments = publishedAssessments.map((a) => {
      const candidate = candidateMap.get(a._id.toString());
      const isStarted = candidate && ["started", "in_progress", "submitted", "evaluated"].includes(candidate.status);
      const isPastEnd = a.endDate && new Date(a.endDate) < now;
      const isBeforeStart = a.startDate && new Date(a.startDate) > now;
      const attemptsCount = candidate ? candidate.attemptsCount : 0;
      const canStart = a.status === "published" && !isPastEnd && !isBeforeStart && attemptsCount < a.maxAttempts && !isStarted;

      return {
        _id: candidate ? candidate._id : `virtual-${a._id}`,
        assessment: a,
        canStart,
        isPastEnd,
        isBeforeStart,
        attemptsLeft: a.maxAttempts - attemptsCount,
        candidate: candidate ? {
          name: candidate.name,
          email: candidate.email,
          status: candidate.status,
          attemptsCount: candidate.attemptsCount,
          startedAt: candidate.startedAt,
          submittedAt: candidate.submittedAt,
        } : null,
        status: candidate ? candidate.status : "invited",
        attemptsCount,
      };
    });

    res.json({ assessments });
  } catch (e) { next(e); }
};

export const startAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate("questions", "text type category skill difficulty marks negativeMarks options correctAnswerText explanation tags timeLimit");
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    if (assessment.status !== "published") return res.status(400).json({ message: "Assessment is not published" });

    const now = new Date();
    if (assessment.startDate && new Date(assessment.startDate) > now) return res.status(400).json({ message: "Assessment has not started yet" });
    if (assessment.endDate && new Date(assessment.endDate) < now) return res.status(400).json({ message: "Assessment has ended" });

    let candidate = await AssessmentCandidate.findOne({ assessment: assessment._id, candidate: req.user._id });
    if (!candidate) {
      candidate = await AssessmentCandidate.create({
        assessment: assessment._id,
        candidate: req.user._id,
        status: "invited",
        attemptsCount: 0,
      });
    }

    if (candidate.attemptsCount >= assessment.maxAttempts) return res.status(400).json({ message: "Maximum attempts reached" });

    const existingAttempt = await AssessmentAttempt.findOne({ assessment: assessment._id, student: req.user._id, status: "in_progress" });
    if (existingAttempt) return res.status(400).json({ message: "You already have an ongoing attempt", attemptId: existingAttempt._id });

    let questionOrder = assessment.questions.map((q) => q._id);
    if (assessment.config?.randomizeQuestions) {
      questionOrder = questionOrder.sort(() => Math.random() - 0.5);
    }

    const attempt = await AssessmentAttempt.create({
      student: req.user._id,
      assessment: assessment._id,
      assessmentCandidate: candidate._id,
      questionOrder,
      startedAt: now,
      deadlineAt: new Date(now.getTime() + assessment.durationMinutes * 60 * 1000),
    });

    candidate.status = "started";
    candidate.attemptsCount += 1;
    candidate.lastAttempt = attempt._id;
    candidate.startedAt = now;
    await candidate.save();

    const questions = questionOrder.map((qid) => {
      const q = assessment.questions.find((q) => q._id.toString() === qid.toString());
      if (!q) return null;
      const questionData = {
        _id: q._id,
        text: q.text,
        type: q.type,
        category: q.category,
        skill: q.skill,
        difficulty: q.difficulty,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        timeLimit: q.timeLimit,
      };

      if (q.type === "mcq" || q.type === "mcq_multi" || q.type === "true_false") {
        let options = q.options.map((o) => ({ text: o.text }));
        if (assessment.config?.randomizeOptions) {
          options = options.sort(() => Math.random() - 0.5);
        }
        questionData.options = options;
      }
      return questionData;
    }).filter(Boolean);

    res.json({ attemptId: attempt._id, questions, durationMinutes: assessment.durationMinutes, passingScore: assessment.passingScore, config: assessment.config });
  } catch (e) { next(e); }
};

export const saveAnswer = async (req, res, next) => {
  try {
    const attempt = await AssessmentAttempt.findOne({ _id: req.params.attemptId, student: req.user._id, status: "in_progress" });
    if (!attempt) return res.status(404).json({ message: "Attempt not found or already submitted" });

    const { questionId, selectedOption, selectedOptions, answerText, ratingValue, timeSpentSeconds } = req.body;
    const existingIdx = attempt.answers.findIndex((a) => a.question.toString() === questionId);
    const answerData = {
      question: questionId,
      selectedOption,
      selectedOptions: selectedOptions || [],
      answerText: answerText || "",
      ratingValue,
      timeSpentSeconds: timeSpentSeconds || 0,
      savedAt: new Date(),
    };

    if (existingIdx >= 0) {
      attempt.answers[existingIdx] = { ...attempt.answers[existingIdx], ...answerData };
    } else {
      attempt.answers.push(answerData);
    }

    await attempt.save();
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const submitAttempt = async (req, res, next) => {
  try {
    const attempt = await AssessmentAttempt.findOne({ _id: req.params.attemptId, student: req.user._id, status: "in_progress" });
    if (!attempt) return res.status(404).json({ message: "Attempt not found or already submitted" });

    const assessment = await Assessment.findById(attempt.assessment);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    const now = new Date();
    if (assessment.endDate && new Date(assessment.endDate) < now) {
      attempt.autoSubmitted = true;
    }

    attempt.status = "submitted";
    attempt.submittedAt = now;
    attempt.timeTakenSeconds = Math.round((now - new Date(attempt.startedAt)) / 1000);
    await attempt.save();

    const candidate = await AssessmentCandidate.findOne({ assessment: assessment._id, candidate: req.user._id });
    if (candidate) {
      candidate.status = "submitted";
      candidate.submittedAt = now;
      await candidate.save();
    }

    try {
      const result = await evaluateAttempt(attempt._id);
      if (candidate) {
        candidate.status = result.passed ? "passed" : "failed";
        await candidate.save();
      }
      const candidates = await AssessmentCandidate.find({ assessment: assessment._id });
      const attempts = await AssessmentAttempt.find({ assessment: assessment._id, status: { $in: ["submitted", "evaluated"] } });
      const invited = candidates.length;
      const attempted = attempts.length;
      const avg = attempted ? attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempted : 0;
      const passed = attempts.filter((a) => a.passed).length;
      const passRate = attempted ? Math.round((passed / attempted) * 100) : 0;
      const shortlisted = candidates.filter((c) => c.status === "shortlisted" || c.status === "interview").length;
      await Assessment.findByIdAndUpdate(assessment._id, {
        stats: { candidatesInvited: invited, candidatesAttempted: attempted, averageScore: Math.round(avg * 10) / 10, passRate, shortlisted },
      });
    } catch (evalError) {
      console.error("Evaluation error:", evalError);
    }

    res.json({ success: true, attemptId: attempt._id });
  } catch (e) { next(e); }
};

export const getAttempt = async (req, res, next) => {
  try {
    const attempt = await AssessmentAttempt.findOne({ _id: req.params.attemptId, student: req.user._id })
      .populate("assessment", "name durationMinutes passingScore config status")
      .lean();
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    res.json({ attempt });
  } catch (e) { next(e); }
};

export const logIntegrityEvent = async (req, res, next) => {
  try {
    const attempt = await AssessmentAttempt.findOne({ _id: req.params.attemptId, student: req.user._id });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    const { type, metadata = {} } = req.body;
    const event = await AssessmentIntegrityEvent.create({
      attempt: attempt._id,
      user: req.user._id,
      type,
      metadata,
    });

    attempt.integrityEvents.push(event._id);
    if (["TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXITED", "SUSPICIOUS_KEY_SHORTCUT", "CONTEXT_MENU", "COPY_ATTEMPT", "PASTE_ATTEMPT", "TEXT_SELECTION"].includes(type)) {
      attempt.integrity = attempt.integrity || {};
      attempt.integrity.violationCount = (attempt.integrity.violationCount || 0) + 1;
      attempt.integrity.lastViolationAt = new Date();
      if (type === "TAB_SWITCH") attempt.integrity.tabSwitchCount = (attempt.integrity.tabSwitchCount || 0) + 1;
      if (type === "WINDOW_BLUR") attempt.integrity.windowBlurCount = (attempt.integrity.windowBlurCount || 0) + 1;
      if (type === "FULLSCREEN_EXITED") attempt.integrity.fullscreenExitCount = (attempt.integrity.fullscreenExitCount || 0) + 1;
      if (type === "SUSPICIOUS_KEY_SHORTCUT") attempt.integrity.shortcutCount = (attempt.integrity.shortcutCount || 0) + 1;
    }
    await attempt.save();

    res.json({ success: true, event });
  } catch (e) { next(e); }
};

export const getMyResults = async (req, res, next) => {
  try {
    const attempts = await AssessmentAttempt.find({ student: req.user._id, status: { $in: ["submitted", "evaluated"] } })
      .populate("assessment", "name passingScore durationMinutes")
      .sort({ submittedAt: -1 })
      .lean();
    res.json({ attempts });
  } catch (e) { next(e); }
};
