import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { resumeOptimizerService } from "../../../services/resumeOptimizerService";
import { AIPageHeader, AIContentCard } from "../../../components/ai/AIStudentUI";
import { LoadingSkeleton } from "../../../components/ui";

export default function ResumeSkillGaps() {
  const [gaps, setGaps] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resumeOptimizerService.getSkillGaps()
      .then((res) => setGaps(res.gaps))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><LoadingSkeleton lines={4} /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <AIPageHeader
        title="Skill Gap Analyzer"
        subtitle={gaps?.targetRole ? `Target: ${gaps.targetRole}` : "Select a target role in your resume"}
      />

      <AIContentCard>
        <p className="text-sm text-gray-600">Skill coverage: <strong>{gaps?.skillCoverage ?? 0}%</strong></p>
        {gaps?.currentSkills?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-green-700 mb-1">Your current skills</p>
            <div className="flex flex-wrap gap-1">
              {gaps.currentSkills.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-800 border border-green-200">✓ {s}</span>
              ))}
            </div>
          </div>
        )}
        {gaps?.skillsToStrengthen?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">Skills to strengthen</p>
            <div className="flex flex-wrap gap-1">
              {gaps.skillsToStrengthen.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">⚠ {s}</span>
              ))}
            </div>
          </div>
        )}
      </AIContentCard>

      {gaps?.learningPath?.length > 0 && (
        <AIContentCard title="Recommended Learning Path">
          <ol className="space-y-2">
            {gaps.learningPath.map((item) => (
              <li key={item.order} className="flex gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">{item.order}</span>
                <div>
                  <p className="font-medium text-gray-900">{item.skill}</p>
                  <p className="text-xs text-gray-500">{item.reason}</p>
                </div>
              </li>
            ))}
          </ol>
        </AIContentCard>
      )}

      {gaps?.recommendedProjects?.length > 0 && (
        <AIContentCard title="Recommended Projects">
          {gaps.recommendedProjects.map((p) => (
            <div key={p.title} className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-indigo-600 font-semibold">{p.label}</p>
              <p className="font-medium text-gray-900">{p.title}</p>
              <p className="text-sm text-gray-600 mt-1">{p.description}</p>
              <p className="text-xs text-amber-700 mt-1">{p.disclaimer}</p>
            </div>
          ))}
        </AIContentCard>
      )}
    </div>
  );
}
