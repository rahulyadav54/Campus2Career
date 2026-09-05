import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, Clock, BadgeCheck, Sparkles, GraduationCap, Filter } from "lucide-react";
import apiClient from "../../services/apiClient";

const typeIcon = { course: BookOpen, certification: BadgeCheck, workshop: GraduationCap, bootcamp: Sparkles, tutorial: BookOpen, book: BookOpen };

export default function LearningRecommendations() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [allResources, setAllResources] = useState([]);

  useEffect(() => {
    Promise.all([
      apiClient.get("/api/career/learning/recommendations"),
      apiClient.get("/api/career/resources")
    ]).then(([rec, res]) => {
      setData(rec);
      setAllResources(res.resources || []);
    }).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!data) return <p className="p-6 text-gray-500">Loading learning recommendations…</p>;

  const { recommendations, gaps, interests } = data;

  const resourceCard = (r, withScore = false) => {
    const Icon = typeIcon[r.type] || BookOpen;
    return (
      <a key={r._id} href={r.url || "#"} target="_blank" rel="noopener noreferrer"
        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition group flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            <Icon className="text-indigo-600 h-5 w-5" />
            <span className="text-xs uppercase tracking-wide text-gray-400">{r.type}</span>
          </div>
          {r.isFree ? <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Free</span>
            : <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Paid</span>}
        </div>
        <p className="font-medium text-gray-900 mt-2 group-hover:text-indigo-600">{r.title}</p>
        <p className="text-sm text-gray-500">{r.provider}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {(r.skills || []).slice(0, 3).map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded">{s}</span>)}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          {withScore && r.matchScore != null && <span className="font-medium text-indigo-600">{r.matchScore} pts match</span>}
          {r.durationHours ? <span className="flex items-center gap-1"><Clock size={12} /> {r.durationHours}h</span> : null}
          <span className="capitalize">{r.level}</span>
          {r.url && <ExternalLink size={14} className="ml-auto text-gray-300 group-hover:text-indigo-500" />}
        </div>
      </a>
    );
  };

  const browserList = (filter === "all" ? allResources : allResources.filter((r) => r.type === filter));

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Learning Recommendations</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Real courses &amp; certifications for you</h1>
        <p className="text-gray-600 mt-2">Personalised recommendations from real course and certification providers, matched to your skill gaps and interests.</p>
      </header>
{gaps.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-amber-900">Skill gaps to close:</span>
          {gaps.map((g) => <span key={g} className="text-xs px-2 py-1 bg-white border border-amber-300 text-amber-800 rounded-full">{g}</span>)}
          {interests.length > 0 && (
            <>
              <span className="text-sm font-medium text-purple-900 ml-2">Interests:</span>
              {interests.map((i) => <span key={i} className="text-xs px-2 py-1 bg-white border border-purple-300 text-purple-700 rounded-full">{i}</span>)}
            </>
          )}
        </section>
      )}

      {/* Personalized */}
      <section className="space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-indigo-600" /> Recommended for you</h2>
        {recommendations.length === 0 && <p className="text-gray-500 text-sm">Take the skill assessment or add skills to unlock personalised recommendations. Browse all resources below.</p>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((r) => resourceCard(r, true))}
        </div>
      </section>

      {/* Browse all */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Filter size={18} className="text-indigo-600" /> Browse all resources ({browserList.length})</h2>
          <div className="flex gap-2 flex-wrap">
            {["all", "course", "certification", "workshop", "bootcamp", "book"].map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg border text-xs capitalize transition ${filter === t ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {browserList.map((r) => resourceCard(r))}
        </div>
        {browserList.length === 0 && <p className="text-gray-500 text-sm">No resources in this category yet.</p>}
      </section>
    </main>
  );
}