import { useEffect, useState, useCallback } from "react";
import { Briefcase, Users, Calendar, TrendingUp, BarChart3, CheckCircle, Clock, Target, Eye } from "lucide-react";
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

const FunnelStep = ({ label, value, max, color, children }) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="w-40 font-medium text-gray-800">{label}</span>
    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className={`${color} h-full rounded-full`} style={{ width: `${Math.round((value / Math.max(max, 1)) * 100)}%` }} /></div>
    <span className="w-10 text-right font-bold text-gray-900">{value}</span>
    {children}
  </div>
);

export default function RecruitmentAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const navigate = useNavigate();

  const fetchData = useCallback(async (range) => {
    setLoading(true);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range));
    try {
      const url = `${API_URL}/api/recruiter/analytics/recruitment-outcomes?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      const res = await makeAuthenticatedRequest(url, {}, navigate);
      setData(await res.json());
    } catch (err) {
      toast.error(err.message || "Unable to load recruitment analytics");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  if (loading) return <p className="p-6 text-gray-500">Loading recruitment analytics…</p>;
  if (!data) return <p className="p-6 text-gray-500">No data available.</p>;

  const { funnel = {}, conversion = {}, monthlyTrend = [], topSkills = [], statusDistribution = [], recentJobs = [] } = data;
  const funnelValues = [funnel.jobsPosted, funnel.totalApplications, funnel.applied, funnel.pendingRecruiterReview, funnel.interviewsScheduled, funnel.hired];
  const maxFunnel = Math.max(...funnelValues, 1);
  const maxSkills = topSkills.length ? Math.max(...topSkills.map((s) => s.count)) : 1;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Analytics Dashboard</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Recruitment analytics</h1>
          <p className="text-gray-600 mt-1">Your hiring funnel, conversion rates and in-demand skills.</p>
        </div>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Jobs posted" value={funnel.jobsPosted || 0} />
        <StatCard icon={Users} label="Applications" value={funnel.totalApplications || 0} sub={`${funnel.hired || 0} hired`} />
        <StatCard icon={Calendar} label="Interviews" value={funnel.interviewsScheduled || 0} />
        <StatCard icon={TrendingUp} label="Hire rate" value={`${conversion.applicationToHire || 0}%`} sub="applications → hired" />
      </section>

      {/* Hiring funnel */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><BarChart3 size={18} className="text-indigo-600" /> Hiring funnel</h2>
        <div className="space-y-3">
          <FunnelStep label="Applied" value={funnel.applied} max={maxFunnel} color="bg-indigo-600" />
          <FunnelStep label="Pending review" value={funnel.pendingRecruiterReview} max={maxFunnel} color="bg-amber-500" />
          <FunnelStep label="Interview scheduled" value={funnel.interviewsScheduled} max={maxFunnel} color="bg-purple-500" />
          <FunnelStep label="Hired" value={funnel.hired} max={maxFunnel} color="bg-green-500" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div><p className="text-xs text-gray-500">Apply → Interview</p><p className="font-bold text-gray-900">{conversion.applicationToInterview || 0}%</p></div>
          <div><p className="text-xs text-gray-500">Apply → Hire</p><p className="font-bold text-gray-900">{conversion.applicationToHire || 0}%</p></div>
          <div><p className="text-xs text-gray-500">Interview → Hire</p><p className="font-bold text-gray-900">{conversion.interviewToHire || 0}%</p></div>
        </div>
      </section>

      {/* Monthly trend + skills */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Calendar size={18} className="text-indigo-600" /> Activity trend</h2>
          <LineChart data={monthlyTrend} series={[{ key: "applications", color: "#6366f1", name: "Applications" }, { key: "hired", color: "#10b981", name: "Hired" }]} />
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Target size={18} className="text-indigo-600" /> In-demand skills</h2>
          <div className="space-y-3">
            {topSkills.map((s) => (
              <div key={s.skill} className="flex items-center gap-3 text-sm">
                <span className="w-32 text-gray-700 truncate">{s.skill}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.round((s.count / maxSkills) * 100)}%` }} /></div>
                <span className="w-6 text-right font-medium text-gray-900">{s.count}</span>
              </div>
            ))}
            {!topSkills.length && <p className="text-sm text-gray-400">Add skills to your job postings to see demand.</p>}
          </div>
        </section>
      </div>

      {/* Status distribution */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><CheckCircle size={18} className="text-indigo-600" /> Application status distribution</h2>
        <div className="space-y-3">
          {statusDistribution.map((s) => (
            <div key={s.status} className="flex items-center gap-3 text-sm">
              <span className="w-44 text-gray-700 capitalize">{s.status.replace(/_/g, " ")}</span>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((s.count / Math.max(funnel.totalApplications, 1)) * 100)}%` }} /></div>
              <span className="w-8 text-right font-medium text-gray-900">{s.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent jobs */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Clock size={18} className="text-indigo-600" /> Recent jobs</h2>
          <button onClick={() => navigate("/recruiter/jobs")} className="text-sm text-indigo-600 hover:underline">View all jobs</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Job</th><th className="pb-2">Status</th><th className="pb-2">Applied</th><th className="pb-2">Posted</th></tr></thead>
            <tbody>
              {recentJobs.map((j, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3 font-medium text-gray-900">{j.title}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      j.status === "approved" ? "bg-green-100 text-green-700" :
                      j.status === "pending_approval" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{j.status || "Active"}</span>
                  </td>
                  <td className="py-3 text-gray-600">{j.applicationCount}</td>
                  <td className="py-3 text-gray-600">{j.postedAt ? new Date(j.postedAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
              {!recentJobs.length && <tr><td colSpan={4} className="py-4 text-gray-400">No jobs posted yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
