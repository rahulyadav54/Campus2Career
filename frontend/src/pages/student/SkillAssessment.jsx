import { API_URL } from '../../config/api';
import { useState, useEffect, useRef } from "react";
import { CheckCircle, Target, BookOpen, Clock, History, Play } from "lucide-react";
import apiClient from "../../services/apiClient";

const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

function TimedAttempt({ template, onDone }) {
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(template.timeLimitMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    apiClient.post(`/api/question-bank/templates/${template._id}/start`, {})
      .then((data) => { setAttemptId(data.attemptId); setQuestions(data.questions); setTimeLeft(data.timeLimitMinutes * 60); })
      .catch((err) => alert(err.message));
  }, [template._id]);

  useEffect(() => {
    if (!attemptId) return;
    timerRef.current = setInterval(() => setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current); submit(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [attemptId]);

  const submit = async () => {
    if (submitting || !attemptId) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const payload = questions.map((q) => ({ questionId: q._id, selectedOption: answers[q._id]?.selectedOption, ratingValue: answers[q._id]?.ratingValue }));
      const data = await apiClient.post(`/api/question-bank/attempts/${attemptId}/submit`, { answers: payload });
      onDone(data.attempt);
    } catch (err) { alert(err.message); setSubmitting(false); }
  };

  if (!questions.length) return <p className="text-gray-500">Loading questions…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white border rounded-xl px-5 py-3">
        <span className="font-semibold">{template.title}</span>
        <span className={`flex items-center gap-2 font-mono text-lg ${timeLeft < 60 ? "text-red-600" : "text-gray-700"}`}>
          <Clock size={18} />{formatTime(timeLeft)}
        </span>
      </div>
      {questions.map((q, idx) => (
        <div key={q._id} className="bg-white border rounded-xl p-5 space-y-3">
          <p className="font-medium">{idx + 1}. {q.text}</p>
          <span className="text-xs text-gray-400 capitalize">{q.category} · {q.skill}</span>
          {q.type === "rating" ? (
            <div>
              <input type="range" min={0} max={100} value={answers[q._id]?.ratingValue ?? 50}
                onChange={(e) => setAnswers({ ...answers, [q._id]: { ratingValue: Number(e.target.value) } })}
                className="w-full accent-indigo-600" />
              <span className="text-sm text-gray-500">{answers[q._id]?.ratingValue ?? 50} / 100</span>
            </div>
          ) : (
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <label key={i} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name={q._id} checked={answers[q._id]?.selectedOption === i}
                    onChange={() => setAnswers({ ...answers, [q._id]: { selectedOption: i } })} />
                  <span className="text-sm">{opt.text}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      <button onClick={submit} disabled={submitting}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit Assessment"}
      </button>
    </div>
  );
}

function AttemptResult({ attempt, onRetake }) {
  const pct = attempt.maxScores?.total > 0 ? Math.round((attempt.scores.total / attempt.maxScores.total) * 100) : 0;
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <CheckCircle className={attempt.passed ? "text-green-600" : "text-amber-500"} />
        <h2 className="text-xl font-semibold">{attempt.passed ? "Passed!" : "Assessment complete"}</h2>
        <span className="ml-auto text-2xl font-bold text-indigo-600">{pct}%</span>
      </div>
      <div className="grid md:grid-cols-3 gap-3 text-sm">
        {["technical", "soft", "aptitude"].map((cat) => (
          <div key={cat} className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500 capitalize">{cat}</p>
            <p className="font-semibold mt-1">{attempt.scores[cat]} / {attempt.maxScores[cat]} pts</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg"><Target className="text-green-700" /><h3 className="font-semibold mt-2">Strengths</h3><p className="text-sm mt-1">{attempt.strengths.join(", ") || "Keep building"}</p></div>
        <div className="p-4 bg-amber-50 rounded-lg"><BookOpen className="text-amber-700" /><h3 className="font-semibold mt-2">Skill Gaps</h3><p className="text-sm mt-1">{attempt.gaps.join(", ") || "No gaps identified"}</p></div>
      </div>
      {attempt.timeTakenSeconds && <p className="text-sm text-gray-500">Time taken: {formatTime(attempt.timeTakenSeconds)}</p>}
      <button onClick={onRetake} className="px-4 py-2 border rounded-lg text-sm">Take another assessment</button>
    </section>
  );
}

// Legacy self-assessment (no template)
const defaultQuestions = [
  { skill: "JavaScript", category: "technical" },
  { skill: "Data Analysis", category: "technical" },
  { skill: "Communication", category: "soft" },
  { skill: "Problem Solving", category: "aptitude" },
  { skill: "Teamwork", category: "soft" }
];

function LegacyAssessment() {
  const [scores, setScores] = useState(Object.fromEntries(defaultQuestions.map((item) => [item.skill, 50])));
  const [interests, setInterests] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await apiClient.post("/api/assessments", {
        interests: interests.split(",").map((i) => i.trim()).filter(Boolean),
        responses: defaultQuestions.map((item) => ({ ...item, score: Number(scores[item.skill]) }))
      });
      setResult(data.assessment);
    } catch (err) { setError(err.message); }
  };

  if (result) return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-3"><CheckCircle className="text-green-600" /><h2 className="text-xl font-semibold">Assessment complete</h2></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg"><Target className="text-green-700" /><h3 className="font-semibold mt-2">Strengths</h3><p className="text-sm mt-1">{result.strengths.join(", ") || "Keep building your foundation"}</p></div>
        <div className="p-4 bg-amber-50 rounded-lg"><BookOpen className="text-amber-700" /><h3 className="font-semibold mt-2">Skill gaps</h3><p className="text-sm mt-1">{result.gaps.join(", ") || "No immediate gaps identified"}</p></div>
      </div>
      <div>
        <h3 className="font-semibold">Recommended learning resources</h3>
        {result.learningRecommendations.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            {result.learningRecommendations.map((item) => (
              <a key={item.resourceId} href={item.url || "#"} target="_blank" rel="noopener noreferrer" className="border rounded-lg p-3 hover:border-indigo-400">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.provider} · {item.type}</p>
                <p className="text-xs text-gray-500 mt-1">{(item.skills || []).join(", ")} {item.isFree ? "· Free" : ""}</p>
              </a>
            ))}
          </div>
        ) : <p className="text-sm text-gray-500 mt-2">No matching resources are published yet. Check Learning Recommendations after the catalogue is updated.</p>}
      </div>
      <button onClick={() => setResult(null)} className="px-4 py-2 border rounded-lg">Retake assessment</button>
    </section>
  );

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      {defaultQuestions.map((item) => (
        <label key={item.skill} className="block">
          <div className="flex justify-between mb-2"><span className="font-medium text-gray-800">{item.skill}</span><span className="text-sm text-gray-500">{scores[item.skill]} / 100</span></div>
          <input type="range" min="0" max="100" value={scores[item.skill]} onChange={(e) => setScores({ ...scores, [item.skill]: e.target.value })} className="w-full accent-indigo-600" />
          <span className="text-xs text-gray-500 capitalize">{item.category} skill</span>
        </label>
      ))}
      <label className="block"><span className="font-medium text-gray-800">Career interests</span><input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="AI, healthcare, product design" className="mt-2 w-full px-3 py-2 border rounded-lg" /></label>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button className="px-5 py-3 bg-indigo-600 text-white rounded-lg font-medium">Submit assessment</button>
    </form>
  );
}

