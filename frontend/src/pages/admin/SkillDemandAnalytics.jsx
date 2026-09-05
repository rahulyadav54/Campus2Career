import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Target, Calendar, BarChart3, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../../utils/auth";
import { API_URL } from "../../config/api";
import toast from "react-hot-toast";

const LineChart = ({ data, series, height = 200 }) => {
  if (!data || !data.length) return <p className="text-sm text-gray-400 py-6">No trend data to display.</p>;
  const allValues = series.flatMap((s) => data.map((d) => Number(d[s.key] || 0)));
  const top = allValues.length ? Math.max(...allValues) : 1;
  const yTo = (v) => 36 - (Number(v || 0) / (top || 1)) * 26;
  const xFor = (i) => 4 + (i / Math.max(1, data.length - 1)) * 92;
  return (
    <svg width="100%" height={height} viewBox="0 0 100 40" className="w-full">
      <line x1="4" y1="36" x2="96" y2="36" stroke="#e5e7eb" strokeWidth="0.8" />
      <line x1="4" y1="8" x2="4" y2="36" stroke="#e5e7eb" strokeWidth="0.8" />
      {series.map((s) => {
        const points = data.map((d, i) => `${xFor(i).toFixed(2)},${yTo(d[s.key]).toFixed(2)}`).join(" ");
        return <polyline key={s.key} fill="none" stroke={s.color} strokeWidth="1.4" points={points} />;
      })}
      {data.map((d, i) => (
        <text key={i} x={xFor(i)} y={39} fontSize="2.8" fill="#9ca3af" textAnchor="middle">{String(d.month || "").slice(0, 3)}</text>
      ))}
    </svg>
  );
};

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <p className="text-sm text-gray-500 flex items-center gap-1.5">{Icon && <Icon size={15} />} {label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export default function SkillDemandAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const res = await makeAuthenticatedRequest(`${API_URL}/api/career/analytics/skill-demand-trends`, {}, navigate);
      setData(await res.json());
    } catch (err) {
      toast.error(err.message || "Unable to load skill demand trends");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <p className="p-6 text-gray-500">Loading skill demand trends…</p>;
  if (!data) return <p className="p-6 text-gray-500">No data available.</p>;

  const { buckets = [], trend = [], monthlyTotals = [], summary = {} } = data;
  const maxScore = trend.length ? Math.max(...trend.map((t) => t.total)) : 1;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Analytics Dashboard</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Skill demand trends</h1>
        <p className="text-gray-600 mt-1">How skill demand evolves month-over-month across student skills, career pathways, approved jobs and programs.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Skills tracked" value={summary.skillsTracked || 0} sub="distinct skills" />
        <StatCard icon={Calendar} label="Month buckets" value={summary.months || 0} />
        <StatCard icon={Target} label="Peak skill" value={summary.peakSkill || "—"} sub={summary.peakMonth || ""} />
        <StatCard icon={TrendingUp} label="Top skills shown" value={summary.topSkillCount || 0} />
      </section>

      {/* Market heat over time */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-indigo-600" /> Market demand heat</h2>
        <LineChart data={monthlyTotals} series={[{ key: "demandScore", color: "#6366f1", name: "Demand score" }]} />
        <p className="text-xs text-gray-400 mt-2">Weighted demand score summed across all skills per month.</p>
      </section>

      {/* Top skill trend lines */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><BarChart3 size={18} className="text-indigo-600" /> Top skill trends</h2>
        <div className="space-y-6">
          {trend.slice(0, 8).map((s) => (
            <div key={s.skill}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-800">{s.skill}</span>
                <span className="text-gray-500">score {s.total} · {s.industries?.length || 0} industries</span>
              </div>
              <LineChart data={s.monthly.map((v, i) => ({ month: buckets[i], value: v }))} series={[{ key: "value", color: "#10b981" }]} height={130} />
            </div>
          ))}
          {!trend.length && <p className="text-gray-400 text-sm">No skill trend data yet.</p>}
        </div>
      </section>

      {/* Top skills ranked by total weighted demand */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Users size={18} className="text-indigo-600" /> Top skills by total demand</h2>
        <div className="space-y-3">
          {trend.slice(0, 15).map((s) => (
            <div key={s.skill}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-800">{s.skill}</span>
                <span className="text-gray-500">score {s.total}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full" style={{ width: `${Math.round((s.total / maxScore) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
