/**
 * interviewController.js
 *
 * REST controller for the Campus2Career AI Virtual Interviewer.
 * Thin layer — all AI logic lives in virtualInterviewService.js.
 */

import InterviewSession from "../models/InterviewSession.js";
import UserModel        from "../models/UserModel.js";
import NotificationService from "../services/notificationService.js";
import { EVENTS } from "../constants/notificationEvents.js";
import { evaluateSkillGap }          from "../services/skillGapEngine.js";
import {
  generateOpeningGreeting,
  generateNextQuestion,
  getInstantOpeningGreeting,
  getInstantFirstQuestion,
  withInterviewTimeout,
} from "../services/interview/interviewPrompts.js";
import {
  evaluateAnswer,
  generateFinalReport,
} from "../services/virtualInterviewService.js";
import { processInterviewTurn } from "../services/interview/conversationEngine.js";
import { createEmptyMemory } from "../services/interview/interviewMemory.js";
import { synthesizeGeminiSpeech } from "../services/geminiSpeechService.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);

const rollingAvgScore = (session) => {
  const evals = (session.questions || [])
    .filter(q => q.evaluation?.overallScore > 0)
    .map(q => q.evaluation.overallScore);
  return evals.length ? Math.round(evals.reduce((a, b) => a + b, 0) / evals.length) : 70;
};

export const synthesizeInterviewSpeech = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim().slice(0, 1200);
    if (!text) return res.status(400).json({ message: "Speech text is required" });

    const audio = await synthesizeGeminiSpeech(text);
    res.set({
      "Content-Type": "audio/wav",
      "Cache-Control": "private, max-age=300",
    });
    return res.send(audio);
  } catch (error) {
    console.warn("[Interview] Gemini TTS unavailable:", error.message);
    return res.status(503).json({ message: "Neural speech is temporarily unavailable" });
  }
};

// ── POST /api/interviews/start ─────────────────────────────────────────────────
export const startInterview = async (req, res) => {
  try {
    const {
      targetRole,
      interviewType = "mixed",
      difficulty    = "intermediate",
      personality   = "professional",
      durationMinutes = 10,
      resumeBased   = false,
      jobDescription = "",
    } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ message: "Target role is required" });
    }

    const student = await UserModel.findById(req.user._id).lean();
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Build skill-gap context
    const gapResult = evaluateSkillGap(student, targetRole);

    // Build resume context (if resume-based)
    const resumeContext = resumeBased
      ? {
          skills:      student.skills?.slice(0, 10) || [],
          projects:    student.projects?.slice(0, 3) || [],
          experiences: student.experiences?.slice(0, 3) || [],
        }
      : { skills: [], projects: [], experiences: [] };

    // Create session document
    const session = await InterviewSession.create({
      studentId:      student._id,
      targetRole:     targetRole.trim(),
      interviewType,
      difficulty,
      personality,
      durationMinutes: Math.min(Math.max(Number(durationMinutes) || 10, 5), 60),
      resumeBased,
      jobDescription: String(jobDescription || "").slice(0, 2000),
      status:    "active",
      startedAt: new Date(),
      skillGapContext: {
        strongSkills:  gapResult.strongSkills  || [],
        missingSkills: gapResult.missingSkills || [],
        coverage:      gapResult.skillCoverage || 0,
      },
      resumeContext,
      conversationMemory: createEmptyMemory(student.name || ""),
      conversationState: {
        phase: "welcome",
        questionNumber: 0,
        interviewerEmotion: "idle",
        candidateReady: false,
        topicsCovered: [],
        topicsMissing: gapResult.missingSkills || [],
      },
    });

    const instantGreeting = getInstantOpeningGreeting(session, student.name);
    const instantFirstQ = getInstantFirstQuestion(session);

    const [greeting, firstQ] = await Promise.all([
      withInterviewTimeout(
        generateOpeningGreeting(session, student.name),
        instantGreeting
      ),
      withInterviewTimeout(
        generateNextQuestion(session, 70, session.conversationMemory),
        instantFirstQ
      ),
    ]);

    session.openingGreeting = greeting;
    session.conversationState.interviewerEmotion = "speaking";

    session.questions.push({
      question:     firstQ.question,
      section:      firstQ.section || "warmup",
      questionType: "primary",
      isFollowUp:   false,
      askedAt:      new Date(),
    });
    session.conversationState.phase = "warmup";
    session.conversationState.questionNumber = 1;

    await session.save();

    console.log(`[Interview] Session started: ${session._id} | Student: ${student._id} | Role: ${targetRole}`);

    return res.status(201).json({
      success: true,
      sessionId: session._id,
      candidateName: student.name || "",
      greeting:  session.openingGreeting,
      question:  {
        index: 0,
        text:  firstQ.question,
        section: firstQ.section,
      },
      speakText: greeting,
      waitForReady: true,
      emotion: "speaking",
      phase: "welcome",
      totalDurationMs: session.durationMinutes * 60 * 1000,
    });
  } catch (error) {
    console.error("[Interview] startInterview error:", error);
    return res.status(500).json({ message: "Failed to start interview session" });
  }
};

