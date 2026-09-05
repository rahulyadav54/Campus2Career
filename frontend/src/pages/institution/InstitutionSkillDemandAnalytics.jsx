import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, GraduationCap, Briefcase, Award } from "lucide-react";
import apiClient from "../../services/apiClient";

const StatCard = ({ icon: IconComp, label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}><IconComp size={22} /></div>
    <div><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p></div>
  </div>
);

export default function InstitutionSkillDemandAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/api/career/analytics/skill-demand-trends?months=12")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <main className="max-w-6xl mx-auto p-6 text-red-600">{error}</main>;
  if (!data) return <main className="max-w-6xl mx-auto p-6 text-gray-500">Loading analytics…</main>;

  const { trend, monthlyTotals, summary } = data;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Analytics</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Skill Demand Trends</h1>
        <p className="text-gray-600 mt-2">Monthly skill demand across jobs, opportunities, pathways, and student assessments.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Skills Tracked" value={summary?.skillsTracked ?? "—"} color="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp} label="Peak Month" value={summary?.peakMonth ?? "—"} color="bg-green-50 text-green-600" />
        <StatCard icon={Award} label="Top Skill" value={summary?.peakSkill ?? "—"} color="bg-purple-50 text-purple-600" />
        <StatCard icon={Users} label="Months Tracked" value={summary?.months ?? "—"} color="bg-amber-50 text-amber-600" />
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Skills by Demand</h2>
        {!trend?.length ? (
          <p className="text-gray-500 text-sm">No skill demand data available yet.</p>
        ) : (
          <div className="space-y-3">
            {trend.slice(0, 10).map((item) => (
              <div key={item.skill} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.skill}</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(100, (item.total / (trend[0]?.total || 1)) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-sm text-gray-600 ml-4">{item.total}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Demand Trend</h2>
        {!monthlyTotals?.length ? (
          <p className="text-gray-500 text-sm">No monthly data available yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {monthlyTotals.map((item) => (
              <div key={item.monthKey} className="border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500">{item.month}</p>
                <p className="text-lg font-bold text-gray-900">{item.demandScore}</p>
                <p className="text-xs text-gray-500">demand score</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
