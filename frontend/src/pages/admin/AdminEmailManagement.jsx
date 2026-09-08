import { useEffect, useState } from "react";
import { Mail, Send, Eye, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import apiClient from "../../services/apiClient";

export default function AdminEmailManagement() {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cfg, st, lg, tpl] = await Promise.all([
        apiClient.get("/api/admin/email/config"),
        apiClient.get("/api/admin/email/stats"),
        apiClient.get("/api/admin/email/logs?limit=30"),
        apiClient.get("/api/admin/email/templates"),
      ]);
      setConfig(cfg);
      setStats(st.stats);
      setLogs(lg.logs || []);
      setTemplates(tpl.templates || []);
      if (tpl.templates?.length && !selectedTemplate) {
        setSelectedTemplate(tpl.templates[0].key);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    try {
      const data = await apiClient.post(`/api/admin/email/templates/${selectedTemplate}/preview`, {});
      setPreview(data.preview);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestSend = async () => {
    if (!selectedTemplate || !testEmail) return;
    setSending(true);
    try {
      await apiClient.post("/api/admin/email/test", { templateKey: selectedTemplate, recipient: testEmail });
      alert("Test email queued successfully");
      load();
    } catch (e) {
      alert(e.message || "Failed to send test email");
    }
    setSending(false);
  };

  if (loading) return <main className="p-6"><p className="text-gray-500">Loading email management…</p></main>;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Admin</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Email Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Resend: {config?.configured ? <span className="text-green-600 font-medium">Connected</span> : <span className="text-red-600 font-medium">Not configured</span>}
            {config?.fromEmail && ` · ${config.fromEmail}`}
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sent", value: stats.sent, icon: Mail, color: "text-blue-600" },
            { label: "Delivered", value: stats.delivered, icon: CheckCircle, color: "text-green-600" },
            { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-600" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border rounded-xl p-5">
              <div className="flex items-center gap-2 text-gray-500 text-sm"><s.icon size={16} className={s.color} /> {s.label}</div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{s.value}</p>
              <p className="text-xs text-gray-400">Last 24 hours</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Send Test Email</h2>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
            {templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
          </select>
          <input
            type="email"
            placeholder="Recipient email"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handlePreview} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              <Eye size={16} /> Preview
            </button>
            <button onClick={handleTestSend} disabled={sending || !testEmail} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">
              <Send size={16} /> {sending ? "Sending…" : "Send Test"}
            </button>
          </div>
        </section>

        {preview && (
          <section className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Preview: {preview.subject}</h2>
            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <iframe title="Email preview" srcDoc={preview.html} className="w-full h-80 border-0" />
            </div>
          </section>
        )}
      </div>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Emails</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Recipient</th>
                <th className="pb-2 pr-4">Subject</th>
                <th className="pb-2 pr-4">Event</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Sent</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-b last:border-0">
                  <td className="py-2 pr-4 text-gray-700">{log.recipient}</td>
                  <td className="py-2 pr-4 text-gray-700 max-w-xs truncate">{log.subject}</td>
                  <td className="py-2 pr-4 text-gray-500">{log.eventType}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      log.status === "SENT" || log.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                      log.status === "FAILED" || log.status === "BOUNCED" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{log.status}</span>
                  </td>
                  <td className="py-2 text-gray-400">{log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p className="text-gray-500 py-4">No emails logged yet.</p>}
        </div>
      </section>
    </main>
  );
}
