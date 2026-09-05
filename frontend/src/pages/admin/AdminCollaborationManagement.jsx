import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Edit,
  Users,
  Trophy,
  Building2,
  Presentation,
  X,
} from "lucide-react";

const TYPES = ["workshop", "guest-lecture", "challenge", "project"];

const typeConfig = {
  workshop: { label: "Workshop", icon: Presentation, color: "indigo" },
  "guest-lecture": { label: "Guest Lecture", icon: Presentation, color: "purple" },
  challenge: { label: "Challenge", icon: Trophy, color: "yellow" },
  project: { label: "Project", icon: Building2, color: "blue" },
};

export default function AdminCollaborationManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("workshop");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor: "",
    date: "",
    time: "",
    duration: "",
    mode: "online",
    location: "",
    capacity: "",
    tags: "",
    theme: "",
    rules: "",
    prize: "",
    teamSize: "",
    deadline: "",
    status: "open",
    company: "",
    industry: "",
    skills: "",
    stipend: "",
  });

  useEffect(() => {
    fetchItems();
  }, [activeType]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const endpointMap = {
        workshop: "workshops",
        "guest-lecture": "guest-lectures",
        challenge: "challenges",
        project: "projects",
      };
      const res = await fetch(
        `${API_URL}/api/admin/collaboration/${endpointMap[activeType]}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const token = localStorage.getItem("token");
      const endpointMap = {
        workshop: "workshops",
        "guest-lecture": "guest-lectures",
        challenge: "challenges",
        project: "projects",
      };
      const res = await fetch(
        `${API_URL}/api/admin/collaboration/${endpointMap[activeType]}/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Deleted successfully!");
      fetchItems();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const endpointMap = {
        workshop: "workshops",
        "guest-lecture": "guest-lectures",
        challenge: "challenges",
        project: "projects",
      };
      const payload = { ...formData };
      if (activeType === "workshop" || activeType === "guest-lecture") {
        payload.tags = formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
      if (activeType === "challenge") {
        payload.tags = formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
      if (activeType === "project") {
        payload.skills = formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const res = await fetch(
        `${API_URL}/api/admin/collaboration/${endpointMap[activeType]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create");
      }
      toast.success("Created successfully!");
      setShowForm(false);
      resetForm();
      fetchItems();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const endpointMap = {
        workshop: "workshops",
        "guest-lecture": "guest-lectures",
        challenge: "challenges",
        project: "projects",
      };
      const payload = { ...formData };
      if (activeType === "workshop" || activeType === "guest-lecture") {
        payload.tags = formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
      if (activeType === "challenge") {
        payload.tags = formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
      if (activeType === "project") {
        payload.skills = formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const res = await fetch(
        `${API_URL}/api/admin/collaboration/${endpointMap[activeType]}/${editingItem._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update");
      }
      toast.success("Updated successfully!");
      setShowForm(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      instructor: item.instructor || item.speaker || "",
      date: item.date ? item.date.slice(0, 10) : "",
      time: item.time || "",
      duration: item.duration || "",
      mode: item.mode || "online",
      location: item.location || "",
      capacity: item.capacity || "",
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      theme: item.theme || "",
      rules: item.rules || "",
      prize: item.prize || "",
      teamSize: item.teamSize || "",
      deadline: item.deadline ? item.deadline.slice(0, 10) : "",
      status: item.status || "open",
      company: item.company || "",
      industry: item.industry || "",
      skills: Array.isArray(item.skills) ? item.skills.join(", ") : "",
      stipend: item.stipend || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      instructor: "",
      date: "",
      time: "",
      duration: "",
      mode: "online",
      location: "",
      capacity: "",
      tags: "",
      theme: "",
      rules: "",
      prize: "",
      teamSize: "",
      deadline: "",
      status: "open",
      company: "",
      industry: "",
      skills: "",
      stipend: "",
    });
  };

  const config = typeConfig[activeType];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
          Admin
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Collaboration Management
        </h1>
        <p className="text-gray-600 mt-2">
          Create and manage workshops, guest lectures, innovation challenges, and live industry projects.
        </p>
      </header>

      <div className="flex gap-2">
        {TYPES.map((type) => {
          const Icon = typeConfig[type].icon;
          return (
            <button
              key={type}
              onClick={() => {
                setActiveType(type);
                setShowForm(false);
                setEditingItem(null);
                resetForm();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border whitespace-nowrap capitalize font-medium transition-colors ${
                activeType === type
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              {typeConfig[type].label}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => {
          if (showForm && !editingItem) {
            setShowForm(false);
            resetForm();
          } else {
            setShowForm(!showForm);
            setEditingItem(null);
            resetForm();
          }
        }}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        {showForm && !editingItem ? <X size={16} /> : <Plus size={16} />}
        {showForm && !editingItem
          ? "Cancel"
          : editingItem
          ? "Edit Item"
          : `Create ${typeConfig[activeType].label}`}
      </button>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? "Edit" : "Create"}{" "}
            {typeConfig[activeType].label}
          </h2>
          <form
            onSubmit={editingItem ? handleUpdate : handleCreate}
            className="space-y-4"
          >
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

            {(activeType === "workshop" || activeType === "guest-lecture") && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {activeType === "workshop" ? "Instructor" : "Speaker"}
                    </label>
                    <input
                      type="text"
                      name="instructor"
                      value={formData.instructor}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, instructor: e.target.value }))
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, date: e.target.value }))
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, time: e.target.value }))
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, duration: e.target.value }))
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, location: e.target.value }))
                    }
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
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
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {activeType === "challenge" && (
              <>
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
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {activeType === "project" && (
              <>
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
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, skills: e.target.value }))
                    }
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
              </>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-medium px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {editingItem ? "Update" : "Create"}{" "}
              {typeConfig[activeType].label}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div
                    className={`p-2 bg-${config.color}-50 rounded-lg`}
                  >
                    <config.icon
                      className={`text-${config.color}-600 w-5 h-5`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                      {item.date && (
                        <span>
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      )}
                      {item.deadline && (
                        <span>
                          Deadline:{" "}
                          {new Date(item.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {item.status && (
                        <span className="capitalize">{item.status}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="flex items-center gap-1 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!items.length && !loading && (
        <div className="text-center py-12">
          <config.icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No {typeConfig[activeType].label.toLowerCase()}s yet
          </h3>
          <p className="text-gray-500">
            Create your first{" "}
            {typeConfig[activeType].label.toLowerCase()} to get started.
          </p>
        </div>
      )}
    </div>
  );
}
