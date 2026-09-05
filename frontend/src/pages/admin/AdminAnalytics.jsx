import { useEffect, useState } from "react";
import { TrendingUp, Target, Users, GraduationCap, Activity, AlertTriangle } from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

export default function AdminAnalytics() {
  const [skillDemand, setSkillDemand] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get("/api/career/analytics/skill-demand"),
      apiClient.get("/api/career/analytics/placement-readiness")
    ]).then(([sd, pr]) => {
      setSkillDemand(sd.skillDemand || []);
      setReadiness(pr);
    }).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6 text-gray-500">Loading analytics…</p>;

  const maxDemand = skillDemand.length ? Math.max(...skillDemand.map((s) => s.demandScore)) : 1;
  const ready = readiness?.totals || {};
  const readyDepts = readiness?.breakdown || [];

  const readinessColor = (score) => (score >= 70 ? "bg-green-500" : score >= 45 ? "bg-amber-500" : "bg-red-500");
  const readinessText = (score) => (score >= 70 ? "Ready" : score >= 45 ? "Developing" : "At risk");

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Analytics Dashboard</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Skill demand &amp; placement readiness</h1>
        <p className="text-gray-600 mt-1">Aggregated from student skills, assessments, career pathways, approved jobs, and opportunities.</p>
      </header>

      {/* Overall readiness cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-sm text-gray-500 flex items-center gap-1.5"><Users size={15} /> Students</p><p className="text-2xl font-bold mt-1">{ready.totalStudents || 0}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-sm text-gray-500 flex items-center gap-1.5"><GraduationCap size={15} /> Placement rate</p><p className="text-2xl font-bold mt-1">{ready.placementRate || 0}%</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-sm text-gray-500 flex items-center gap-1.5"><Activity size={15} /> Assessed</p><p className="text-2xl font-bold mt-1">{ready.assessed || 0}%</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-sm text-gray-500 flex items-center gap-1.5"><Target size={15} /> Skills tracked</p><p className="text-2xl font-bold mt-1">{skillDemand.length}</p></div>
      </section>

      {/* Skill demand trends */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-indigo-600" /> Top skills in demand</h2>
        <div className="space-y-3">
          {skillDemand.slice(0, 15).map((s) => (
            <div key={s.skill}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-800">{s.skill}</span>
                <span className="text-gray-500">{s.studentCount} students · {s.jobCount} jobs · {s.opportunityCount} programs · score {s.demandScore}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full" style={{ width: `${Math.round((s.demandScore / maxDemand) * 100)}%` }} />
              </div>
            </div>
          ))}
          {skillDemand.length === 0 && <p className="text-gray-400 text-sm">No skill data yet. Seed the demo dataset or wait for students to add skills.</p>}
        </div>
      </section>
{/* Placement readiness by department */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Target size={18} className="text-indigo-600" /> Placement readiness by department</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Department</th><th className="pb-2">Students</th><th className="pb-2">Skill rate</th><th className="pb-2">Assessment</th><th className="pb-2">Applications</th><th className="pb-2">Placed</th><th className="pb-2">Readiness</th></tr></thead>
            <tbody>
              {readyDepts.map((d) => (
                <tr key={d.department} className="border-b last:border-0">
                  <td className="py-3 font-medium text-gray-900">{d.department}</td>
                  <td className="py-3">{d.totalStudents}</td>
                  <td className="py-3">{d.skillRate}%</td>
                  <td className="py-3">{d.assessmentRate}%</td>
                  <td className="py-3">{d.applications}</td>
                  <td className="py-3">{d.placed}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${readinessColor(d.readinessScore)}`} style={{ width: `${d.readinessScore}%` }} /></div>
                      <span className="text-xs font-medium text-gray-700">{d.readinessScore} · {readinessText(d.readinessScore)}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {readyDepts.length === 0 && <tr><td colSpan={7} className="py-4 text-gray-400">No student data available.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {readyDepts.filter((d) => d.readinessScore < 45).length > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={15} /> {readyDepts.filter((d) => d.readinessScore < 45).length} department(s) need skill-development interventions.
        </p>
      )}
    </main>
  );
}