// ── POST /api/interviews/:sessionId/answer ────────────────────────────────────
export const submitAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { transcript, questionIndex, requestFollowUp, confirmReady } = req.body;

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (String(session.studentId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (session.status !== "active") {
      return res.status(400).json({ message: `Session is ${session.status}` });
    }

    // Handle "ready to begin" confirmation
    if (confirmReady && !session.conversationState?.candidateReady) {
      session.conversationState.candidateReady = true;
      session.conversationState.phase = "introduction";
      session.conversationState.interviewerEmotion = "encouraging";
      const firstQ = session.questions[0];
      const speakText = `Great. Let's begin. ${firstQ?.question || "Tell me about yourself."}`;
      await session.save();
      return res.json({
        success: true,
        nextAction: "begin_interview",
        speakText,
        emotion: "encouraging",
        phase: "introduction",
        status: "speaking",
        nextQuestion: {
          index: 0,
          text: firstQ?.question || "",
          section: firstQ?.section || "warmup",
        },
        thinkingPauseMs: 600,
      });
    }

    if (!transcript?.trim()) {
      return res.status(400).json({ message: "Answer transcript is required" });
    }

    const idx = typeof questionIndex === "number"
      ? questionIndex
      : session.questions.length - 1;

    if (idx < 0 || idx >= session.questions.length) {
      return res.status(400).json({ message: "Invalid question index" });
    }

    const qRecord = session.questions[idx];

    qRecord.answer = {
      transcript: transcript.trim().slice(0, 2000),
      answeredAt: new Date(),
      durationMs: req.body.durationMs || 0,
    };

    const evaluation = await evaluateAnswer(qRecord.question, transcript, session);
    if (requestFollowUp) evaluation.followUpRequired = true;
    qRecord.evaluation = evaluation;

    const turn = await processInterviewTurn(session, qRecord, transcript, evaluation);

    session.conversationMemory = turn.memory;
    session.conversationState = {
      ...session.conversationState,
      phase: turn.conversational.phase,
      interviewerEmotion: turn.conversational.emotion,
      questionNumber: (session.conversationState?.questionNumber || 0) + 1,
    };

    const { nextQuestion, nextAction, conversational, rollingAvg } = turn;

    if (nextQuestion.isFollowUp) {
      session.questions.push({
        question: nextQuestion.text,
        section: nextQuestion.section || qRecord.section,
        questionType: "follow-up",
        isFollowUp: true,
        parentIndex: idx,
        askedAt: new Date(),
      });
      qRecord.followUpQuestion = nextQuestion.text;
    } else {
      session.questions.push({
        question: nextQuestion.text,
        section: nextQuestion.section || session.interviewType,
        questionType: "primary",
        isFollowUp: false,
        askedAt: new Date(),
      });
    }

    session.currentQuestionIndex = session.questions.length - 1;
    await session.save();

    console.log(`[Interview] Answer | Session: ${sessionId} | Q${idx} | ${turn.analysis.classification} | score: ${evaluation.overallScore}`);

    return res.json({
      success: true,
      evaluation: {
        overallScore: evaluation.overallScore,
        classification: turn.analysis.classification,
        followUpRequired: nextAction === "follow_up",
      },
      nextAction,
      nextQuestion: {
        index: session.questions.length - 1,
        text: nextQuestion.text,
        section: nextQuestion.section,
      },
      speakText: conversational.speakText,
      emotion: conversational.emotion,
      status: conversational.status,
      phase: conversational.phase,
      thinkingPauseMs: conversational.thinkingPauseMs,
      avgScore: rollingAvg,
    });
  } catch (error) {
    console.error("[Interview] submitAnswer error:", error);
    return res.status(500).json({ message: "Failed to process answer" });
  }
};

