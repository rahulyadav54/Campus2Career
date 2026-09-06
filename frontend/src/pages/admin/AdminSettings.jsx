import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell, ChevronDown, Globe, KeyRound, LayoutDashboard, Lock, Monitor,
  Palette, ShieldAlert, Smartphone, User, ScrollText, Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { API_URL } from "../../config/api";
import { makeAuthenticatedRequest } from "../../utils/auth";
import { applyAppearance, passwordChecks, passwordScore, writeLocalPreferences } from "../../utils/adminPreferences";
import { Card, EmptyState, LoadingSkeleton } from "../../components/ui";
import { formatRelativeDate } from "../../lib/utils";
import { Eye, EyeOff } from "lucide-react";

const NAV = [
  { group: "ACCOUNT", items: [
    { id: "profile", label: "Profile", icon: User, to: "/admin/profile" },
    { id: "security", label: "Password & Security", icon: KeyRound },
  ]},
  { group: "PREFERENCES", items: [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "locale", label: "Language & Region", icon: Globe },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "NOTIFICATIONS", items: [
    { id: "notifications", label: "Email Notifications", icon: Bell },
    { id: "push", label: "Push Notifications", icon: Smartphone },
    { id: "alerts", label: "Alerts", icon: ShieldAlert },
  ]},
  { group: "PRIVACY", items: [
    { id: "privacy", label: "Privacy Settings", icon: Lock },
    { id: "activity", label: "Activity Log", icon: ScrollText },
  ]},
  { group: "SESSIONS", items: [
    { id: "sessions", label: "Devices & Sessions", icon: Monitor },
  ]},
  { group: "SYSTEM", items: [
    { id: "system", label: "System Preferences", icon: SettingsIcon },
    { id: "danger", label: "Danger Zone", icon: ShieldAlert },
  ]},
];

