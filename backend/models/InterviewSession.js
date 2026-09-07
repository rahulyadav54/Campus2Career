import mongoose from "mongoose";

// ── Per-question evaluation ──────────────────────────────────────────────────
const evaluationSchema = new mongoose.Schema(
  {
    relevance:           { type: Number, min: 0, max: 100, default: 0 },
    technicalKnowledge:  { type: Number, min: 0, max: 100, default: 0 },
    communication:       { type: Number, min: 0, max: 100, default: 0 },
    clarity:             { type: Number, min: 0, max: 100, default: 0 },
    confidence:          { type: Number, min: 0, max: 100, default: 0 },
    problemSolving:      { type: Number, min: 0, max: 100, default: 0 },
    overallScore:        { type: Number, min: 0, max: 100, default: 0 },
    strengths:           [{ type: String }],
    improvements:        [{ type: String }],
    followUpRequired:    { type: Boolean, default: false },
    followUpReason:      { type: String, default: "" },
    answerClassification: { type: String, default: "" },
  },
  { _id: false }
);

// ── Per-question answer ───────────────────────────────────────────────────────
const answerSchema = new mongoose.Schema(
  {
    transcript:   { type: String, default: "" },
    answeredAt:   { type: Date },
    durationMs:   { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Individual question record ───────────────────────────────────────────────
const questionRecordSchema = new mongoose.Schema(
  {
    question:         { type: String, required: true },
    section:          { type: String, default: "general" },        // hr | technical | behavioral | follow-up
    questionType:     { type: String, default: "primary" },        // primary | follow-up
    askedAt:          { type: Date },
    isFollowUp:       { type: Boolean, default: false },
    parentIndex:      { type: Number, default: -1 },               // index of parent question if follow-up
    answer:           answerSchema,
    evaluation:       evaluationSchema,
    followUpQuestion: { type: String, default: "" },               // follow-up generated after this Q
  },
  { _id: false }
);

// ── Interview summary (populated on completion) ───────────────────────────────
const summarySchema = new mongoose.Schema(
  {
    overallScore:          { type: Number, min: 0, max: 100, default: 0 },
    technicalScore:        { type: Number, min: 0, max: 100, default: 0 },
    communicationScore:    { type: Number, min: 0, max: 100, default: 0 },
    confidenceScore:       { type: Number, min: 0, max: 100, default: 0 },
    problemSolvingScore:   { type: Number, min: 0, max: 100, default: 0 },
    answerRelevanceScore:  { type: Number, min: 0, max: 100, default: 0 },
    clarityScore:          { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

// ── Root interview session ────────────────────────────────────────────────────
const interviewSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },

    // Setup config
    targetRole:    { type: String, required: true },
    interviewType: {
      type:    String,
      enum:    ["hr", "technical", "behavioral", "mixed", "resume-based"],
      default: "mixed",
    },
    difficulty: {
      type:    String,
      enum:    ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
    },
    personality: {
      type:    String,
      enum:    ["professional", "friendly", "strict", "technical", "hr-manager"],
      default: "professional",
    },
    durationMinutes:   { type: Number, default: 10 },
    resumeBased:       { type: Boolean, default: false },
    jobDescription:    { type: String, default: "" },

    conversationState: {
      phase:               { type: String, default: "welcome" },
      questionNumber:      { type: Number, default: 0 },
      interviewerEmotion:  { type: String, default: "idle" },
      candidateReady:      { type: Boolean, default: false },
      topicsCovered:       [{ type: String }],
      topicsMissing:       [{ type: String }],
    },

    conversationMemory: {
      candidateName:           { type: String, default: "" },
      skillsMentioned:         [{ type: String }],
      projectsMentioned:       [{ type: String }],
      technologiesMentioned:   [{ type: String }],
      topicsCovered:           [{ type: String }],
      strongAreas:             [{ type: String }],
      weakAreas:               [{ type: String }],
      keyQuotes:               [{ type: String }],
      questionsAsked:          [{ type: String }],
    },

    executiveSummary: { type: String, default: "" },

    // Session lifecycle
    status: {
      type:    String,
      enum:    ["pending", "active", "paused", "completed", "abandoned"],
      default: "pending",
    },
    startedAt:   { type: Date },
    endedAt:     { type: Date },
    pausedAt:    { type: Date },

    // Conversation
    currentQuestionIndex: { type: Number, default: 0 },
    questions:            [questionRecordSchema],

    // Opening message spoken by avatar
    openingGreeting: { type: String, default: "" },

    // Skill gap context (snapshot at session start)
    skillGapContext: {
      strongSkills:  [{ type: String }],
      missingSkills: [{ type: String }],
      coverage:      { type: Number, default: 0 },
    },

    // Resume context (snapshot — no raw file stored here)
    resumeContext: {
      skills:       [{ type: String }],
      projects:     [{ type: mongoose.Schema.Types.Mixed }],
      experiences:  [{ type: mongoose.Schema.Types.Mixed }],
    },

    // Final results (populated when status = completed)
    summary:         summarySchema,
    strengths:       [{ type: String }],
    weaknesses:      [{ type: String }],
    recommendations: [{ type: String }],
    readinessLevel: {
      type:    String,
      enum:    ["Excellent", "Ready with Improvement", "Needs More Practice", "Not Yet Ready", ""],
      default: "",
    },

    // AI model used
    aiModel: { type: String, default: "gemini" },
  },
  { timestamps: true }
);

// Compound index for student history queries
interviewSessionSchema.index({ studentId: 1, createdAt: -1 });
interviewSessionSchema.index({ studentId: 1, status: 1 });

export default mongoose.model("InterviewSession", interviewSessionSchema);
