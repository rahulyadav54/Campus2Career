import { useEffect, useState } from "react";
import { CheckCircle, ExternalLink } from "lucide-react";
import apiClient from "../../services/apiClient";
import { API_URL } from "../../config/api";

export default function AdminPortfolioVerification() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");

  const load = () =>
    apiClient.get("/api/portfolio/me")
      .then(() => {
        // Admin sees all unverified items via a dedicated query
        return fetch(`${API_URL}/api/portfolio/pending`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }).then((r) => r.json());
      })
      .catch(() => apiClient.get("/api/portfolio/pending"))
      .then((data) => setItems(data?.items || []))
      .catch((err) => setMessage(err.message));

  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    try {
      await apiClient.patch(`/api/portfolio/${id}/verify`, {});
      setMessage("Portfolio item verified");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Admin</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Portfolio Verification</h1>
        <p className="text-gray-600 mt-2">Verify student portfolio evidence submissions.</p>
      </header>
      {message && <p className="text-sm text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg">{message}</p>}
      {items.length === 0 ? (
        <p className="text-gray-500">No portfolio items pending verification.</p>
      ) : (
        <section className="space-y-4">
          {items.map((item) => (
            <article key={item._id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:justify-between gap-3">
                <div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded capitalize">{item.type}</span>
                  <h2 className="font-semibold mt-1">{item.title}</h2>
                  {item.issuer && <p className="text-sm text-gray-500">Issuer: {item.issuer}</p>}
                  {item.description && <p className="text-sm text-gray-700 mt-1">{item.description}</p>}
                  {item.evidenceUrl && (
                    <a href={item.evidenceUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 mt-2 hover:underline">
                      <ExternalLink size={14} /> View evidence
                    </a>
                  )}
                </div>
                <button onClick={() => verify(item._id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium h-fit">
                  <CheckCircle size={16} /> Verify
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
