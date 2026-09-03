import { API_URL } from '../../config/api';
import { useEffect, useState } from "react";
import { BookOpen, Send, Users } from "lucide-react";

const initialForm = {
  title: "",
  description: "",
  type: "fdp",
  audience: "academician",
  requiredSkills: "",
  eligibility: "",
  location: "Remote",
  deadline: "",
  link: ""
};

export default function AcademicianDashboard() {
  const [form, setForm] = useState(initialForm);
  const [submissions, setSubmissions] = useState([]);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  const loadSubmissions = () => {
    fetch(`${API_URL}/api/opportunities`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then((data) => setSubmissions(data.opportunities || []));
  };

  useEffect(() => { loadSubmissions(); }, []);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`${API_URL}/api/opportunities`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        requiredSkills: form.requiredSkills.split(",").map((skill) => skill.trim()).filter(Boolean),
        deadline: form.deadline || undefined
      })
    });
    const data = await response.json();
    setMessage(data.message || "Program submitted for institution approval");
    if (response.ok) {
      setForm(initialForm);
      loadSubmissions();
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Academia workspace</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Connect learning with industry</h1>
        <p className="text-gray-600 mt-2">Publish faculty opportunities and collaboration programs for institution review.</p>
      </header>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3"><BookOpen className="text-indigo-600" /><h2 className="text-xl font-semibold">Publish a program</h2></div>
          <input required name="title" value={form.title} onChange={update} placeholder="Program title" className="w-full px-3 py-2 border rounded-lg" />
          <textarea required name="description" value={form.description} onChange={update} placeholder="Describe the collaboration, outcomes, and schedule" className="w-full px-3 py-2 border rounded-lg min-h-28" />
          <div className="grid md:grid-cols-2 gap-4">
            <select name="type" value={form.type} onChange={update} className="px-3 py-2 border rounded-lg"><option value="fdp">Faculty Development Program</option><option value="faculty-internship">Faculty Internship</option><option value="workshop">Industry Workshop</option><option value="research">Collaborative Research</option><option value="consultancy">Consultancy</option><option value="live-project">Live Industry Project</option><option value="mentorship">Mentorship Program</option><option value="innovation">Innovation Challenge</option></select>
            <select name="audience" value={form.audience} onChange={update} className="px-3 py-2 border rounded-lg"><option value="academician">Academicians</option><option value="student">Students</option><option value="both">Students and Academicians</option></select>
          </div>
          <input name="requiredSkills" value={form.requiredSkills} onChange={update} placeholder="Required skills, comma separated" className="w-full px-3 py-2 border rounded-lg" />
          <input name="eligibility" value={form.eligibility} onChange={update} placeholder="Eligibility" className="w-full px-3 py-2 border rounded-lg" />
          <div className="grid md:grid-cols-2 gap-4"><input name="location" value={form.location} onChange={update} placeholder="Location" className="px-3 py-2 border rounded-lg" /><input type="date" name="deadline" value={form.deadline} onChange={update} className="px-3 py-2 border rounded-lg" /></div>
          <input type="url" name="link" value={form.link} onChange={update} placeholder="Application or information link" className="w-full px-3 py-2 border rounded-lg" />
          {message && <p className="text-sm text-indigo-700">{message}</p>}
          <button className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg font-medium"><Send size={17} />Submit for approval</button>
        </form>

        <section className="bg-gray-900 text-white rounded-xl p-6 h-fit"><Users className="text-indigo-300" /><h2 className="text-xl font-semibold mt-3">Collaboration programs</h2><p className="text-gray-300 mt-2">Create meaningful pathways between classrooms, faculty, and industry partners.</p><div className="grid grid-cols-2 gap-3 mt-6"><div className="bg-white/10 rounded-lg p-3"><p className="text-2xl font-bold">{submissions.length}</p><p className="text-sm text-gray-300">Approved programs</p></div><div className="bg-white/10 rounded-lg p-3"><p className="text-2xl font-bold">{submissions.reduce((total, item) => total + (item.applications?.length || 0), 0)}</p><p className="text-sm text-gray-300">Applications</p></div></div></section>
      </div>
    </main>
  );
}
