import { useEffect, useState } from "react";
import { CheckCircle2, Target, Sparkles } from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { StatCard, LoadingSkeleton } from "../../components/ui";
import { AIContentCard, AIPageHeader, SkillChip } from "../../components/ai/AIStudentUI";

export default function AISkillGapPage() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillGap();
  }, []);

  const fetchSkillGap = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get("/api/skill-gap/analysis");
      setAnalysis(data.analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <LoadingSkeleton lines={3} />
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={2} />
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <AIPageHeader
          eyebrow="AI Skill Gap"
          title="Skill gap analysis"
          description="Complete your profile and assessments to see how your skills align with your target role."
        />
        <p className="mt-6 text-sm text-gray-500">No skill gap data available yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <AIPageHeader
        eyebrow="AI Skill Gap"
        title={analysis.targetRole || "Choose a target role"}
        description={analysis.why || "Skill coverage is calculated from your profile, assessments, and role requirements."}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={Target} iconColor="indigo" value={`${analysis.skillCoverage || 0}%`} label="Skill coverage" />
        <StatCard icon={CheckCircle2} iconColor="green" value={analysis.strongSkills?.length || 0} label="Strong skills" />
        <StatCard icon={Target} iconColor="amber" value={analysis.missingSkills?.length || 0} label="Missing skills" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <AIContentCard title="Strong skills" icon={CheckCircle2}>
          <div className="flex flex-wrap gap-2">
            {(analysis.strongSkills || []).length ? analysis.strongSkills.map((skill) => (
              <SkillChip key={skill} variant="strong">{skill}</SkillChip>
            )) : <span className="text-sm text-gray-500">No strong skill matches from the role map.</span>}
          </div>
        </AIContentCard>

        <AIContentCard title="Missing / priority skills" icon={Target}>
          <div className="flex flex-wrap gap-2">
            {(analysis.missingSkills || []).length ? analysis.missingSkills.map((skill) => (
              <SkillChip key={skill} variant="gap">{skill}</SkillChip>
            )) : (
              <span className="text-sm text-gray-500">
                {analysis.targetRole ? "You are well-aligned with this role." : "Select a target role to identify priority skills."}
              </span>
            )}
          </div>
        </AIContentCard>
      </div>

      <AIContentCard title="Why these recommendations were generated" icon={Sparkles}>
        <div className="space-y-3">
          {(analysis.recommendations || []).length ? analysis.recommendations.map((item, index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="font-medium text-gray-900">{item.skill}</div>
                <SkillChip variant="priority">{item.priority}</SkillChip>
              </div>
              <div className="text-sm text-gray-600 mt-2">{item.reason}</div>
              <div className="text-xs text-gray-500 mt-2">{item.why}</div>
            </div>
          )) : (
            <p className="text-sm text-gray-500">
              {analysis.targetRole ? "No additional recommendations are needed for this role." : "Recommendations will appear after you select a target role."}
            </p>
          )}
        </div>
      </AIContentCard>
    </div>
  );
}
