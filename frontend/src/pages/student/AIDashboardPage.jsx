import { useEffect, useState } from "react";
import { BrainCircuit, Gauge, Target, BookOpen, Briefcase, Sparkles, ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { apiClient } from "../../services/apiClient";

export default function AIDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const [mission, skillGap, readiness, resume, interview] = await Promise.all([
          apiClient.get("/api/ai-automation/career/mission").catch(() => null),
          apiClient.get("/api/skill-gap/analysis").catch(() => null),
          apiClient.get("/api/ai-automation/placement/readiness").catch(() => null),
          apiClient.get("/api/ai-automation/resume/intelligence").catch(() => null),
          apiClient.get("/api/ai-automation/interview/plan").catch(() => null),
        ]);

        setOverview({
          mission: mission?.mission || null,
          skillGap: skillGap?.analysis || null,
          readiness: readiness?.readiness || null,
          resume: resume?.analysis || null,
          interview: interview?.plan || null,
        });
      } catch (error) {
        console.error("AI dashboard failed to load:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-600">Loading your AI dashboard...</div>;
  }

  const cards = [
    { title: "Career Mission", value: overview?.mission ? `${overview.mission.currentReadiness || 0}%` : "N/A", detail: overview?.mission?.targetRole || "Generate mission", icon: BrainCircuit, accent: "from-violet-500 to-indigo-600", href: "/student/ai-career-mission" },
    { title: "Skill Gap", value: overview?.skillGap ? `${overview.skillGap.skillCoverage || 0}%` : "N/A", detail: overview?.skillGap?.targetRole || "Analyse gaps", icon: Target, accent: "from-amber-500 to-orange-500", href: "/student/ai-skill-gap" },
    { title: "Placement Readiness", value: overview?.readiness ? `${overview.readiness.overallScore || 0}` : "N/A", detail: overview?.readiness?.level || "Ready", icon: Gauge, accent: "from-emerald-500 to-teal-500", href: "/student/ai-career-mission" },
    { title: "Resume Fit", value: overview?.resume ? `${overview.resume.atsScore || 0}%` : "N/A", detail: overview?.resume?.role || "Resume analysis", icon: Briefcase, accent: "from-sky-500 to-cyan-600", href: "/student/ai-career-mission" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-violet-900 to-indigo-700 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-200">Campus2Career AI</p>
            <h1 className="mt-2 text-3xl font-bold">Smart Automation Dashboard</h1>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-violet-100">
              <Sparkles className="w-4 h-4" />
              Live orchestration
            </div>
            <div className="text-2xl font-bold mt-1">Active</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ title, value, detail, icon: Icon, accent, href }) => (
          <Link key={title} to={href} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className={`inline-flex rounded-xl bg-gradient-to-r ${accent} p-2 text-white`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="mt-4 text-sm text-slate-500">{title}</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
              <span>{detail}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Career mission highlights" icon={<BrainCircuit className="w-5 h-5" />}>
          {overview?.mission ? (
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>Target role:</strong> {overview.mission.targetRole}</p>
              <p><strong>Current readiness:</strong> {overview.mission.currentReadiness || 0}%</p>
              <p><strong>Priority gaps:</strong> {(overview.mission.skillGaps || []).slice(0, 3).join(", ") || "None detected"}</p>
              <p><strong>Why:</strong> {overview.mission.why?.readiness || "Profile readiness is aligned to role coverage."}</p>
            </div>
          ) : (
            <div className="text-slate-500">No mission available yet.</div>
          )}
        </Panel>

        <Panel title="Mock interview readiness" icon={<BookOpen className="w-5 h-5" />}>
          {overview?.interview ? (
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>Overall score:</strong> {overview.interview.overallScore || 0}/100</p>
              <p><strong>Readiness label:</strong> {overview.interview.readinessLabel || "Not set"}</p>
              <p><strong>Difficulty:</strong> {overview.interview.difficulty || "Mixed"}</p>
              <p><strong>Guidance:</strong> {overview.interview.guidance || "Practice clear STAR stories."}</p>
            </div>
          ) : (
            <div className="text-slate-500">No interview plan available yet.</div>
          )}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Resume fit insights" icon={<Briefcase className="w-5 h-5" />}>
          {overview?.resume ? (
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>ATS score:</strong> {overview.resume.atsScore || 0}%</p>
              <p><strong>Strengths:</strong> {(overview.resume.strengths || []).slice(0, 3).join(", ") || "None"}</p>
              <p><strong>Recommendation:</strong> {overview.resume.recommendation || "Keep your resume role-focused."}</p>
            </div>
          ) : (
            <div className="text-slate-500">Resume analysis not generated.</div>
          )}
        </Panel>

        <Panel title="Next actions" icon={<ArrowRight className="w-5 h-5" />}>
          <div className="space-y-3 text-sm text-slate-700">
            <p>1. Improve the strongest missing skills from your AI mission.</p>
            <p>2. Update resume bullets with measurable project outcomes.</p>
            <p>3. Practice the mock interview questions from your role plan.</p>
            <p>4. Keep applying to opportunities with high fit scores.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