// ── POST /api/interviews/:sessionId/end ───────────────────────────────────────
export const endInterview = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (String(session.studentId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (session.status === "completed") {
      // Already done — return the existing report
      return res.json({ success: true, sessionId, alreadyCompleted: true, summary: session.summary });
    }

    session.status  = "completed";
    session.endedAt = new Date();

    // Generate final report
    const report = await generateFinalReport(session);
    session.summary         = report.summary;
    session.strengths       = report.strengths;
    session.weaknesses      = report.weaknesses;
    session.recommendations = report.recommendations;
    session.readinessLevel  = report.readinessLevel;
    session.executiveSummary = report.executiveSummary || "";

    await session.save();

    console.log(`[Interview] Session completed: ${sessionId} | Score: ${report.summary.overallScore}`);

    setImmediate(() => {
      NotificationService.notify({
        userId: session.studentId,
        event: EVENTS.INTERVIEW_COMPLETED,
        data: {
          sessionId,
          targetRole: session.targetRole,
          role: "student",
        },
      }).catch((e) => console.error("[endInterview] notification error:", e.message));
    });

    return res.json({
      success: true,
      sessionId,
      targetRole:      session.targetRole,
      durationMinutes: session.durationMinutes,
      createdAt:       session.createdAt,
      summary:         report.summary,
      strengths:       report.strengths,
      weaknesses:      report.weaknesses,
      recommendations: report.recommendations,
      readinessLevel:  report.readinessLevel,
      executiveSummary: report.executiveSummary,
      struggledQuestions: report.struggledQuestions || [],
      topicsToPractice: report.topicsToPractice || [],
      evaluations: session.questions
        .filter(q => q.answer?.transcript)
        .map(q => ({
          questionText:  q.question,
          studentAnswer: q.answer.transcript,
          score:         q.evaluation?.overallScore ?? 0,
          feedback:      q.evaluation?.improvements?.join(" ") || "",
        })),
    });
  } catch (error) {
    console.error("[Interview] endInterview error:", error);
    return res.status(500).json({ message: "Failed to end interview session" });
  }
};

// ── GET /api/interviews/:sessionId ────────────────────────────────────────────
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findById(sessionId).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (String(session.studentId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    return res.json({ success: true, session });
  } catch (error) {
    console.error("[Interview] getSession error:", error);
    return res.status(500).json({ message: "Failed to retrieve session" });
  }
};

// ── GET /api/interviews/:sessionId/report ─────────────────────────────────────
export const getReport = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findById(sessionId).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (String(session.studentId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (session.status !== "completed") {
      return res.status(400).json({ message: "Interview has not been completed yet" });
    }

    return res.json({
      success:  true,
      sessionId,
      targetRole:     session.targetRole,
      interviewType:  session.interviewType,
      difficulty:     session.difficulty,
      durationMinutes: session.durationMinutes,
      questionsCount: session.questions?.length || 0,
      startedAt:  session.startedAt,
      endedAt:    session.endedAt,
      createdAt:  session.createdAt,
      summary:         session.summary,
      strengths:       session.strengths,
      weaknesses:      session.weaknesses,
      recommendations: session.recommendations,
      readinessLevel:  session.readinessLevel,
      evaluations: (session.questions || [])
        .filter(q => q.answer?.transcript)
        .map(q => ({
          questionText:  q.question,
          studentAnswer: q.answer.transcript,
          score:         q.evaluation?.overallScore ?? 0,
          feedback:      q.evaluation?.improvements?.join(" ") || "",
        })),
    });
  } catch (error) {
    console.error("[Interview] getReport error:", error);
    return res.status(500).json({ message: "Failed to retrieve report" });
  }
};

