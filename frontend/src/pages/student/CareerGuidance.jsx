import { useEffect, useState } from "react";
import { TrendingUp, BookOpen, Target, ExternalLink, ChevronDown, ChevronUp, Zap } from "lucide-react";
import apiClient from "../../services/apiClient";

const demandColor = { low: "bg-gray-100 text-gray-600", medium: "bg-blue-100 text-blue-700", high: "bg-amber-100 text-amber-700", very_high: "bg-green-100 text-green-700" };
const demandLabel = { low: "Low Demand", medium: "Medium Demand", high: "High Demand", very_high: "Very High Demand" };

export default function CareerGuidance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    apiClient.get("/api/career/guidance")
      .then(setData)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!data) return <p className="p-6 text-gray-500">Loading career guidance…</p>;

  const { recommendedPathways, recommendedIndustries, learningResources, skillGaps, studentProfile } = data;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Career Guidance</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Your personalised career roadmap</h1>
        <p className="text-gray-600 mt-2">Based on your skills, strengths, and interests.</p>
      </header>

      {/* Profile snapshot */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Zap size={18} className="text-indigo-600" /> Your Skill Profile</h2>
        <div className="flex flex-wrap gap-2">
          {(studentProfile.skills || []).map(s => (
            <span key={s} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">{s}</span>
          ))}
          {!(studentProfile.skills?.length) && <p className="text-sm text-gray-400">No skills added yet — update your profile.</p>}
        </div>
        {studentProfile.interests?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center">Interests:</span>
            {studentProfile.interests.map(i => (
              <span key={i} className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full">{i}</span>
            ))}
          </div>
        )}
      </section>

      {/* Recommended Pathways */}
      <section className="space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Target size={18} className="text-indigo-600" /> Recommended Career Pathways</h2>
        {recommendedPathways.length === 0 && (
          <p className="text-gray-500 text-sm">Add skills to your profile to get personalised recommendations.</p>
        )}
        {recommendedPathways.map(({ pathway, matchScore, matchedSkills, missingSkills }) => (
          <div key={pathway._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === pathway._id ? null : pathway._id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[52px]">
                  <p className={`text-2xl font-bold ${matchScore >= 70 ? "text-green-600" : matchScore >= 40 ? "text-amber-600" : "text-gray-400"}`}>{matchScore}%</p>
                  <p className="text-xs text-gray-400">match</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{pathway.role}</p>
                  <p className="text-sm text-gray-500">{pathway.industry}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${demandColor[pathway.demandLevel]}`}>{demandLabel[pathway.demandLevel]}</span>
                <span className="text-sm text-gray-500">₹{pathway.averageSalaryLPA} LPA</span>
                {expanded === pathway._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {expanded === pathway._id && (
              <div className="border-t border-gray-100 p-5 space-y-4">
                <p className="text-gray-700 text-sm">{pathway.description}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">You already have</p>
                    <div className="flex flex-wrap gap-1">
                      {matchedSkills.length ? matchedSkills.map(s => <span key={s} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">{s}</span>) : <span className="text-xs text-gray-400">None yet</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Skills to build</p>
                    <div className="flex flex-wrap gap-1">
                      {missingSkills.length ? missingSkills.map(s => <span key={s} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full">{s}</span>) : <span className="text-xs text-green-600">All required skills covered!</span>}
                    </div>
                  </div>
                </div>
                {pathway.certifications?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommended Certifications</p>
                    <div className="flex flex-wrap gap-1">
                      {pathway.certifications.map(c => <span key={c} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">{c}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Recommended Industries */}
      {recommendedIndustries.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-600" /> Industry Demand Outlook</h2>
          <p className="text-sm text-gray-500 -mt-2">High-demand industries matched with your skills and interests.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendedIndustries.map((ind) => (
              <div key={ind.industry} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-gray-900">{ind.industry}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${demandColor[ind.demandLevel] || "bg-gray-100 text-gray-600"}`}>{demandLabel[ind.demandLevel] || ind.demandLevel}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{ind.roles} mapped roles</p>
                {ind.matchedRoles?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ind.matchedRoles.slice(0, 4).map((r) => <span key={r} className="text-[11px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded">{r}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skill Gaps */}
      {skillGaps.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-900 mb-3">Top Skill Gaps to Address</h2>
          <div className="flex flex-wrap gap-2">
            {skillGaps.map(s => <span key={s} className="text-sm px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded-full">{s}</span>)}
          </div>
        </section>
      )}

      {/* Learning Resources */}
      {learningResources.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600" /> Recommended Learning Resources</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {learningResources.map(r => (
              <a key={r._id} href={r.url || "#"} target="_blank" rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition group">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-indigo-600">{r.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{r.provider} · {r.type}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.skills.slice(0, 3).map(s => <span key={s} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{s}</span>)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {r.isFree && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Free</span>}
                    <span className="text-xs text-gray-400 capitalize">{r.level}</span>
                    {r.url && <ExternalLink size={14} className="text-gray-400 mt-1" />}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
