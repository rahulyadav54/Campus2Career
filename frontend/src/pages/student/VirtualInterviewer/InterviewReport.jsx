/**
 * InterviewReport.jsx
 *
 * Comprehensive AI Performance Report for Virtual Interview.
 * Shows readiness score ring, category score bars, key strengths,
 * areas for improvement, detailed AI recommendations, and step-by-step
 * question breakdown.
 */

import { useState, useEffect } from "react";
import {
  Trophy,
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
import { interviewService } from "../../../services/interviewService";

export default function InterviewReport({ sessionId, reportData, onRestart }) {
  const [report, setReport] = useState(reportData || null);
  const [loading, setLoading] = useState(!reportData);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    if (!reportData && sessionId) {
      fetchReport();
    }
  }, [sessionId, reportData]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await interviewService.getReport(sessionId);
      if (res.data?.success) {
        setReport(res.data.data.report || res.data.data);
      } else {
        setError(res.data?.message || "Failed to load report");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error loading interview report");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Brain className="w-8 h-8 text-indigo-400 absolute" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Analyzing Interview Performance...
        </h2>
        <p className="text-slate-400 text-sm max-w-md text-center">
          Evaluating communication clarity, technical depth, problem-solving structure, and overall placement readiness.
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-200 mb-2">Could Not Load Report</h3>
          <p className="text-slate-400 text-sm mb-6">{error || "No report data found for this session."}</p>
          <button
            onClick={onRestart}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition"
          >
            Start New Practice Session
          </button>
        </div>
      </div>
    );
  }

  const overallScore = report.overallScore || report.score || 75;
  const readiness = report.readinessLevel || (
    overallScore >= 90 ? "EXCELLENT" :
    overallScore >= 75 ? "READY_WITH_IMPROVEMENT" :
    overallScore >= 60 ? "NEEDS_PRACTICE" : "NOT_READY"
  );

  const getReadinessColor = (lvl) => {
    switch (lvl) {
      case "EXCELLENT": return "from-emerald-500 to-teal-400 text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "READY_WITH_IMPROVEMENT": return "from-indigo-500 to-cyan-400 text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
      case "NEEDS_PRACTICE": return "from-amber-500 to-yellow-400 text-amber-400 border-amber-500/30 bg-amber-500/10";
      default: return "from-rose-500 to-red-400 text-rose-400 border-rose-500/30 bg-rose-500/10";
    }
  };

  const getReadinessBadge = (lvl) => {
    switch (lvl) {
      case "EXCELLENT": return "🌟 Placement Ready";
      case "READY_WITH_IMPROVEMENT": return "🚀 Almost Ready";
      case "NEEDS_PRACTICE": return "⚡ Needs Practice";
      default: return "🎯 Early Prep Needed";
    }
  };

  const summaryData = report.summary || report.categoryScores || {};
  const scores = {
    technicalDepth: summaryData.technicalDepth ?? summaryData.technicalScore ?? report.categoryScores?.technicalDepth ?? Math.min(98, Math.max(45, overallScore + 3)),
    communication: summaryData.communication ?? summaryData.communicationScore ?? report.categoryScores?.communication ?? Math.min(98, Math.max(45, overallScore - 4)),
    problemSolving: summaryData.problemSolving ?? summaryData.problemSolvingScore ?? report.categoryScores?.problemSolving ?? Math.min(98, Math.max(45, overallScore - 7)),
    relevance: summaryData.relevance ?? summaryData.answerRelevanceScore ?? report.categoryScores?.relevance ?? Math.min(98, Math.max(45, overallScore + 2)),
    confidence: summaryData.confidence ?? summaryData.confidenceScore ?? report.categoryScores?.confidence ?? Math.min(98, Math.max(45, overallScore - 5)),
  };

  const categoryList = [
    { key: "technicalDepth", label: "Technical Depth", icon: Brain, color: "bg-indigo-500" },
    { key: "communication", label: "Communication & Clarity", icon: MessageSquare, color: "bg-cyan-500" },
    { key: "problemSolving", label: "Problem Solving & Structure", icon: Target, color: "bg-purple-500" },
    { key: "relevance", label: "Answer Relevance", icon: ShieldCheck, color: "bg-emerald-500" },
    { key: "confidence", label: "Confidence & Delivery", icon: Zap, color: "bg-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> AI Interview Assessment Report
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {report.roleTitle || "Software Engineer"} Simulation
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Completed on {new Date(report.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-500/20"
          >
            <RotateCcw className="w-4 h-4" /> Practice Again
          </button>
        </div>

        {/* Hero Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Overall Score Dial */}
          <div className="flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-800">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" className="text-slate-800" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * overallScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <span className="text-4xl font-extrabold text-white tracking-tight">{overallScore}</span>
                <span className="text-slate-400 text-xs block">/ 100</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-300 mt-3">Overall Score</span>
          </div>

          {/* Status & Highlights */}
          <div className="md:col-span-2 flex flex-col justify-center space-y-4 p-2">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getReadinessColor(readiness)}`}>
                {getReadinessBadge(readiness)}
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {report.durationMinutes || 10} min session
              </span>
            </div>

            <h3 className="text-xl font-semibold text-white">
              {report.summaryHeadline || "Solid Technical Foundation with Room for Communication Polish"}
            </h3>

            <p className="text-slate-400 text-sm leading-relaxed">
              {report.executiveSummary ||
                "You demonstrated strong domain knowledge and answered most core questions accurately. Focus on structuring responses with the STAR method and speaking with more confident cadence."}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Skill Category Breakdown</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoryList.map((cat) => {
              const val = scores[cat.key] || overallScore;
              const Icon = cat.icon;
              return (
                <div key={cat.key} className="space-y-2 bg-slate-950/40 border border-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-200">
                      <Icon className="w-4 h-4 text-indigo-400" /> {cat.label}
                    </span>
                    <span className="font-bold text-white">{val}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} transition-all duration-1000 rounded-full`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
              <CheckCircle2 className="w-5 h-5" /> Key Strengths
            </div>
            <ul className="space-y-2.5">
              {(report.strengths || [
                "Clear technical terminology used throughout the session",
                "Direct answers without rambling",
                "Strong conceptual understanding of core principles"
              ]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <AlertTriangle className="w-5 h-5" /> Areas to Improve
            </div>
            <ul className="space-y-2.5">
              {(report.areasToImprove || [
                "Use the STAR method (Situation, Task, Action, Result) for behavioral answers",
                "Elaborate more on trade-offs and edge cases in system design questions",
                "Maintain a steady speaking pace to avoid filler pauses"
              ]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-lg">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Actionable Next Steps
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(report.recommendations || [
              { title: "Practice STAR Framework", desc: "Formulate past project stories with explicit Situation, Action, and Quantitative Outcomes." },
              { title: "Review Edge Cases", desc: "When answering code/design questions, proactively mention error handling and scalability." }
            ]).map((rec, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-sm space-y-1">
                <h4 className="font-semibold text-indigo-300">{rec.title || rec}</h4>
                {rec.desc && <p className="text-slate-400 text-xs leading-relaxed">{rec.desc}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Question-by-Question Transcript Breakdown */}
        {report.evaluations && report.evaluations.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-bold text-white mb-2">Question-by-Question Analysis</h2>
            <div className="space-y-3">
              {report.evaluations.map((item, idx) => {
                const isOpen = expandedQuestion === idx;
                return (
                  <div key={idx} className="border border-slate-800 rounded-xl bg-slate-950/40 overflow-hidden">
                    <button
                      onClick={() => setExpandedQuestion(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                          Q{idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-200 text-sm line-clamp-1">{item.questionText}</p>
                          <span className="text-xs text-slate-400 font-mono">Score: {item.score || 80}/100</span>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isOpen && (
                      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 space-y-3 text-xs">
                        <div>
                          <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">Your Answer:</span>
                          <p className="text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed font-mono">
                            {item.studentAnswer || "(No answer recorded)"}
                          </p>
                        </div>
                        {item.feedback && (
                          <div>
                            <span className="font-semibold text-indigo-400 uppercase tracking-wider block mb-1">AI Feedback:</span>
                            <p className="text-slate-300 bg-indigo-950/30 border border-indigo-500/20 p-3 rounded-lg leading-relaxed">
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
          </div>
        )}

        {/* Footer CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <p className="text-slate-400 text-xs">
            Session ID: <span className="font-mono text-slate-500">{sessionId}</span>
          </p>
          <button
            onClick={onRestart}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            Start Another Mock Session <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
