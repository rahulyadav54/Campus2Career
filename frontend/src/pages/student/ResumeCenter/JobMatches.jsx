import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { resumeOptimizerService } from "../../../services/resumeOptimizerService";
import { AIPageHeader, AIContentCard } from "../../../components/ai/AIStudentUI";
import { LoadingSkeleton } from "../../../components/ui";

export default function ResumeJobMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resumeOptimizerService.getJobMatches()
      .then((res) => setMatches(res.matches || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><LoadingSkeleton lines={4} /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <AIPageHeader title="AI Job Match" subtitle="Estimated profile match based on your resume and available listings." />
      <p className="text-xs text-gray-500">Potential match based on your current profile — not a guarantee of employment.</p>

      {matches.length === 0 ? (
        <AIContentCard>
          <p className="text-gray-500">No active job listings found. Check back later or browse <Link to="/student/jobs" className="text-indigo-600">Job Openings</Link>.</p>
        </AIContentCard>
      ) : (
        matches.map((m) => (
          <AIContentCard key={m.jobId}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">{m.title}</h3>
                <p className="text-sm text-gray-500">{m.company} · {m.location}</p>
                <p className="text-2xl font-bold text-indigo-700 mt-2">{m.estimatedMatch}%</p>
                <p className="text-xs text-gray-400">Estimated Profile Match</p>
                {m.matchedSkills?.length > 0 && (
                  <p className="text-xs text-green-700 mt-2">✓ {m.matchedSkills.join(", ")}</p>
                )}
                {m.missingSkills?.length > 0 && (
                  <p className="text-xs text-amber-700 mt-1">⚠ {m.missingSkills.join(", ")}</p>
                )}
              </div>
              <Link to={`/student/jobs`} className="shrink-0 inline-flex items-center gap-1 text-sm text-indigo-600">
                View <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AIContentCard>
        ))
      )}
    </div>
  );
}
