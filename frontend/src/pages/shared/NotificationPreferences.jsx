import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Mail, Save } from "lucide-react";
import apiClient from "../../services/apiClient";

const EMAIL_LABELS = {
  account: "Account updates",
  application: "Application updates",
  interview: "Interview updates",
  jobRecommendations: "Job recommendations",
  resume: "Resume updates",
  careerTips: "Career tips",
  jobDigest: "Weekly job digest",
  security: "Security alerts",
};

const INAPP_LABELS = {
  application: "Application updates",
  interview: "Interview updates",
  resume: "Resume updates",
  jobRecommendations: "Job recommendations",
  account: "Account updates",
};

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [prefData, histData] = await Promise.all([
          apiClient.get("/api/notifications/preferences"),
          apiClient.get("/api/notifications/email-history?limit=10"),
        ]);
        setPrefs(prefData.preferences);
        setEmailHistory(histData.emails || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  const toggle = (section, key) => {
    setPrefs((p) => ({
      ...p,
      [section]: { ...p[section], [key]: !p[section][key] },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = await apiClient.put("/api/notifications/preferences", {
        email: prefs.email,
        inApp: prefs.inApp,
        digestFrequency: prefs.digestFrequency,
      });
      setPrefs(data.preferences);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (loading) return <main className="max-w-3xl mx-auto p-6"><p className="text-gray-500">Loading preferences…</p></main>;
  if (!prefs) return <main className="max-w-3xl mx-auto p-6"><p className="text-gray-500">Unable to load preferences.</p></main>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Settings</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Notification Preferences</h1>
        <p className="text-sm text-gray-500 mt-1">Control how Campus2Career notifies you. Security and account emails may still be sent when required.</p>
      </div>

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Email Notifications</h2>
        </div>
        {Object.entries(EMAIL_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between py-2 border-b last:border-0">
            <span className="text-sm text-gray-700">{label}</span>
            <button
              type="button"
              onClick={() => toggle("email", key)}
              className={`relative w-11 h-6 rounded-full transition-colors ${prefs.email[key] ? "bg-indigo-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs.email[key] ? "translate-x-5" : ""}`} />
            </button>
          </label>
        ))}
        <div className="pt-2">
          <label className="text-sm text-gray-700">Digest frequency</label>
          <select
            className="mt-1 block w-full max-w-xs border rounded-lg px-3 py-2 text-sm"
            value={prefs.digestFrequency}
            onChange={(e) => setPrefs((p) => ({ ...p, digestFrequency: e.target.value }))}
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">In-App Notifications</h2>
        </div>
        {Object.entries(INAPP_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between py-2 border-b last:border-0">
            <span className="text-sm text-gray-700">{label}</span>
            <button
              type="button"
              onClick={() => toggle("inApp", key)}
              className={`relative w-11 h-6 rounded-full transition-colors ${prefs.inApp[key] ? "bg-indigo-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs.inApp[key] ? "translate-x-5" : ""}`} />
            </button>
          </label>
        ))}
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        <Save size={16} /> {saving ? "Saving…" : "Save preferences"}
      </button>

      {emailHistory.length > 0 && (
        <section className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Email Activity</h2>
          <ul className="space-y-2">
            {emailHistory.map((e) => (
              <li key={e._id} className="flex justify-between text-sm py-2 border-b last:border-0">
                <span className="text-gray-700">{e.subject}</span>
                <span className="text-gray-400">{e.sentAt ? new Date(e.sentAt).toLocaleDateString() : e.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
