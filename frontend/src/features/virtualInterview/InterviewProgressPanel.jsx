import { Clock, BarChart2 } from "lucide-react";
import { STATUS_LABELS } from "./constants";

export default function InterviewProgressPanel({
  questionNumber,
  totalExpected,
  progress,
  currentTopic,
  timeLeft,
  status,
  avgScore,
}) {
  const fmt = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <aside className="w-full lg:w-72 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-5 h-fit">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Interview progress</p>
        <p className="text-lg font-bold text-gray-900 mt-1">Question {questionNumber}</p>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Current topic</span>
          <span className="font-medium text-gray-900 capitalize">{currentTopic || "General"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Time</span>
          <span className="font-mono font-semibold text-gray-900">{fmt(timeLeft)}</span>
        </div>
        {avgScore != null && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> Score</span>
            <span className="font-semibold text-indigo-700">{avgScore}/100</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Interviewer status</p>
        <p className="text-sm font-medium text-indigo-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          {STATUS_LABELS[status] || status}
        </p>
      </div>
    </aside>
  );
}
