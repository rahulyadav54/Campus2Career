import { useEffect, useState } from "react";
import { AlertTriangle, Users, Target, BarChart3, PieChart, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../../utils/auth";
import { API_URL } from "../../config/api";
import toast from "react-hot-toast";

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <p className="text-sm text-gray-500 flex items-center gap-1.5">{Icon && <Icon size={15} />} {label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const Bar = ({ label, value, max, color = "bg-red-500", sub }) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="w-44 text-gray-700 truncate">{label}</span>
    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: `${Math.round((value / Math.max(max, 1)) * 100)}%` }} /></div>
    <span className="w-8 text-right font-medium text-gray-900">{value}</span>
    {sub && <span className="w-20 text-right text-xs text-gray-400">{sub}</span>}
  </div>
);

export default function StudentSkillGapReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await makeAuthenticatedRequest(`${API_URL}/api/admin/analytics/student-skill-gaps`, {}, navigate);
        setData(await res.json());
      } catch (err) {
        toast.error(err.message || "Unable to load skill gap report");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="p-6 text-gray-500">Loading skill gap report…</p>;
  if (!data) return <p className="p-6 text-gray-500">No data available.</p>;

  const { summary = {}, gapFrequency = [], topSkillGaps = [], byDepartment = [], distribution = [], demandedSkills = [] } = data;

  const maxGap = gapFrequency.length ? Math.max(...gapFrequency.map((g) => g.count)) : 1;
  const maxDist = distribution.length ? Math.max(...distribution.map((d) => d.count)) : 1;
  const maxDept = byDepartment.length ? Math.max(...byDepartment.map((d) => d.studentsWithGaps)) : 1;
  const gapColor = (priority) => (priority >= 8 ? "bg-red-500" : priority >= 4 ? "bg-amber-500" : "bg-gray-400");

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Analytics Dashboard</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Student skill gap report</h1>
        <p className="text-gray-600 mt-1">Institution-wide distribution of skill gaps, prioritised against live industry demand.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Students analysed" value={summary.totalStudents || 0} />
        <StatCard icon={AlertTriangle} label="Students w/ gaps" value={summary.studentsWithGaps || 0} sub={`${summary.pctWithGaps || 0}%`} />
        <StatCard icon={Target} label="Avg gaps / student" value={summary.avgGapsPerStudent || 0} />
        <StatCard icon={BarChart3} label="Unique gaps" value={summary.totalUniqueGaps || 0} />
      </section>

      {/* Gap distribution */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><PieChart size={18} className="text-indigo-600" /> Gap distribution</h2>
        <div className="space-y-3">
          {distribution.map((d) => (
            <Bar key={d.range} label={`Students with ${d.range} gaps`} value={d.count} max={maxDist} color="bg-indigo-600" />
          ))}
        </div>
      </section>

      {/* Most frequent skill gaps */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><AlertTriangle size={18} className="text-indigo-600" /> Most frequent skill gaps</h2>
        <div className="space-y-3">
          {gapFrequency.slice(0, 20).map((g) => (
            <Bar key={g.skill} label={g.skill} value={g.count} max={maxGap} color="bg-red-500" />
          ))}
          {!gapFrequency.length && <p className="text-gray-400 text-sm">No skill gaps recorded for students in scope.</p>}
        </div>
      </section>

      {/* Top skill gaps (priority = gap count + industry demand) */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Target size={18} className="text-indigo-600" /> Prioritised skill gaps (gap × industry demand)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Skill</th><th className="pb-2">Students missing</th><th className="pb-2">Industry demand</th><th className="pb-2">Priority</th></tr></thead>
            <tbody>
              {topSkillGaps.map((g) => (
                <tr key={g.skill} className="border-b last:border-0">
                  <td className="py-3 font-medium text-gray-900">{g.skill}</td>
                  <td className="py-3 text-gray-600">{g.gapCount}</td>
                  <td className="py-3 text-gray-600">{g.industryDemand}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium text-white ${gapColor(g.priority)}`}>{g.priority}</span>
                  </td>
                </tr>
              ))}
              {!topSkillGaps.length && <tr><td colSpan={4} className="py-4 text-gray-400">No prioritised gaps.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By department */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><GraduationCap size={18} className="text-indigo-600" /> Gap rate by department</h2>
          <div className="space-y-3">
            {byDepartment.map((d) => (
              <Bar key={d.department} label={d.department} value={d.studentsWithGaps} max={maxDept} color="bg-indigo-500" sub={`${d.gapRate}% · avg ${d.avgGaps}`} />
            ))}
          </div>
        </section>

        {/* Industry-demanded skills to teach */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Target size={18} className="text-indigo-600" /> High-demand skills (teach & align)</h2>
          <div className="flex flex-wrap gap-2">
            {demandedSkills.map((s) => (
              <span key={s.skill} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">{s.skill} ({s.count})</span>
            ))}
            {!demandedSkills.length && <span className="text-sm text-gray-400">No demanded skills found.</span>}
          </div>
        </section>
      </div>
    </main>
  );
}
