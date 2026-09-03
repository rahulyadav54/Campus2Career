import { Question, AssessmentTemplate } from "../models/QuestionBankModel.js";
import AssessmentAttempt from "../models/AssessmentAttemptModel.js";
import User from "../models/UserModel.js";

// Admin: create question
export const createQuestion = async (req, res) => {
  try {
    const question = await Question.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ question });
  } catch (error) {
    res.status(400).json({ message: "Unable to create question", error: error.message });
  }
};

// Admin: list questions
export const listQuestions = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.skill) filter.skill = new RegExp(req.query.skill, "i");
    const questions = await Question.find(filter).sort({ category: 1, skill: 1 });
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: "Unable to load questions", error: error.message });
  }
};

// Admin: update question
export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!question) return res.status(404).json({ message: "Question not found" });
    res.json({ question });
  } catch (error) {
    res.status(400).json({ message: "Unable to update question", error: error.message });
  }
};

// Admin: delete (deactivate) question
export const deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Question removed" });
  } catch (error) {
    res.status(500).json({ message: "Unable to remove question", error: error.message });
  }
};

// Admin: create assessment template
export const createTemplate = async (req, res) => {
  try {
    const template = await AssessmentTemplate.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ template });
  } catch (error) {
    res.status(400).json({ message: "Unable to create template", error: error.message });
  }
};

// Admin: list templates
export const listTemplates = async (req, res) => {
  try {
    const templates = await AssessmentTemplate.find({ isActive: true })
      .populate("questions", "text category skill type marks")
      .sort({ createdAt: -1 });
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ message: "Unable to load templates", error: error.message });
  }
};

// Student: start a timed assessment attempt
export const startAttempt = async (req, res) => {
  try {
    const template = await AssessmentTemplate.findById(req.params.templateId)
      .populate("questions");
    if (!template || !template.isActive) return res.status(404).json({ message: "Assessment not found" });

    const attempt = await AssessmentAttempt.create({
      student: req.user._id,
      template: template._id,
      startedAt: new Date()
    });

    // Return questions without correct answers
    const questions = template.questions.map((q) => ({
      _id: q._id,
      text: q.text,
      category: q.category,
      skill: q.skill,
      type: q.type,
      options: q.options.map((o) => ({ text: o.text })),
      marks: q.marks
    }));

    res.json({ attemptId: attempt._id, questions, timeLimitMinutes: template.timeLimitMinutes });
  } catch (error) {
    res.status(500).json({ message: "Unable to start assessment", error: error.message });
  }
};

// Student: submit attempt answers
export const submitAttempt = async (req, res) => {
  try {
    const attempt = await AssessmentAttempt.findOne({ _id: req.params.attemptId, student: req.user._id });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.submittedAt) return res.status(400).json({ message: "Attempt already submitted" });

    const template = await AssessmentTemplate.findById(attempt.template).populate("questions");
    const { answers = [] } = req.body;

    const scores = { technical: 0, soft: 0, aptitude: 0, total: 0 };
    const maxScores = { technical: 0, soft: 0, aptitude: 0, total: 0 };
    const skillScores = {};

    const processedAnswers = answers.map((ans) => {
      const question = template.questions.find((q) => q._id.toString() === ans.questionId);
      if (!question) return null;

      maxScores[question.category] = (maxScores[question.category] || 0) + question.marks;
      maxScores.total += question.marks;

      let isCorrect = false;
      let marksAwarded = 0;

      if (question.type === "mcq" || question.type === "true_false") {
        const correctIdx = question.options.findIndex((o) => o.isCorrect);
        isCorrect = ans.selectedOption === correctIdx;
        marksAwarded = isCorrect ? question.marks : 0;
      } else if (question.type === "rating") {
        marksAwarded = Math.round(((ans.ratingValue || 0) / 100) * question.marks);
        isCorrect = marksAwarded >= question.marks * 0.7;
      }

      scores[question.category] = (scores[question.category] || 0) + marksAwarded;
      scores.total += marksAwarded;

      if (!skillScores[question.skill]) skillScores[question.skill] = { earned: 0, max: 0 };
      skillScores[question.skill].earned += marksAwarded;
      skillScores[question.skill].max += question.marks;

      return { question: question._id, selectedOption: ans.selectedOption, ratingValue: ans.ratingValue, isCorrect, marksAwarded };
    }).filter(Boolean);

    const strengths = Object.entries(skillScores).filter(([, v]) => v.max > 0 && (v.earned / v.max) >= 0.7).map(([k]) => k);
    const gaps = Object.entries(skillScores).filter(([, v]) => v.max > 0 && (v.earned / v.max) < 0.6).map(([k]) => k);
    const passed = maxScores.total > 0 && (scores.total / maxScores.total) * 100 >= template.passingScore;

    attempt.answers = processedAnswers;
    attempt.scores = scores;
    attempt.maxScores = maxScores;
    attempt.strengths = strengths;
    attempt.gaps = gaps;
    attempt.submittedAt = new Date();
    attempt.timeTakenSeconds = Math.round((attempt.submittedAt - attempt.startedAt) / 1000);
    attempt.passed = passed;
    await attempt.save();

    // Update user skill profile
    await User.findByIdAndUpdate(req.user._id, {
      "skillProfile.strengths": strengths,
      "skillProfile.gaps": gaps,
      "skillProfile.lastAssessedAt": attempt.submittedAt
    });

    res.json({ attempt });
  } catch (error) {
    res.status(500).json({ message: "Unable to submit assessment", error: error.message });
  }
};

// Student: get attempt history
export const getAttemptHistory = async (req, res) => {
  try {
    const attempts = await AssessmentAttempt.find({ student: req.user._id, submittedAt: { $exists: true } })
      .populate("template", "title timeLimitMinutes passingScore")
      .sort({ submittedAt: -1 });
    res.json({ attempts });
  } catch (error) {
    res.status(500).json({ message: "Unable to load history", error: error.message });
  }
};
