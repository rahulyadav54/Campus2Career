import { useState, useEffect } from "react";
import { X } from "lucide-react";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  institution: "",
  department: "",
  year: "",
  rollNo: "",
  teamName: "",
  teamMembers: "",
  coverLetter: "",
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

/**
 * Modal form for collaboration registration with full required details.
 */
export default function CollaborationRegistrationModal({
  open,
  onClose,
  onSubmit,
  title = "Complete Registration",
  subtitle = "Please fill in all required details to register.",
  showTeamFields = false,
  showCoverLetter = false,
  submitting = false,
}) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    const u = getStoredUser();
    setForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      institution: u.institution || "",
      department: u.department || "",
      year: u.year || "",
      rollNo: u.rollNo || "",
      teamName: "",
      teamMembers: "",
      coverLetter: "",
    });
  }, [open]);

  if (!open) return null;

  const update = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const field = (name, label, type = "text", required = true) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={update}
        required={required}
        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field("name", "Full Name")}
            {field("email", "Email", "email")}
            {field("phone", "Phone", "tel")}
            {field("institution", "College / Institution")}
            {field("department", "Department")}
            {field("year", "Year")}
            {field("rollNo", "Roll Number")}
          </div>

          {showTeamFields && (
            <>
              {field("teamName", "Team Name")}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Members <span className="text-gray-400">(names, comma-separated)</span>
                </label>
                <textarea
                  name="teamMembers"
                  value={form.teamMembers}
                  onChange={update}
                  rows={2}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Member 1, Member 2, …"
                />
              </div>
            </>
          )}

          {showCoverLetter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Letter / Why you want to apply
              </label>
              <textarea
                name="coverLetter"
                value={form.coverLetter}
                onChange={update}
                rows={3}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Brief motivation…"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
