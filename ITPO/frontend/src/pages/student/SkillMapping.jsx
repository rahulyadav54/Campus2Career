import { useEffect, useState } from "react";
import { TrendingUp, Target, Building2, Briefcase, Zap, BookOpen } from "lucide-react";
import apiClient from "../../services/apiClient";

const demandBadge = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  very_high: "bg-green-100 text-green-700"
};
const demandLabel = {
  low: "Low Demand",
  medium: "Medium Demand",
  high: "High Demand",
  very_high: "Very High Demand"
};

export default function SkillMapping() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showAllSkills, setShowAllSkills] = useState(false);

  useEffect(() => {
    apiClient.get("/api/career/skill-mapping")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!data) return <p className="p-6 text-gray-500">Loading skill mapping…</p>;

  const { studentProfile, recommendedIndustries, recommendedRoles, skillsMap } = data;
  const chips = (items, color) =>
    (items || []).map((s) => (
      <span key={s} className={`text-xs px-2 py-1 rounded-full ${color}`}>{s}</span>
    ));

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Skill Mapping</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Your skills → roles → industries</h1>
        <p className="text-gray-600 mt-2">Recommended industries and roles based on your assessment, skills, and interests.</p>
      </header>

      {/* Profile snapshot */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Zap size={18} className="text-indigo-600" /> Your Skill Profile</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Skills:</span>
          {chips(studentProfile.skills, "bg-indigo-50 text-indigo-700")}
          {!(studentProfile.skills?.length) && <span className="text-sm text-gray-400">No skills added yet</span>}
        </div>
        {studentProfile.strengths?.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Assessment strengths:</span>
            {chips(studentProfile.strengths, "bg-green-50 text-green-700")}
          </div>
        )}
        {studentProfile.gaps?.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Gaps to address:</span>
            {chips(studentProfile.gaps, "bg-red-50 text-red-600")}
          </div>
        )}
        {studentProfile.interests?.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Interests:</span>
            {chips(studentProfile.interests, "bg-purple-50 text-purple-700")}
          </div>
        )}
        {studentProfile.lastAssessedAt && (
          <p className="text-xs text-gray-400">Last assessed: {new Date(studentProfile.lastAssessedAt).toLocaleDateString()}</p>
        )}
      </section>

      {/* Recommended industries */}
      <section className="space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Building2 size={18} className="text-indigo-600" /> Recommended Industries</h2>
        {recommendedIndustries.length === 0 && <p className="text-gray-500 text-sm">Complete your skill assessment or add skills to see industry recommendations.</p>}
        <div className="grid md:grid-cols-2 gap-4">
          {recommendedIndustries.map((ind) => (
            <div key={ind.industry} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{ind.industry}</h3>
                  <p className="text-sm text-gray-500">{ind.roles} matching role{ind.roles === 1 ? "" : "s"}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${demandBadge[ind.demandLevel] || "bg-gray-100 text-gray-600"}`}>
                  {demandLabel[ind.demandLevel] || ind.demandLevel}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Skill coverage</span><span className="font-medium">{ind.coverageScore}%</span></div>
                <div className="h-2 bg-gray-100 rounded-full"><div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${ind.coverageScore}%` }} /></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Interest fit</span><span className="font-medium">{ind.interestScore}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Overall score</span><span className="font-bold text-indigo-600">{ind.totalScore}/100</span></div>
              </div>
              {ind.roleNames?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {ind.roleNames.slice(0, 4).map((r) => <span key={r} className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-full">{r}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
{/* Recommended roles */}
      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Briefcase size={18} className="text-indigo-600" /> Recommended Roles</h2>
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="p-4">Role</th><th className="p-4">Industry</th><th className="p-4">Match</th><th className="p-4">Demand</th><th className="p-4">Avg. Salary</th></tr></thead>
            <tbody>
              {recommendedRoles.map((r) => (
                <tr key={`${r.role}-${r.industry}`} className="border-b last:border-0">
                  <td className="p-4 font-medium text-gray-900">{r.role}</td>
                  <td className="p-4 text-gray-600">{r.industry}</td>
                  <td className="p-4">
                    <span className="font-bold text-indigo-600">{r.matchScore}%</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.matchedSkills.slice(0, 2).map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded">{s}</span>)}
                      {r.missingSkills.length > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">+{r.missingSkills.length} gaps</span>}
                    </div>
                  </td>
                  <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${demandBadge[r.demandLevel] || "bg-gray-100"}`}>{demandLabel[r.demandLevel] || r.demandLevel}</span></td>
                  <td className="p-4 text-gray-600">₹{r.salaryLPA} LPA</td>
                </tr>
              ))}
              {recommendedRoles.length === 0 && <tr><td colSpan={5} className="p-4 text-gray-400">No roles found — add skills to your profile.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Skill → roles → industries mapping */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Target size={18} className="text-indigo-600" /> Skill → Role → Industry Mapping</h2>
          {skillsMap.length > 6 && (
            <button onClick={() => setShowAllSkills(!showAllSkills)} className="text-sm text-indigo-600 hover:underline">
              {showAllSkills ? "Show fewer" : `Show all (${skillsMap.length})`}
            </button>
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(showAllSkills ? skillsMap : skillsMap.slice(0, 6)).map((entry) => (
            <div key={entry.skill} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center gap-2">
                <p className="font-semibold text-gray-900">{entry.skill}</p>
                {entry.hasSkill
                  ? <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">You have this</span>
                  : entry.isGap
                    ? <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full">Gap</span>
                    : <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">New</span>}
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex gap-2"><span className="text-gray-400 w-12 flex-shrink-0">Roles</span><div className="flex flex-wrap gap-1">{entry.roles.slice(0, 3).map((r) => <span key={r} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded">{r}</span>)}</div></div>
                <div className="flex gap-2"><span className="text-gray-400 w-12 flex-shrink-0">Industry</span><div className="flex flex-wrap gap-1">{entry.industries.slice(0, 3).map((i) => <span key={i} className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded">{i}</span>)}</div></div>
                <p className="text-gray-400 pt-1">Required in {entry.requiredIn} career path{entry.requiredIn === 1 ? "" : "s"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {recommendedRoles.length === 0 && recommendedIndustries.length === 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
          We need more profile data to recommend roles. Add skills and interests on your <span className="font-medium">Profile</span> page and take the
          <span className="font-medium"> Skill Assessment</span> for accurate results.
        </section>
      )}

      <p className="text-sm text-gray-400 flex items-center gap-1"><TrendingUp size={14} className="text-indigo-600" /> Tip: address your skill gaps with the <a className="text-indigo-600 hover:underline" href="#/student/learning">Learning Recommendations</a> page.</p>
    </main>
  );
}