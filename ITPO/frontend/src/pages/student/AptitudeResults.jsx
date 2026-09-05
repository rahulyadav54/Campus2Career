import { API_URL } from "../../config/api";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  Loader2,
} from "lucide-react";

const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

export default function AptitudeResults() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/api/aptitude/attempts/${attemptId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load result");
        const data = await res.json();
        setAttempt(data.attempt || data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-500 gap-2">
        <Loader2 className="animate-spin" /> Loading result…
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="p-6 text-center text-gray-500">
        Result not available.
        <div className="mt-4">
          <Link to="/student/aptitude" className="text-indigo-600 hover:underline">Back to Aptitude Tests</Link>
        </div>
      </div>
    );
  }

  const correct = attempt.correctCount ?? attempt.score ?? 0;
  const total = attempt.totalQuestions ?? attempt.maxScore ?? 0;
  const percentage = attempt.percentage ?? (total > 0 ? Math.round((correct / total) * 100) : 0);
  const passed = attempt.passed ?? (percentage >= (attempt.passingScore || 50));
  const timeTaken = attempt.timeTakenSeconds || attempt.timeTaken || 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/student/aptitude" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
          <ArrowLeft size={14} /> Back to tests
        </Link>
      </div>

      <section className={`bg-white border-2 rounded-2xl p-6 sm:p-8 ${passed ? "border-green-200" : "border-red-200"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {passed ? (
              <div className="bg-green-100 text-green-700 rounded-full"><CheckCircle2 size={36} /></div>
            ) : (
              <div className="bg-red-100 text-red-700 rounded-full"><XCircle size={36} /></div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Result</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {attempt.test?.title || "Aptitude Test"}
              </h1>
              <p className={`text-sm font-semibold mt-1 ${passed ? "text-green-700" : "text-red-700"}`}>
                {passed ? "Passed" : "Failed"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl sm:text-5xl font-bold text-indigo-600">{percentage}%</p>
            <p className="text-sm text-gray-500 mt-1">{correct} / {total} correct</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-gray-500 text-xs"><Target size={14} /> Score</div>
            <p className="text-lg font-bold text-gray-900 mt-1">{correct}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-gray-500 text-xs"><Award size={14} /> Passing</div>
            <p className="text-lg font-bold text-gray-900 mt-1">{attempt.passingScore || 50}%</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-gray-500 text-xs"><Clock size={14} /> Time Taken</div>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatTime(timeTaken)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-gray-500 text-xs"><TrendingUp size={14} /> Accuracy</div>
            <p className="text-lg font-bold text-gray-900 mt-1">{percentage}%</p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Solutions</h2>
        <div className="space-y-4">
          {(attempt.solutions || attempt.questions || []).map((q, idx) => {
            const userAnswer = q.userAnswer ?? q.selectedOption;
            const correctAnswer = q.correctAnswer ?? q.correctOption;
            const isCorrect = userAnswer === correctAnswer;
            return (
              <article key={q._id || idx} className={`border rounded-xl p-4 sm:p-5 ${isCorrect ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/40"}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-gray-900">
                    <span className="text-gray-500 mr-2">Q{idx + 1}.</span>
                    {q.text || q.question}
                  </h3>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                      <CheckCircle2 size={14} /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                      <XCircle size={14} /> Incorrect
                    </span>
                  )}
                </div>

                <div className="mt-3 grid gap-2">
                  {(q.options || []).map((opt, i) => {
                    const optText = typeof opt === "string" ? opt : opt.text;
                    const isUserPick = userAnswer === i;
                    const isCorrectOpt = correctAnswer === i;
                    let cls = "border-gray-200 bg-white";
                    if (isCorrectOpt) cls = "border-green-400 bg-green-50";
                    else if (isUserPick && !isCorrectOpt) cls = "border-red-400 bg-red-50";
                    return (
                      <div key={i} className={`p-3 border rounded-lg text-sm ${cls}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span><span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>{optText}</span>
                          <div className="flex items-center gap-2 text-xs">
                            {isCorrectOpt && <span className="text-green-700 font-medium">Correct answer</span>}
                            {isUserPick && <span className="text-indigo-700 font-medium">Your answer</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <p className="mt-3 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-3">
                    <span className="font-semibold text-gray-800">Explanation: </span>{q.explanation}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Link to="/student/aptitude" className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-center hover:bg-gray-50">
          All Tests
        </Link>
        <Link to={`/student/aptitude/${attempt.test?._id || attempt.testId}`} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm text-center font-medium">
          Retake Test
        </Link>
      </div>
    </div>
  );
}