// ── GET /api/interviews/history ───────────────────────────────────────────────
export const getHistory = async (req, res) => {
  try {
    const sessions = await InterviewSession.find(
      { studentId: req.user._id, status: { $in: ["completed", "abandoned"] } },
      {
        targetRole: 1, interviewType: 1, difficulty: 1, durationMinutes: 1,
        status: 1, startedAt: 1, endedAt: 1,
        "summary.overallScore": 1,
        readinessLevel: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({ success: true, history: sessions });
  } catch (error) {
    console.error("[Interview] getHistory error:", error);
    return res.status(500).json({ message: "Failed to retrieve interview history" });
  }
};

// ── POST /api/interviews/avatar/token ────────────────────────────────────────
// Proxies HeyGen session token so HEYGEN_API_KEY stays server-side.
export const getAvatarToken = async (req, res) => {
  try {
    const apiKey    = process.env.HEYGEN_API_KEY;
    const avatarId  = process.env.HEYGEN_AVATAR_ID || "Angela-inblacktopsuit-20220820";
    const voiceId   = process.env.HEYGEN_VOICE_ID  || "1bd001e7e50f421d891986aad5158bc8";

    if (!apiKey) {
      return res.status(200).json({
        success:   false,
        available: false,
        message:   "HeyGen avatar service not configured — using fallback mode",
      });
    }

    const heygenRes = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key":    apiKey,
      },
      body: JSON.stringify({
        avatar_id: avatarId,
        voice_id:  voiceId,
      }),
    });

    if (!heygenRes.ok) {
      const err = await heygenRes.text();
      console.error("[Interview] HeyGen token error:", err);
      return res.status(200).json({
        success:   false,
        available: false,
        message:   "Avatar service temporarily unavailable — using fallback mode",
      });
    }

    const data = await heygenRes.json();
    return res.json({
      success:   true,
      available: true,
      token:     data.data?.token || data.token,
      avatarId,
      voiceId,
    });
  } catch (error) {
    console.error("[Interview] getAvatarToken error:", error);
    return res.status(200).json({
      success:   false,
      available: false,
      message:   "Avatar service temporarily unavailable — using fallback mode",
    });
  }
};

import fs from "fs";
import path from "path";

// Helper to get local interviewer URL
const getLocalInterviewerUrl = (req) => {
  try {
    const pathsToTry = [
      path.join(process.cwd(), "uploads", "interviewer.jpeg"),
      path.join(process.cwd(), "..", "interviewer", "interviewer.jpeg"),
      path.join(process.cwd(), "interviewer", "interviewer.jpeg"),
      path.join(process.cwd(), "..", "frontend", "public", "interviewer.jpeg"),
      path.join(process.cwd(), "frontend", "public", "interviewer.jpeg"),
    ];
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        const backendUrl = (process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
        const imageUrl = `${backendUrl}/uploads/interviewer.jpeg`;
        
        // Only use local URL if it's publicly accessible (not localhost/127.0.0.1)
        const isPublic = !backendUrl.includes("localhost") && !backendUrl.includes("127.0.0.1") && !backendUrl.includes("0.0.0.0");
        if (isPublic) {
          return imageUrl;
        }
        break;
      }
    }
  } catch (e) {
    console.warn("Could not resolve local interviewer.jpeg:", e.message);
  }
  return "https://create-images-results.d-id.com/DefaultPresenters/Noam_m/image.jpeg";
};

// ── D-ID STREAMING AVATAR CONTROLLER ACTIONS ─────────────────────────────────

const getDIDKey = () => process.env.DID_API_KEY || process.env.D_ID_API_KEY;

