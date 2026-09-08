/**
 * index.jsx — Virtual Interviewer entry: setup → pre-checks → live → report
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InterviewSetup from "./InterviewSetup";
import LiveInterview from "./LiveInterview";
import InterviewReport from "./InterviewReport";
import PreInterviewFlow from "../../../features/virtualInterview/PreInterviewFlow";
import { useCandidateMedia } from "../../../features/virtualInterview/useCandidateMedia";
import { interviewService, unwrapInterviewResponse } from "../../../services/interviewService";
import { apiClient } from "../../../services/apiClient";

export default function VirtualInterviewer() {
  const { sessionId: paramSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const resumePrep = location.state || {};
  const candidateMedia = useCandidateMedia();

  const [view, setView] = useState(paramSessionId ? "report" : "setup");
  const [activeSession, setActiveSession] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [starting, setStarting] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [pendingConfig, setPendingConfig] = useState(null);

  const buildOptimisticSession = (config, name = "") => ({
    sessionId: null,
    pending: true,
    targetRole: config.targetRole,
    candidateName: name,
    greeting: `Hi ${name || "there"}, welcome. I'm going to ask you a few questions about your experience for the ${config.targetRole} role. If you need a moment to think, that's completely fine. Are you ready to begin?`,
    speakText: `Hi ${name || "there"}, welcome. Are you ready to begin?`,
    waitForReady: true,
    firstQuestion: {
      index: 0,
      text: `To start, tell me about yourself and your background relevant to ${config.targetRole}.`,
      section: config.interviewType || "warmup",
    },
    totalDurationMs: (config.durationMinutes || 10) * 60 * 1000,
    presenterUrl: config.presenterUrl || "/interviewer.jpeg",
    phase: "welcome",
  });

  useEffect(() => {
    apiClient.get("/api/auth/profile")
      .then((data) => {
        const user = data.user || data;
        setCandidateName(user?.name || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (paramSessionId) loadSession(paramSessionId);
  }, [paramSessionId]);

  const loadSession = async (id) => {
    try {
      const res = unwrapInterviewResponse(await interviewService.getReport(id));
      if (res?.success) {
        setReportData(res);
        setView("report");
      } else setView("setup");
    } catch {
      setView("setup");
    }
  };

  const handleStartInterview = async (config) => {
    setStarting(true);
    setPendingConfig(config);
    setActiveSession(buildOptimisticSession(config, candidateName));
    setView("precheck");

    try {
      const res = unwrapInterviewResponse(await interviewService.start(config));
      if (res?.success && res?.sessionId) {
        setActiveSession({
          sessionId: res.sessionId,
          pending: false,
          targetRole: config.targetRole,
          candidateName: res.candidateName || candidateName,
          greeting: res.greeting,
          speakText: res.speakText || res.greeting,
          waitForReady: res.waitForReady ?? true,
          firstQuestion: res.question,
          totalDurationMs: res.totalDurationMs || config.durationMinutes * 60 * 1000,
          presenterUrl: config.presenterUrl || "/interviewer.jpeg",
          phase: res.phase || "welcome",
        });
        return;
      }
      throw new Error(res?.message || "Could not start session");
    } catch (err) {
      console.warn("Interview start used offline fallback:", err.message);
      setActiveSession({
        sessionId: `local-${Date.now()}`,
        pending: false,
        targetRole: config.targetRole,
        candidateName,
        greeting: `Hi ${candidateName || "there"}, welcome. I'm going to ask you a few questions about your experience for the ${config.targetRole} role. If you need a moment to think, that's completely fine. Are you ready to begin?`,
        speakText: `Hi ${candidateName || "there"}, welcome. Are you ready to begin?`,
        waitForReady: true,
        firstQuestion: {
          index: 0,
          text: `To start, please introduce yourself and your background relevant to ${config.targetRole}.`,
          section: config.interviewType || "warmup",
        },
        totalDurationMs: (config.durationMinutes || 10) * 60 * 1000,
        presenterUrl: config.presenterUrl || "/interviewer.jpeg",
      });
    } finally {
      setStarting(false);
    }
  };

  const handleFinishInterview = (report) => {
    setReportData(report);
    setView("report");
  };

  const handleRestart = () => {
    candidateMedia.release();
    setActiveSession(null);
    setReportData(null);
    setPendingConfig(null);
    setView("setup");
    navigate("/student/virtual-interview");
  };

  return (
    <div className="w-full min-h-full bg-gray-50">
      {view === "setup" && (
        <InterviewSetup
          onStart={handleStartInterview}
          loading={starting}
          initialConfig={resumePrep.fromResume ? {
            targetRole: resumePrep.targetRole || "",
            jobDescription: resumePrep.jobDescription || "",
            resumeBased: true,
            interviewType: "resume-based",
          } : null}
        />
      )}

      {view === "precheck" && activeSession && (
        <PreInterviewFlow
          candidateName={activeSession.candidateName || candidateName}
          targetRole={activeSession.targetRole || pendingConfig?.targetRole}
          sessionReady={Boolean(activeSession?.sessionId)}
          media={candidateMedia}
          onComplete={() => setView("live")}
        />
      )}

      {view === "live" && activeSession && (
        <LiveInterview
          session={activeSession}
          media={candidateMedia}
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
