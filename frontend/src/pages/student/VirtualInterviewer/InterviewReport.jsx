/**
 * InterviewReport.jsx — AI performance report after virtual interview.
 */

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageSquare,
  Zap,
  Target,
  BarChart2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { interviewService, unwrapInterviewResponse } from "../../../services/interviewService";

export default function InterviewReport({ sessionId, reportData, onRestart }) {
  const [report, setReport] = useState(reportData || null);
  const [loading, setLoading] = useState(!reportData);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    if (!reportData && sessionId && !sessionId.startsWith("local-")) {
      fetchReport();
    } else if (reportData) {
      setReport(reportData);
      setLoading(false);
    } else if (sessionId?.startsWith("local-")) {
      setError("This offline practice session has no saved report. Start a new connected interview.");
      setLoading(false);
    }
  }, [sessionId, reportData]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = unwrapInterviewResponse(await interviewService.getReport(sessionId));
      if (res?.success) {
        setReport(res);
      } else {
        setError(res?.message || "Failed to load report");
      }
    } catch (err) {
      setError(err.message || err.data?.message || "Error loading interview report");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <Brain className="w-7 h-7 text-indigo-600 absolute" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Analyzing interview performance…</h2>
        <p className="text-gray-500 text-sm max-w-md text-center">
          Evaluating communication, technical depth, and placement readiness.
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-full bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Could not load report</h3>
          <p className="text-gray-500 text-sm mb-6">{error || "No report data found for this session."}</p>
          <button
            onClick={onRestart}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
          >
            Start new practice session
          </button>
        </div>
      </div>
    );
  }

  const overallScore = report.summary?.overallScore ?? report.overallScore ?? report.score ?? 0;
  const readiness = report.readinessLevel || (
    overallScore >= 90 ? "EXCELLENT" :
    overallScore >= 75 ? "READY_WITH_IMPROVEMENT" :
    overallScore >= 60 ? "NEEDS_PRACTICE" : "NOT_READY"
  );
  const normalizedReadiness = String(readiness).toUpperCase().replace(/\s+/g, "_");

  const readinessBadge = {
    EXCELLENT: { label: "Placement ready", className: "bg-green-50 text-green-700 border-green-200" },
    READY_WITH_IMPROVEMENT: { label: "Almost ready", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    NEEDS_PRACTICE: { label: "Needs practice", className: "bg-amber-50 text-amber-800 border-amber-200" },
    NOT_READY: { label: "Early prep needed", className: "bg-red-50 text-red-700 border-red-200" },
  };
  const badge = readinessBadge[normalizedReadiness] || readinessBadge.NOT_READY;

  const summaryData = report.summary || {};
  const scores = {
    technicalDepth: summaryData.technicalScore ?? summaryData.technicalDepth ?? overallScore,
    communication: summaryData.communicationScore ?? summaryData.communication ?? overallScore,
    problemSolving: summaryData.problemSolvingScore ?? summaryData.problemSolving ?? overallScore,
    relevance: summaryData.answerRelevanceScore ?? summaryData.relevance ?? overallScore,
    confidence: summaryData.confidenceScore ?? summaryData.confidence ?? overallScore,
  };

  const categoryList = [
    { key: "technicalDepth", label: "Technical depth", icon: Brain },
    { key: "communication", label: "Communication", icon: MessageSquare },
    { key: "problemSolving", label: "Problem solving", icon: Target },
    { key: "relevance", label: "Answer relevance", icon: ShieldCheck },
    { key: "confidence", label: "Confidence", icon: Zap },
  ];

  const recommendations = (report.recommendations || []).map((rec) =>
    typeof rec === "string" ? { title: rec, desc: "" } : rec
  );

  return (
    <div className="min-h-full bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Interview assessment</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {report.targetRole || report.roleTitle || "Interview"} simulation
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Completed {new Date(report.createdAt || report.endedAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {report.durationMinutes ? ` · ${report.durationMinutes} min` : ""}
            </p>
          </div>
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition shrink-0"
          >
            <RotateCcw className="w-4 h-4" /> Practice again
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-sm">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#e5e7eb" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50" cy="50" r="42"
                  stroke="#4f46e5"
                  strokeWidth="8"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * overallScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-bold text-gray-900">{overallScore}</span>
                <span className="text-gray-400 text-xs block">/ 100</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mt-3">Overall score</p>
          </div>

          <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-center gap-3">
            <span className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
              {badge.label}
            </span>
            <h2 className="text-lg font-semibold text-gray-900">
              {overallScore ? "Interview performance summary" : "No answers were recorded"}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {report.executiveSummary || (overallScore
                ? "Scores are based on the answers recorded during this session."
                : "Finish at least one spoken answer to generate a full assessment.")}
            </p>
          </div>
        </div>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Skill category breakdown</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {categoryList.map((cat) => {
              const val = scores[cat.key];
              const Icon = cat.icon;
              return (
                <div key={cat.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-gray-700">
                      <Icon className="w-4 h-4 text-indigo-600" /> {cat.label}
                    </span>
                    <span className="font-bold text-gray-900">{val}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-700" style={{ width: `${val}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <CheckCircle2 className="w-5 h-5" /> Key strengths
            </div>
            <ul className="space-y-2">
              {(report.strengths?.length ? report.strengths : ["Complete a connected interview for detailed strengths."]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-semibold">
              <AlertTriangle className="w-5 h-5" /> Areas to improve
            </div>
            <ul className="space-y-2">
              {(report.weaknesses || report.areasToImprove || ["Answer at least one question to receive targeted feedback."]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {recommendations.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold">
              <Sparkles className="w-5 h-5 text-indigo-600" /> Actionable next steps
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                  <h4 className="font-medium text-gray-900">{rec.title || rec}</h4>
                  {rec.desc && <p className="text-gray-600 text-xs mt-1 leading-relaxed">{rec.desc}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {report.evaluations?.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Question-by-question analysis</h2>
            <div className="space-y-3">
              {report.evaluations.map((item, idx) => {
                const isOpen = expandedQuestion === idx;
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedQuestion(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                          Q{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.questionText}</p>
                          <span className="text-xs text-gray-500">Score: {item.score || 0}/100</span>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Your answer</span>
                          <p className="text-gray-700 mt-1 bg-white p-3 rounded-lg border border-gray-200 leading-relaxed">
                            {item.studentAnswer || "(No answer recorded)"}
                          </p>
                        </div>
                        {item.feedback && (
                          <div>
                            <span className="font-medium text-indigo-600 text-xs uppercase tracking-wide">AI feedback</span>
                            <p className="text-gray-700 mt-1 bg-indigo-50 p-3 rounded-lg border border-indigo-100 leading-relaxed">
                              {item.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {sessionId && (
            <p className="text-xs text-gray-400">
              Session: <span className="font-mono">{sessionId}</span>
            </p>
          )}
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
          >
            Start another session <ArrowRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}
