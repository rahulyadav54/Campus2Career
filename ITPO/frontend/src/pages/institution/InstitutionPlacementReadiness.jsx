import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, GraduationCap } from "lucide-react";
import apiClient from "../../services/apiClient";

const StatCard = ({ icon: IconComp, label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}><IconComp size={22} /></div>
    <div><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p></div>
  </div>
);

export default function InstitutionPlacementReadiness() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/api/career/analytics/placement-readiness")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <main className="max-w-6xl mx-auto p-6 text-red-600">{error}</main>;
  if (!data) return <main className="max-w-6xl mx-auto p-6 text-gray-500">Loading analytics…</main>;

  const { breakdown, totals } = data;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Analytics</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Placement Readiness</h1>
        <p className="text-gray-600 mt-2">Readiness scores, application activity, and placement outcomes.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={totals?.totalStudents ?? "—"} color="bg-blue-50 text-blue-600" />
        <StatCard icon={GraduationCap} label="Placed" value={totals?.placed ?? "—"} color="bg-green-50 text-green-600" />
        <StatCard icon={TrendingUp} label="Placement Rate" value={`${totals?.placementRate ?? 0}%`} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={BarChart3} label="Assessed" value={`${totals?.assessed ?? 0}%`} color="bg-purple-50 text-purple-600" />
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Breakdown</h2>
        {!breakdown?.length ? (
          <p className="text-gray-500 text-sm">No readiness data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Department</th><th className="pb-2">Students</th><th className="pb-2">Skills</th><th className="pb-2">Assessed</th><th className="pb-2">Applications</th><th className="pb-2">Placed</th><th className="pb-2">Readiness</th></tr></thead>
              <tbody>
                {breakdown.map((row) => (
                  <tr key={row.department} className="border-b last:border-0">
                    <td className="py-2 font-medium">{row.department}</td>
                    <td className="py-2">{row.totalStudents}</td>
                    <td className="py-2">{row.skillRate}%</td>
                    <td className="py-2">{row.assessmentRate}%</td>
                    <td className="py-2">{row.applyRate}%</td>
                    <td className="py-2">{row.placementRate}%</td>
                    <td className="py-2">{row.readinessScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
