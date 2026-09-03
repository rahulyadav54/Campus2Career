import { useEffect, useState } from "react";

export default function Portfolio() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ type: "project", title: "", description: "", issuer: "", evidenceUrl: "" });
  const [message, setMessage] = useState("");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };

  const load = () => fetch("http://localhost:5000/api/portfolio/me", { headers }).then((response) => response.json()).then((data) => setItems(data.items || []));
  useEffect(load, []);
  const submit = async (event) => {
    event.preventDefault();
    const response = await fetch("http://localhost:5000/api/portfolio", { method: "POST", headers, body: JSON.stringify(form) });
    const data = await response.json();
    setMessage(data.message || "Portfolio item added for verification");
    setForm({ ...form, title: "", description: "", issuer: "", evidenceUrl: "" });
    load();
  };
  return <main className="max-w-5xl mx-auto p-6 space-y-6"><header><p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Digital portfolio</p><h1 className="text-3xl font-bold mt-2">Show verified evidence of your growth</h1><p className="text-gray-600 mt-2">Add skills, projects, certificates, internships, and achievements for institution verification.</p></header><form onSubmit={submit} className="bg-white border rounded-xl p-5 grid md:grid-cols-2 gap-4"><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="px-3 py-2 border rounded-lg"><option value="project">Project</option><option value="certificate">Certificate</option><option value="skill">Skill</option><option value="internship">Internship</option><option value="achievement">Achievement</option></select><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title" className="px-3 py-2 border rounded-lg" /><input value={form.issuer} onChange={(event) => setForm({ ...form, issuer: event.target.value })} placeholder="Issuer or institution" className="px-3 py-2 border rounded-lg" /><input value={form.evidenceUrl} onChange={(event) => setForm({ ...form, evidenceUrl: event.target.value })} placeholder="Evidence URL" className="px-3 py-2 border rounded-lg" /><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="md:col-span-2 px-3 py-2 border rounded-lg" /><button className="w-fit px-4 py-2 bg-indigo-600 text-white rounded-lg">Add to portfolio</button>{message && <p className="text-sm text-indigo-700">{message}</p>}</form><section className="grid md:grid-cols-2 gap-4">{items.map((item) => <article key={item._id} className="bg-white border rounded-xl p-5"><div className="flex justify-between gap-3"><h2 className="font-semibold">{item.title}</h2><span className={`text-xs px-2 py-1 rounded ${item.verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{item.verified ? "Verified" : "Pending verification"}</span></div><p className="text-sm text-gray-500 capitalize mt-1">{item.type} {item.issuer && `· ${item.issuer}`}</p><p className="text-gray-700 mt-3">{item.description}</p></article>)}</section></main>;
}