import { useEffect, useState } from "react";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import apiClient from "../../services/apiClient";

export default function PortfolioVerification() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState({});

  const load = () =>
    apiClient.get("/api/institutions/me/portfolio/pending")
      .then((data) => setItems(data.items || []))
      .catch((err) => setMessage(err.message));

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      const body = { action };
      if (action === "reject" && rejectionReason[id]) body.rejectionReason = rejectionReason[id];
      await apiClient.patch(`/api/institutions/me/portfolio/${id}/verify`, body);
      setMessage(`Portfolio item ${action}d successfully`);
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Institution Admin</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Portfolio Verification</h1>
        <p className="text-gray-600 mt-2">Review and verify student portfolio evidence submissions.</p>
      </header>

      {message && <p className="text-sm text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg">{message}</p>}

      {items.length === 0 ? (
        <p className="text-gray-500">No portfolio items pending verification.</p>
      ) : (
        <section className="space-y-4">
          {items.map((item) => (
            <article key={item._id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="flex flex-col md:flex-row md:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded capitalize">{item.type}</span>
                    <h2 className="font-semibold text-gray-900">{item.title}</h2>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.owner?.name} · {item.owner?.department} · {item.owner?.rollNo}
                  </p>
                  {item.issuer && <p className="text-sm text-gray-600 mt-1">Issuer: {item.issuer}</p>}
                  {item.description && <p className="text-gray-700 text-sm mt-2">{item.description}</p>}
                  {item.evidenceUrl && (
                    <a href={item.evidenceUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 mt-2 hover:underline">
                      <ExternalLink size={14} /> View evidence
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <button onClick={() => act(item._id, "verify")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                    <CheckCircle size={16} /> Verify
                  </button>
                  <input
                    value={rejectionReason[item._id] || ""}
                    onChange={(e) => setRejectionReason({ ...rejectionReason, [item._id]: e.target.value })}
                    placeholder="Rejection reason (optional)"
                    className="px-3 py-1.5 border rounded-lg text-sm"
                  />
                  <button onClick={() => act(item._id, "reject")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50">
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
