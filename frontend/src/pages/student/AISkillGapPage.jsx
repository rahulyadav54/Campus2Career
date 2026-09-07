import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Target, Sparkles } from "lucide-react";
import { apiClient } from "../../services/apiClient";

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
    return <div className="p-6 text-slate-600">Checking your skill gaps...</div>;
  }

  if (!analysis) {
    return <div className="p-6 text-slate-600">No skill gap data available yet.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-orange-100">
          <AlertTriangle className="w-4 h-4" />
          AI Skill Gap Engine
        </div>
        <h1 className="text-3xl font-bold mt-2">{analysis.targetRole}</h1>
        <p className="mt-3 text-orange-50">{analysis.why}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Metric label="Skill Coverage" value={`${analysis.skillCoverage || 0}%`} />
        <Metric label="Strong Skills" value={analysis.strongSkills?.length || 0} />
        <Metric label="Missing Skills" value={analysis.missingSkills?.length || 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Strong Skills" icon={<CheckCircle2 className="w-5 h-5" />}>
          <div className="flex flex-wrap gap-2">
            {(analysis.strongSkills || []).length ? analysis.strongSkills.map((skill) => (
              <span key={skill} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">{skill}</span>
            )) : <span className="text-slate-500">No strong skill matches from the role map.</span>}
          </div>
        </Card>

        <Card title="Missing / Priority Skills" icon={<Target className="w-5 h-5" />}>
          <div className="flex flex-wrap gap-2">
            {(analysis.missingSkills || []).length ? analysis.missingSkills.map((skill) => (
              <span key={skill} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">{skill}</span>
            )) : <span className="text-slate-500">You are well-aligned with this role.</span>}
          </div>
        </Card>
      </div>

      <Card title="Why these recommendations were generated" icon={<Sparkles className="w-5 h-5" />}>
        <div className="space-y-3">
          {(analysis.recommendations || []).map((item, index) => (
            <div key={index} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-slate-800">{item.skill}</div>
                <span className="text-xs uppercase tracking-wide rounded-full px-2 py-1 bg-orange-100 text-orange-700">{item.priority}</span>
              </div>
              <div className="text-sm text-slate-600 mt-2">{item.reason}</div>
              <div className="text-xs text-slate-500 mt-2">{item.why}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-2">{value}</div>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-center gap-2 font-semibold text-slate-800 mb-4">{icon}{title}</div>
      {children}
    </div>
  );
}
