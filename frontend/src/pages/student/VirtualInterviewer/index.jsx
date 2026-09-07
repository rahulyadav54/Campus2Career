/**
 * index.jsx
 *
 * Main entry component for AI Virtual Interviewer.
 * Orchestrates views:
 * 1. setup: Interview setup screen (role, type, difficulty, avatar choice)
 * 2. live: Real-time simulation (Avatar + Voice + Transcript + Question State Machine)
 * 3. report: Performance feedback & readiness evaluation
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InterviewSetup from "./InterviewSetup";
import LiveInterview from "./LiveInterview";
import InterviewReport from "./InterviewReport";
import { interviewService } from "../../../services/interviewService";

export default function VirtualInterviewer() {
  const { sessionId: paramSessionId } = useParams();
  const navigate = useNavigate();

  const [view, setView] = useState(paramSessionId ? "report" : "setup"); // 'setup' | 'live' | 'report'
  const [activeSession, setActiveSession] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [starting, setStarting] = useState(false);

  // If a session ID is passed in URL, load that session/report directly
  useEffect(() => {
    if (paramSessionId) {
      loadSession(paramSessionId);
    }
  }, [paramSessionId]);

  const loadSession = async (id) => {
    try {
      const res = await interviewService.getReport(id);
      if (res.data?.success) {
        setReportData(res.data.data.report || res.data.data);
        setView("report");
      }
    } catch (err) {
      console.error("Failed to load past session report:", err);
      setView("setup");
    }
  };

  const handleStartInterview = async (config) => {
    setStarting(true);
    try {
      const res = await interviewService.start(config);
      const data = res.data?.data || res.data;
      if (data?.success || data?.sessionId) {
        setActiveSession({
          sessionId: data.sessionId,
          greeting: data.greeting,
          firstQuestion: data.question,
          totalDurationMs: data.totalDurationMs || (config.durationMinutes * 60 * 1000),
          presenterUrl: config.presenterUrl,
        });
        setView("live");
      } else {
        throw new Error(data?.message || "Could not start session");
      }
    } catch (err) {
      console.warn("Starting interview in client session mode:", err.message);
      setActiveSession({
        sessionId: "local-" + Date.now(),
        greeting: `Welcome! I will be interviewing you today for the ${config.targetRole} position.`,
        firstQuestion: {
          index: 0,
          text: `To get started, please introduce yourself and tell me about your background relevant to ${config.targetRole}.`,
          section: config.interviewType || "general",
        },
        totalDurationMs: (config.durationMinutes || 10) * 60 * 1000,
        presenterUrl: config.presenterUrl,
      });
      setView("live");
    } finally {
      setStarting(false);
    }
  };

  const handleFinishInterview = (report) => {
    setReportData(report);
    setView("report");
  };

  const handleRestart = () => {
    setActiveSession(null);
    setReportData(null);
    setView("setup");
    navigate("/student/virtual-interview");
  };

  return (
    <div className="w-full min-h-screen bg-slate-950">
      {view === "setup" && (
        <InterviewSetup onStart={handleStartInterview} loading={starting} />
      )}

      {view === "live" && activeSession && (
        <LiveInterview
          session={activeSession}
          onFinish={handleFinishInterview}
          onExit={handleRestart}
        />
      )}

      {view === "report" && (
        <InterviewReport
          sessionId={activeSession?.sessionId || paramSessionId}
          reportData={reportData}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
