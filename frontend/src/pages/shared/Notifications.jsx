import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { Bell, CheckCheck, Filter } from "lucide-react";
import apiClient from "../../services/apiClient";

const TYPE_ICONS = {
  job_submitted: "📝",
  job_approved: "✅",
  job_rejected: "❌",
  application_received: "📨",
  interview_scheduled: "📅",
  application_status_update: "🔄",
  recruiter_registered: "🏢",
  system_announcement: "📢",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", unreadOnly: String(unreadOnly) });
      const data = await apiClient.get(`/api/notifications/me?${params}`);
      setNotifications(data.notifications || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await apiClient.get("/api/notifications/me/unread-count");
      setUnreadCount(data.unreadCount || 0);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchNotifications(); fetchUnreadCount(); }, [page, unreadOnly]);

  const markAsRead = async (id) => {
    try {
      await apiClient.post(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) { console.error(e); }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Notifications</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Your notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setUnreadOnly((v) => !v)} className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm ${unreadOnly ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "hover:bg-gray-50"}`}><Filter size={16} /> {unreadOnly ? "Showing unread" : "All notifications"}</button>
          {unreadCount > 0 && <button onClick={markAllAsRead} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"><CheckCheck size={16} /> Mark all read</button>}
        </div>
      </div>

      {loading ? <p className="text-gray-500">Loading notifications…</p> : notifications.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <Bell className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n._id} onClick={() => !n.isRead && markAsRead(n._id)} className={`bg-white border rounded-xl p-5 flex flex-col md:flex-row md:items-start gap-4 cursor-pointer transition-colors ${n.isRead ? "opacity-75" : "border-indigo-200 bg-indigo-50/30"}`}>
              <div className="text-2xl">{TYPE_ICONS[n.type] || "🔔"}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{n.title}</h3>
                  {!n.isRead && <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>}
                </div>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.isRead && <button onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }} className="text-xs text-indigo-600 hover:underline">Mark read</button>}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </main>
  );
}
