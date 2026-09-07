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
  ClipboardList,
} from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { LoadingSkeleton } from "../../components/ui";
import {
  AIActionBar,
  AIContentCard,
  AIPageHeader,
  AIReadinessBadge,
} from "../../components/ai/AIStudentUI";

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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <AIPageHeader
        eyebrow="Interview preparation"
        title="Prepare with a plan, not guesswork"
        description="Get role-specific questions, answer frameworks, and a focused checklist before your next interview."
      />

      <AIActionBar>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 min-w-[180px]">
          Target role
          <input
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. Data Analyst"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 min-w-[140px]">
          Interview type
          <select
            value={interviewType}
            onChange={(event) => setInterviewType(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="mixed">Mixed</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="hr">HR</option>
          </select>
        </label>
        <button
          type="button"
          onClick={loadPlan}
          disabled={loading || !targetRole.trim()}
          className="inline-flex items-center gap-2 self-end rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Generate plan
        </button>
      </AIActionBar>

      <section className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Virtual interview
            </span>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">AI Virtual Interviewer</h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              Practice a realistic 1-on-1 interview with voice interaction, dynamic follow-up questions,
              and a detailed performance report when you finish.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <FeatureTag icon={Video} label="Live video-call layout" />
              <FeatureTag icon={Mic} label="Voice input & synthesis" />
              <FeatureTag icon={Bot} label="Context-aware follow-ups" />
            </div>
          </div>

          <Link
            to="/student/virtual-interview"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Video className="h-4 w-4" />
            Start virtual interview
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {loading && !plan ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} lines={2} />
            ))}
          </div>
          <LoadingSkeleton lines={6} />
        </div>
      ) : plan ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <AIReadinessBadge label="Readiness" value={`${plan.overallScore || 0}/100`} icon={ClipboardList} />
            <AIReadinessBadge label="Difficulty" value={plan.difficulty || "Mixed"} icon={PlayCircle} />
            <AIReadinessBadge label="Focus role" value={plan.role || targetRole} icon={BookOpen} />
          </div>

          <p className="text-sm text-gray-500 -mt-2">
            {plan.readinessLabel || "Keep practicing"} · {plan.questions?.length || 0} guided questions · {plan.interviewType || interviewType}
          </p>

          <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <AIContentCard title="Practice questions" icon={PlayCircle}>
              <p className="text-sm text-gray-500 mb-4 -mt-2">
                Say your answer out loud, then compare it with the evaluation points.
              </p>
              <div className="space-y-4">
                {(plan.questions || []).map((question, index) => (
                  <article key={`${question.text}-${index}`} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-medium leading-6 text-gray-900">
                        {index + 1}. {question.text}
                      </h3>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-600">
                        {question.type}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(question.expectedPoints || []).map((point) => (
                        <span
                          key={point}
                          className="inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-xs text-green-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {point}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </AIContentCard>

            <div className="space-y-6">
              <AIContentCard title="AI guidance" icon={Lightbulb}>
                <p className="text-sm leading-6 text-gray-600">{plan.guidance}</p>
              </AIContentCard>

              <AIContentCard title="Preparation materials" icon={BookOpen}>
                <div className="space-y-4">
                  {materials.length === 0 ? (
                    <p className="text-sm text-gray-500">No materials found for this role yet.</p>
                  ) : (
                    materials.map((material) => (
                      <div key={`${material.type}-${material.title}`} className="flex gap-3">
                        <div className="h-fit rounded-lg bg-indigo-50 p-2 text-indigo-600">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-800">{material.title}</h3>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray-500">
                              {material.type}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-gray-500">{material.description}</p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            {material.provider} · {material.duration}
                          </p>
                          {material.url && (
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              Open material
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </AIContentCard>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function FeatureTag({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
      <Icon className="h-3.5 w-3.5 text-indigo-600" />
      {label}
    </span>
  );
}
