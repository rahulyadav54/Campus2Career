import { useEffect, useState } from "react";
import { Sparkles, Target, Gauge, ArrowRight, Briefcase, BookOpen, BrainCircuit, CheckCircle2 } from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { StatCard, LoadingSkeleton } from "../../components/ui";
import {
  AIActionBar,
  AIContentCard,
  AIPageHeader,
  AIReadinessBadge,
  SkillChip,
} from "../../components/ai/AIStudentUI";

export default function AICareerMissionPage() {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetRole, setTargetRole] = useState("Data Analyst");

  useEffect(() => {
    fetchMission();
  }, []);

  const fetchMission = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get("/api/ai-automation/career/mission");
      if (data.mission) {
        setMission(data.mission);
        if (data.mission.targetRole) setTargetRole(data.mission.targetRole);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateMission = async () => {
    try {
      setLoading(true);
      const data = await apiClient.post("/api/ai-automation/career/mission", {
        targetRole,
        action: "career_planning",
        intent: "career_planning",
      });
      if (data.mission) setMission(data.mission);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !mission) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <LoadingSkeleton lines={3} />
        <div className="grid md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={2} />
          ))}
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <AIPageHeader
          eyebrow="AI Career Mission"
          title="Build your placement roadmap"
          description="Set a target role and generate a personalised mission with skills, learning paths, and weekly milestones."
        />
        <AIActionBar>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Target role, e.g. Data Analyst"
          />
          <button
            onClick={generateMission}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generate mission
          </button>
        </AIActionBar>
        <p className="text-sm text-gray-500">No mission generated yet. Enter a role above to get started.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <AIPageHeader
        eyebrow="AI Career Mission"
        title={mission.targetRole}
        description="Personalised roadmap based on your skills, profile completeness, and role requirements."
        meta={
          <AIReadinessBadge
            label="Current readiness"
            value={`${mission.currentReadiness || 0}%`}
            icon={Gauge}
          />
        }
      />

      <AIActionBar>
        <input
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Target role"
        />
        <button
          onClick={generateMission}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" />
          Regenerate mission
        </button>
      </AIActionBar>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Gauge} iconColor="indigo" value={`${mission.skillCoverage || 0}%`} label="Skill coverage" />
        <StatCard icon={Target} iconColor="amber" value={mission.skillGaps?.length || 0} label="Skill gaps" />
        <StatCard icon={Briefcase} iconColor="blue" value={mission.prioritySkills?.length || 0} label="Priority skills" />
        <StatCard icon={BrainCircuit} iconColor="purple" value={`${Math.round(mission.confidence || 0)}%`} label="Confidence" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <AIContentCard title="Why this recommendation?" icon={BrainCircuit}>
          <ul className="space-y-3 text-sm text-gray-700">
            <li><span className="font-medium text-gray-900">Coverage:</span> {mission.why?.coverage || "Profile data is being evaluated."}</li>
            <li><span className="font-medium text-gray-900">Readiness:</span> {mission.why?.readiness || "Readiness is based on role coverage and profile completeness."}</li>
            <li><span className="font-medium text-gray-900">Gap signal:</span> {mission.why?.missing || "No major missing skill was detected."}</li>
          </ul>
        </AIContentCard>

        <AIContentCard title="Recommended learning" icon={BookOpen}>
          <div className="space-y-3">
            {(mission.recommendedCourses || []).slice(0, 4).map((course, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="font-medium text-gray-900">{course.title}</div>
                <div className="text-xs text-gray-500 mt-1">{course.provider}</div>
                <div className="text-sm text-gray-600 mt-2">{course.reason}</div>
              </div>
            ))}
          </div>
        </AIContentCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <AIContentCard title="Skill gaps" icon={Target}>
          <div className="flex flex-wrap gap-2">
            {(mission.skillGaps || []).length ? mission.skillGaps.map((skill) => (
              <SkillChip key={skill} variant="gap">{skill}</SkillChip>
            )) : <span className="text-sm text-gray-500">No major gaps identified.</span>}
          </div>
        </AIContentCard>

        <AIContentCard title="Roadmap" icon={ArrowRight}>
          <div className="space-y-3">
            {(mission.roadmap || []).map((step) => (
              <div key={step.week} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-gray-900">Week {step.week}: {step.title}</div>
                  {step.completed ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : null}
                </div>
                <div className="text-sm text-gray-600 mt-2">{step.description}</div>
              </div>
            ))}
          </div>
        </AIContentCard>
      </div>
    </div>
  );
}
