import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Globe, BookOpen, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

const statusConfig = {
  connected: { label: "Connected", className: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700", Icon: Clock },
  disconnected: { label: "Disconnected", className: "bg-red-100 text-red-700", Icon: AlertCircle }
};

const typeLabel = { mooc: "MOOC", certification: "Certification", institutional: "Institutional", government: "Government" };

export default function AdminLearningPlatforms() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    type: "mooc",
    description: "",
    website: "",
    apiEndpoint: "",
    apiKey: "",
    isActive: true,
    supportedSkills: "",
    logoUrl: "",
    integrationStatus: "pending"
  });

  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/learning-platforms");
      setPlatforms(res.data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load learning platforms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        supportedSkills: formData.supportedSkills.split(",").map(s => s.trim()).filter(Boolean)
      };

      if (editingItem) {
        await apiClient.put(`/api/learning-platforms/${editingItem._id}`, payload);
        toast.success("Platform updated successfully");
      } else {
        await apiClient.post("/api/learning-platforms", payload);
        toast.success("Platform created successfully");
      }
      setShowForm(false);
      setEditingItem(null);
      resetForm();
      fetchPlatforms();
    } catch (err) {
      toast.error(err.message || "Failed to save platform");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      provider: item.provider || "",
      type: item.type || "mooc",
      description: item.description || "",
      website: item.website || "",
      apiEndpoint: item.apiEndpoint || "",
      apiKey: item.apiKey || "",
      isActive: item.isActive ?? true,
      supportedSkills: Array.isArray(item.supportedSkills) ? item.supportedSkills.join(", ") : "",
      logoUrl: item.logoUrl || "",
      integrationStatus: item.integrationStatus || "pending"
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this platform?")) return;
    try {
      await apiClient.delete(`/api/learning-platforms/${id}`);
      toast.success("Platform deleted successfully");
      fetchPlatforms();
    } catch (err) {
      toast.error(err.message || "Failed to delete platform");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      provider: "",
      type: "mooc",
      description: "",
      website: "",
      apiEndpoint: "",
      apiKey: "",
      isActive: true,
      supportedSkills: "",
      logoUrl: "",
      integrationStatus: "pending"
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Admin</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Learning Platform Integrations</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage external learning providers connected to Campus2Career.</p>
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
        {showForm && !editingItem ? "Cancel" : editingItem ? "Edit Platform" : "Add Platform"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Coursera for Campus" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <input required value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Coursera" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="mooc">MOOC</option>
                <option value="certification">Certification</option>
                <option value="institutional">Institutional</option>
                <option value="government">Government</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Integration Status</label>
              <select value={formData.integrationStatus} onChange={(e) => setFormData({ ...formData, integrationStatus: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="connected">Connected</option>
                <option value="pending">Pending</option>
                <option value="disconnected">Disconnected</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} placeholder="Brief description of the platform" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://www.coursera.org" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input value={formData.logoUrl} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://example.com/logo.png" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
              <input value={formData.apiEndpoint} onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://api.example.com/v1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Optional API key" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Supported Skills (comma separated)</label>
              <input value={formData.supportedSkills} onChange={(e) => setFormData({ ...formData, supportedSkills: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Python, Machine Learning, Data Analysis" />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input id="isActive" type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base">
              {editingItem ? "Update" : "Create"} Platform
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
          Loading platforms…
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {platforms.map((platform) => {
            const status = statusConfig[platform.integrationStatus] || statusConfig.pending;
            const StatusIcon = status.Icon;
            const TypeIcon = platform.type === "certification" ? BookOpen : Globe;
            return (
              <div key={platform._id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <TypeIcon className="text-indigo-600 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">{platform.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{platform.provider} · {typeLabel[platform.type] || platform.type}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">{platform.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(platform.supportedSkills || []).slice(0, 6).map((s) => (
                          <span key={s} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-50 text-indigo-700 rounded">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium ${status.className}`}>
                      <StatusIcon size={12} /> {status.label}
                    </span>
                    <button onClick={() => handleEdit(platform)} className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      <Pencil size={14} className="sm:hidden" />
                      <Pencil size={16} className="hidden sm:block" />
                    </button>
                    <button onClick={() => handleDelete(platform._id)} className="p-1.5 sm:p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} className="sm:hidden" />
                      <Trash2 size={16} className="hidden sm:block" />
                    </button>
                  </div>
                </div>
                {platform.website && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <a href={platform.website} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                      <Globe size={12} /> {platform.website}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
          {!platforms.length && <p className="text-gray-500 text-sm">No learning platforms added yet.</p>}
        </div>
      )}
    </div>
  );
}
