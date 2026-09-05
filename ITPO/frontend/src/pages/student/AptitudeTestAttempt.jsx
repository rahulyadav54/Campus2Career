import { API_URL } from "../../config/api";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

export default function AptitudeTestAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);

  const submit = useCallback(async (auto = false) => {
    if (submitting || !attemptId) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    const token = localStorage.getItem("token");
    const payload = questions.map((q) => ({
      questionId: q._id,
      selectedOption: answers[q._id] ?? null,
    }));
    try {
      const res = await fetch(`${API_URL}/api/aptitude/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: payload, autoSubmitted: auto }),
      });
      if (!res.ok) throw new Error("Failed to submit test");
      const data = await res.json();
      if (auto) toast("Time's up! Test auto-submitted.", { icon: "⏰" });
      else toast.success("Test submitted successfully");
      navigate(`/student/aptitude/results/${data.attemptId || attemptId}`);
    } catch (err) {
      toast.error(err.message || "Could not submit test");
      setSubmitting(false);
    }
  }, [answers, attemptId, questions, navigate, submitting]);

  useEffect(() => {
    const startAttempt = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/api/aptitude/tests/${testId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not start aptitude test");
        const data = await res.json();
        setTest(data.test || null);
        setAttemptId(data.attemptId);
        setQuestions(data.questions || []);
        setTimeLeft((data.timeLimitMinutes || data.test?.durationMinutes || 30) * 60);
      } catch (err) {
        toast.error(err.message);
        navigate("/student/aptitude");
      } finally {
        setLoading(false);
      }
    };
    startAttempt();
  }, [testId, navigate]);

  useEffect(() => {
    if (!attemptId || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          submit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [attemptId, submit]);

  const handleSelect = (qid, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qid]: optionIndex }));
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-500 gap-2">
        <Loader2 className="animate-spin" /> Preparing your test…
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        No questions available for this test.
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <header className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">Aptitude Test</p>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">{test?.title || "Aptitude Test"}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {answeredCount}/{questions.length} answered
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold ${timeLeft < 60 ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-800"}`}>
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>
      </header>

      <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-xs">Each question carries equal marks</span>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">
            {currentQ.text || currentQ.question}
          </h2>
          {currentQ.difficulty && (
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {currentQ.difficulty}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {(currentQ.options || []).map((opt, i) => {
            const selected = answers[currentQ._id] === i;
            return (
              <label
                key={i}
                className={`flex items-start gap-3 p-3 sm:p-4 border rounded-xl cursor-pointer transition ${selected ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name={currentQ._id}
                  checked={selected}
                  onChange={() => handleSelect(currentQ._id, i)}
                  className="mt-1 accent-indigo-600"
                />
                <span className="text-sm sm:text-base text-gray-800">
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                  {typeof opt === "string" ? opt : opt.text}
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          {currentIndex === questions.length - 1 ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              <Send size={16} /> Submit Test
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Navigator</h3>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => {
            const isAnswered = answers[q._id] !== undefined;
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q._id || i}
                onClick={() => setCurrentIndex(i)}
                className={`w-9 h-9 rounded-lg text-sm font-medium border transition ${isCurrent ? "bg-indigo-600 text-white border-indigo-600" : isAnswered ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </section>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle />
              <h3 className="font-semibold text-lg">Submit Test?</h3>
            </div>
            <p className="text-sm text-gray-600">
              You have answered <span className="font-semibold text-gray-900">{answeredCount}</span> out of {questions.length} questions.
              {answeredCount < questions.length && " Unanswered questions will be marked incorrect."}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                Continue Test
              </button>
              <button
                onClick={() => submit(false)}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <CheckCircle2 size={16} /> Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}