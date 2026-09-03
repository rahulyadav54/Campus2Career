import { useEffect, useState } from "react";
import { ClipboardList, Plus, Award, MessageSquare, Send, CheckCircle2, CalendarDays, Building2, X, BookOpenCheck } from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

const statusStyle = {
  ongoing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  discontinued: "bg-red-100 text-red-600"
};

export default function Internships() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ title: "", organization: "", description: "", startDate: "" });
  const [updateForm, setUpdateForm] = useState({ week: "", summary: "", tasks: "" });
  const [completeForm, setCompleteForm] = useState({ evidenceUrl: "", remarks: "", skills: "" });

  const load = () => apiClient.get("/api/internship-progress/me").then((d) => setRecords(d.records || []));
  useEffect(() => { load().catch((e) => toast.error(e.message)).finally(() => setLoading(false)); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/internship-progress", {
        title: form.title,
        organization: form.organization,
        description: form.description,
        startDate: form.startDate || new Date().toISOString()
      });
      toast.success("Internship record created");
      setShowCreate(false);
      setForm({ title: "", organization: "", description: "", startDate: "" });
      await load();
    } catch (err) { toast.error(err.message); }
  };

  const addUpdate = async (id, e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/internship-progress/${id}/weekly-update`, {
        week: Number(updateForm.week),
        summary: updateForm.summary,
        tasksCompleted: updateForm.tasks.split(",").map((t) => t.trim()).filter(Boolean)
      });
      toast.success("Weekly update added");
      setUpdateForm({ week: "", summary: "", tasks: "" });
      await load();
    } catch (err) { toast.error(err.message); }
  };

  const complete = async (id, e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/internship-progress/${id}/complete`, {
        completionEvidence: completeForm.evidenceUrl,
        completionRemarks: completeForm.remarks,
        skillsGained: completeForm.skills.split(",").map((s) => s.trim()).filter(Boolean)
      });
      toast.success("Internship marked as completed");
      setCompleteForm({ evidenceUrl: "", remarks: "", skills: "" });
      await load();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading internship records…</p>;

  const ongoing = records.filter((r) => r.status === "ongoing").length;
  const completed = records.filter((r) => r.status === "completed").length;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Internship Progress</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Track your internships</h1>
          <p className="text-gray-600 mt-1">{ongoing} ongoing · {completed} completed</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          {showCreate ? <X size={16} /> : <Plus size={16} />} {showCreate ? "Cancel" : "Add internship"}
        </button>
      </header>

      {showCreate && (
        <form onSubmit={create} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><ClipboardList size={18} className="text-indigo-600" /> New internship record</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm"><span className="text-gray-600">Title *</span>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Software Development Internship" className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm"><span className="text-gray-600">Organization</span>
              <input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="e.g. TechCorp" className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm sm:col-span-2"><span className="text-gray-600">Description</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What will you be working on?" className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm"><span className="text-gray-600">Start date *</span>
              <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          </div>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">Create record</button>
        </form>
      )}
{records.length === 0 && !showCreate && (
        <section className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700">No internship records yet</h3>
          <p className="text-gray-500 text-sm mt-1">Add your current internship to start tracking progress, weekly updates, and mentor feedback.</p>
        </section>
      )}

      <section className="space-y-4">
        {records.map((rec) => {
          const isOpen = expanded === rec._id;
          return (
            <article key={rec._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : rec._id)} className="w-full flex flex-wrap items-center gap-4 p-5 text-left hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {rec.certificateIssued && <Award size={16} className="text-green-600" />}
                    <h3 className="font-semibold text-gray-900 truncate">{rec.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle[rec.status] || "bg-gray-100 text-gray-600"}`}>{rec.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                    {rec.organization && <span className="flex items-center gap-1"><Building2 size={14} /> {rec.organization}</span>}
                    <span className="flex items-center gap-1"><CalendarDays size={14} /> {new Date(rec.startDate).toLocaleDateString()}{rec.endDate ? ` — ${new Date(rec.endDate).toLocaleDateString()}` : ""}</span>
                    {rec.mentor?.name && <span>Mentor: {rec.mentor.name}</span>}
                  </div>
                </div>
                <span className="text-sm text-indigo-600">{isOpen ? "Close" : "Details"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 p-5 space-y-6">
                  {rec.description && <p className="text-sm text-gray-700">{rec.description}</p>}

                  {/* Weekly updates */}
                  <section>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Weekly updates ({rec.weeklyUpdates?.length || 0})</h4>
                    <div className="space-y-2">
                      {(rec.weeklyUpdates || []).slice().reverse().map((w, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between"><span className="font-medium">Week {w.week || idx + 1}</span><span className="text-xs text-gray-400">{new Date(w.submittedAt).toLocaleDateString()}</span></div>
                          <p className="text-gray-700 mt-1">{w.summary}</p>
                          {(w.tasksCompleted || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">{w.tasksCompleted.map((t, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded">{t}</span>)}</div>
                          )}
                        </div>
                      ))}
                      {(rec.weeklyUpdates || []).length === 0 && <p className="text-sm text-gray-400">No updates yet.</p>}
                    </div>
                    {rec.status === "ongoing" && (
                      <form onSubmit={(e) => addUpdate(rec._id, e)} className="mt-3 grid sm:grid-cols-[90px_1fr_1fr_auto] gap-2 items-end">
                        <input required type="number" min={1} placeholder="Week" value={updateForm.week} onChange={(e) => setUpdateForm({ ...updateForm, week: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
                        <input required placeholder="What did you work on?" value={updateForm.summary} onChange={(e) => setUpdateForm({ ...updateForm, summary: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
                        <input placeholder="Tasks (comma separated)" value={updateForm.tasks} onChange={(e) => setUpdateForm({ ...updateForm, tasks: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
                        <button type="submit" className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm"><Send size={14} /> Add</button>
                      </form>
                    )}
                  </section>
{/* Mentor feedback */}
                  {(rec.mentorFeedback || []).length > 0 && (
                    <section>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5"><MessageSquare size={15} className="text-indigo-600" /> Mentor feedback</h4>
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

                  {/* Completion evidence */}
                  {rec.status === "completed" && (
                    <section className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 space-y-1">
                      <div className="flex items-center gap-2 font-medium"><CheckCircle2 size={16} /> Internship completed</div>
                      {rec.completionRemarks && <p>Remarks: {rec.completionRemarks}</p>}
                      {rec.completionEvidence && <p>Evidence: <a href={rec.completionEvidence} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{rec.completionEvidence}</a></p>}
                      {(rec.skillsGained || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">{rec.skillsGained.map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 bg-white border border-green-300 rounded">{s}</span>)}</div>
                      )}
                      {rec.certificateIssued ? (
                        <p className="flex items-center gap-1.5 font-medium pt-1"><Award size={15} /> Certificate issued ({rec.certificateNumber || "issued"}){rec.certificateUrl ? <> — <a className="text-indigo-600 hover:underline" href={rec.certificateUrl} target="_blank" rel="noopener noreferrer">view</a></> : null}</p>
                      ) : (
                        <p className="pt-1 text-amber-700">Certificate pending mentor review.</p>
                      )}
                    </section>
                  )}

                  {/* Mark complete */}
                  {rec.status === "ongoing" && (
                    <details className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <summary className="text-sm font-medium text-amber-900 cursor-pointer flex items-center gap-1.5"><BookOpenCheck size={16} /> Mark as completed</summary>
                      <form onSubmit={(e) => complete(rec._id, e)} className="mt-3 grid gap-3 text-sm">
                        <input placeholder="Evidence URL (report / certificate link)" value={completeForm.evidenceUrl} onChange={(e) => setCompleteForm({ ...completeForm, evidenceUrl: e.target.value })} className="border rounded-lg px-3 py-2" />
                        <input placeholder="Completion remarks" value={completeForm.remarks} onChange={(e) => setCompleteForm({ ...completeForm, remarks: e.target.value })} className="border rounded-lg px-3 py-2" />
                        <input placeholder="Skills gained (comma separated)" value={completeForm.skills} onChange={(e) => setCompleteForm({ ...completeForm, skills: e.target.value })} className="border rounded-lg px-3 py-2" />
                        <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg w-fit">Submit completion</button>
                      </form>
                    </details>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}