const NOTIFICATION_CATEGORIES = [
  { group: "User Management", items: [
    { key: "newUserRegistration", label: "New user registration" },
    { key: "userApprovalRequest", label: "User approval request" },
    { key: "studentApprovalRequest", label: "Student approval request" },
  ]},
  { group: "Content", items: [
    { key: "jobVerification", label: "Job verification" },
    { key: "programApproval", label: "Program approval" },
    { key: "newAnnouncement", label: "New announcement" },
  ]},
  { group: "Assessments", items: [
    { key: "assessmentSubmission", label: "New assessment submission" },
    { key: "assessmentCompletion", label: "Assessment completion" },
    { key: "interviewRequest", label: "New interview request" },
  ]},
  { group: "System", items: [
    { key: "securityAlerts", label: "Security alerts" },
    { key: "systemMaintenance", label: "System maintenance" },
    { key: "importantSystem", label: "Important system notifications" },
  ]},
];

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-gray-300"} ${disabled ? "opacity-50" : ""}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
    {children}
  </label>
);

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const section = params.get("section") || "security";
  const [account, setAccount] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_URL}/api/admin/account`, {}, navigate);
      const data = await res.json();
      setAccount(data);
      setSettings(data.settings);
      writeLocalPreferences(data.settings);
      applyAppearance(data.settings?.appearance);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async (patch) => {
    setSaving(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_URL}/api/admin/account/settings`, {
        method: "PUT",
        body: JSON.stringify(patch),
      }, navigate);
      const data = await res.json();
      setSettings(data.settings);
      writeLocalPreferences(data.settings);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const setSection = (id) => {
    setParams({ section: id });
    setNavOpen(false);
  };

  const currentLabel = useMemo(() => {
    for (const group of NAV) {
      const item = group.items.find((i) => i.id === section);
      if (item) return item.label;
    }
    return "Settings";
  }, [section]);

  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-xs text-gray-500 mb-1">
        <Link to="/admin" className="hover:text-indigo-600">Dashboard</Link>
        <span className="mx-1.5">/</span>
        Settings
      </p>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Manage your account, security and preferences</p>

      <div className="lg:hidden mb-4">
        <button
          onClick={() => setNavOpen(!navOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium"
        >
          {currentLabel}
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className={`${navOpen ? "block" : "hidden"} lg:block bg-white border border-gray-200 rounded-xl p-3 h-fit`}>
          {NAV.map((group) => (
            <div key={group.group} className="mb-4 last:mb-0">
              <p className="px-2 mb-1 text-[11px] font-semibold tracking-wider text-gray-400">{group.group}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.to ? navigate(item.to) : setSection(item.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm ${active ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <div>
          {loading || !settings ? (
            <Card><LoadingSkeleton lines={8} /></Card>
          ) : (
            <SectionBody
              section={section}
              settings={settings}
              setSettings={setSettings}
              account={account}
              saveSettings={saveSettings}
              saving={saving}
              navigate={navigate}
              reload={load}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const SectionBody = (props) => {
  const { section } = props;
  if (section === "security") return <SecurityPanel {...props} />;
  if (section === "appearance" || section === "system") return <AppearancePanel {...props} />;
  if (section === "locale") return <LocalePanel {...props} />;
  if (section === "dashboard") return <DashboardPanel {...props} />;
  if (section === "notifications" || section === "push" || section === "alerts") return <NotificationsPanel {...props} />;
  if (section === "privacy") return <PrivacyPanel {...props} />;
  if (section === "activity") return <ActivityPanel {...props} />;
  if (section === "sessions") return <SessionsPanel {...props} />;
  if (section === "danger") return <DangerPanel {...props} />;
  return <SecurityPanel {...props} />;
};

const SecurityPanel = ({ account, navigate }) => {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ a: false, b: false, c: false });
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [saving, setSaving] = useState(false);
  const checks = passwordChecks(newPassword);
  const score = passwordScore(newPassword);
  const twoFactor = account?.security?.twoFactor || { supported: false, enabled: false };

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast.error("New password and confirmation do not match");
    if (score < 5) return toast.error("Password does not meet all requirements");
    setSaving(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirm,
          signOutOtherDevices: signOutOthers,
        }),
      }, navigate);
      const data = await res.json();
      if (data.token) localStorage.setItem("token", data.token);
      toast.success("Password changed successfully");
      setCurrent(""); setNew(""); setConfirm("");
    } catch (err) {
      toast.error(err.message || "Password change failed");
    } finally {
      setSaving(false);
    }
  };

  const PasswordField = ({ label, value, onChange, which }) => (
    <Field label={label}>
      <div className="relative">
        <input type={show[which] ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} pr-10`} autoComplete="off" />
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShow((s) => ({ ...s, [which]: !s[which] }))}>
          {show[which] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );

  return (
    <div className="space-y-6">
      <Card title="Change Password" description="Use a strong unique password. Passwords are hashed on the server and never stored in plaintext.">
        <form onSubmit={submit} className="space-y-4 max-w-lg">
          <PasswordField label="Current Password" value={currentPassword} onChange={setCurrent} which="a" />
          <PasswordField label="New Password" value={newPassword} onChange={setNew} which="b" />
          <div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className={`h-full ${score <= 2 ? "bg-red-500" : score < 5 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${(score / 5) * 100}%` }} />
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
              {[
                [checks.length, "Minimum 8 characters"],
                [checks.upper, "Uppercase letter"],
                [checks.lower, "Lowercase letter"],
                [checks.number, "Number"],
                [checks.special, "Special character"],
              ].map(([ok, label]) => (
                <li key={label} className={ok ? "text-emerald-600" : "text-gray-500"}>{ok ? "✓" : "○"} {label}</li>
              ))}
            </ul>
          </div>
          <PasswordField label="Confirm New Password" value={confirm} onChange={setConfirm} which="c" />
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" className="mt-1" checked={signOutOthers} onChange={(e) => setSignOutOthers(e.target.checked)} />
            Sign me out of all other devices after changing my password
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Updating..." : "Update password"}
            </button>
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">Forgot password / Reset password</Link>
          </div>
        </form>
      </Card>

      <Card title="Account verification">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Email verification</p>
              <p className="text-gray-500">{account?.user?.email}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${account?.security?.emailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {account?.security?.emailVerified ? "Verified" : "Not verified"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Phone verification</p>
              <p className="text-gray-500">Phone OTP verification is not enabled on this platform.</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {account?.security?.phoneVerified ? "Verified" : "Unavailable"}
            </span>
          </div>
        </div>
      </Card>

      <Card title="Two-Factor Authentication" description="Protect your administrator account with an additional verification step.">
        <p className="text-sm text-gray-600 mb-3">{twoFactor.message}</p>
        <p className="text-sm mb-4">Status: <span className="font-medium">Disabled</span></p>
        <button type="button" disabled className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm cursor-not-allowed">
          Enable 2FA
        </button>
        <p className="text-xs text-gray-400 mt-2">Integration point: connect a TOTP provider to the JWT auth pipeline before enabling this control. Disable / regenerate backup codes will appear here once that provider is wired.</p>
      </Card>

      <Card title="Login alerts" description="Security notifications for this account follow your saved notification preferences.">
        <p className="text-sm text-gray-600">Successful logins are written to your activity log. Enable security alerts under Notifications to receive in-app notices when they are generated by the platform.</p>
      </Card>
    </div>
  );
};

const AppearancePanel = ({ settings, setSettings, saveSettings, saving }) => {
  const appearance = settings.appearance;
  const update = (patch) => {
    const next = { ...settings, appearance: { ...appearance, ...patch } };
    setSettings(next);
    applyAppearance(next.appearance);
  };
  return (
    <Card title="Appearance" description="Theme applies to your admin workspace on this browser after save.">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Theme</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {["light", "dark", "system"].map((theme) => (
              <button key={theme} type="button" onClick={() => update({ theme })} className={`border rounded-xl px-4 py-3 text-sm capitalize ${appearance.theme === theme ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200"}`}>
                {theme === "system" ? "System default" : theme}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between text-sm"><span>Sidebar collapsed</span><Toggle checked={appearance.sidebarCollapsed} onChange={(v) => update({ sidebarCollapsed: v })} /></label>
        <label className="flex items-center justify-between text-sm"><span>Compact layout</span><Toggle checked={appearance.compactLayout} onChange={(v) => update({ compactLayout: v })} /></label>
        <label className="flex items-center justify-between text-sm"><span>Enable animations</span><Toggle checked={appearance.enableAnimations} onChange={(v) => update({ enableAnimations: v })} /></label>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Accent</p>
          <div className="flex gap-2">
            {["indigo", "violet", "blue"].map((c) => (
              <button key={c} type="button" onClick={() => update({ accentColor: c })} className={`w-8 h-8 rounded-full bg-${c}-600 ring-offset-2 ${appearance.accentColor === c ? "ring-2 ring-indigo-500" : ""}`} style={{ backgroundColor: c === "indigo" ? "#4f46e5" : c === "violet" ? "#7c3aed" : "#2563eb" }} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Accent is stored with your preferences. Core screens continue to use the Campus2Career indigo identity.</p>
        </div>
        <button type="button" disabled={saving} onClick={() => saveSettings({ appearance })} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">{saving ? "Saving..." : "Save appearance"}</button>
      </div>
    </Card>
  );
};

const LocalePanel = ({ settings, setSettings, saveSettings, saving }) => {
  const locale = settings.locale;
  const update = (patch) => setSettings({ ...settings, locale: { ...locale, ...patch } });
  return (
    <Card title="Language & Region" description="These values format dates for your account. The application is not fully localized.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <Field label="Language">
          <select className={inputClass} value={locale.language} onChange={(e) => update({ language: e.target.value })}>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label="Time zone">
          <select className={inputClass} value={locale.timeZone} onChange={(e) => update({ timeZone: e.target.value })}>
            {["Asia/Kolkata", "UTC", "America/New_York", "Europe/London"].map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </Field>
        <Field label="Date format">
          <select className={inputClass} value={locale.dateFormat} onChange={(e) => update({ dateFormat: e.target.value })}>
            {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((z) => <option key={z}>{z}</option>)}
          </select>
        </Field>
        <Field label="Time format">
          <select className={inputClass} value={locale.timeFormat} onChange={(e) => update({ timeFormat: e.target.value })}>
            <option value="12h">12-hour</option>
            <option value="24h">24-hour</option>
          </select>
        </Field>
      </div>
      <button type="button" disabled={saving} onClick={() => saveSettings({ locale })} className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">{saving ? "Saving..." : "Save region"}</button>
    </Card>
  );
};

const DashboardPanel = ({ settings, setSettings, saveSettings, saving }) => {
  const dashboard = settings.dashboard;
  const update = (patch) => setSettings({ ...settings, dashboard: { ...dashboard, ...patch } });
  return (
    <Card title="Dashboard" description="Controls your default admin landing page and list density.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <Field label="Default landing page">
          <select className={inputClass} value={dashboard.defaultLandingPage} onChange={(e) => update({ defaultLandingPage: e.target.value })}>
            <option value="/admin">Dashboard</option>
            <option value="/admin/users">User Management</option>
            <option value="/admin/user-approvals">User Approvals</option>
            <option value="/admin/job-verification">Job Verification</option>
            <option value="/admin/analytics">Analytics</option>
          </select>
        </Field>
        <Field label="Items per page">
          <select className={inputClass} value={dashboard.itemsPerPage} onChange={(e) => update({ itemsPerPage: Number(e.target.value) })}>
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Dashboard density">
          <select className={inputClass} value={dashboard.density} onChange={(e) => update({ density: e.target.value })}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </Field>
        <Field label="Sidebar behavior">
          <select className={inputClass} value={dashboard.sidebarBehavior} onChange={(e) => update({ sidebarBehavior: e.target.value })}>
            <option value="expanded">Expanded</option>
            <option value="collapsed">Collapsed</option>
            <option value="auto">Auto</option>
          </select>
        </Field>
      </div>
      <button type="button" disabled={saving} onClick={() => saveSettings({ dashboard })} className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">{saving ? "Saving..." : "Save dashboard preferences"}</button>
    </Card>
  );
};

const NotificationsPanel = ({ settings, setSettings, saveSettings, saving, section }) => {
  const n = settings.notifications;
  const updateCat = (key, value) => setSettings({
    ...settings,
    notifications: { ...n, categories: { ...n.categories, [key]: value } },
  });
  const updateChannel = (key, value) => setSettings({
    ...settings,
    notifications: { ...n, channels: { ...n.channels, [key]: value } },
  });
  return (
    <div className="space-y-6">
      {(section === "notifications" || section === "push" || section === "alerts") && (
        <Card title="Notification channels">
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm"><span>Email</span><Toggle checked={n.channels.email} onChange={(v) => updateChannel("email", v)} /></label>
            <label className="flex items-center justify-between text-sm">
              <span>Push <span className="text-gray-400 font-normal">(browser push is not configured)</span></span>
              <Toggle checked={n.channels.push} onChange={(v) => updateChannel("push", v)} />
            </label>
            <label className="flex items-center justify-between text-sm"><span>In-app</span><Toggle checked={n.channels.inApp} onChange={(v) => updateChannel("inApp", v)} /></label>
          </div>
          <Field label="Frequency">
            <select className={`${inputClass} mt-3 max-w-xs`} value={n.frequency} onChange={(e) => setSettings({ ...settings, notifications: { ...n, frequency: e.target.value } })}>
              <option value="immediate">Immediately</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </Field>
        </Card>
      )}
      <Card title="Categories" description="These preferences are stored on your admin account and used when the notification service checks your settings.">
        <div className="space-y-6">
          {NOTIFICATION_CATEGORIES.map((group) => (
            <div key={group.group}>
              <p className="text-sm font-semibold text-gray-900 mb-3">{group.group}</p>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <label key={item.key} className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <Toggle checked={Boolean(n.categories[item.key])} onChange={(v) => updateCat(item.key, v)} />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button type="button" disabled={saving} onClick={() => saveSettings({ notifications: n })} className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">{saving ? "Saving..." : "Save notification preferences"}</button>
      </Card>
    </div>
  );
};

const PrivacyPanel = ({ settings, setSettings, saveSettings, saving }) => {
  const p = settings.privacy;
  const update = (patch) => setSettings({ ...settings, privacy: { ...p, ...patch } });
  return (
    <Card title="Privacy" description="Only settings that this backend actually stores are shown.">
      <div className="space-y-4 max-w-xl">
        <Field label="Profile visibility">
          <select className={inputClass} value={p.profileVisibility} onChange={(e) => update({ profileVisibility: e.target.value })}>
            <option value="private">Private</option>
            <option value="staff">Staff</option>
            <option value="public">Public</option>
          </select>
        </Field>
        <label className="flex items-center justify-between text-sm"><span>Show email</span><Toggle checked={p.showEmail} onChange={(v) => update({ showEmail: v })} /></label>
        <label className="flex items-center justify-between text-sm"><span>Show phone</span><Toggle checked={p.showPhone} onChange={(v) => update({ showPhone: v })} /></label>
        <label className="flex items-center justify-between text-sm"><span>Login alerts</span><Toggle checked={p.loginAlerts} onChange={(v) => update({ loginAlerts: v })} /></label>
        <Field label="Activity visibility">
          <select className={inputClass} value={p.activityVisibility} onChange={(e) => update({ activityVisibility: e.target.value })}>
            <option value="self">Only me</option>
            <option value="admins">Administrators</option>
          </select>
        </Field>
        <button type="button" disabled={saving} onClick={() => saveSettings({ privacy: p })} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">{saving ? "Saving..." : "Save privacy settings"}</button>
      </div>
    </Card>
  );
};

const ActivityPanel = ({ navigate }) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(nextPage), limit: "10", search, action, startDate, endDate });
      const res = await makeAuthenticatedRequest(`${API_URL}/api/admin/account/activity?${q}`, {}, navigate);
      const data = await res.json();
      setItems(data.items || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  return (
    <Card title="Activity Log" description="Actions recorded for your administrator account.">
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input className={inputClass} placeholder="Search actions" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input className={inputClass} placeholder="Filter by action" value={action} onChange={(e) => setAction(e.target.value)} />
        <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button type="button" onClick={() => load(1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm whitespace-nowrap">Apply</button>
      </div>
      {loading ? <LoadingSkeleton lines={6} /> : items.length === 0 ? (
        <EmptyState title="No activity yet" description="Admin actions you take will appear here." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Date/time</th>
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Device</th>
                <th className="py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="py-2 pr-3 font-medium text-gray-900">{row.action}</td>
                  <td className="py-2 pr-3 text-gray-600">{row.date ? new Date(row.date).toLocaleString() : "—"}</td>
                  <td className="py-2 pr-3">{row.user || "—"}</td>
                  <td className="py-2 pr-3">{row.device || "—"}</td>
                  <td className="py-2">{row.ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Previous</button>
        <span className="text-sm py-1.5 text-gray-500">Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Next</button>
      </div>
    </Card>
  );
};

const SessionsPanel = ({ navigate }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_URL}/api/auth/sessions`, {}, navigate);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const parseUa = (ua) => {
    let browser = "Unknown browser";
    if (/edg/i.test(ua)) browser = "Microsoft Edge";
    else if (/chrome/i.test(ua)) browser = "Chrome";
    else if (/firefox/i.test(ua)) browser = "Firefox";
    else if (/safari/i.test(ua)) browser = "Safari";
    let os = "Unknown OS";
    if (/windows/i.test(ua)) os = "Windows";
    else if (/mac os/i.test(ua)) os = "macOS";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad/i.test(ua)) os = "iOS";
    else if (/linux/i.test(ua)) os = "Linux";
    return `${browser} • ${os}`;
  };

  const revoke = async (id) => {
    if (!window.confirm("Revoke this session?")) return;
    try {
      await makeAuthenticatedRequest(`${API_URL}/api/auth/sessions/${id}`, { method: "DELETE" }, navigate);
      toast.success("Session revoked");
      load();
    } catch (err) {
      toast.error(err.message || "Could not revoke session");
    }
  };

  const revokeOthers = async () => {
    if (!window.confirm("Sign out of all other devices?")) return;
    try {
      await makeAuthenticatedRequest(`${API_URL}/api/auth/sessions/revoke-others`, { method: "POST" }, navigate);
      toast.success("Signed out of other devices");
      load();
    } catch (err) {
      toast.error(err.message || "Could not sign out other devices");
    }
  };

  return (
    <Card title="Devices & Sessions" description="Only sessions created after this update are listed. IP and location are shown only when the server recorded them.">
      {loading ? <LoadingSkeleton lines={4} /> : sessions.length === 0 ? (
        <EmptyState title="No tracked sessions" description="Sign in again to register this device. Older JWT sessions without a session id are not listed." />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-200 rounded-xl p-4">
              <div>
                <p className="font-medium text-gray-900">{parseUa(s.userAgent)}</p>
                <p className="text-sm text-gray-500">
                  {s.current ? "Current device · Active now" : `Last active ${s.lastActiveAt ? formatRelativeDate(s.lastActiveAt) : "—"}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">IP: {s.ipAddress || "Not recorded"} · Location unavailable</p>
              </div>
              {s.current ? (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 self-start">Current</span>
              ) : (
                <button type="button" onClick={() => revoke(s.id)} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg">Revoke</button>
              )}
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={revokeOthers} className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Sign out of all other devices</button>
    </Card>
  );
};

const DangerPanel = ({ navigate }) => {
  const [mode, setMode] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [working, setWorking] = useState(false);

  const finishLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/login");
  };

  const run = async () => {
    if (mode === "deactivate" && confirm !== "DEACTIVATE") return toast.error("Type DEACTIVATE to confirm");
    if (mode === "delete" && confirm !== "DELETE") return toast.error("Type DELETE to confirm");
    setWorking(true);
    try {
      const path = mode === "deactivate" ? "/api/admin/account/deactivate" : "/api/admin/account/delete";
      await makeAuthenticatedRequest(`${API_URL}${path}`, {
        method: "POST",
        body: JSON.stringify({ password, confirm }),
      }, navigate);
      toast.success(mode === "deactivate" ? "Account deactivated" : "Account deleted");
      finishLogout();
    } catch (err) {
      toast.error(err.message || "Request failed");
    } finally {
      setWorking(false);
    }
  };

  const signOutAll = async () => {
    if (!window.confirm("Sign out of all other devices?")) return;
    try {
      await makeAuthenticatedRequest(`${API_URL}/api/auth/sessions/revoke-others`, { method: "POST" }, navigate);
      toast.success("Signed out of other devices");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card title="Danger Zone" className="border-red-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl">
          <div>
            <p className="font-medium text-gray-900">Sign out of all devices</p>
            <p className="text-sm text-gray-500">Revokes other tracked sessions. This device stays signed in.</p>
          </div>
          <button type="button" onClick={signOutAll} className="px-3 py-2 text-sm border rounded-lg">Sign out others</button>
        </div>
        <div className="flex items-center justify-between gap-4 p-4 border border-amber-200 bg-amber-50 rounded-xl">
          <div>
            <p className="font-medium text-gray-900">Deactivate account</p>
            <p className="text-sm text-gray-600">Requires your password and typing DEACTIVATE.</p>
          </div>
          <button type="button" onClick={() => setMode("deactivate")} className="px-3 py-2 text-sm border border-amber-300 text-amber-800 rounded-lg">Deactivate</button>
        </div>
        <div className="flex items-center justify-between gap-4 p-4 border border-red-200 bg-red-50 rounded-xl">
          <div>
            <p className="font-medium text-gray-900">Delete account</p>
            <p className="text-sm text-gray-600">Permanent. Requires password and typing DELETE. The last admin cannot be deleted.</p>
          </div>
          <button type="button" onClick={() => setMode("delete")} className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg">Delete</button>
        </div>
        {mode && (
          <div className="p-4 border border-gray-200 rounded-xl space-y-3">
            <p className="text-sm font-medium">Confirm {mode === "delete" ? "deletion" : "deactivation"}</p>
            <input type="password" className={inputClass} placeholder="Current password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className={inputClass} placeholder={mode === "delete" ? "Type DELETE" : "Type DEACTIVATE"} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" disabled={working} onClick={run} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">{working ? "Working..." : "Confirm"}</button>
              <button type="button" onClick={() => { setMode(null); setPassword(""); setConfirm(""); }} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AdminSettings;
