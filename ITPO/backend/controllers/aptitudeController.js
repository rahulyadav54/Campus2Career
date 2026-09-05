import AptitudeTest from "../models/AptitudeTest.js";
import AptitudeAttempt from "../models/AptitudeAttempt.js";

const sanitizeTest = (test) => {
  if (!test) return test;
  const obj = test.toObject ? test.toObject() : { ...test };
  if (Array.isArray(obj.questions)) {
    obj.questions = obj.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      marks: q.marks
    }));
  }
  return obj;
};

// Admin: create aptitude test
export const createTest = async (req, res) => {
  try {
    const payload = { ...req.body, createdBy: req.user._id };
    const test = await AptitudeTest.create(payload);
    res.status(201).json({ test });
  } catch (error) {
    res.status(400).json({ message: "Unable to create aptitude test", error: error.message });
  }
};

// Admin: publish test
export const publishTest = async (req, res) => {
  try {
    const test = await AptitudeTest.findByIdAndUpdate(
      req.params.id,
      { isPublished: true, status: "published" },
      { new: true, runValidators: true }
    );
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json({ test });
  } catch (error) {
    res.status(400).json({ message: "Unable to publish test", error: error.message });
  }
};

// List published tests
export const listTests = async (req, res) => {
  try {
    const filter = { isPublished: true, status: "published" };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    const tests = await AptitudeTest.find(filter)
      .select("title description category difficulty timeLimitMinutes totalMarks passingMarks")
      .sort({ createdAt: -1 });
    res.json({ tests });
  } catch (error) {
    res.status(500).json({ message: "Unable to load tests", error: error.message });
  }
};

// Get test details (without correct answers)
export const getTestById = async (req, res) => {
  try {
    const test = await AptitudeTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });
    if (!test.isPublished && req.user.role !== "admin") {
      return res.status(403).json({ message: "Test not available" });
    }
    res.json({ test: sanitizeTest(test) });
  } catch (error) {
    res.status(500).json({ message: "Unable to load test", error: error.message });
  }
};

// Student: start attempt
export const startAttempt = async (req, res) => {
  try {
    const test = await AptitudeTest.findById(req.params.id);
    if (!test || !test.isPublished) return res.status(404).json({ message: "Test not found" });

    const attempt = await AptitudeAttempt.create({
      student: req.user._id,
      test: test._id,
      startedAt: new Date()
    });

    res.json({
      attemptId: attempt._id,
      testId: test._id,
      title: test.title,
      timeLimitMinutes: test.timeLimitMinutes,
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      questions: sanitizeTest(test).questions,
      startedAt: attempt.startedAt
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to start attempt", error: error.message });
  }
};

// Student: submit attempt with auto-evaluation
export const submitAttempt = async (req, res) => {
  try {
    const { answers = [], attemptId } = req.body || {};
    let attempt;

    if (attemptId) {
      attempt = await AptitudeAttempt.findOne({ _id: attemptId, student: req.user._id });
      if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    } else {
      attempt = await AptitudeAttempt.findOne({
        test: req.params.id,
        student: req.user._id,
        submittedAt: { $exists: false }
      }).sort({ startedAt: -1 });
      if (!attempt) return res.status(404).json({ message: "No active attempt found" });
    }

    if (attempt.submittedAt) return res.status(400).json({ message: "Attempt already submitted" });

    const test = await AptitudeTest.findById(attempt.test);
    if (!test) return res.status(404).json({ message: "Test not found" });

    let totalMarksObtained = 0;
    const processedAnswers = (test.questions || []).map((q, idx) => {
      const submitted = Array.isArray(answers)
        ? answers.find((a) => Number(a.questionIndex) === idx)
        : null;
      const selectedOption = submitted ? submitted.selectedOption : null;
      const isCorrect = selectedOption != null && selectedOption === q.correctAnswer;
      const marksObtained = isCorrect ? q.marks : 0;
      totalMarksObtained += marksObtained;
      return { questionIndex: idx, selectedOption, isCorrect, marksObtained };
    });

    const submittedAtDate = new Date();
    const timeTakenSeconds = Math.max(0, Math.round((submittedAtDate - attempt.startedAt) / 1000));
    const totalMarks = test.totalMarks || 0;
    const percentage = totalMarks > 0 ? Math.round((totalMarksObtained / totalMarks) * 10000) / 100 : 0;
    const passed = totalMarksObtained >= (test.passingMarks || 0);

    attempt.answers = processedAnswers;
    attempt.totalMarksObtained = totalMarksObtained;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.submittedAt = submittedAtDate;
    attempt.timeTakenSeconds = timeTakenSeconds;
    await attempt.save();

    res.json({
      attempt,
      test: { _id: test._id, title: test.title, totalMarks: test.totalMarks, passingMarks: test.passingMarks }
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to submit attempt", error: error.message });
  }
};

// List student's attempts
export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await AptitudeAttempt.find({ student: req.user._id })
      .populate("test", "title category difficulty totalMarks passingMarks timeLimitMinutes")
      .sort({ createdAt: -1 });
    res.json({ attempts });
  } catch (error) {
    res.status(500).json({ message: "Unable to load attempts", error: error.message });
  }
};

// View a single attempt with solutions
export const getAttemptResult = async (req, res) => {
  try {
    const attempt = await AptitudeAttempt.findById(req.params.attemptId)
      .populate("test", "title description category difficulty totalMarks passingMarks timeLimitMinutes questions");
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    const isOwner = attempt.student.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!attempt.submittedAt) {
      return res.status(400).json({ message: "Attempt not yet submitted" });
    }

    const test = attempt.test;
    const solutions = (test.questions || []).map((q, idx) => {
      const ans = attempt.answers.find((a) => a.questionIndex === idx);
      return {
        questionIndex: idx,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        marks: q.marks,
        selectedOption: ans ? ans.selectedOption : null,
        isCorrect: ans ? ans.isCorrect : false,
        marksObtained: ans ? ans.marksObtained : 0
      };
    });

    res.json({
      attempt: {
        _id: attempt._id,
        testId: test._id,
        title: test.title,
        category: test.category,
        difficulty: test.difficulty,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        totalMarksObtained: attempt.totalMarksObtained,
        percentage: attempt.percentage,
        passed: attempt.passed,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeTakenSeconds: attempt.timeTakenSeconds
      },
      solutions
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load result", error: error.message });
  }
};