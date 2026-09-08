import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_URL } from "../../config/api";
import { makeAuthenticatedRequest } from "../../utils/auth";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  department: "",
  company: "",
  description: "",
};

export default function AccountProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await makeAuthenticatedRequest(`${API_URL}/api/auth/profile`, {}, navigate);
        const data = await res.json();
        const user = data?.user || data;
        setRole(user.role || "");
        setForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          department: user.department || "",
          company: user.company || "",
          description: user.description || "",
        });
        if (user) localStorage.setItem("user", JSON.stringify(user));
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await makeAuthenticatedRequest(
        `${API_URL}/api/auth/update-profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone,
            department: form.department,
            company: form.company,
            description: form.description,
          }),
        },
        navigate
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      const user = data.user || data;
      if (user) localStorage.setItem("user", JSON.stringify(user));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-gray-500">Loading profile…</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Account</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">Role: {role || "user"}</p>
      </div>

      <form onSubmit={onSave} className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <User size={22} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{form.name || "Your name"}</p>
            <p className="text-sm text-gray-500">{form.email}</p>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Full name</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => onChange("name", e.target.value)} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" value={form.email} disabled />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Phone</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Department</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.department} onChange={(e) => onChange("department", e.target.value)} />
        </label>

        {(role === "recruiter" || form.company) && (
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Company</span>
            <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.company} onChange={(e) => onChange("company", e.target.value)} />
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Bio</span>
          <textarea className="mt-1 w-full border rounded-lg px-3 py-2 text-sm min-h-[100px]" value={form.description} onChange={(e) => onChange("description", e.target.value)} maxLength={500} />
        </label>

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          <Save size={16} /> {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
