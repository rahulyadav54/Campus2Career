import { useEffect, useState } from "react";
import { Compass, BookOpen, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

const demandOptions = ["low", "medium", "high", "very_high"];
const resourceTypes = ["course", "certification", "workshop", "bootcamp", "tutorial", "book"];

const blankPathway = { role: "", industry: "", description: "", requiredSkills: [], niceToHaveSkills: [], averageSalaryLPA: 0, demandLevel: "medium", certifications: [], relatedRoles: [] };
const blankResource = { title: "", provider: "", type: "course", skills: [], url: "", durationHours: 0, isFree: false, level: "beginner", industry: "" };

export default function AdminPathways() {
  const [tab, setTab] = useState("pathways");
  const [pathways, setPathways] = useState([]);
  const [resources, setResources] = useState([]);
  const [showPathwayForm, setShowPathwayForm] = useState(false);
  const [editingPathway, setEditingPathway] = useState(null);
  const [pathwayForm, setPathwayForm] = useState(blankPathway);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceForm, setResourceForm] = useState(blankResource);

  const load = async () => {
    try {
      const [p, r] = await Promise.all([
        apiClient.get("/api/career/pathways/all"),
        apiClient.get("/api/career/resources")
      ]);
      setPathways(p.pathways || []);
      setResources(r.resources || []);
    } catch (err) { toast.error(err.message); }
  };
  useEffect(() => { load(); }, []);

  const savePathway = async (e) => {
    e.preventDefault();
    try {
      if (editingPathway) {
        await apiClient.put(`/api/career/pathways/${editingPathway._id}`, pathwayForm);
        toast.success("Pathway updated");
      } else {
        await apiClient.post("/api/career/pathways", pathwayForm);
        toast.success("Pathway created");
      }
      setShowPathwayForm(false);
      setEditingPathway(null);
      setPathwayForm(blankPathway);
      await load();
    } catch (err) { toast.error(err.message); }
  };

  const deactivatePathway = async (id) => {
    try { await apiClient.delete(`/api/career/pathways/${id}`); toast.success("Pathway removed"); await load(); }
    catch (err) { toast.error(err.message); }
  };

  const saveResource = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/career/resources", resourceForm);
      toast.success("Resource added");
      setShowResourceForm(false);
      setResourceForm(blankResource);
      await load();
    } catch (err) { toast.error(err.message); }
  };

  const deactivateResource = async (id) => {
    try { await apiClient.delete(`/api/career/resources/${id}`); toast.success("Resource removed"); await load(); }
    catch (err) { toast.error(err.message); }
  };

  const splitSkills = (value) => value.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Career Intelligence</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Career Pathways &amp; Learning Resources</h1>
        <p className="text-gray-600 mt-1">Maintain the skill → role → industry mapping and the course/certification catalogue.</p>
      </header>

      <div className="flex gap-2">
        <button onClick={() => setTab("pathways")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "pathways" ? "bg-indigo-600 text-white" : "bg-white border text-gray-600"}`}><Compass size={14} className="inline mr-1" /> Pathways ({pathways.length})</button>
        <button onClick={() => setTab("resources")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "resources" ? "bg-indigo-600 text-white" : "bg-white border text-gray-600"}`}><BookOpen size={14} className="inline mr-1" /> Resources ({resources.length})</button>
      </div>
{tab === "pathways" ? (
        <>
          <div className="flex justify-end">
            <button onClick={() => { setEditingPathway(null); setPathwayForm(blankPathway); setShowPathwayForm(!showPathwayForm); }} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
              {showPathwayForm ? <X size={15} /> : <Plus size={15} />} {showPathwayForm ? "Cancel" : "Add pathway"}
            </button>
          </div>

          {showPathwayForm && (
            <form onSubmit={savePathway} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold">{editingPathway ? "Edit pathway" : "New career pathway"}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-sm"><span className="text-gray-600">Role *</span><input required value={pathwayForm.role} onChange={(e) => setPathwayForm({ ...pathwayForm, role: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm"><span className="text-gray-600">Industry *</span><input required value={pathwayForm.industry} onChange={(e) => setPathwayForm({ ...pathwayForm, industry: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm sm:col-span-2"><span className="text-gray-600">Description</span><textarea rows={2} value={pathwayForm.description} onChange={(e) => setPathwayForm({ ...pathwayForm, description: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm"><span className="text-gray-600">Required skills (comma)</span><input value={pathwayForm.requiredSkills.join(", ")} onChange={(e) => setPathwayForm({ ...pathwayForm, requiredSkills: splitSkills(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm"><span className="text-gray-600">Nice-to-have skills (comma)</span><input value={pathwayForm.niceToHaveSkills.join(", ")} onChange={(e) => setPathwayForm({ ...pathwayForm, niceToHaveSkills: splitSkills(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm"><span className="text-gray-600">Certifications (comma)</span><input value={pathwayForm.certifications.join(", ")} onChange={(e) => setPathwayForm({ ...pathwayForm, certifications: splitSkills(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm"><span className="text-gray-600">Salary (LPA)</span><input type="number" min={0} value={pathwayForm.averageSalaryLPA} onChange={(e) => setPathwayForm({ ...pathwayForm, averageSalaryLPA: Number(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                  <label className="text-sm"><span className="text-gray-600">Demand level</span><select value={pathwayForm.demandLevel} onChange={(e) => setPathwayForm({ ...pathwayForm, demandLevel: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">{demandOptions.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
                </div>
              </div>
              <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"><Save size={15} /> Save pathway</button>
            </form>
          )}

          <section className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="p-4">Role</th><th className="p-4">Industry</th><th className="p-4">Skills</th><th className="p-4">Demand</th><th className="p-4">Salary</th><th className="p-4">Actions</th></tr></thead>
              <tbody>
                {pathways.map((p) => (
                  <tr key={p._id} className="border-b last:border-0">
                    <td className="p-4 font-medium text-gray-900">{p.role}</td>
                    <td className="p-4 text-gray-600">{p.industry}</td>
                    <td className="p-4"><div className="flex flex-wrap gap-1 max-w-xs">{(Array.isArray(p.requiredSkills) ? p.requiredSkills : []).slice(0, 4).map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded">{s}</span>)}</div></td>
                    <td className="p-4"><span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 capitalize">{p.demandLevel}</span></td>
                    <td className="p-4 text-gray-600">₹{p.averageSalaryLPA} LPA</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingPathway(p); setPathwayForm({ role: p.role, industry: p.industry, description: p.description, requiredSkills: p.requiredSkills || [], niceToHaveSkills: p.niceToHaveSkills || [], averageSalaryLPA: p.averageSalaryLPA, demandLevel: p.demandLevel, certifications: p.certifications || [], relatedRoles: p.relatedRoles || [] }); setShowPathwayForm(true); setTab("pathways"); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Edit"><Pencil size={15} /></button>
                        <button onClick={() => deactivatePathway(p._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Remove"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pathways.length === 0 && <tr><td colSpan={6} className="p-4 text-gray-400">No pathways yet.</td></tr>}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowResourceForm(!showResourceForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
              {showResourceForm ? <X size={15} /> : <Plus size={15} />} {showResourceForm ? "Cancel" : "Add resource"}
            </button>
          </div>

          {showResourceForm && (
            <form onSubmit={saveResource} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold">New learning resource</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-sm"><span className="text-gray-600">Title *</span><input required value={resourceForm.title} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm"><span className="text-gray-600">Provider *</span><input required value={resourceForm.provider} onChange={(e) => setResourceForm({ ...resourceForm, provider: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm"><span className="text-gray-600">Type</span><select value={resourceForm.type} onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">{resourceTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
                <label className="text-sm"><span className="text-gray-600">URL</span><input value={resourceForm.url} onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm"><span className="text-gray-600">Skills (comma)</span><input value={resourceForm.skills.join(", ")} onChange={(e) => setResourceForm({ ...resourceForm, skills: splitSkills(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm"><span className="text-gray-600">Level</span><select value={resourceForm.level} onChange={(e) => setResourceForm({ ...resourceForm, level: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">{["beginner", "intermediate", "advanced"].map((l) => <option key={l} value={l}>{l}</option>)}</select></label>
                <label className="text-sm"><span className="text-gray-600">Duration (hours)</span><input type="number" min={0} value={resourceForm.durationHours} onChange={(e) => setResourceForm({ ...resourceForm, durationHours: Number(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm flex items-end gap-2"><input type="checkbox" checked={resourceForm.isFree} onChange={(e) => setResourceForm({ ...resourceForm, isFree: e.target.checked })} /> <span>Free resource</span></label>
              </div>
              <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"><Save size={15} /> Save resource</button>
            </form>
          )}

          <section className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="p-4">Title</th><th className="p-4">Provider</th><th className="p-4">Type</th><th className="p-4">Level</th><th className="p-4">Cost</th><th className="p-4">Actions</th></tr></thead>
              <tbody>
                {resources.map((r) => (
                  <tr key={r._id} className="border-b last:border-0">
                    <td className="p-4 font-medium text-gray-900">{r.title}</td>
                    <td className="p-4 text-gray-600">{r.provider}</td>
                    <td className="p-4"><span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 capitalize">{r.type}</span></td>
                    <td className="p-4 text-gray-600 capitalize">{r.level}</td>
                    <td className="p-4">{r.isFree ? <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">Free</span> : <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700">Paid</span>}</td>
                    <td className="p-4">
                      <button onClick={() => deactivateResource(r._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Remove"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
                {resources.length === 0 && <tr><td colSpan={6} className="p-4 text-gray-400">No resources yet.</td></tr>}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}