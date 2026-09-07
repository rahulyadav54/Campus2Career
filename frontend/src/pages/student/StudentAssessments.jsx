import { useState, useEffect, useRef } from "react";
import { API_URL } from "../../config/api";
import { toast } from "react-hot-toast";
import { Play, Clock, CheckCircle, XCircle, FileText, Shield } from "lucide-react";
import apiClient from "../../services/apiClient";

const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
const asArray = (value) => Array.isArray(value) ? value : [];

export default function StudentAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("available");
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [attemptResult, setAttemptResult] = useState(null);
  const timerRef = useRef(null);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/api/student-assessments/me");
      setAssessments(asArray(data.assessments));
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const fetchResults = async () => {
    try {
      const data = await apiClient.get("/api/student-assessments/results");
      setResults(asArray(data.attempts));
    } catch (e) { toast.error(e.message); }
  };

  useEffect(() => { fetchAssessments(); fetchResults(); }, []);

  const startAssessment = async (assessmentId) => {
    try {
      const data = await apiClient.post(`/api/student-assessments/${assessmentId}/start`, {});
      setActiveAssessment(data);
      setQuestions(data.questions || []);
      setAttemptId(data.attemptId);
      setTimeLeft((data.durationMinutes || 30) * 60);
      setAnswers({});
      setCurrentQ(0);
      setAttemptResult(null);
      setView("attempt");
    } catch (e) { toast.error(e.message); }
  };

  useEffect(() => {
    if (view !== "attempt" || !attemptId) return;
    timerRef.current = setInterval(() => setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current); submitAssessment(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [view, attemptId]);

  const submitAssessment = async () => {
    if (submitting || !attemptId) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const payload = questions.map((q) => ({ questionId: q._id, selectedOption: answers[q._id]?.selectedOption, selectedOptions: answers[q._id]?.selectedOptions || [], answerText: answers[q._id]?.answerText || "", ratingValue: answers[q._id]?.ratingValue }));
      await apiClient.post(`/api/student-assessments/attempts/${attemptId}/submit`, { answers: payload });
      toast.success("Assessment submitted");
      setView("results");
      fetchResults();
      fetchAssessments();
    } catch (e) { toast.error(e.message); setSubmitting(false); }
  };

  const saveAnswer = async (questionId, answerData) => {
    setAnswers({ ...answers, [questionId]: answerData });
    try {
      await apiClient.post(`/api/student-assessments/attempts/${attemptId}/save`, { questionId, ...answerData });
    } catch { /* silent auto-save */ }
  };

  if (view === "attempt" && activeAssessment) {
    const q = questions[currentQ];
    if (!q) {
      return (
        <main className="max-w-4xl mx-auto p-6">
          <div className="bg-white border rounded-xl p-6 space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Assessment unavailable</h2>
            <p className="text-gray-600">This assessment has no questions available right now.</p>
            <button onClick={() => { setView("available"); setActiveAssessment(null); }} className="px-4 py-2 border rounded-lg text-sm">Back to Assessments</button>
          </div>
        </main>
      );
    }
    const answeredCount = Object.keys(answers).filter((k) => answers[k]?.selectedOption !== undefined || answers[k]?.answerText || answers[k]?.ratingValue !== undefined).length;
    return (
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <FileText className="text-indigo-600" size={20} />
            <span className="font-semibold text-gray-900">{activeAssessment.assessment?.name || "Assessment"}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className={`flex items-center gap-2 font-mono text-lg ${timeLeft < 60 ? "text-red-600" : "text-gray-700"}`}><Clock size={18} />{formatTime(timeLeft)}</span>
            <span className="text-gray-500">{answeredCount}/{questions.length} answered</span>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-6 space-y-6">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">{q.category} · {q.skill} · {q.difficulty}</span>
            <p className="font-medium text-gray-900 mt-2 text-lg">{currentQ + 1}. {q.text}</p>
            <p className="text-xs text-gray-500 mt-1">{q.marks} marks {q.negativeMarks > 0 ? `· ${q.negativeMarks} negative` : ""}</p>
          </div>
          <div className="space-y-3">
            {(q.options || []).map((opt, i) => (
              <label key={i} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-indigo-400 transition-colors ${answers[q._id]?.selectedOption === i ? "border-indigo-600 bg-indigo-50" : "border-gray-200"}`}>
                <input type="radio" name={q._id} checked={answers[q._id]?.selectedOption === i} onChange={() => saveAnswer(q._id, { selectedOption: i })} className="accent-indigo-600" />
                <span className="text-sm text-gray-800">{opt.text}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <button onClick={() => setCurrentQ((c) => Math.max(0, c - 1))} disabled={currentQ === 0} className="px-5 py-2 border rounded-lg text-sm disabled:opacity-50">Previous</button>
            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ((c) => c + 1)} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Next</button>
            ) : (
              <button onClick={submitAssessment} disabled={submitting} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{submitting ? "Submitting…" : "Submit Assessment"}</button>
            )}
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">Question navigator</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => (
              <button key={i} onClick={() => setCurrentQ(i)} className={`w-8 h-8 rounded-lg text-xs font-medium border ${i === currentQ ? "border-indigo-600 bg-indigo-50 text-indigo-700" : answers[q._id]?.selectedOption !== undefined ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>{i + 1}</button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (view === "results" && attemptResult) {
    const pct = attemptResult.maxScores?.total > 0 ? Math.round((attemptResult.scores?.total / attemptResult.maxScores.total) * 100) : 0;
    return (
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            {attemptResult.passed ? <CheckCircle className="text-green-600" size={28} /> : <XCircle className="text-amber-500" size={28} />}
            <div><h2 className="text-xl font-semibold">{attemptResult.passed ? "Passed!" : "Assessment Complete"}</h2><p className="text-sm text-gray-500">{attemptResult.assessment?.name}</p></div>
            <span className="ml-auto text-3xl font-bold text-indigo-600">{pct}%</span>
          </div>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            {["technical", "soft", "aptitude"].map((cat) => (
              <div key={cat} className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-500 capitalize">{cat}</p><p className="font-semibold mt-1">{attemptResult.scores?.[cat] || 0} / {attemptResult.maxScores?.[cat] || 0} pts</p></div>
            ))}
          </div>
          {attemptResult.strengths?.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg"><p className="font-semibold text-green-800">Strengths</p><p className="text-sm text-green-700 mt-1">{attemptResult.strengths.join(", ")}</p></div>
          )}
          {attemptResult.gaps?.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg"><p className="font-semibold text-amber-800">Skill Gaps</p><p className="text-sm text-amber-700 mt-1">{attemptResult.gaps.join(", ")}</p></div>
          )}
          <button onClick={() => { setView("available"); setActiveAssessment(null); setAttemptResult(null); }} className="px-4 py-2 border rounded-lg text-sm">Back to Assessments</button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Skill Development</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Assessments</h1>
        <p className="text-gray-600 mt-2">Complete industry assessments to showcase your skills.</p>
      </div>
      <div className="flex gap-2 border-b">
        <button onClick={() => setView("available")} className={`px-4 py-2 text-sm font-medium ${view === "available" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-gray-500"}`}>Available ({assessments.length})</button>
        <button onClick={() => { setView("results"); fetchResults(); }} className={`px-4 py-2 text-sm font-medium ${view === "results" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-gray-500"}`}>Results ({results.length})</button>
      </div>
      {view === "available" && (
        loading ? <p className="text-gray-500">Loading assessments…</p> : assessments.length === 0 ? <p className="text-gray-500">No assessments available right now.</p> : (
          <div className="grid gap-4">
            {assessments.map((item) => {
              const a = item.assessment;
              const canStart = item.canStart;
              const isPastEnd = item.isPastEnd;
              const isBeforeStart = item.isBeforeStart;
              const attemptsLeft = item.attemptsLeft;
              return (
                <div key={item._id} className="bg-white border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{a.description || "No description"}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span>{a.durationMinutes} min</span>
                      <span>Pass: {a.passingScore}%</span>
                      <span>Attempts left: {attemptsLeft}</span>
                    </div>
                    {isPastEnd && <span className="text-xs text-red-600 mt-1 block">Assessment ended</span>}
                    {isBeforeStart && <span className="text-xs text-amber-600 mt-1 block">Not started yet</span>}
                  </div>
                  <button onClick={() => startAssessment(a._id)} disabled={!canStart} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"><Play size={16} /> Start</button>
                </div>
              );
            })}
          </div>
        )
      )}
      {view === "results" && (
        results.length === 0 ? <p className="text-gray-500">No completed assessments yet.</p> : (
          <div className="grid gap-4">
            {results.map((a) => {
              const pct = a.maxScores?.total > 0 ? Math.round((a.scores.total / a.maxScores.total) * 100) : 0;
              return (
                <div key={a._id} className="bg-white border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.assessment?.name || "Assessment"}</h3>
                    <p className="text-sm text-gray-500">{new Date(a.submittedAt).toLocaleDateString()} · {a.timeTakenSeconds ? `${Math.floor(a.timeTakenSeconds / 60)}m ${a.timeTakenSeconds % 60}s` : "—"}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span>Strengths: {a.strengths?.join(", ") || "—"}</span>
                      <span>Gaps: {a.gaps?.join(", ") || "—"}</span>
                    </div>
                  </div>
                  <span className={`text-2xl font-bold ${a.passed ? "text-green-600" : "text-amber-500"}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        )
      )}
    </main>
  );
}
