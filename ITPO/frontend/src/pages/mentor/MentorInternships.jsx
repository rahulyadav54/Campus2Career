import { useEffect, useState } from "react";
import { ClipboardList, MessageSquare, Award, User, Send, CheckCircle2 } from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

const statusStyle = {
  ongoing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  discontinued: "bg-red-100 text-red-600"
};

export default function MentorInternships() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({});
  const [cert, setCert] = useState({});

  const load = () => apiClient.get("/api/internship-progress/mentees").then((d) => setRecords(d.records || []));
  useEffect(() => { load().catch((e) => toast.error(e.message)).finally(() => setLoading(false)); }, []);

  const submitFeedback = async (id, e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/internship-progress/${id}/feedback`, {
        text: feedback[id]?.text || "",
        rating: Number(feedback[id]?.rating) || undefined
      });
      toast.success("Feedback added");
      setFeedback({ ...feedback, [id]: {} });
      await load();
    } catch (err) { toast.error(err.message); }
  };

  const issueCertificate = async (id, e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/internship-progress/${id}/certificate`, {
        certificateUrl: cert[id]?.certificateUrl || "",
        finalRating: Number(cert[id]?.finalRating) || 5
      });
      toast.success("Certificate issued");
      setCert({ ...cert, [id]: {} });
      await load();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading mentee internship records…</p>;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Internship Progress</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Your mentees' internships</h1>
        <p className="text-gray-600 mt-1">Review weekly updates, add feedback, and issue completion certificates.</p>
      </header>

      {records.length === 0 && (
        <section className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700">No internship records yet</h3>
          <p className="text-gray-500 text-sm mt-1">Your mentees' internship records will appear here when they start tracking.</p>
        </section>
      )}
{records.map((rec) => (
        <details key={rec._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <summary className="flex flex-wrap items-center gap-4 p-5 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              <span className="font-semibold text-gray-900">{rec.student?.name}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-800">{rec.title}</h3>
              <p className="text-sm text-gray-500">{rec.organization || "—"} · Started {new Date(rec.startDate).toLocaleDateString()}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[rec.status] || "bg-gray-100 text-gray-600"}`}>{rec.status}</span>
            {rec.certificateIssued && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><Award size={12} /> Cert issued</span>}
          </summary>

          <div className="border-t border-gray-100 p-5 space-y-5">
            {(rec.weeklyUpdates || []).length > 0 && (
              <section>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Weekly updates ({rec.weeklyUpdates.length})</h4>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {(rec.weeklyUpdates || []).slice().reverse().map((w, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="flex justify-between"><span className="font-medium">Week {w.week || idx + 1}</span><span className="text-xs text-gray-400">{new Date(w.submittedAt).toLocaleDateString()}</span></div>
                      <p className="text-gray-700 mt-1">{w.summary}</p>
                      {(w.tasksCompleted || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">{w.tasksCompleted.map((t, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded">{t}</span>)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(rec.mentorFeedback || []).length > 0 && (
              <section>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Your previous feedback</h4>
                <div className="space-y-2">
                  {(rec.mentorFeedback || []).slice().reverse().map((fb, idx) => (
                    <div key={idx} className="bg-indigo-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-700">"{fb.text}"</p>
                      {fb.rating && <p className="text-xs text-indigo-700 mt-1">Rating: {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
{/* Add feedback */}
            <form onSubmit={(e) => submitFeedback(rec._id, e)} className="grid sm:grid-cols-[1fr_120px_auto] gap-2 items-end">
              <div>
                <label className="text-xs text-gray-500">Feedback *</label>
                <input required value={feedback[rec._id]?.text || ""} onChange={(e) => setFeedback({ ...feedback, [rec._id]: { ...feedback[rec._id], text: e.target.value } })} placeholder="Constructive feedback for the mentee" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Rating (1-5)</label>
                <select value={feedback[rec._id]?.rating || 5} onChange={(e) => setFeedback({ ...feedback, [rec._id]: { ...feedback[rec._id], rating: e.target.value } })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
              </div>
              <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"><MessageSquare size={15} /> Add feedback</button>
            </form>

            {/* Issue certificate for completed internships */}
            {rec.status === "completed" && !rec.certificateIssued && (
              <form onSubmit={(e) => issueCertificate(rec._id, e)} className="bg-green-50 border border-green-200 rounded-lg p-4 grid sm:grid-cols-[1fr_120px_auto] gap-2 items-end">
                <div>
                  <label className="text-xs text-green-800 font-medium">Materialize completion — issue certificate</label>
                  <input value={cert[rec._id]?.certificateUrl || ""} onChange={(e) => setCert({ ...cert, [rec._id]: { ...cert[rec._id], certificateUrl: e.target.value } })} placeholder="Certificate URL (optional)" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-green-800 font-medium">Final rating</label>
                  <select value={cert[rec._id]?.finalRating || 5} onChange={(e) => setCert({ ...cert, [rec._id]: { ...cert[rec._id], finalRating: e.target.value } })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
                <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"><Award size={15} /> Issue certificate</button>
              </form>
            )}

            {rec.status === "completed" && rec.certificateIssued && (
              <p className="flex items-center gap-1.5 text-sm text-green-700 font-medium"><CheckCircle2 size={16} /> Certificate issued {rec.certificateNumber ? `(${rec.certificateNumber})` : ""} {rec.finalRating ? `· Final rating ${rec.finalRating}★` : ""}</p>
            )}
          </div>
        </details>
      ))}
    </main>
  );
}