import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { API_URL } from "../../config/api";

export default function OpportunityApprovals() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
  const load = () => fetch(`${API_URL}/api/opportunities/pending`, { headers }).then((response) => response.json()).then((data) => setItems(Array.isArray(data?.opportunities) ? data.opportunities : []));
  useEffect(() => { load(); }, []);
  const update = async (id, status) => {
    const response = await fetch(`${API_URL}/api/opportunities/${id}/status`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
    const data = await response.json();
    setMessage(data.message || `Opportunity ${status}`);
    load();
  };
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Institution governance</p>
        <h1 className="text-3xl font-bold mt-2">Review collaboration opportunities</h1>
        <p className="text-gray-600 mt-2">Approve programs before they become visible to students and academicians.</p>
      </header>
      {message && <p className="text-sm text-indigo-700">{message}</p>}
      <section className="space-y-4">
        {items.map((item) => (
          <article key={item._id} className="bg-white border rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div>
                <h2 className="font-semibold text-lg">{item.title || "Untitled"}</h2>
                <p className="text-sm text-gray-500 capitalize">
                  {(item.type || "opportunity").replace("-", " ")} · {item.audience || "all"} · Submitted by {item.provider?.name || "Unknown"}
                </p>
                <p className="text-gray-700 mt-3">{item.description || ""}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(Array.isArray(item.requiredSkills) ? item.requiredSkills : []).map((skill) => (
                    <span key={skill} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 h-fit">
                <button onClick={() => update(item._id, "approved")} className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg"><Check size={16} />Approve</button>
                <button onClick={() => update(item._id, "rejected")} className="inline-flex items-center gap-1 px-3 py-2 border border-red-200 text-red-700 rounded-lg"><X size={16} />Reject</button>
              </div>
            </div>
          </article>
        ))}
        {!items.length && <p className="text-gray-500">No opportunities are waiting for review.</p>}
      </section>
    </main>
  );
}