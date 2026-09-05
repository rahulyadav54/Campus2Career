import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";
import { toast } from "react-hot-toast";
import {
  Trophy,
  Users,
  Target,
  Calendar,
  Award,
  Plus,
  X,
  Code,
} from "lucide-react";

export default function InnovationChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    theme: "",
    rules: "",
    prize: "",
    teamSize: "",
    deadline: "",
    status: "open",
    tags: "",
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/collaboration/challenges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch challenges");
      const data = await res.json();
      setChallenges(Array.isArray(data) ? data : data.challenges || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/collaboration/challenges/${id}/apply`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Application failed");
      }
      toast.success("Applied successfully!");
      fetchChallenges();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/admin/collaboration/challenges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create challenge");
      }
      toast.success("Challenge created successfully!");
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        theme: "",
        rules: "",
        prize: "",
        teamSize: "",
        deadline: "",
        status: "open",
        tags: "",
      });
      fetchChallenges();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-red-100 text-red-700";
      case "upcoming":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
          Competitions
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Innovation Challenges
        </h1>
        <p className="text-gray-600 mt-2">
          Showcase your skills, form teams, and compete for exciting prizes.
        </p>
      </header>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Create Challenge"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Challenge
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme
                </label>
                <input
                  type="text"
                  name="theme"
                  value={formData.theme}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, theme: e.target.value }))
                  }
                  placeholder="e.g., Sustainable Tech"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Size
                </label>
                <input
                  type="number"
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, teamSize: e.target.value }))
                  }
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prize
                </label>
                <input
                  type="text"
                  name="prize"
                  value={formData.prize}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, prize: e.target.value }))
                  }
                  placeholder="e.g., INR 50,000 + Internship"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, deadline: e.target.value }))
                  }
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, status: e.target.value }))
                  }
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rules
              </label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, rules: e.target.value }))
                }
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, tags: e.target.value }))
                }
                placeholder="e.g., AI, Hackathon, Sustainability"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-medium px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Challenge
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading challenges...</div>
        </div>
      ) : (
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {challenges.map((challenge) => (
            <article
              key={challenge._id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Trophy className="text-yellow-600 w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">
                      {challenge.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{challenge.theme}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(
                    challenge.status
                  )}`}
                >
                  {challenge.status}
                </span>
              </div>

              <p className="text-gray-700 mt-4 text-sm line-clamp-2">
                {challenge.description}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  Team size: {challenge.teamSize}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  Deadline: {new Date(challenge.deadline).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-gray-400" />
                  {challenge.prize}
                </div>
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-gray-400" />
                  {challenge.applications?.length || 0} teams
                </div>
              </div>

              {challenge.rules && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {challenge.rules}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {(challenge.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleApply(challenge._id)}
                disabled={challenge.status === "closed"}
                className="mt-5 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {challenge.status === "closed"
                  ? "Challenge Closed"
                  : "Register Team"}
              </button>
            </article>
          ))}
        </section>
      )}

      {!challenges.length && !loading && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No challenges yet
          </h3>
          <p className="text-gray-500">
            Innovation challenges will appear here once published.
          </p>
        </div>
      )}
    </div>
  );
}
