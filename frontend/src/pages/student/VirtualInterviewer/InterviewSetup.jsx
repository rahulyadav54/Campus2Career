/**
 * InterviewSetup.jsx
 * Professional interview configuration screen.
 */

import { useState } from "react";
import {
  Video, Briefcase, BarChart3, Clock, User, FileText,
  ChevronRight, Mic, AlertCircle, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

const ROLES = [
  "Full Stack Developer", "Software Engineer", "Frontend Developer",
  "Backend Developer", "Data Analyst", "Data Scientist", "Machine Learning Engineer",
  "DevOps Engineer", "Product Manager", "UX Designer", "Business Analyst",
  "Cybersecurity Analyst", "Cloud Engineer",
];

const INTERVIEW_TYPES = [
  { value: "hr",           label: "HR Interview",        desc: "Culture fit, motivation, salary discussion" },
  { value: "technical",    label: "Technical Interview",  desc: "Coding, system design, problem-solving" },
  { value: "behavioral",   label: "Behavioral Interview", desc: "STAR-based competency questions" },
  { value: "mixed",        label: "Mixed Interview",      desc: "Blend of all types" },
  { value: "resume-based", label: "Resume-Based",         desc: "Personalized questions from your profile" },
];

const DIFFICULTIES = [
  { value: "beginner",     label: "Beginner",     desc: "Foundational questions" },
  { value: "intermediate", label: "Intermediate",  desc: "Industry standard" },
  { value: "advanced",     label: "Advanced",      desc: "Senior-level depth" },
  { value: "expert",       label: "Expert",        desc: "Architect-level challenge" },
];

const PERSONALITIES = [
  { value: "professional", label: "Professional",  emoji: "🤝", desc: "Formal, polished, corporate" },
  { value: "friendly",     label: "Friendly",      emoji: "😊", desc: "Warm, encouraging, conversational" },
  { value: "strict",       label: "Strict",        emoji: "🔍", desc: "Direct, demanding, challenging" },
  { value: "technical",    label: "Technical",     emoji: "💻", desc: "Deep technical follow-ups" },
  { value: "hr-manager",   label: "HR Manager",    emoji: "👔", desc: "Communication, behaviour, teamwork" },
];

const DURATIONS = [
  { value: 5,  label: "5 min",  desc: "Quick practice" },
  { value: 10, label: "10 min", desc: "Standard session" },
  { value: 15, label: "15 min", desc: "Full interview" },
  { value: 20, label: "20 min", desc: "Extended deep-dive" },
];

const AVATAR_PRESETS = [
  {
    id: "interviewer-custom",
    name: "Campus2Career Lead (Custom)",
    url: "/interviewer.jpeg",
  },
  {
    id: "noam",
    name: "Noam (Male Corporate)",
    url: "https://create-images-results.d-id.com/DefaultPresenters/Noam_m/image.jpeg",
  },
  {
    id: "anna",
    name: "Anna (Female Tech Lead)",
    url: "https://create-images-results.d-id.com/DefaultPresenters/Anna_f/image.jpeg",
  },
  {
    id: "matt",
    name: "Matt (Senior Executive)",
    url: "https://create-images-results.d-id.com/DefaultPresenters/Matt_m/image.jpeg",
  },
  {
    id: "emma",
    name: "Emma (HR Manager)",
    url: "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/image.jpeg",
  },
];

function OptionPill({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
        selected
          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200"
          : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <h3 className="font-semibold text-gray-900 text-sm">{children}</h3>
    </div>
  );
}

export default function InterviewSetup({ onStart, loading = false, initialConfig = null }) {
  const [targetRole,    setTargetRole]    = useState(initialConfig?.targetRole || "Software Engineer");
  const [customRole,    setCustomRole]    = useState("");
  const [interviewType, setInterviewType] = useState(initialConfig?.interviewType || "mixed");
  const [difficulty,    setDifficulty]    = useState("intermediate");
  const [personality,   setPersonality]   = useState("professional");
  const [duration,      setDuration]      = useState(10);
  const [resumeBased,   setResumeBased]   = useState(initialConfig?.resumeBased ?? false);
  const [jobDescription, setJobDescription] = useState(initialConfig?.jobDescription || "");

  const effectiveRole = customRole.trim() || targetRole;

  const handleStart = () => {
    if (!effectiveRole.trim()) {
      toast.error("Please select or enter a target role");
      return;
    }
    onStart({
      targetRole:     effectiveRole.trim(),
      interviewType,
      difficulty,
      personality,
      durationMinutes: duration,
      resumeBased,
      jobDescription: jobDescription.trim(),
      presenterUrl:   "/interviewer.jpeg",
    });
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-4">
            <Video className="w-4 h-4" /> AI Virtual Interviewer
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configure Your Interview</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Sit in front of a professional AI interviewer. Speak your answers naturally — just like a real interview.
          </p>
        </div>

        {/* Setup card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80 p-6 sm:p-8 space-y-8">

          {/* Target Role */}
          <div>
            <SectionTitle icon={Briefcase}>Target Role</SectionTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              {ROLES.map(r => (
                <OptionPill
                  key={r}
                  selected={targetRole === r && !customRole}
                  onClick={() => { setTargetRole(r); setCustomRole(""); }}
                >
                  {r}
                </OptionPill>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type a custom role…"
              value={customRole}
              onChange={e => setCustomRole(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            />
          </div>

          {/* Interview Type */}
          <div>
            <SectionTitle icon={FileText}>Interview Type</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INTERVIEW_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setInterviewType(t.value)}
                  className={`flex flex-col text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                    interviewType === t.value
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <span className="font-semibold text-sm">{t.label}</span>
                  <span className={`text-xs mt-0.5 ${interviewType === t.value ? "text-indigo-200" : "text-gray-400"}`}>
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <SectionTitle icon={BarChart3}>Difficulty Level</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`flex flex-col text-left px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex-1 min-w-[120px] ${
                    difficulty === d.value
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <span className="font-semibold text-sm">{d.label}</span>
                  <span className={`text-xs mt-0.5 ${difficulty === d.value ? "text-indigo-200" : "text-gray-400"}`}>
                    {d.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Interviewer Personality */}
          <div>
            <SectionTitle icon={User}>Interviewer Personality</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PERSONALITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPersonality(p.value)}
                  className={`flex flex-col text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                    personality === p.value
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <span className="text-lg mb-0.5">{p.emoji}</span>
                  <span className="font-semibold text-sm">{p.label}</span>
                  <span className={`text-xs mt-0.5 ${personality === p.value ? "text-indigo-200" : "text-gray-400"}`}>
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Permanent Interviewer Avatar Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <img
              src="/interviewer.jpeg"
              alt="AI Interviewer"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-200 shrink-0 border border-white"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900">AI Virtual Interviewer</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-indigo-600 text-[10px] font-semibold uppercase tracking-wider border border-indigo-200">
                  Live avatar
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Your interview is conducted by an interactive AI interviewer with voice recognition.
              </p>
            </div>
          </div>

          {/* Duration */}
          <div>
            <SectionTitle icon={Clock}>Interview Duration</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map(d => (
                <OptionPill
                  key={d.value}
                  selected={duration === d.value}
                  onClick={() => setDuration(d.value)}
                >
                  <span className="font-semibold">{d.label}</span>
                  <span className={`block text-xs ${duration === d.value ? "text-indigo-200" : "text-gray-400"}`}>
                    {d.desc}
                  </span>
                </OptionPill>
              ))}
            </div>
          </div>

          {/* Resume-based toggle */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            resumeBased ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-gray-50"
          }`}
            onClick={() => setResumeBased(v => !v)}
            role="switch"
            aria-checked={resumeBased}
            tabIndex={0}
            onKeyDown={e => e.key === " " && setResumeBased(v => !v)}
          >
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${resumeBased ? "text-indigo-600" : "text-gray-400"}`} />
                <span className="font-semibold text-gray-900 text-sm">Resume-Based Questions</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 ml-6">Use your profile & resume to generate personalised questions</p>
            </div>
            <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
              resumeBased ? "bg-indigo-600" : "bg-gray-300"
            }`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                resumeBased ? "translate-x-6" : "translate-x-0.5"
              }`} />
            </div>
          </div>

          {/* Job description for resume-based prep */}
          {(resumeBased || jobDescription) && (
            <div>
              <SectionLabel icon={FileText}>Job Description (optional)</SectionLabel>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                placeholder="Paste the job description to get job-specific interview questions…"
                className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none focus:ring-2 focus:ring-indigo-300 outline-none"
              />
            </div>
          )}

          {/* Microphone notice */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <Mic className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Microphone Required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                This interview uses your microphone for voice answers. Your browser will ask for permission when you start. No audio is permanently stored.
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleStart}
            disabled={loading || !effectiveRole.trim()}
            id="start-virtual-interview-btn"
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl
              bg-indigo-600 text-white font-semibold text-lg
              hover:bg-indigo-700 transition-all shadow-sm
              disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting Interview…
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                Start Virtual Interview
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
