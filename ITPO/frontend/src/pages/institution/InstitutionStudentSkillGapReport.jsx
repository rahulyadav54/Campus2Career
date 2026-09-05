import { useEffect, useState } from "react";
import { AlertTriangle, Users, BarChart3, TrendingUp } from "lucide-react";
import apiClient from "../../services/apiClient";

const StatCard = ({ icon: IconComp, label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}><IconComp size={22} /></div>
    <div><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p></div>
  </div>
);

export default function InstitutionStudentSkillGapReport() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/api/admin/analytics/student-skill-gaps")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <main className="max-w-6xl mx-auto p-6 text-red-600">{error}</main>;
  if (!data) return <main className="max-w-6xl mx-auto p-6 text-gray-500">Loading analytics…</main>;

  const { summary, topSkillGaps, demandedSkills } = data;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Analytics</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Student Skill Gap Report</h1>
        <p className="text-gray-600 mt-2">Institution-wide skill gap distribution and prioritized improvement areas.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={summary?.totalStudents ?? "—"} color="bg-blue-50 text-blue-600" />
        <StatCard icon={AlertTriangle} label="Students With Gaps" value={summary?.studentsWithGaps ?? "—"} color="bg-amber-50 text-amber-600" />
        <StatCard icon={BarChart3} label="Gap Rate" value={`${summary?.pctWithGaps ?? 0}%`} color="bg-red-50 text-red-600" />
        <StatCard icon={TrendingUp} label="Avg Gaps / Student" value={summary?.avgGapsPerStudent ?? "—"} color="bg-purple-50 text-purple-600" />
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Skill Gaps</h2>
        {!topSkillGaps?.length ? (
          <p className="text-gray-500 text-sm">No gap data available yet.</p>
        ) : (
          <div className="space-y-3">
            {topSkillGaps.slice(0, 10).map((item) => (
              <div key={item.skill} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.skill}</p>
                  <p className="text-xs text-gray-500">Industry demand: {item.industryDemand}</p>
                </div>
                <span className="text-sm text-gray-600">{item.gapCount} students</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">In-Demand Skills</h2>
        {!demandedSkills?.length ? (
          <p className="text-gray-500 text-sm">No demand data available yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {demandedSkills.slice(0, 20).map((s) => (
              <span key={s.skill} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">{s.skill} ({s.count})</span>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
