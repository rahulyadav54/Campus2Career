import { API_URL } from "../../config/api";
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Brain,
  Clock,
  Award,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Filter,
  BarChart3,
} from "lucide-react";

const CATEGORIES = ["All", "Quantitative", "Logical", "Verbal", "Technical", "Reasoning"];
const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

const difficultyStyles = {
  Easy: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-red-50 text-red-700 border-red-200",
};

const statusStyles = {
  "not-attempted": "bg-slate-50 text-slate-600 border-slate-200",
  "in-progress": "bg-indigo-50 text-indigo-700 border-indigo-200",
  passed: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

function StatusBadge({ status }) {
  const label = status === "not-attempted" ? "Not Attempted" : status === "in-progress" ? "In Progress" : status === "passed" ? "Passed" : status === "failed" ? "Failed" : status;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles[status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {label}
    </span>
  );
}

export default function AptitudeTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const fetchTests = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/api/aptitude/tests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load aptitude tests");
        const data = await res.json();
        setTests(Array.isArray(data) ? data : data.tests || []);
      } catch (err) {
        toast.error(err.message || "Could not load aptitude tests");
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const filtered = useMemo(() => {
    return tests.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (difficulty !== "All" && t.difficulty !== difficulty) return false;
      if (statusFilter !== "All" && t.status !== statusFilter) return false;
      if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tests, category, difficulty, statusFilter, search]);

  const stats = useMemo(() => {
    return {
      total: tests.length,
      passed: tests.filter((t) => t.status === "passed").length,
      attempted: tests.filter((t) => t.status === "passed" || t.status === "failed").length,
    };
  }, [tests]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 flex items-center gap-2">
            <Sparkles size={14} /> Aptitude Practice
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 flex items-center gap-2">
            <Brain className="text-indigo-600" /> Aptitude Tests
          </h1>
          <p className="text-gray-600 mt-2">Sharpen your reasoning, quantitative and verbal skills with timed tests.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500">Attempted</p>
            <p className="text-xl font-bold text-indigo-600">{stats.attempted}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500">Passed</p>
            <p className="text-xl font-bold text-green-600">{stats.passed}</p>
          </div>
        </div>
      </header>

      <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 text-gray-700">
          <Filter size={16} />
          <h2 className="font-semibold">Filters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            {DIFFICULTIES.map((d) => (<option key={d}>{d}</option>))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            {["All", "not-attempted", "in-progress", "passed", "failed"].map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Statuses" : s.replace("-", " ")}</option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
          <Loader2 className="animate-spin" /> Loading aptitude tests…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <Brain className="mx-auto text-gray-400" size={36} />
          <p className="text-gray-600 mt-3">No aptitude tests match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((test) => (
            <article key={test._id || test.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 leading-snug">{test.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{test.category} · {test.questionCount || test.questions?.length || 0} questions</p>
                </div>
                <StatusBadge status={test.status || "not-attempted"} />
              </div>

              {test.description && <p className="text-sm text-gray-600 line-clamp-2">{test.description}</p>}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded-full border font-medium ${difficultyStyles[test.difficulty] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {test.difficulty || "Mixed"}
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  <Clock size={12} /> {test.durationMinutes || test.timeLimitMinutes || 30} min
                </span>
                {test.passingScore != null && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Award size={12} /> Pass: {test.passingScore}%
                  </span>
                )}
              </div>

              {test.lastScore != null && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <BarChart3 size={12} /> Last score: <span className="font-semibold text-gray-800">{test.lastScore}%</span>
                </div>
              )}

              <div className="mt-auto flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/student/aptitude/${test._id || test.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                >
                  <PlayCircle size={16} /> {test.status === "in-progress" ? "Resume" : test.status === "passed" || test.status === "failed" ? "Retake" : "Start"}
                </button>
                {test.lastAttemptId && (
                  <Link
                    to={`/student/aptitude/results/${test.lastAttemptId}`}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Result
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}