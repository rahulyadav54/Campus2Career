import { useEffect, useState } from "react";
import { Megaphone, AlertCircle, Info, CheckCircle } from "lucide-react";
import apiClient from "../../services/apiClient";

const typeConfig = {
  general: { icon: Info, className: "bg-blue-50 text-blue-700" },
  placement: { icon: CheckCircle, className: "bg-green-50 text-green-700" },
  alert: { icon: AlertCircle, className: "bg-amber-50 text-amber-700" },
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/api/posts/announcements")
      .then((res) => setAnnouncements(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <main className="max-w-4xl mx-auto p-6 text-red-600">{error}</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Announcements</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Latest Updates</h1>
        <p className="text-gray-600 mt-2">Placement cell announcements, alerts, and updates relevant to you.</p>
      </header>

      {announcements.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">No announcements yet.</div>
      ) : (
        <div className="space-y-4">
          {announcements.map((post) => {
            const config = typeConfig[post.type] || typeConfig.general;
            const Icon = config.icon;
            return (
              <div key={post._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.className}`}><Icon size={18} /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900">{post.title}</p>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{post.content}</p>
                    {post.priority === "high" && (
                      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full">High Priority</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
