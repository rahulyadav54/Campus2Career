/**
 * Resume Center — Career Readiness Dashboard
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText, Upload, Sparkles, Target, Briefcase, Building2,
  Mic, TrendingUp, Plus, ArrowRight, BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import { resumeOptimizerService } from "../../../services/resumeOptimizerService";
import { AIPageHeader, AIContentCard, AIReadinessBadge } from "../../../components/ai/AIStudentUI";
import { LoadingSkeleton, StatCard } from "../../../components/ui";

export default function ResumeCenter() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [dash, list] = await Promise.all([
        resumeOptimizerService.getDashboard(),
        resumeOptimizerService.listResumes(),
      ]);
      setDashboard(dash.dashboard);
      setResumes(list.resumes || []);
    } catch (err) {
      toast.error(err.message || "Failed to load Resume Center");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await resumeOptimizerService.createResume({ title: "My Resume", fromProfile: true });
      navigate(`/student/resume-center/builder/${res.resume._id}`);
    } catch (err) {
      toast.error(err.message || "Failed to create resume");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await resumeOptimizerService.uploadResume(file);
      toast.success(res.message || "Resume imported");
      navigate(`/student/resume-center/builder/${res.resume._id}`);
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <LoadingSkeleton lines={3} />
      </div>
    );
  }

  const scores = dashboard?.scores || {};
  const readiness = dashboard?.careerReadiness || 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <AIPageHeader
        title="AI Resume & Career Optimizer"
        subtitle="Your AI career copilot — build, analyze, match jobs, and prepare for interviews."
        badge="Career Copilot"
      />

      {/* Career Readiness */}
      <AIContentCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Career Readiness</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-indigo-700">{readiness}</span>
              <span className="text-gray-500">/ 100</span>
            </div>
          </div>
          <AIReadinessBadge score={readiness} label="Overall readiness" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          {[
            { label: "Resume Health", value: scores.resumeHealth, icon: FileText },
            { label: "ATS Compatibility", value: scores.atsCompatibility, icon: BarChart3 },
            { label: "Skill Match", value: scores.skillMatch, icon: Target },
            { label: "Projects", value: scores.projects, icon: Sparkles },
            { label: "Interview Ready", value: scores.interviewReadiness, icon: Mic },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
              <Icon className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900">{value ?? "—"}</p>
            </div>
          ))}
        </div>
      </AIContentCard>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Build Resume", desc: "Create from profile or scratch", icon: Plus, action: handleCreate, primary: true },
          { label: "Upload Resume", desc: "PDF or DOCX import", icon: Upload, input: true },
          { label: "Analyze ATS", desc: "Check compatibility", icon: BarChart3, to: dashboard?.defaultResumeId ? `/student/resume-center/builder/${dashboard.defaultResumeId}?tab=ats` : null },
          { label: "Match Jobs", desc: "Find relevant openings", icon: Briefcase, to: "/student/resume-center/jobs" },
          { label: "Explore Companies", desc: "Target employers", icon: Building2, to: "/student/resume-center/companies" },
          { label: "Practice Interview", desc: "Job-specific prep", icon: Mic, to: "/student/virtual-interview" },
          { label: "Skill Gaps", desc: "Learning path", icon: TrendingUp, to: "/student/resume-center/skills" },
        ].map((item) => (
          <div key={item.label} className="relative">
            {item.input ? (
              <label className="block cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
                <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} disabled={uploading} />
                <item.icon className="w-5 h-5 text-indigo-600 mb-2" />
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{uploading ? "Uploading…" : item.desc}</p>
              </label>
            ) : item.to ? (
              <Link to={item.to} className="block rounded-2xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
                <item.icon className="w-5 h-5 text-indigo-600 mb-2" />
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </Link>
            ) : (
              <button type="button" onClick={item.action} className={`w-full text-left rounded-2xl border p-4 transition-all ${item.primary ? "border-indigo-300 bg-indigo-50 hover:bg-indigo-100" : "border-gray-200 bg-white hover:border-indigo-300"}`}>
                <item.icon className="w-5 h-5 text-indigo-600 mb-2" />
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Resume versions */}
      <AIContentCard title="Your Resumes">
        {resumes.length === 0 ? (
          <p className="text-gray-500 text-sm">No resumes yet. Build one or upload an existing resume to get started.</p>
        ) : (
          <div className="space-y-2">
            {resumes.map((r) => (
              <Link
                key={r._id}
                to={`/student/resume-center/builder/${r._id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-500">
                    {r.targetRole || "No target role"} · ATS: {r.atsScore ?? "—"}/100
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))}
          </div>
        )}
      </AIContentCard>

      {dashboard?.skillGaps?.length > 0 && (
        <AIContentCard title="Skills to Strengthen">
          <div className="flex flex-wrap gap-2">
            {dashboard.skillGaps.map((s) => (
              <span key={s} className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {s}
              </span>
            ))}
          </div>
        </AIContentCard>
      )}
    </div>
  );
}