export default function SkillAssessment() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("home"); // home | attempt | history

  useEffect(() => {
    apiClient.get("/api/question-bank/templates").then((d) => setTemplates(d.templates || [])).catch(() => {});
    apiClient.get("/api/question-bank/attempts/history").then((d) => setHistory(d.attempts || [])).catch(() => {});
  }, []);

  if (view === "attempt" && selected) {
    if (result) return (
      <main className="max-w-4xl mx-auto p-6">
        <AttemptResult attempt={result} onRetake={() => { setResult(null); setSelected(null); setView("home"); }} />
      </main>
    );
    return <main className="max-w-4xl mx-auto p-6"><TimedAttempt template={selected} onDone={(a) => setResult(a)} /></main>;
  }

  if (view === "history") return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Assessment History</h1>
        <button onClick={() => setView("home")} className="text-sm text-indigo-600 hover:underline">← Back</button>
      </div>
      {history.length === 0 ? <p className="text-gray-500">No completed assessments yet.</p> : (
        <div className="space-y-3">
          {history.map((a) => {
            const pct = a.maxScores?.total > 0 ? Math.round((a.scores.total / a.maxScores.total) * 100) : 0;
            return (
              <div key={a._id} className="bg-white border rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{a.template?.title || "Self Assessment"}</p>
                  <p className="text-sm text-gray-500">{new Date(a.submittedAt).toLocaleDateString()} · {formatTime(a.timeTakenSeconds || 0)}</p>
                  <p className="text-sm mt-1">Strengths: {a.strengths.join(", ") || "—"} · Gaps: {a.gaps.join(", ") || "—"}</p>
                </div>
                <span className={`text-lg font-bold ${a.passed ? "text-green-600" : "text-amber-500"}`}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Skill Development</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Build your Campus2Career skill profile</h1>
        <p className="text-gray-600 mt-2">Take a timed assessment or rate your skills manually.</p>
      </header>

      <div className="flex gap-2">
        <button onClick={() => setView("history")} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <History size={16} /> View History ({history.length})
        </button>
      </div>

      {templates.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">Available Assessments</h2>
          {templates.map((t) => (
            <div key={t._id} className="bg-white border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-gray-500">{t.questions?.length || 0} questions · {t.timeLimitMinutes} min · Pass: {t.passingScore}%</p>
                {t.description && <p className="text-sm text-gray-600 mt-1">{t.description}</p>}
              </div>
              <button onClick={() => { setSelected(t); setResult(null); setView("attempt"); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
                <Play size={16} /> Start
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">Quick Self-Assessment</h2>
        <p className="text-sm text-gray-500">Rate your confidence on key skills.</p>
        <LegacyAssessment />
      </section>
    </main>
  );
}
