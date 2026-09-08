import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { resumeOptimizerService } from "../../../services/resumeOptimizerService";
import { AIPageHeader, AIContentCard } from "../../../components/ai/AIStudentUI";
import { LoadingSkeleton } from "../../../components/ui";

export default function ResumeCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resumeOptimizerService.getCompanies()
      .then((res) => setCompanies(res.companies || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><LoadingSkeleton lines={4} /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <AIPageHeader title="Companies You Can Target" subtitle="Based on your skills, experience, and target role." />

      {companies.map((c) => (
        <AIContentCard key={c.company}>
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{c.company}</h3>
              <p className="text-sm text-gray-500">{c.industry}</p>
              <p className="text-xl font-bold text-indigo-700 mt-1">{c.profileMatch}% <span className="text-xs font-normal text-gray-400">estimated match</span></p>
              <p className="text-sm text-gray-600 mt-2">Roles: {c.potentialRoles?.join(", ")}</p>
              {c.whyMatch?.length > 0 && (
                <p className="text-xs text-green-700 mt-2">✓ {c.whyMatch.join(" · ")}</p>
              )}
              {c.skillGaps?.length > 0 && (
                <p className="text-xs text-amber-700 mt-1">⚠ Gaps: {c.skillGaps.join(", ")}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">{c.recommendedAction}</p>
              <p className="text-xs text-gray-400 mt-1">{c.disclaimer}</p>
            </div>
          </div>
        </AIContentCard>
      ))}
    </div>
  );
}
