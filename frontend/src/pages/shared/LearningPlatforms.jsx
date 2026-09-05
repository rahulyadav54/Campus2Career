import { useEffect, useState } from "react";
import { Globe, ExternalLink, CheckCircle2, Clock, AlertCircle, BookOpen, Filter } from "lucide-react";
import apiClient from "../../services/apiClient";

const statusConfig = {
  connected: { label: "Connected", className: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700", Icon: Clock },
  disconnected: { label: "Disconnected", className: "bg-red-100 text-red-700", Icon: AlertCircle }
};

const typeLabel = { mooc: "MOOC", certification: "Certification", institutional: "Institutional", government: "Government" };

export default function LearningPlatforms() {
  const [platforms, setPlatforms] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    apiClient.get("/api/learning-platforms")
      .then((res) => setPlatforms(res.data.data || []))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <main className="max-w-6xl mx-auto p-6 text-red-600">{error}</main>;
  if (!platforms.length) return <main className="max-w-6xl mx-auto p-6 text-gray-500">Loading learning platforms…</main>;

  const filtered = filter === "all" ? platforms : platforms.filter((p) => p.type === filter);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Integrations</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Learning Platform Integrations</h1>
        <p className="text-gray-600 mt-2">External providers connected to Campus2Career for courses, certifications, and learning paths.</p>
      </header>

      <div className="flex gap-2 flex-wrap">
        {["all", ...Object.keys(typeLabel)].map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg border text-xs capitalize transition ${filter === t ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            {t === "all" ? "All" : typeLabel[t] || t}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const status = statusConfig[p.integrationStatus] || statusConfig.pending;
          const Icon = status.Icon;
          const TypeIcon = p.type === "certification" ? BookOpen : Globe;
          return (
            <div key={p._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TypeIcon className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.provider}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${status.className}`}>
                  <Icon size={12} /> {status.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-3">{p.description}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {(p.supportedSkills || []).slice(0, 6).map((s) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded">{s}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="capitalize">{typeLabel[p.type] || p.type}</span>
                {p.website && (
                  <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700">
                    Visit <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="text-gray-500 text-sm">No platforms in this category yet.</p>}
    </main>
  );
}
