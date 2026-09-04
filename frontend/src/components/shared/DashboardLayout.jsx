import { API_URL } from '../../config/api';
import { refreshSession } from '../../services/auth';
import AIChatbot from '../AIChatbot';
// src/pages/dashboard/DashboardLayout.jsx
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bell,
  LogOut,
  Menu,
  X,
  User,
  Briefcase,
  Users,
  BarChart3,
  CheckCircle,
  Award,
  GraduationCap,
  Megaphone,
  History,
  Activity,
  Compass,
  BookOpen,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

const DashboardLayout = ({ userRole = "student" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Always seed from localStorage first so the UI renders immediately
      const cached = JSON.parse(localStorage.getItem("user") || "null");
      if (cached) setUserData(cached);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        let res = await fetch(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.status === 401 && await refreshSession()) {
          const renewedToken = localStorage.getItem("token");
          res = await fetch(`${API_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${renewedToken}` },
            cache: "no-store",
          });
        }

        if (res.ok) {
          const data = await res.json();
          const user = data.user || data.student;
          // Only redirect on a real role mismatch from a fresh token
          if (user.role !== userRole) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
            return;
          }
          localStorage.setItem("user", JSON.stringify(user));
          setUserData(user);
        } else if (res.status === 401) {
          // Token truly invalid — force logout with toast only if user was active
          const hadUser = !!localStorage.getItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (hadUser) toast.error("Session expired. Please login again.");
          navigate("/login");
        }
        // For any other status (429, 503, etc.) keep the cached user and stay on dashboard
      } catch (error) {
        // Network error or timeout — keep cached user, don't redirect
        console.warn("Profile fetch failed, using cached user:", error.message);
      }
    };
    fetchUserData();
  }, [userRole, navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;
    const events = new EventSource(`${API_URL}/api/realtime/events?token=${encodeURIComponent(token)}`);
    events.addEventListener("notification", (event) => {
      const notification = JSON.parse(event.data);
      toast(notification.title || "You have a new notification", { icon: "!" });
    });
    return () => events.close();
  }, []);

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      refreshSession().catch(() => {});
    }, 6 * 60 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, []);

  const menuConfig = {
    student: {
      title: "Campus2Career",
      items: [
        { path: "/student", label: "Dashboard", icon: BarChart3 },
        { path: "/student/profile", label: "Profile", icon: User },
        { path: "/student/jobs", label: "Job Openings", icon: Briefcase },
        { path: "/student/recommendations", label: "Job Recommendations", icon: CheckCircle },
        { path: "/student/assessment", label: "Skill Assessment", icon: Activity },
        { path: "/student/opportunities", label: "Learning & Programs", icon: Award },
        {
          path: "/student/applications",
          label: "My Applications",
          icon: Users,
        },
        { path: "/student/certificates", label: "Certificates", icon: Award },
        { path: "/student/portfolio", label: "Digital Portfolio", icon: Award },
        { path: "/student/career", label: "Career Guidance", icon: Compass },
        { path: "/student/skill-mapping", label: "Skill Mapping", icon: TrendingUp },
        { path: "/student/learning", label: "Learning Recommendations", icon: BookOpen },
        { path: "/student/internships", label: "Internships", icon: ClipboardList },
      ],
    },
    mentor: {
      title: "Campus Connect - Mentor",
      items: [
        { path: "/mentor", label: "Dashboard", icon: BarChart3 },
        { path: "/mentor/mentees", label: "My Students", icon: Users },
        {
          path: "/mentor/approvals",
          label: "Pending Approvals",
          icon: CheckCircle,
        },
        {
          path: "/mentor/progress",
          label: "Progress Tracking",
          icon: BarChart3,
        },
        {
          path: "/mentor/history",
          label: "Application History",
          icon: History,
        },
        {
          path: "/mentor/internships",
          label: "Internship Progress",
          icon: ClipboardList,
        },
      ],
    },
    academician: {
      title: "Campus2Career - Academia",
      items: [
        { path: "/academician", label: "Academia Hub", icon: BarChart3 },
        { path: "/academician/opportunities", label: "Faculty Programs", icon: GraduationCap },
      ],
    },
    recruiter: {
      title: "Recruiter Portal",
      items: [
        { path: "/recruiter", label: "Dashboard", icon: BarChart3 },
        { path: "/recruiter/jobs", label: "Job Management", icon: Briefcase },
        { path: "/recruiter/applications", label: "Applications", icon: Users },
        { path: "/recruiter/students", label: "Students", icon: Users },
        {
          path: "/recruiter/history",
          label: "History",
          icon: History,
        },
      ],
    },
    admin: {
      title: "Campus2Career - Placement Cell",
      items: [
        { path: "/admin", label: "Dashboard", icon: BarChart3 },
        { path: "/admin/user-approvals", label: "User Approvals", icon: CheckCircle },
        { path: "/admin/job-verification", label: "Job Verification", icon: Briefcase },
        { path: "/admin/opportunity-approvals", label: "Program Approvals", icon: CheckCircle },
        { path: "/admin/approvals", label: "Student Approvals", icon: Users },
        { path: "/admin/users", label: "User Management", icon: Users },
        { path: "/admin/activities", label: "Activity Monitor", icon: Activity },
        { path: "/admin/post", label: "Announcements", icon: Megaphone },
        { path: "/admin/portfolio-verification", label: "Portfolio Verification", icon: Award },
        { path: "/admin/question-bank", label: "Question Bank", icon: GraduationCap },
        { path: "/admin/pathways", label: "Career Pathways", icon: Compass },
        { path: "/admin/analytics", label: "Analytics Dashboard", icon: TrendingUp },
      ],
    },
    institution: {
      title: "Campus2Career - Institution",
      items: [
        { path: "/institution", label: "Dashboard", icon: BarChart3 },
        { path: "/institution/portfolio-verification", label: "Portfolio Verification", icon: Award },
      ],
    },
  };

  const config = menuConfig[userRole];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <header className="flex justify-between items-center bg-white/90 backdrop-blur-md shadow-md px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-500 text-sm">
              Welcome back, {userData?.name || "User"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          

          {/* User Info */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {userData?.name?.charAt(0) || "U"}
            </div>
            <span className="hidden sm:block font-medium text-gray-900">
              {userData?.name || "User"}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex flex-1">
        {/* SIDEBAR */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0 translate-y-20 w-full" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 ${
            sidebarCollapsed ? "w-16" : "w-64"
          } bg-white shadow-lg transition-all duration-300`}
        >
          <div className="px-3 py-4">
            {/* Collapse Toggle - Desktop Only */}
            <div className="hidden lg:flex justify-end mb-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={16} className={`transition-transform duration-300 ${
                  sidebarCollapsed ? "rotate-180" : ""
                }`} />
              </button>
            </div>
            
            <nav className="flex flex-col gap-2">
              {config.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors relative group ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    title={sidebarCollapsed ? item.label : ""}
                  >
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      {typeof Icon === "string" ? (
                        <span className="text-lg">{Icon}</span>
                      ) : (
                        <Icon size={20} className="flex-shrink-0" />
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* CONTENT */}
        <main className={`flex-1 bg-gradient-to-br from-slate-50 via-indigo-50 to-indigo-100 transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-0" : ""
        }`}>
          <Outlet />
        </main>
      </div>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* AI Career Advisor Chatbot */}
      <AIChatbot />
    </div>
  );
};

export default DashboardLayout;
