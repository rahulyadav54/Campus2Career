import { useEffect, useState } from "react";
import { Briefcase, Calendar, ClipboardCheck, Users, Building2, TrendingUp, Award } from "lucide-react";
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

const Bar = ({ label, value, max, color = "bg-indigo-600", sub }) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="w-36 text-gray-700 truncate">{label}</span>
    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: `${Math.round((value / Math.max(max, 1)) * 100)}%` }} /></div>
    <span className="w-10 text-right font-medium text-gray-900">{value}</span>
    {sub && <span className="w-10 text-right text-xs text-gray-400">{sub}</span>}
  </div>
);

export default function InternshipAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await makeAuthenticatedRequest(`${API_URL}/api/admin/analytics/internship-participation`, {}, navigate);
        setData(await res.json());
      } catch (err) {
        toast.error(err.message || "Unable to load internship analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) return <p className="p-6 text-gray-500">Loading internship analytics…</p>;
  if (!data) return <p className="p-6 text-gray-500">No data available.</p>;

  const { summary = {}, statusBreakdown = [], byDepartment = [], completionTrend = [], topOrganizations = [], skillsGained = [], programs = [] } = data;

  const statusColor = { ongoing: "bg-amber-500", completed: "bg-green-500", discontinued: "bg-red-500" };
  const maxDept = byDepartment.length ? Math.max(...byDepartment.map((d) => d.total)) : 1;
  const maxOrg = topOrganizations.length ? Math.max(...topOrganizations.map((o) => o.count)) : 1;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Analytics Dashboard</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Internship participation &amp; completion</h1>
        <p className="text-gray-600 mt-1">Institution-level internship records sourced from InternshipProgress and approved internship programs.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Internships tracked" value={summary.totalInternships || 0} />
        <StatCard icon={ClipboardCheck} label="Completion rate" value={`${summary.completionRate || 0}%`} sub={`${summary.completed || 0} of ${summary.totalInternships || 0} completed`} />
        <StatCard icon={Award} label="Certificate rate" value={`${summary.certificateRate || 0}%`} sub="of completed internships" />
        <StatCard icon={Users} label="Students participated" value={summary.totalStudentsParticipated || 0} sub={`avg duration ${summary.avgDurationDays || 0}d`} />
      </section>

      {/* Status breakdown */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Calendar size={18} className="text-indigo-600" /> Status breakdown</h2>
        <div className="space-y-3">
          {statusBreakdown.map((s) => (
            <Bar key={s.status} label={s.status} value={s.count} max={summary.totalInternships || 1} color={statusColor[s.status] || "bg-gray-400"} />
          ))}
        </div>
      </section>

      {/* Completion trend */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-indigo-600" /> Completion trend</h2>
        <LineChart data={completionTrend} series={[{ key: "started", color: "#93c5fd", name: "Started" }, { key: "completed", color: "#10b981", name: "Completed" }]} />
      </section>

      {/* By department */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Users size={18} className="text-indigo-600" /> Completion rate by department</h2>
        <div className="space-y-3">
          {byDepartment.map((d) => (
            <Bar key={d.department} label={d.department} value={d.total} max={maxDept} color="bg-indigo-500" sub={`${d.completionRate}%`} />
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top organizations */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Building2 size={18} className="text-indigo-600" /> Top organizations</h2>
          <div className="space-y-3">
            {topOrganizations.map((o) => (
              <Bar key={o.organization} label={o.organization} value={o.count} max={maxOrg} color="bg-purple-500" />
            ))}
          </div>
        </section>

        {/* Skills gained */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Award size={18} className="text-indigo-600" /> Skills gained</h2>
          <div className="flex flex-wrap gap-2">
            {skillsGained.map((s) => (
              <span key={s.skill} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">{s.skill} ({s.count})</span>
            ))}
            {!skillsGained.length && <span className="text-sm text-gray-400">No skills recorded yet.</span>}
          </div>
        </section>
      </div>

      {/* Programs table */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Briefcase size={18} className="text-indigo-600" /> Internship programs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Program</th><th className="pb-2">Applications</th><th className="pb-2">Accepted</th><th className="pb-2">Completed</th></tr></thead>
            <tbody>
              {programs.map((p, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3 font-medium text-gray-900">{p.title}</td>
                  <td className="py-3 text-gray-600">{p.applications}</td>
                  <td className="py-3 text-gray-600">{p.accepted}</td>
                  <td className="py-3 text-gray-600">{p.completed}</td>
                </tr>
              ))}
              {!programs.length && <tr><td colSpan={4} className="py-4 text-gray-400">No internship programs found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
