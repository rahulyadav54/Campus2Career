import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";
import { toast } from "react-hot-toast";
import {
  Presentation,
  Users,
  Calendar,
  MapPin,
  Clock,
  Plus,
  X,
} from "lucide-react";

export default function Workshops() {
  const [activeTab, setActiveTab] = useState("workshops");
  const [workshops, setWorkshops] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (activeTab === "workshops") {
        const res = await fetch(`${API_URL}/api/collaboration/workshops`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch workshops");
        const data = await res.json();
        setWorkshops(Array.isArray(data) ? data : data.workshops || []);
      } else {
        const res = await fetch(`${API_URL}/api/collaboration/guest-lectures`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch guest lectures");
        const data = await res.json();
        setLectures(Array.isArray(data) ? data : data.lectures || []);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        activeTab === "workshops"
          ? `${API_URL}/api/collaboration/workshops/${id}/register`
          : `${API_URL}/api/collaboration/guest-lectures/${id}/register`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }
      toast.success("Registered successfully!");
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        activeTab === "workshops"
          ? `${API_URL}/api/admin/collaboration/workshops`
          : `${API_URL}/api/admin/collaboration/guest-lectures`;
      const res = await fetch(endpoint, {
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
        throw new Error(data.message || "Failed to create");
      }
      toast.success(
        `${activeTab === "workshops" ? "Workshop" : "Guest lecture"} created successfully!`
      );
      setShowForm(false);
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
      });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const items = activeTab === "workshops" ? workshops : lectures;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
          Learning & Development
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Workshops & Guest Lectures
        </h1>
        <p className="text-gray-600 mt-2">
          Enhance your skills through expert-led sessions and hands-on workshops.
        </p>
      </header>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("workshops")}
          className={`px-4 py-2 rounded-lg border whitespace-nowrap capitalize font-medium transition-colors ${
            activeTab === "workshops"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Workshops
        </button>
        <button
          onClick={() => setActiveTab("lectures")}
          className={`px-4 py-2 rounded-lg border whitespace-nowrap capitalize font-medium transition-colors ${
            activeTab === "lectures"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Guest Lectures
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Create New"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {activeTab === "workshops" ? "Create Workshop" : "Create Guest Lecture"}
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
                  {activeTab === "workshops" ? "Instructor" : "Speaker"}
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
                placeholder="e.g., Zoom / Auditorium A"
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
                placeholder="e.g., AI, Leadership, Communication"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-medium px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create {activeTab === "workshops" ? "Workshop" : "Guest Lecture"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <article
              key={item._id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Presentation className="text-indigo-600 w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">
                      {item.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.instructor || item.speaker}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded capitalize">
                  {item.mode}
                </span>
              </div>

              <p className="text-gray-700 mt-4 text-sm line-clamp-2">
                {item.description}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  {new Date(item.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  {item.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  {item.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  {item.capacity} seats
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {(item.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleRegister(item._id)}
                className="mt-5 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Register Now
              </button>
            </article>
          ))}
        </section>
      )}

      {!items.length && !loading && (
        <div className="text-center py-12">
          <Presentation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No {activeTab === "workshops" ? "workshops" : "guest lectures"} yet
          </h3>
          <p className="text-gray-500">
            {activeTab === "workshops"
              ? "Workshops will appear here once created."
              : "Guest lectures will appear here once scheduled."}
          </p>
        </div>
      )}
    </div>
  );
}
