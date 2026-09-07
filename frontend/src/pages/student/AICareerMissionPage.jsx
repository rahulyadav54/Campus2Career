import { useEffect, useState } from "react";
import { Sparkles, Target, Gauge, ArrowRight, Briefcase, BookOpen, BrainCircuit, CheckCircle2 } from "lucide-react";
import { apiClient } from "../../services/apiClient";

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
    return <div className="p-8 text-slate-600">Loading your AI Career Mission...</div>;
  }

  if (!mission) {
    return <div className="p-8 text-slate-600">No mission generated yet.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-100">AI Career Mission</p>
            <h1 className="text-3xl font-bold mt-2">{mission.targetRole}</h1>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              <span className="text-sm">Current readiness</span>
            </div>
            <div className="text-3xl font-bold mt-1">{mission.currentReadiness || 0}%</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="Target role"
          />
          <button
            onClick={generateMission}
            className="inline-flex items-center gap-2 bg-white text-indigo-700 rounded-xl px-4 py-2 font-semibold hover:bg-indigo-50 transition"
          >
            <Sparkles className="w-4 h-4" />
            Generate AI Mission
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard icon={<Gauge className="w-5 h-5" />} title="Skill Coverage" value={`${mission.skillCoverage || 0}%`} />
        <StatCard icon={<Target className="w-5 h-5" />} title="Skill Gaps" value={mission.skillGaps?.length || 0} />
        <StatCard icon={<Briefcase className="w-5 h-5" />} title="Priority Skills" value={mission.prioritySkills?.length || 0} />
        <StatCard icon={<BrainCircuit className="w-5 h-5" />} title="Confidence" value={`${Math.round(mission.confidence || 0)}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Why this AI recommendation?" icon={<BrainCircuit className="w-5 h-5" />}>
          <ul className="space-y-3 text-sm text-slate-700">
            <li><strong>Coverage:</strong> {mission.why?.coverage || "Profile data is being evaluated."}</li>
            <li><strong>Readiness:</strong> {mission.why?.readiness || "Readiness is based on role coverage and profile completeness."}</li>
            <li><strong>Gap signal:</strong> {mission.why?.missing || "No major missing skill was detected."}</li>
          </ul>
        </Card>

        <Card title="Recommended learning" icon={<BookOpen className="w-5 h-5" />}>
          <div className="space-y-3">
            {(mission.recommendedCourses || []).slice(0, 4).map((course, index) => (
              <div key={index} className="border rounded-xl p-3 bg-slate-50">
                <div className="font-semibold text-slate-800">{course.title}</div>
                <div className="text-xs text-slate-500 mt-1">{course.provider}</div>
                <div className="text-sm text-slate-600 mt-2">{course.reason}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Skill gaps" icon={<Target className="w-5 h-5" />}>
          <div className="flex flex-wrap gap-2">
            {(mission.skillGaps || []).length ? mission.skillGaps.map((skill) => (
              <span key={skill} className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">{skill}</span>
            )) : <span className="text-slate-500">No major gaps identified.</span>}
          </div>
        </Card>

        <Card title="Roadmap" icon={<ArrowRight className="w-5 h-5" />}>
          <div className="space-y-3">
            {(mission.roadmap || []).map((step) => (
              <div key={step.week} className="border rounded-xl p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800">Week {step.week}: {step.title}</div>
                  {step.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : null}
                </div>
                <div className="text-sm text-slate-600 mt-2">{step.description}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 text-slate-600">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-3">{value}</div>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
