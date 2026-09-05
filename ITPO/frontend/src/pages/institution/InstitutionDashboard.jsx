import { useEffect, useState } from "react";
import { Users, GraduationCap, CheckCircle, Clock, BarChart2, Building2 } from "lucide-react";
import apiClient from "../../services/apiClient";

const StatCard = ({ icon: IconComp, label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}><IconComp size={22} /></div>
    <div><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p></div>
  </div>
);

export default function InstitutionDashboard() {
  const [data, setData] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiClient.get("/api/institutions/me"),
      apiClient.get("/api/institutions/me/dashboard")
    ]).then(([instData, dashData]) => {
      setInstitution(instData.institution);
      setData(dashData);
    }).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!data) return <p className="p-6 text-gray-500">Loading dashboard…</p>;

  const { metrics, departmentBreakdown } = data;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <Building2 className="text-indigo-600" size={28} />
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Institution Admin</p>
            <h1 className="text-3xl font-bold text-gray-900">{institution?.name || "Institution Dashboard"}</h1>
          </div>
        </div>
        <p className="text-gray-600 mt-2">Overview of students, placements, and program outcomes.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Students" value={metrics.totalStudents} color="bg-blue-50 text-blue-600" />
        <StatCard icon={GraduationCap} label="Placed Students" value={metrics.placedStudents} color="bg-green-50 text-green-600" />
        <StatCard icon={BarChart2} label="Placement Rate" value={`${metrics.placementRate}%`} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={Clock} label="Pending Approvals" value={metrics.pendingStudents} color="bg-amber-50 text-amber-600" />
        <StatCard icon={Users} label="Academicians" value={metrics.totalAcademicians} color="bg-purple-50 text-purple-600" />
        <StatCard icon={CheckCircle} label="Pending Portfolio Verifications" value={metrics.pendingPortfolioItems} color="bg-rose-50 text-rose-600" />
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Breakdown</h2>
        {departmentBreakdown.length === 0 ? (
          <p className="text-gray-500 text-sm">No department data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Department</th><th className="pb-2">Students</th><th className="pb-2">Placed</th><th className="pb-2">Rate</th></tr></thead>
              <tbody>
                {departmentBreakdown.map((dept) => (
                  <tr key={dept._id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{dept._id || "Unassigned"}</td>
                    <td className="py-2">{dept.count}</td>
                    <td className="py-2">{dept.placed}</td>
                    <td className="py-2">{dept.count ? `${Math.round((dept.placed / dept.count) * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/institution/analytics/skill-demand" className="block p-4 border border-gray-100 rounded-lg hover:border-indigo-300 hover:shadow-sm transition">
            <p className="font-medium text-gray-900">Skill Demand Trends</p>
            <p className="text-sm text-gray-500">Monthly skill demand across jobs, pathways, and opportunities.</p>
          </a>
          <a href="/institution/analytics/internship-participation" className="block p-4 border border-gray-100 rounded-lg hover:border-indigo-300 hover:shadow-sm transition">
            <p className="font-medium text-gray-900">Internship Analytics</p>
            <p className="text-sm text-gray-500">Participation, completion, and skills gained.</p>
          </a>
          <a href="/institution/analytics/placement-readiness" className="block p-4 border border-gray-100 rounded-lg hover:border-indigo-300 hover:shadow-sm transition">
            <p className="font-medium text-gray-900">Placement Readiness</p>
            <p className="text-sm text-gray-500">Department-wise readiness scores and outcomes.</p>
          </a>
        </div>
      </section>
    </main>
  );
}
