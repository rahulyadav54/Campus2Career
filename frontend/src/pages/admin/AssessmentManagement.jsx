import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";
import { toast } from "react-hot-toast";
import { Plus, Search, Filter, FileText, Users, BarChart3, Settings, Download, Play, Pause, Trash2, Edit, Copy, CheckCircle, XCircle, Clock, Award } from "lucide-react";
import apiClient from "../../services/apiClient";

const STATUS_OPTIONS = ["draft", "published", "closed", "archived"];
const STATUS_COLORS = { draft: "bg-gray-100 text-gray-700", published: "bg-green-100 text-green-700", closed: "bg-blue-100 text-blue-700", archived: "bg-red-100 text-red-700" };

export default function AssessmentManagement() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", durationMinutes: 30, passingScore: 60, maxAttempts: 1, status: "draft", job: "" });
  const [stats, setStats] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ defaultDurationMinutes: 30, defaultPassingScore: 60, defaultMaxAttempts: 1, violationThreshold: 3, violationAction: "auto_submit", negativeMarking: false, negativeMarkingValue: 25, randomizationEnabled: true, resultVisibility: "score_only", enableRanking: true, autoShortlistThreshold: 70 });

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const data = await apiClient.get(`/api/assessment-management/?${params}`);
      setAssessments(data.assessments || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const fetchDashboard = async () => {
    try {
      const data = await apiClient.get("/api/assessment-management/dashboard");
      setStats(data.stats);
    } catch (e) { toast.error(e.message); }
  };

  const fetchSettings = async () => {
    try {
      const data = await apiClient.get("/api/assessment-management/settings");
      setSettings(data.settings);
      setSettingsForm({ defaultDurationMinutes: data.settings.defaultDurationMinutes || 30, defaultPassingScore: data.settings.defaultPassingScore || 60, defaultMaxAttempts: data.settings.defaultMaxAttempts || 1, violationThreshold: data.settings.violationThreshold || 3, violationAction: data.settings.violationAction || "auto_submit", negativeMarking: data.settings.negativeMarking || false, negativeMarkingValue: data.settings.negativeMarkingValue || 25, randomizationEnabled: data.settings.randomizationEnabled !== false, resultVisibility: data.settings.resultVisibility || "score_only", enableRanking: data.settings.enableRanking !== false, autoShortlistThreshold: data.settings.autoShortlistThreshold || 70 });
    } catch (e) { toast.error(e.message); }
  };

  useEffect(() => { fetchDashboard(); fetchSettings(); fetchAssessments(); }, []);

  useEffect(() => { fetchAssessments(); }, [search, statusFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiClient.put(`/api/assessment-management/${editing._id}`, formData);
        toast.success("Assessment updated");
      } else {
        await apiClient.post("/api/assessment-management/", formData);
        toast.success("Assessment created");
      }
      setShowForm(false); setEditing(null); setFormData({ name: "", description: "", durationMinutes: 30, passingScore: 60, maxAttempts: 1, status: "draft", job: "" }); fetchAssessments(); fetchDashboard();
    } catch (e) { toast.error(e.message); }
  };

  const handlePublish = async (id) => {
    try { await apiClient.post(`/api/assessment-management/${id}/publish`); toast.success("Published"); fetchAssessments(); fetchDashboard(); } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Archive this assessment?")) return;
    try { await apiClient.delete(`/api/assessment-management/${id}`); toast.success("Archived"); fetchAssessments(); fetchDashboard(); } catch (e) { toast.error(e.message); }
  };

  const handleDuplicate = async (id) => {
    try { const data = await apiClient.post(`/api/assessment-management/${id}/duplicate`); toast.success("Duplicated"); fetchAssessments(); } catch (e) { toast.error(e.message); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try { await apiClient.put("/api/assessment-management/settings", settingsForm); toast.success("Settings saved"); fetchSettings(); } catch (e) { toast.error(e.message); }
  };

  const downloadTemplate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/assessment-management/template/download`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to download template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "assessment_questions_template.csv"; a.click(); URL.revokeObjectURL(url);
    } catch (e) { toast.error(e.message); }
  };

  const getHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });

  if (selectedAssessment) {
    return (
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedAssessment(null); setCandidates([]); setResults([]); }} className="text-sm text-indigo-600 hover:underline">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedAssessment.name}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedAssessment.status] || "bg-gray-100"}`}>{selectedAssessment.status}</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-5 space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
            <p className="text-lg font-semibold">{selectedAssessment.durationMinutes} min</p>
          </div>
          <div className="bg-white border rounded-xl p-5 space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Passing Score</p>
            <p className="text-lg font-semibold">{selectedAssessment.passingScore}%</p>
          </div>
          <div className="bg-white border rounded-xl p-5 space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Max Attempts</p>
            <p className="text-lg font-semibold">{selectedAssessment.maxAttempts}</p>
          </div>
        </div>
        {selectedAssessment.description && <p className="text-gray-600 text-sm">{selectedAssessment.description}</p>}
        <div className="flex flex-wrap gap-3">
          <button onClick={async () => { const data = await apiClient.get(`/api/assessment-management/${selectedAssessment._id}/candidates`); setCandidates(data.candidates || []); }} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm"><Users size={16} /> Candidates</button>
          <button onClick={async () => { const data = await apiClient.get(`/api/assessment-management/${selectedAssessment._id}/results`); setResults(data.results || []); }} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm"><BarChart3 size={16} /> Results</button>
          <button onClick={async () => { const data = await apiClient.get(`/api/assessment-management/${selectedAssessment._id}/stats`); toast.success(`Avg: ${data.stats.averageScore}%, Pass rate: ${data.stats.passRate}%`); }} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm"><Award size={16} /> Stats</button>
        </div>
        {candidates.length > 0 && (
          <section className="bg-white border rounded-xl overflow-hidden">
            <h2 className="font-semibold p-4 border-b">Candidates ({candidates.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Status</th><th className="text-left p-3">Attempts</th></tr></thead>
                <tbody>{candidates.map((c) => (<tr key={c._id} className="border-t"><td className="p-3">{c.candidate?.name || "—"}</td><td className="p-3">{c.candidate?.email || "—"}</td><td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-gray-100">{c.status}</span></td><td className="p-3">{c.attemptsCount}</td></tr>))}</tbody>
              </table>
            </div>
          </section>
        )}
        {results.length > 0 && (
          <section className="bg-white border rounded-xl overflow-hidden">
            <h2 className="font-semibold p-4 border-b">Results ({results.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="text-left p-3">Candidate</th><th className="text-left p-3">Status</th><th className="text-left p-3">Score</th><th className="text-left p-3">Time</th><th className="text-left p-3">Submitted</th></tr></thead>
                <tbody>{results.map((r) => (<tr key={r.candidateId} className="border-t"><td className="p-3">{r.candidateName}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${r.attempt?.passed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span></td><td className="p-3">{r.attempt?.percentage ?? "—"}%</td><td className="p-3">{r.attempt?.timeTakenSeconds ? `${Math.floor(r.attempt.timeTakenSeconds / 60)}m` : "—"}</td><td className="p-3">{r.attempt?.submittedAt ? new Date(r.attempt.submittedAt).toLocaleDateString() : "—"}</td></tr>))}</tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Recruitment</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Assessment Management</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={downloadTemplate} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"><Download size={16} /> Template</button>
          <button onClick={() => setShowSettings(true)} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"><Settings size={16} /> Settings</button>
          <button onClick={() => { setEditing(null); setFormData({ name: "", description: "", durationMinutes: 30, passingScore: 60, maxAttempts: 1, status: "draft", job: "" }); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"><Plus size={16} /> Create Assessment</button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-xl p-5 space-y-1"><p className="text-xs text-gray-500 uppercase tracking-wide">Total</p><p className="text-2xl font-bold">{stats.total}</p></div>
          <div className="bg-white border rounded-xl p-5 space-y-1"><p className="text-xs text-gray-500 uppercase tracking-wide">Active</p><p className="text-2xl font-bold text-green-600">{stats.active}</p></div>
          <div className="bg-white border rounded-xl p-5 space-y-1"><p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p><p className="text-2xl font-bold text-blue-600">{stats.completed}</p></div>
          <div className="bg-white border rounded-xl p-5 space-y-1"><p className="text-xs text-gray-500 uppercase tracking-wide">Avg Score</p><p className="text-2xl font-bold text-indigo-600">{stats.averageScore}%</p></div>
        </div>
      )}

      <div className="bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-gray-400" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assessments..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg text-sm">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>

      {loading ? <p className="text-gray-500">Loading assessments…</p> : assessments.length === 0 ? <p className="text-gray-500">No assessments found.</p> : (
        <div className="grid gap-4">
          {assessments.map((a) => (
            <div key={a._id} className="bg-white border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{a.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || "bg-gray-100"}`}>{a.status}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{a.description || "No description"}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                  <span>{a.durationMinutes} min</span>
                  <span>Pass: {a.passingScore}%</span>
                  <span>Max attempts: {a.maxAttempts}</span>
                  <span>Candidates: {a.candidateCount || 0}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setSelectedAssessment(a); setCandidates([]); setResults([]); }} className="p-2 border rounded-lg hover:bg-gray-50" title="View details"><BarChart3 size={16} /></button>
                <button onClick={() => { setEditing(a); setFormData({ name: a.name, description: a.description || "", durationMinutes: a.durationMinutes, passingScore: a.passingScore, maxAttempts: a.maxAttempts, status: a.status, job: a.job?._id || "" }); setShowForm(true); }} className="p-2 border rounded-lg hover:bg-gray-50" title="Edit"><Edit size={16} /></button>
                {a.status === "draft" && <button onClick={() => handlePublish(a._id)} className="p-2 border rounded-lg hover:bg-gray-50" title="Publish"><Play size={16} /></button>}
                {a.status === "published" && <button onClick={() => handlePublish(a._id)} className="p-2 border rounded-lg hover:bg-gray-50" title="Close"><Pause size={16} /></button>}
                <button onClick={() => handleDuplicate(a._id)} className="p-2 border rounded-lg hover:bg-gray-50" title="Duplicate"><Copy size={16} /></button>
                <button onClick={() => handleDelete(a._id)} className="p-2 border rounded-lg hover:bg-red-50 text-red-600" title="Archive"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-xl font-semibold">{editing ? "Edit Assessment" : "Create Assessment"}</h2>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label><input type="number" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })} required min={1} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label><input type="number" value={formData.passingScore} onChange={(e) => setFormData({ ...formData, passingScore: Number(e.target.value) })} required min={0} max={100} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label><input type="number" value={formData.maxAttempts} onChange={(e) => setFormData({ ...formData, maxAttempts: Number(e.target.value) })} required min={1} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">{STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}</select></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">{editing ? "Update" : "Create"}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2 border rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-xl font-semibold">Assessment Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Default Duration (min)</label><input type="number" value={settingsForm.defaultDurationMinutes} onChange={(e) => setSettingsForm({ ...settingsForm, defaultDurationMinutes: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Default Passing Score (%)</label><input type="number" value={settingsForm.defaultPassingScore} onChange={(e) => setSettingsForm({ ...settingsForm, defaultPassingScore: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Violation Threshold</label><input type="number" value={settingsForm.violationThreshold} onChange={(e) => setSettingsForm({ ...settingsForm, violationThreshold: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Violation Action</label><select value={settingsForm.violationAction} onChange={(e) => setSettingsForm({ ...settingsForm, violationAction: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="warn">Warn</option><option value="auto_submit">Auto Submit</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Negative Marking Value (%)</label><input type="number" value={settingsForm.negativeMarkingValue} onChange={(e) => setSettingsForm({ ...settingsForm, negativeMarkingValue: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Auto Shortlist Threshold (%)</label><input type="number" value={settingsForm.autoShortlistThreshold} onChange={(e) => setSettingsForm({ ...settingsForm, autoShortlistThreshold: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            </div>
            <div className="flex items-center gap-2"><input type="checkbox" id="negMark" checked={settingsForm.negativeMarking} onChange={(e) => setSettingsForm({ ...settingsForm, negativeMarking: e.target.checked })} /><label htmlFor="negMark" className="text-sm text-gray-700">Enable negative marking</label></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="rand" checked={settingsForm.randomizationEnabled} onChange={(e) => setSettingsForm({ ...settingsForm, randomizationEnabled: e.target.checked })} /><label htmlFor="rand" className="text-sm text-gray-700">Randomize questions</label></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="rank" checked={settingsForm.enableRanking} onChange={(e) => setSettingsForm({ ...settingsForm, enableRanking: e.target.checked })} /><label htmlFor="rank" className="text-sm text-gray-700">Enable ranking</label></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Save Settings</button>
              <button type="button" onClick={() => setShowSettings(false)} className="px-5 py-2 border rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