export const createDIDStream = async (req, res) => {
  try {
    const apiKey = getDIDKey();
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        available: false,
        message: "D-ID API key not configured",
      });
    }

    const authHeader = apiKey.startsWith("Basic ") ? apiKey : `Basic ${apiKey}`;
    let presenterUrl = req.body.presenterUrl;

    if (!presenterUrl || presenterUrl === "default" || presenterUrl.startsWith("/interviewer") || presenterUrl.includes("interviewer.jpeg")) {
      presenterUrl = getLocalInterviewerUrl(req);
    }

    const didRes = await fetch("https://api.d-id.com/talks/streams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({ source_url: presenterUrl }),
    });

    if (!didRes.ok) {
      const errText = await didRes.text();
      console.error("[Interview] D-ID stream creation error:", errText);
      return res.status(200).json({
        success: false,
        available: false,
        message: "D-ID stream creation failed",
        error: errText,
      });
    }

    const data = await didRes.json();
    return res.json({
      success: true,
      available: true,
      streamId: data.id,
      offer: data.offer,
      iceServers: data.ice_servers,
      sessionId: data.session_id,
    });
  } catch (error) {
    console.error("[Interview] createDIDStream error:", error);
    return res.status(200).json({
      success: false,
      available: false,
      message: "D-ID service connection error",
    });
  }
};

export const sendDIDSDP = async (req, res) => {
  try {
    const { streamId, answer, sessionId } = req.body;
    const apiKey = getDIDKey();
    if (!apiKey || !streamId || !answer) {
      return res.status(400).json({ message: "Missing required D-ID SDP parameters" });
    }

    const authHeader = apiKey.startsWith("Basic ") ? apiKey : `Basic ${apiKey}`;
    const didRes = await fetch(`https://api.d-id.com/talks/streams/${streamId}/sdp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({ answer, session_id: sessionId }),
    });

    const data = await didRes.json();
    return res.json({ success: didRes.ok, data });
  } catch (error) {
    console.error("[Interview] sendDIDSDP error:", error);
    return res.status(500).json({ message: "Failed to send D-ID SDP" });
  }
};

export const sendDIDICE = async (req, res) => {
  try {
    const { streamId, candidate, sdpMid, sdpMLineIndex, sessionId } = req.body;
    const apiKey = getDIDKey();
    if (!apiKey || !streamId || !candidate) {
      return res.status(400).json({ message: "Missing required D-ID ICE parameters" });
    }

    const authHeader = apiKey.startsWith("Basic ") ? apiKey : `Basic ${apiKey}`;
    const didRes = await fetch(`https://api.d-id.com/talks/streams/${streamId}/ice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });

    const data = await didRes.json();
    return res.json({ success: didRes.ok, data });
  } catch (error) {
    console.error("[Interview] sendDIDICE error:", error);
    return res.status(500).json({ message: "Failed to send D-ID ICE candidate" });
  }
};

export const speakDIDStream = async (req, res) => {
  try {
    const { streamId, text, sessionId, voiceId = "en-US-JennyNeural" } = req.body;
    const apiKey = getDIDKey();
    if (!apiKey || !streamId || !text) {
      return res.status(400).json({ message: "Missing required speak parameters" });
    }

    const authHeader = apiKey.startsWith("Basic ") ? apiKey : `Basic ${apiKey}`;
    const didRes = await fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        script: {
          type: "text",
          sub_type: "talk",
          input: text,
          provider: {
            type: "microsoft",
            voice_id: voiceId,
          },
        },
        config: {
          fluent: true,
          pad_audio: 0.0,
          stitch: true,
          align_driver: true,
          auto_match: true,
        },
        session_id: sessionId,
      }),
    });

    const data = await didRes.json();
    return res.json({ success: didRes.ok, data });
  } catch (error) {
    console.error("[Interview] speakDIDStream error:", error);
    return res.status(500).json({ message: "Failed to make D-ID avatar speak" });
  }
};

export const closeDIDStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { sessionId } = req.body;
    const apiKey = getDIDKey();
    if (!apiKey || !streamId) return res.json({ success: true });

    const authHeader = apiKey.startsWith("Basic ") ? apiKey : `Basic ${apiKey}`;
    await fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: true });
  }
};

export default {
  startInterview,
  synthesizeInterviewSpeech,
  submitAnswer,
  endInterview,
  getSession,
  getReport,
  getHistory,
  getAvatarToken,
  createDIDStream,
  sendDIDSDP,
  sendDIDICE,
  speakDIDStream,
  closeDIDStream,
};
