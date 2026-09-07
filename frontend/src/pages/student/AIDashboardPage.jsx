import { useEffect, useState } from "react";
import { BrainCircuit, Gauge, Target, BookOpen, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { apiClient } from "../../services/apiClient";
import { StatCard, LoadingSkeleton } from "../../components/ui";
import { AIContentCard, AIPageHeader, AIReadinessBadge } from "../../components/ai/AIStudentUI";

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
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <LoadingSkeleton lines={2} />
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={3} />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Career Mission",
      value: overview?.mission ? `${overview.mission.currentReadiness || 0}%` : "—",
      detail: overview?.mission?.targetRole || "Generate mission",
      icon: BrainCircuit,
      iconColor: "indigo",
      href: "/student/ai-career-mission",
    },
    {
      title: "Skill Gap",
      value: overview?.skillGap ? `${overview.skillGap.skillCoverage || 0}%` : "—",
      detail: overview?.skillGap?.targetRole || "Analyse gaps",
      icon: Target,
      iconColor: "amber",
      href: "/student/ai-skill-gap",
    },
    {
      title: "Placement Readiness",
      value: overview?.readiness ? `${overview.readiness.overallScore || 0}` : "—",
      detail: overview?.readiness?.level || "Ready",
      icon: Gauge,
      iconColor: "green",
      href: "/student/ai-career-mission",
    },
    {
      title: "Resume Fit",
      value: overview?.resume ? `${overview.resume.atsScore || 0}%` : "—",
      detail: overview?.resume?.role || "Resume analysis",
      icon: Briefcase,
      iconColor: "blue",
      href: "/student/ai-career-mission",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <AIPageHeader
        eyebrow="AI Automation"
        title="Smart Automation Dashboard"
        description="A single view of your career mission, skill gaps, placement readiness, and interview prep — powered by your profile data."
        meta={
          <AIReadinessBadge
            label="Orchestration"
            value="Active"
            icon={Sparkles}
          />
        }
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ title, value, detail, icon, iconColor, href }) => (
          <Link key={title} to={href} className="block">
            <StatCard
              icon={icon}
              iconColor={iconColor}
              value={value}
              label={title}
              sublabel={detail}
              className="h-full hover:border-indigo-200"
            />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <AIContentCard title="Career mission highlights" icon={BrainCircuit}>
          {overview?.mission ? (
            <div className="space-y-3 text-sm text-gray-700">
              <p><span className="font-medium text-gray-900">Target role:</span> {overview.mission.targetRole}</p>
              <p><span className="font-medium text-gray-900">Current readiness:</span> {overview.mission.currentReadiness || 0}%</p>
              <p><span className="font-medium text-gray-900">Priority gaps:</span> {(overview.mission.skillGaps || []).slice(0, 3).join(", ") || "None detected"}</p>
              <p><span className="font-medium text-gray-900">Why:</span> {overview.mission.why?.readiness || "Profile readiness is aligned to role coverage."}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No mission available yet. Open Career Mission to generate one.</p>
          )}
        </AIContentCard>

        <AIContentCard title="Mock interview readiness" icon={BookOpen}>
          {overview?.interview ? (
            <div className="space-y-3 text-sm text-gray-700">
              <p><span className="font-medium text-gray-900">Overall score:</span> {overview.interview.overallScore || 0}/100</p>
              <p><span className="font-medium text-gray-900">Readiness label:</span> {overview.interview.readinessLabel || "Not set"}</p>
              <p><span className="font-medium text-gray-900">Difficulty:</span> {overview.interview.difficulty || "Mixed"}</p>
              <p><span className="font-medium text-gray-900">Guidance:</span> {overview.interview.guidance || "Practice clear STAR stories."}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No interview plan available yet.</p>
          )}
        </AIContentCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <AIContentCard title="Resume fit insights" icon={Briefcase}>
          {overview?.resume ? (
            <div className="space-y-3 text-sm text-gray-700">
              <p><span className="font-medium text-gray-900">ATS score:</span> {overview.resume.atsScore || 0}%</p>
              <p><span className="font-medium text-gray-900">Strengths:</span> {(overview.resume.strengths || []).slice(0, 3).join(", ") || "None"}</p>
              <p><span className="font-medium text-gray-900">Recommendation:</span> {overview.resume.recommendation || "Keep your resume role-focused."}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Resume analysis not generated.</p>
          )}
        </AIContentCard>

        <AIContentCard title="Next actions" icon={ArrowRight}>
          <ol className="space-y-2.5 text-sm text-gray-700 list-decimal list-inside">
            <li>Improve the strongest missing skills from your AI mission.</li>
            <li>Update resume bullets with measurable project outcomes.</li>
            <li>Practice the mock interview questions from your role plan.</li>
            <li>Keep applying to opportunities with high fit scores.</li>
          </ol>
        </AIContentCard>
      </div>
    </div>
  );
}
