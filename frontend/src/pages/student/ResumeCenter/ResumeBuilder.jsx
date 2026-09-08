/**
 * Resume Builder — 3-panel editor (sections | preview | AI assistant)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Save, Download, Copy, GripVertical, Plus, Trash2, Sparkles,
  ChevronUp, ChevronDown, ZoomIn, ZoomOut, Mic, Loader, Check, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { resumeOptimizerService } from "../../../services/resumeOptimizerService";
import ResumePreview from "../../../features/resumeOptimizer/ResumePreview";
import { SECTION_LABELS, TARGET_ROLES, ZOOM_LEVELS, CAMPUS2CAREER_SECTION_ORDER } from "../../../features/resumeOptimizer/constants";

const SECTION_ACTIONS = {
  summary: [
    { id: "improve", label: "Improve with AI" },
    { id: "shorten", label: "Shorten" },
    { id: "professional", label: "Make Professional" },
    { id: "ats", label: "Make ATS-Friendly" },
  ],
  experience: [
    { id: "rewrite", label: "Rewrite" },
    { id: "impact", label: "Make Impact-Focused" },
    { id: "ats", label: "ATS Optimize" },
  ],
  projects: [
    { id: "technical", label: "Add Technical Detail" },
    { id: "impact", label: "Make Impact-Focused" },
    { id: "ats", label: "ATS Optimize" },
  ],
};

function createId() {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function ResumeBuilder() {
  const { resumeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeSection, setActiveSection] = useState("summary");
  const [rightTab, setRightTab] = useState(searchParams.get("tab") === "ats" ? "ats" : "ai");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const saveTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await resumeOptimizerService.getResume(resumeId);
      setResume(res.resume);
      if (res.resume.jobAnalysis?.jobDescription) {
        setJobDescription(res.resume.jobAnalysis.jobDescription);
      }
      if (res.resume.atsScore) {
        setAnalysis({
          atsScore: res.resume.atsScore,
          breakdown: res.resume.atsBreakdown,
          strengths: res.resume.atsStrengths,
          improvements: res.resume.atsImprovements,
          warnings: res.resume.atsWarnings,
          jobMatch: res.resume.jobAnalysis,
        });
      }
    } catch (err) {
      toast.error(err.message || "Failed to load resume");
      navigate("/student/resume-center");
    } finally {
      setLoading(false);
    }
  }, [resumeId, navigate]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (data) => {
    try {
      setSaving(true);
      await resumeOptimizerService.updateResume(resumeId, { content: data.content, title: data.title, targetRole: data.targetRole });
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }, [resumeId]);

  const handleContentChange = (content) => {
    setResume((prev) => {
      const next = { ...prev, content };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(next), 1500);
      return next;
    });
  };

  const moveSection = (index, direction) => {
    const order = [...(resume.content.sectionOrder || [])];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= order.length) return;
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    handleContentChange({ ...resume.content, sectionOrder: order });
  };

  const addExperience = () => {
    const content = { ...resume.content };
    content.experience = [...(content.experience || []), {
      id: createId(), company: "", title: "", location: "", startDate: "", endDate: "", current: false, bullets: [""],
    }];
    handleContentChange(content);
  };

  const addProject = () => {
    const content = { ...resume.content };
    content.projects = [...(content.projects || []), {
      id: createId(), name: "", url: "", techStack: "", technologies: [], bullets: [""],
    }];
    handleContentChange(content);
  };

  const addEducation = () => {
    const content = { ...resume.content };
    content.education = [...(content.education || []), {
      id: createId(), institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", highlights: [],
    }];
    handleContentChange(content);
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      const res = await resumeOptimizerService.analyze(resumeId, { jobDescription });
      setAnalysis(res.analysis);
      toast.success(`Estimated ATS Compatibility: ${res.analysis.atsScore}/100`);
      if (res.analysis.scoreDelta) {
        toast(`Score change: ${res.analysis.scoreDelta > 0 ? "+" : ""}${res.analysis.scoreDelta}`, { icon: "📊" });
      }
    } catch (err) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const runAI = async (action) => {
    try {
      setAiLoading(true);
      let sectionContent = resume.content.summary;
      if (activeSection === "experience" && resume.content.experience?.[0]) {
        sectionContent = resume.content.experience[0].bullets?.join("\n") || "";
      }
      if (activeSection === "projects" && resume.content.projects?.[0]) {
        sectionContent = resume.content.projects[0].bullets?.join("\n") || "";
      }
      const res = await resumeOptimizerService.improveSection(resumeId, {
        sectionType: activeSection,
        sectionContent,
        action,
      });
      setSuggestion(res.suggestion);
    } catch (err) {
      toast.error(err.message || "AI failed");
    } finally {
      setAiLoading(false);
    }
  };

  const acceptSuggestion = () => {
    if (!suggestion?.suggested) return;
    const content = { ...resume.content };
    if (activeSection === "summary") content.summary = suggestion.suggested;
    handleContentChange(content);
    setSuggestion(null);
    toast.success("Change applied — review your resume");
  };

  const handlePrint = () => {
    const url = resumeOptimizerService.exportHtmlUrl(resumeId);
    const w = window.open(url, "_blank");
    if (w) w.onload = () => w.print();
  };

  const startInterview = async () => {
    try {
      const res = await resumeOptimizerService.getInterviewContext(resumeId);
      sessionStorage.setItem("interviewPrepContext", JSON.stringify(res.context));
      navigate("/student/virtual-interview", {
        state: {
          fromResume: true,
          targetRole: res.context.targetRole,
          jobDescription: res.context.jobDescription,
          skillGaps: res.context.skillGaps,
        },
      });
    } catch (err) {
      toast.error(err.message || "Could not prepare interview");
    }
  };

  if (loading || !resume) {
    return <div className="p-8 text-center text-gray-500"><Loader className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  const order = resume.content?.sectionOrder?.length
    ? resume.content.sectionOrder
    : CAMPUS2CAREER_SECTION_ORDER;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Link to="/student/resume-center" className="text-sm text-gray-500 hover:text-indigo-600">← Resume Center</Link>
          <input
            type="text"
            value={resume.title}
            onChange={(e) => setResume({ ...resume, title: e.target.value })}
            onBlur={() => save(resume)}
            className="font-semibold text-gray-900 border-none outline-none bg-transparent"
          />
          {saving && <span className="text-xs text-gray-400">Saving…</span>}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={resume.targetRole || ""}
            onChange={(e) => { setResume({ ...resume, targetRole: e.target.value }); save({ ...resume, targetRole: e.target.value }); }}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1"
          >
            <option value="">Target role</option>
            {TARGET_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="button" onClick={() => save(resume)} className="p-2 rounded-lg border hover:bg-gray-50" title="Save"><Save className="w-4 h-4" /></button>
          <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button type="button" onClick={() => resumeOptimizerService.duplicateResume(resumeId).then(() => toast.success("Duplicated"))} className="p-2 rounded-lg border hover:bg-gray-50" title="Duplicate"><Copy className="w-4 h-4" /></button>
          <button type="button" onClick={startInterview} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">
            <Mic className="w-4 h-4" /> Interview
          </button>
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT — Sections */}
        <aside className="w-full lg:w-56 border-r border-gray-200 bg-gray-50 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Sections</p>
          {order.map((id, i) => (
            <div key={id} className={`flex items-center gap-1 rounded-lg ${activeSection === id ? "bg-indigo-100 border border-indigo-200" : "hover:bg-white"}`}>
              <GripVertical className="w-3 h-3 text-gray-300 ml-1 shrink-0" />
              <button type="button" onClick={() => setActiveSection(id)} className="flex-1 text-left px-2 py-2 text-sm font-medium text-gray-700">
                {SECTION_LABELS[id] || id}
              </button>
              <div className="flex flex-col">
                <button type="button" onClick={() => moveSection(i, -1)} className="p-0.5 text-gray-400 hover:text-gray-600"><ChevronUp className="w-3 h-3" /></button>
                <button type="button" onClick={() => moveSection(i, 1)} className="p-0.5 text-gray-400 hover:text-gray-600"><ChevronDown className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          <div className="pt-2 space-y-1 border-t border-gray-200 mt-2">
            <button type="button" onClick={addExperience} className="w-full flex items-center gap-1 px-2 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg"><Plus className="w-3 h-3" /> Experience</button>
            <button type="button" onClick={addProject} className="w-full flex items-center gap-1 px-2 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg"><Plus className="w-3 h-3" /> Project</button>
            <button type="button" onClick={addEducation} className="w-full flex items-center gap-1 px-2 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg"><Plus className="w-3 h-3" /> Education</button>
          </div>
        </aside>

        {/* CENTER — Preview */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          <div className="flex items-center justify-center gap-2 py-2 bg-white border-b border-gray-100">
            {ZOOM_LEVELS.map((z) => (
              <button key={z} type="button" onClick={() => setZoom(z)} className={`px-2 py-0.5 text-xs rounded ${zoom === z ? "bg-indigo-100 text-indigo-700" : "text-gray-500"}`}>{z}%</button>
            ))}
          </div>
          <ResumePreview
            content={resume.content}
            templateId={resume.templateId}
            zoom={zoom}
            onChange={handleContentChange}
            editMode
          />
        </main>

        {/* RIGHT — AI / ATS */}
        <aside className="w-full lg:w-80 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="flex border-b border-gray-200">
            {["ai", "ats"].map((tab) => (
              <button key={tab} type="button" onClick={() => setRightTab(tab)} className={`flex-1 py-2.5 text-sm font-medium ${rightTab === tab ? "text-indigo-700 border-b-2 border-indigo-600" : "text-gray-500"}`}>
                {tab === "ai" ? "AI Assistant" : "ATS Analyzer"}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {rightTab === "ai" && (
              <>
                <p className="text-xs text-gray-500">Section: <strong>{SECTION_LABELS[activeSection]}</strong></p>
                {(SECTION_ACTIONS[activeSection] || SECTION_ACTIONS.summary).map((a) => (
                  <button key={a.id} type="button" disabled={aiLoading} onClick={() => runAI(a.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50">
                    <Sparkles className="w-4 h-4 text-indigo-500" /> {a.label}
                  </button>
                ))}
                {suggestion && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 space-y-2 text-sm">
                    <p className="font-semibold text-indigo-900">AI Suggestion</p>
                    <p className="text-gray-500 text-xs">Original:</p>
                    <p className="text-gray-700 text-xs line-clamp-3">{suggestion.original}</p>
                    <p className="text-gray-500 text-xs">Suggested:</p>
                    <p className="text-gray-900">{suggestion.suggested}</p>
                    {suggestion.changes?.map((c, i) => <p key={i} className="text-xs text-gray-600">• {c}</p>)}
                    <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">{suggestion.truthCheck}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={acceptSuggestion} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-indigo-600 text-white text-xs"><Check className="w-3 h-3" /> Accept</button>
                      <button type="button" onClick={() => setSuggestion(null)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs"><X className="w-3 h-3" /> Reject</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {rightTab === "ats" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Job Description (optional)</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={5}
                    placeholder="Paste job description for job-specific ATS analysis…"
                    className="mt-1 w-full text-sm border border-gray-200 rounded-lg p-2 resize-none"
                  />
                </div>
                <button type="button" onClick={runAnalysis} disabled={analyzing} className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">
                  {analyzing ? "Analyzing…" : "Analyze ATS Compatibility"}
                </button>

                {analysis && (
                  <div className="space-y-3">
                    <div className="text-center p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                      <p className="text-3xl font-bold text-indigo-700">{analysis.atsScore}<span className="text-lg text-gray-400">/100</span></p>
                      <p className="text-xs text-gray-500 mt-1">Estimated ATS Compatibility</p>
                      <p className="text-xs text-gray-400 mt-1">{analysis.disclaimer || "Different ATS platforms work differently."}</p>
                    </div>

                    {analysis.breakdown && (
                      <div className="space-y-1 text-sm">
                        {Object.entries(analysis.breakdown).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                            <span className="font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {analysis.matchedKeywords?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">✓ Matched Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.matchedKeywords.map((k) => (
                            <span key={k.keyword} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-800 border border-green-200">{k.keyword}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.missingKeywords?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-1">⚠ Missing Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.missingKeywords.map((k) => (
                            <span key={k.keyword} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">{k.keyword}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.improvements?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">What to improve</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {analysis.improvements.map((item, i) => <li key={i}>• {item}</li>)}
                        </ul>
                      </div>
                    )}

                    {analysis.jobMatch && (
                      <div className="rounded-xl border border-gray-200 p-3">
                        <p className="text-sm font-semibold">Estimated Profile Match: {analysis.jobMatch.estimatedMatch}%</p>
                        <p className="text-xs text-gray-500">{analysis.jobMatch.disclaimer}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
