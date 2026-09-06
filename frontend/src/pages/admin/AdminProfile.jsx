import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Check, Pencil, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_URL } from "../../config/api";
import { makeAuthenticatedRequest } from "../../utils/auth";
import { Avatar, Card, LoadingSkeleton, RoleBadge, StatusBadge } from "../../components/ui";
import { formatDate, formatRelativeDate } from "../../lib/utils";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  employeeId: "",
  description: "",
};

const AdminProfile = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_URL}/api/auth/profile`, {}, navigate);
      const data = await res.json();
      const user = data?.user || data;
      setProfile(user);
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
        designation: user.designation || "",
        employeeId: user.employeeId || "",
        description: user.description || "",
      });
      if (user) localStorage.setItem("user", JSON.stringify(user));
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const onLeave = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required";
    if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) next.phone = "Enter a valid phone number";
    if (form.description.length > 500) next.description = "Bio must be 500 characters or less";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_URL}/api/auth/update-profile`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          department: form.department.trim(),
          designation: form.designation.trim(),
          employeeId: form.employeeId.trim(),
          description: form.description.trim(),
        }),
      }, navigate);
      const data = await res.json();
      const user = data.user || { ...profile, ...form };
      setProfile(user);
      localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), ...user }));
      toast.success("Profile updated successfully");
      setEditing(false);
      setDirty(false);
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setForm({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      department: profile?.department || "",
      designation: profile?.designation || "",
      employeeId: profile?.employeeId || "",
      description: profile?.description || "",
    });
    setErrors({});
    setEditing(false);
    setDirty(false);
  };

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2MB or smaller");
      return;
    }
    const body = new FormData();
    body.append("avatar", file);
    try {
      const res = await makeAuthenticatedRequest(`${API_URL}/api/admin/account/avatar`, { method: "POST", body }, navigate);
      const data = await res.json();
      if (data.profileImage) {
        setProfile((prev) => ({ ...prev, profileImage: data.profileImage }));
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, profileImage: data.profileImage }));
        toast.success("Profile photo updated");
      }
    } catch (err) {
      toast.error(err.message || "Could not upload photo");
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <LoadingSkeleton lines={2} />
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <LoadingSkeleton avatar lines={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-xs text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-indigo-600">Dashboard</Link>
          <span className="mx-1.5">/</span>
          Profile
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, security and preferences</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative">
            <Avatar src={profile?.profileImage} name={profile?.name} size="3xl" className="text-xl" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700"
              title="Upload profile picture"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => uploadAvatar(e.target.files?.[0])}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-gray-900 truncate">{profile?.name}</h2>
              <RoleBadge role="admin" />
              <StatusBadge status={profile?.isActive === false ? "inactive" : "active"}>
                {profile?.isActive === false ? "Deactivated" : "Active"}
              </StatusBadge>
            </div>
            <p className="text-sm text-gray-600">{profile?.email}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
              <span>Last login: {profile?.lastLogin ? formatRelativeDate(profile.lastLogin) : "—"}</span>
              <span>Member since: {formatDate(profile?.createdAt)}</span>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSave}>
        <Card
          title="Profile information"
          description="These details are stored on your administrator account."
          headerAction={
            editing ? (
              <div className="flex gap-2">
                <button type="button" onClick={handleCancel} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  <X size={14} /> Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  <Check size={14} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                <Pencil size={14} /> Edit Profile
              </button>
            )
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Full Name", required: true },
              { key: "email", label: "Email", disabled: true, hint: "Email cannot be changed from this screen." },
              { key: "phone", label: "Phone" },
              { key: "department", label: "Department" },
              { key: "designation", label: "Job Title" },
              { key: "employeeId", label: "Employee/Admin ID" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  value={form[field.key]}
                  disabled={!editing || field.disabled}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
                {errors[field.key] && <p className="text-xs text-red-600 mt-1">{errors[field.key]}</p>}
                {field.hint && <p className="text-xs text-gray-400 mt-1">{field.hint}</p>}
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                rows={4}
                disabled={!editing}
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">{form.description.length}/500</p>
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default AdminProfile;
