import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Video,
  Mic,
  Bot,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { apiClient } from "../../services/apiClient";

export default function InterviewPreparation() {
  const [targetRole, setTargetRole] = useState("Data Analyst");
  const [interviewType, setInterviewType] = useState("mixed");
  const [plan, setPlan] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams({ targetRole, type: interviewType });
      const [planData, materialsData] = await Promise.all([
        apiClient.get(`/api/ai-automation/interview/plan?${query.toString()}`),
        apiClient.get(`/api/ai-automation/interview/materials?targetRole=${encodeURIComponent(targetRole)}`),
      ]);
      setPlan(planData.plan || null);
      setMaterials(Array.isArray(materialsData.materials) ? materialsData.materials : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load interview preparation materials.");
    } finally {
      setLoading(false);
    }
  }, [interviewType, targetRole]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">Interview preparation</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Prepare with a plan, not guesswork.</h1>
              <p className="mt-3 max-w-2xl text-indigo-100">
                Get role-specific questions, answer frameworks, and a focused checklist before your next interview.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="text-sm font-medium text-indigo-100">
                Target role
                <input
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-indigo-200 outline-none ring-white/40 focus:ring-2 sm:w-52"
                  placeholder="e.g. Data Analyst"
                />
              </label>
              <label className="text-sm font-medium text-indigo-100">
                Interview type
                <select
                  value={interviewType}
                  onChange={(event) => setInterviewType(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white outline-none ring-white/40 focus:ring-2 sm:w-40"
                >
                  <option className="text-slate-900" value="mixed">Mixed</option>
                  <option className="text-slate-900" value="technical">Technical</option>
                  <option className="text-slate-900" value="behavioral">Behavioral</option>
                  <option className="text-slate-900" value="hr">HR</option>
                </select>
              </label>
              <button
                type="button"
                onClick={loadPlan}
                disabled={loading || !targetRole.trim()}
                className="inline-flex h-fit items-center justify-center gap-2 self-end rounded-xl bg-white px-4 py-2.5 font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Generate plan
              </button>
            </div>
          </div>
        </header>

        {/* AI Virtual Interviewer Featured Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 text-white shadow-2xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> New • Production AI Feature
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                AI Virtual Interviewer
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Experience a realistic, 1-on-1 interview simulation with a live AI avatar, voice recognition, context-aware follow-up questions, and an in-depth performance analytics report.
              </p>
              <div className="flex flex-wrap gap-4 pt-1 text-xs text-indigo-200">
                <span className="flex items-center gap-1.5"><Video className="w-4 h-4 text-indigo-400" /> HeyGen WebRTC / 3D Avatar</span>
                <span className="flex items-center gap-1.5"><Mic className="w-4 h-4 text-cyan-400" /> Realtime Voice Input & Synthesis</span>
                <span className="flex items-center gap-1.5"><Bot className="w-4 h-4 text-purple-400" /> Nemotron AI Context Engine</span>
              </div>
            </div>

            <Link
              to="/student/virtual-interview"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm sm:text-base rounded-2xl transition shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Video className="w-5 h-5" /> Start Virtual Interview <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {loading && !plan ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Building your interview preparation plan...
          </div>
        ) : plan ? (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <SummaryCard label="Readiness" value={`${plan.overallScore || 0}/100`} detail={plan.readinessLabel || "Keep practicing"} />
              <SummaryCard label="Difficulty" value={plan.difficulty || "Mixed"} detail={`${plan.questions?.length || 0} guided questions`} />
              <SummaryCard label="Focus role" value={plan.role || targetRole} detail={plan.interviewType || "mixed"} />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-50 p-2 text-indigo-700"><PlayCircle className="h-5 w-5" /></div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Practice questions</h2>
                    <p className="text-sm text-slate-500">Say your answer out loud, then compare it with the evaluation points.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {(plan.questions || []).map((question, index) => (
                    <article key={`${question.text}-${index}`} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-medium leading-6 text-slate-900">{index + 1}. {question.text}</h3>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600">{question.type}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(question.expectedPoints || []).map((point) => (
                          <span key={point} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />{point}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-50 p-2 text-amber-700"><Lightbulb className="h-5 w-5" /></div>
                    <h2 className="font-semibold text-slate-900">AI guidance</h2>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{plan.guidance}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-sky-50 p-2 text-sky-700"><BookOpen className="h-5 w-5" /></div>
                    <h2 className="font-semibold text-slate-900">Preparation materials</h2>
                  </div>
                  <div className="mt-4 space-y-4">
                    {materials.map((material) => (
                      <div key={`${material.type}-${material.title}`} className="flex gap-3">
                        <div className="h-fit rounded-lg bg-sky-50 p-2 text-sky-700"><BookOpen className="h-4 w-4" /></div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-800">{material.title}</h3>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500">{material.type}</span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{material.description}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{material.provider} · {material.duration}</p>
                          {material.url && (
                            <a href={material.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                              Open material <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold capitalize text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{detail}</div>
    </div>
  );
}
