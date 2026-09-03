import { useEffect, useState } from "react";
import { Briefcase, GraduationCap, Users, FlaskConical } from "lucide-react";

const categories = ["all", "internship", "job", "training", "certification", "workshop", "fdp", "research", "live-project", "faculty-internship"];
const icons = { internship: Briefcase, job: Briefcase, training: GraduationCap, fdp: GraduationCap, research: FlaskConical, "live-project": Users };

export default function OpportunityHub() {
  const [opportunities, setOpportunities] = useState([]);
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const query = category === "all" ? "" : `?type=${category}`;
    fetch(`http://localhost:5000/api/opportunities${query}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message); return data; })
      .then((data) => setOpportunities(data.opportunities || []))
      .catch((error) => setMessage(error.message || "Unable to load opportunities"));
  }, [category]);

  const apply = async (id) => {
    const response = await fetch(`http://localhost:5000/api/opportunities/${id}/apply`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    const data = await response.json();
    setMessage(data.message);
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header><p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Unified opportunities</p><h1 className="text-3xl font-bold text-gray-900 mt-2">Internships, learning and collaboration</h1><p className="text-gray-600 mt-2">One place for career opportunities and academia-industry programs.</p></header>
      <div className="flex gap-2 overflow-x-auto pb-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`px-3 py-2 rounded-lg border whitespace-nowrap capitalize ${category === item ? "bg-indigo-600 text-white" : "bg-white text-gray-700"}`}>{item.replace("-", " ")}</button>)}</div>
      {message && <p className="text-sm text-indigo-700">{message}</p>}
      <section className="grid md:grid-cols-2 gap-5">{opportunities.map((opportunity) => { const Icon = icons[opportunity.type] || Briefcase; return <article key={opportunity._id} className="bg-white border border-gray-200 rounded-xl p-5"><div className="flex justify-between gap-4"><div className="flex gap-3"><Icon className="text-indigo-600" /><div><h2 className="font-semibold text-lg">{opportunity.title}</h2><p className="text-sm text-gray-500 capitalize">{opportunity.type.replace("-", " ")} · {opportunity.location}</p></div></div><span className="text-xs px-2 py-1 bg-gray-100 rounded h-fit capitalize">{opportunity.audience}</span></div><p className="text-gray-700 mt-4">{opportunity.description}</p><div className="flex flex-wrap gap-2 mt-4">{opportunity.requiredSkills.map((skill) => <span key={skill} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded">{skill}</span>)}</div><button onClick={() => apply(opportunity._id)} className="mt-5 px-4 py-2 bg-gray-900 text-white rounded-lg">Apply</button></article>; })}</section>
      {!opportunities.length && !message && <p className="text-gray-500">No approved opportunities in this category yet.</p>}
    </main>
  );
}