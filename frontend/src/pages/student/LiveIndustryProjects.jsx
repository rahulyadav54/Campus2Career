import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";
import { toast } from "react-hot-toast";
import {
  Building2,
  Clock,
  DollarSign,
  Code,
  Calendar,
  Plus,
  X,
} from "lucide-react";

export default function LiveIndustryProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company: "",
    industry: "",
    skills: "",
    stipend: "",
    duration: "",
    deadline: "",
    mode: "online",
    capacity: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/collaborations/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
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
        `${API_URL}/api/collaborations/projects/${id}/register`,
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
      fetchProjects();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/collaborations/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create project");
      }
      toast.success("Project created successfully!");
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        company: "",
        industry: "",
        skills: "",
        stipend: "",
        duration: "",
        deadline: "",
        mode: "online",
        capacity: "",
      });
      fetchProjects();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
          Industry Engagement
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
          Live Industry Projects
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Work on real-world projects from leading companies and gain hands-on experience.
        </p>
      </header>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span className="hidden sm:inline">{showForm ? "Cancel" : "Post Project"}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Post New Industry Project
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Title
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
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, company: e.target.value }))
                  }
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, industry: e.target.value }))
                  }
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stipend
                </label>
                <input
                  type="text"
                  name="stipend"
                  value={formData.stipend}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, stipend: e.target.value }))
                  }
                  placeholder="e.g., INR 15,000/month"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, duration: e.target.value }))
                  }
                  placeholder="e.g., 3 months"
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
                  Mode
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, mode: e.target.value }))
                  }
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Skills (comma-separated)
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, skills: e.target.value }))
                }
                placeholder="e.g., React, Python, Data Analysis"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, capacity: e.target.value }))
                }
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-medium px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Post Project
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading projects...</div>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {projects.map((project) => (
            <article
              key={project._id}
              className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Building2 className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base sm:text-lg text-gray-900">
                      {project.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {project.company}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                  {project.mode}
                </span>
              </div>

              <p className="text-gray-700 mt-3 sm:mt-4 text-xs sm:text-sm line-clamp-2">
                {project.description}
              </p>

              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Building2 size={12} className="text-gray-400" />
                  {project.industry}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={12} className="text-gray-400" />
                  {project.stipend}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-gray-400" />
                  {project.duration}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-gray-400" />
                  Due: {new Date(project.deadline).toLocaleDateString()}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                {(project.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 text-blue-700 rounded flex items-center gap-1"
                  >
                    <Code size={10} />
                    {skill}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleApply(project._id)}
                className="mt-3 sm:mt-5 w-full px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm sm:text-base"
              >
                Apply Now
              </button>
            </article>
          ))}
        </section>
      )}

      {!projects.length && !loading && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No projects yet
          </h3>
          <p className="text-gray-500">
            Live industry projects will appear here once posted.
          </p>
        </div>
      )}
    </div>
  );
}
