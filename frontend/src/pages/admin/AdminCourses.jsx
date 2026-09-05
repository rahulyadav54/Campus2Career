import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, Globe, Award } from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

const levelLabel = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    provider: "",
    platform: "",
    skills: "",
    duration: "",
    level: "beginner",
    certificateAvailable: true,
    externalUrl: "",
    thumbnail: "",
    rating: 0,
    isFree: true,
    status: "published"
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/courses");
      setCourses(res.data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        rating: Number(formData.rating)
      };

      if (editingItem) {
        await apiClient.put(`/api/courses/${editingItem._id}`, payload);
        toast.success("Course updated successfully");
      } else {
        await apiClient.post("/api/courses", payload);
        toast.success("Course created successfully");
      }
      setShowForm(false);
      setEditingItem(null);
      resetForm();
      fetchCourses();
    } catch (err) {
      toast.error(err.message || "Failed to save course");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      provider: item.provider || "",
      platform: item.platform || "",
      skills: Array.isArray(item.skills) ? item.skills.join(", ") : "",
      duration: item.duration || "",
      level: item.level || "beginner",
      certificateAvailable: item.certificateAvailable ?? true,
      externalUrl: item.externalUrl || "",
      thumbnail: item.thumbnail || "",
      rating: item.rating || 0,
      isFree: item.isFree ?? true,
      status: item.status || "published"
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await apiClient.delete(`/api/courses/${id}`);
      toast.success("Course deleted successfully");
      fetchCourses();
    } catch (err) {
      toast.error(err.message || "Failed to delete course");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      provider: "",
      platform: "",
      skills: "",
      duration: "",
      level: "beginner",
      certificateAvailable: true,
      externalUrl: "",
      thumbnail: "",
      rating: 0,
      isFree: true,
      status: "published"
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Admin</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Course Management</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Create and manage courses for the learning hub.</p>
      </header>

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
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
      >
        {showForm && !editingItem ? <Trash2 size={16} /> : <Plus size={16} />}
        {showForm && !editingItem ? "Cancel" : editingItem ? "Edit Course" : "Add Course"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Introduction to Data Science" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <input required value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Coursera" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <input required value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Coursera" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} placeholder="Course description" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">External URL</label>
              <input required value={formData.externalUrl} onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://www.coursera.org/learn/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="4 weeks" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
              <input value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Python, Data Analysis, SQL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={formData.certificateAvailable} onChange={(e) => setFormData({ ...formData, certificateAvailable: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                Certificate Available
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={formData.isFree} onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                Free
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base">
              {editingItem ? "Update" : "Create"} Course
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading courses…
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {courses.map((course) => (
            <div key={course._id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex gap-2 sm:gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <BookOpen className="text-indigo-600 w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">{course.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">{course.provider} · {course.platform} · {levelLabel[course.level] || course.level}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">{course.description}</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {(course.skills || []).slice(0, 5).map((s) => (
                        <span key={s} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-50 text-indigo-700 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(course)} className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Pencil size={14} className="sm:hidden" />
                    <Pencil size={16} className="hidden sm:block" />
                  </button>
                  <button onClick={() => handleDelete(course._id)} className="p-1.5 sm:p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} className="sm:hidden" />
                    <Trash2 size={16} className="hidden sm:block" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="capitalize">{course.status}</span>
                {course.certificateAvailable && <span className="flex items-center gap-1 text-indigo-600"><Award size={12} /> Certificate</span>}
                <a href={course.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700">
                  <Globe size={12} /> External Link
                </a>
              </div>
            </div>
          ))}
          {!courses.length && <p className="text-gray-500 text-sm">No courses added yet.</p>}
        </div>
      )}
    </div>
  );
}
