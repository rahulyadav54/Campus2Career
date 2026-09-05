import { useEffect, useState } from "react";
import { ClipboardList, TrendingUp, Building2, Award } from "lucide-react";
import apiClient from "../../services/apiClient";

const StatCard = ({ icon: IconComp, label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}><IconComp size={22} /></div>
    <div><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p></div>
  </div>
);

export default function InstitutionInternshipAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/api/admin/analytics/internship-participation?months=12")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <main className="max-w-6xl mx-auto p-6 text-red-600">{error}</main>;
  if (!data) return <main className="max-w-6xl mx-auto p-6 text-gray-500">Loading analytics…</main>;

  const { summary, statusBreakdown, byDepartment, skillsGained } = data;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Analytics</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Internship Participation</h1>
        <p className="text-gray-600 mt-2">Internship enrollment, completion, and skill outcomes.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Internships" value={summary?.totalInternships ?? "—"} color="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${summary?.completionRate ?? 0}%`} color="bg-green-50 text-green-600" />
        <StatCard icon={Award} label="Certificate Rate" value={`${summary?.certificateRate ?? 0}%`} color="bg-purple-50 text-purple-600" />
        <StatCard icon={Building2} label="Avg Duration" value={`${summary?.avgDurationDays ?? 0} days`} color="bg-amber-50 text-amber-600" />
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h2>
        {!statusBreakdown?.length ? (
          <p className="text-gray-500 text-sm">No internship records yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {statusBreakdown.map((s) => (
              <div key={s.status} className="border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500 capitalize">{s.status}</p>
                <p className="text-lg font-bold text-gray-900">{s.count}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Participation</h2>
        {!byDepartment?.length ? (
          <p className="text-gray-500 text-sm">No department data available.</p>
        ) : (
          <div className="space-y-2">
            {byDepartment.slice(0, 10).map((dept) => (
              <div key={dept.department} className="flex items-center justify-between border-b last:border-0 py-2">
                <p className="text-sm font-medium text-gray-900">{dept.department}</p>
                <p className="text-sm text-gray-600">{dept.total} students · {dept.completed} completed</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Skills Gained</h2>
        {!skillsGained?.length ? (
          <p className="text-gray-500 text-sm">No skills data available yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skillsGained.slice(0, 20).map((s) => (
              <span key={s.skill} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">{s.skill} ({s.count})</span>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
