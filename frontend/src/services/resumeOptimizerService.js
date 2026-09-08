import { apiClient } from "./apiClient";
import { API_URL } from "../config/api";

const BASE = "/api/resume-optimizer";

export const resumeOptimizerService = {
  getDashboard: () => apiClient.get(`${BASE}/dashboard`),
  listTemplates: () => apiClient.get(`${BASE}/templates`),
  listResumes: () => apiClient.get(BASE),
  getResume: (id) => apiClient.get(`${BASE}/${id}`),
  createResume: (data) => apiClient.post(BASE, data),
  updateResume: (id, data) => apiClient.put(`${BASE}/${id}`, data),
  deleteResume: (id) => apiClient.delete(`${BASE}/${id}`),
  duplicateResume: (id) => apiClient.post(`${BASE}/${id}/duplicate`),
  analyze: (id, data) => apiClient.post(`${BASE}/${id}/analyze`, data),
  improveSection: (id, data) => apiClient.post(`${BASE}/${id}/improve`, data),
  tailor: (id, data) => apiClient.post(`${BASE}/${id}/tailor`, data),
  applyChanges: (id, changes) => apiClient.post(`${BASE}/${id}/apply-changes`, { changes }),
  aiGenerate: (data) => apiClient.post(`${BASE}/ai-generate`, data),
  getJobMatches: (resumeId) => apiClient.get(`${BASE}/jobs/match${resumeId ? `?resumeId=${resumeId}` : ""}`),
  getCompanies: (targetRole) => apiClient.get(`${BASE}/companies${targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : ""}`),
  getSkillGaps: (targetRole) => apiClient.get(`${BASE}/skill-gaps${targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : ""}`),
  getInterviewContext: (id) => apiClient.get(`${BASE}/${id}/interview-context`),
  exportHtmlUrl: (id) => `${API_URL}${BASE}/${id}/export/html`,

  uploadResume: async (file, { title, templateId, targetRole } = {}) => {
    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("resume", file);
    if (title) form.append("title", title);
    if (templateId) form.append("templateId", templateId);
    if (targetRole) form.append("targetRole", targetRole);

    const res = await fetch(`${API_URL}${BASE}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload failed");
    return data;
  },
};

export default resumeOptimizerService;
