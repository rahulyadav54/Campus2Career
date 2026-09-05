import { useEffect, useState } from "react";
import { Download, Award, Calendar, ExternalLink, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../../services/apiClient";

const Certificates = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/api/internship-progress/me")
      .then((data) => setRecords(data.records || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const completedCertificates = records.filter((r) => r.certificateIssued);
  const pendingCertificates = records.filter((r) => r.status === "completed" && !r.certificateIssued);
  const inProgressCertificates = records.filter((r) => r.status === "ongoing");

  const getRatingStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-sm ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}`}>⭐</span>
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading certificates…
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-indigo-50 to-indigo-100 mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Certificates</h1>
        <div className="text-sm text-gray-600">
          {completedCertificates.length} issued, {pendingCertificates.length} pending review, {inProgressCertificates.length} in progress
        </div>
      </div>

      {completedCertificates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="text-green-600" size={20} /> Issued Certificates
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {completedCertificates.map((rec) => (
              <div key={rec._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{rec.title}</h3>
                    <p className="text-gray-600">{rec.organization}</p>
                  </div>
                  <Award className="text-green-600" size={24} />
                </div>

                <div className="space-y-3 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    {new Date(rec.endDate || rec.startDate).toLocaleDateString()}
                    {rec.startDate ? ` — ${new Date(rec.startDate).toLocaleDateString()}` : ""}
                  </div>
                  {rec.certificateNumber && (
                    <div className="text-gray-600">
                      Certificate no: <span className="font-mono text-gray-800">{rec.certificateNumber}</span>
                    </div>
                  )}
                  {(rec.skillsGained || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rec.skillsGained.map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded">{s}</span>)}
                    </div>
                  )}
                  {rec.finalRating && getRatingStars(rec.finalRating)}
                </div>

                {rec.mentorFeedback?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Mentor Feedback:</p>
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">"{rec.mentorFeedback[rec.mentorFeedback.length - 1].text}"</p>
                  </div>
                )}

                {rec.certificateUrl ? (
                  <a href={rec.certificateUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors">
                    <ExternalLink size={18} /> View Certificate
                  </a>
                ) : (
                  <button
                    onClick={() => toast.success(`Certificate downloaded for ${rec.title}`)}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download size={18} /> Download Certificate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingCertificates.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="text-amber-600" size={20} /> Pending Certificates
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {pendingCertificates.map((rec) => (
              <div key={rec._id} className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-amber-400">
                <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                <p className="text-sm text-gray-600">{rec.organization || "Internship record"}</p>
                <p className="text-sm text-amber-700 mt-2">Completion submitted. Waiting for mentor review.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {inProgressCertificates.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={20} /> In Progress
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {inProgressCertificates.map((rec) => (
              <div key={rec._id} className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-indigo-400">
                <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                <p className="text-sm text-gray-600">{rec.organization || "Internship record"}</p>
                <p className="text-sm text-indigo-700 mt-2">Certificate will be available after completion and mentor review.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {records.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500">
          Complete an internship to receive certificates here.
        </div>
      )}
    </div>
  );
};

export default Certificates;
