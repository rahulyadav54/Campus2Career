import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Eye, EyeOff, KeyRound, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_URL } from "../../config/api";
import { makeAuthenticatedRequest } from "../../utils/auth";

export default function AccountSettings() {
  const navigate = useNavigate();
  const role = (localStorage.getItem("role") || "student").toLowerCase();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Enter current and new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }
    setSaving(true);
    try {
      const res = await makeAuthenticatedRequest(
        `${API_URL}/api/auth/change-password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        },
        navigate
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");
      if (data.token) localStorage.setItem("token", data.token);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Account</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage password and notification preferences.</p>
      </div>

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Password & Security</h2>
        </div>
        <form onSubmit={onChangePassword} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Current password</span>
            <div className="relative mt-1">
              <input type={showCurrent ? "text" : "password"} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowCurrent((v) => !v)}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">New password</span>
            <div className="relative mt-1">
              <input type={showNew ? "text" : "password"} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowNew((v) => !v)}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Confirm new password</span>
            <input type="password" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </label>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            <Save size={16} /> {saving ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Notification Preferences</h2>
              <p className="text-sm text-gray-500">Control email and in-app alerts.</p>
            </div>
          </div>
          <Link to={`/${role}/notification-preferences`} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
            Manage
          </Link>
        </div>
      </section>
    </main>
  );
}
