import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, Users, UserCheck, Briefcase, FileText, Award, BookOpen,
  Target, Compass, TrendingUp, Activity, Calendar, MessageSquare,
  Settings, HelpCircle, LogOut, Menu, X, Bell, ChevronDown, Search,
  ClipboardList, GraduationCap, Trophy, Building2, Globe, Presentation,
  Megaphone, Shield, UserPlus, User, KeyRound, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import { Avatar } from "../ui";
import ThemeToggle from "../ThemeToggle";
import { readLocalPreferences } from "../../utils/adminPreferences";

const roleNavConfig = {
  student: {
    title: "Student Portal",
    menu: [
      { group: "Overview", items: [
        { label: "Dashboard", icon: BarChart3, path: "/student" },
      ]},
      { group: "AI Automation", items: [
        { label: "AI Dashboard", icon: Sparkles, path: "/student/ai-dashboard" },
        { label: "AI Career Mission", icon: Target, path: "/student/ai-career-mission" },
        { label: "AI Skill Gap", icon: Activity, path: "/student/ai-skill-gap" },
      ]},
      { group: "Career", items: [
        { label: "Job Openings", icon: Briefcase, path: "/student/jobs" },
        { label: "Job Recommendations", icon: Target, path: "/student/recommendations" },
        { label: "My Applications", icon: FileText, path: "/student/applications" },
        { label: "Career Guidance", icon: Compass, path: "/student/career" },
        { label: "Skill Mapping", icon: TrendingUp, path: "/student/skill-mapping" },
        { label: "Interview Preparation", icon: Presentation, path: "/student/interview-preparation" },
      ]},
      { group: "Learning", items: [
        { label: "My Courses", icon: BookOpen, path: "/student/my-courses" },
        { label: "Explore Courses", icon: GraduationCap, path: "/student/courses" },
        { label: "Skill Assessment", icon: Activity, path: "/student/assessment" },
        { label: "Assessments", icon: FileText, path: "/student/assessments" },
        { label: "Aptitude Tests", icon: ClipboardList, path: "/student/aptitude" },
        { label: "Certificates", icon: Award, path: "/student/certificates" },
        { label: "Digital Portfolio", icon: Building2, path: "/student/portfolio" },
        { label: "Learning Recommendations", icon: BookOpen, path: "/student/learning" },
        { label: "Learning Platforms", icon: Globe, path: "/student/learning-platforms" },
      ]},
      { group: "Community", items: [
        { label: "Announcements", icon: Megaphone, path: "/student/announcements" },
        { label: "Notifications", icon: Bell, path: "/student/notifications" },
        { label: "Workshops & Lectures", icon: Presentation, path: "/student/workshops" },
        { label: "Innovation Challenges", icon: Trophy, path: "/student/challenges" },
        { label: "Live Industry Projects", icon: Building2, path: "/student/projects" },
        { label: "Collaborations", icon: Users, path: "/student/collaborations" },
      ]},
    ],
  },
  admin: {
    title: "Admin Panel",
    menu: [
      { group: "Overview", items: [
        { label: "Dashboard", icon: BarChart3, path: "/admin" },
        { label: "Analytics", icon: TrendingUp, path: "/admin/analytics" },
      ]},
      { group: "Users", items: [
        { label: "User Approvals", icon: UserCheck, path: "/admin/user-approvals" },
        { label: "Student Approvals", icon: Users, path: "/admin/approvals" },
        { label: "User Management", icon: Shield, path: "/admin/users" },
      ]},
      { group: "Content", items: [
        { label: "Job Verification", icon: Briefcase, path: "/admin/job-verification" },
        { label: "Program Approvals", icon: GraduationCap, path: "/admin/opportunity-approvals" },
        { label: "Announcements", icon: Megaphone, path: "/admin/post" },
        { label: "Portfolios", icon: Award, path: "/admin/portfolio-verification" },
        { label: "Question Bank", icon: ClipboardList, path: "/admin/question-bank" },
        { label: "Career Pathways", icon: Compass, path: "/admin/pathways" },
        { label: "Assessments", icon: FileText, path: "/admin/assessments" },
      ]},
      { group: "Learning", items: [
        { label: "Courses", icon: BookOpen, path: "/admin/courses" },
        { label: "Learning Platforms", icon: Globe, path: "/admin/learning-platforms" },
      ]},
      { group: "Analytics", items: [
        { label: "Skill Demand Trends", icon: TrendingUp, path: "/admin/analytics/skill-demand-trends" },
        { label: "Internship Analytics", icon: Briefcase, path: "/admin/analytics/internship-participation" },
        { label: "Student Skill Gaps", icon: Activity, path: "/admin/analytics/student-skill-gaps" },
      ]},
      { group: "Activity", items: [
        { label: "Activity Monitor", icon: Activity, path: "/admin/activities" },
        { label: "Collaborations", icon: Building2, path: "/admin/collaboration" },
        { label: "Notifications", icon: Bell, path: "/admin/notifications" },
      ]},
      { group: "Account", items: [
        { label: "Profile", icon: User, path: "/admin/profile" },
        { label: "Settings", icon: Settings, path: "/admin/settings" },
      ]},
    ],
  },
  recruiter: {
    title: "Recruiter Portal",
    menu: [
      { group: "Overview", items: [
        { label: "Dashboard", icon: BarChart3, path: "/recruiter" },
      ]},
      { group: "Jobs", items: [
        { label: "My Jobs", icon: Briefcase, path: "/recruiter/jobs" },
        { label: "Create Job", icon: FileText, path: "/recruiter/create-job" },
      ]},
      { group: "Candidates", items: [
        { label: "Applications", icon: Users, path: "/recruiter/applications" },
        { label: "Students", icon: UserPlus, path: "/recruiter/students" },
      ]},
      { group: "Engagement", items: [
        { label: "History", icon: Calendar, path: "/recruiter/history" },
        { label: "Analytics", icon: TrendingUp, path: "/recruiter/analytics" },
        { label: "Announcements", icon: Megaphone, path: "/recruiter/announcements" },
        { label: "Assessments", icon: FileText, path: "/recruiter/assessments" },
        { label: "Notifications", icon: Bell, path: "/recruiter/notifications" },
      ]},
    ],
  },
  mentor: {
    title: "Mentor Portal",
    menu: [
      { group: "Overview", items: [
        { label: "Dashboard", icon: BarChart3, path: "/mentor" },
      ]},
      { group: "Mentees", items: [
        { label: "My Mentees", icon: Users, path: "/mentor/mentees" },
        { label: "Approvals", icon: UserCheck, path: "/mentor/approvals" },
        { label: "Progress", icon: TrendingUp, path: "/mentor/progress" },
        { label: "History", icon: Calendar, path: "/mentor/history" },
        { label: "Internships", icon: Briefcase, path: "/mentor/internships" },
        { label: "Notifications", icon: Bell, path: "/mentor/notifications" },
      ]},
    ],
  },
  academician: {
    title: "Academician Portal",
    menu: [
      { group: "Overview", items: [
        { label: "Dashboard", icon: BarChart3, path: "/academician" },
        { label: "Faculty Programs", icon: GraduationCap, path: "/academician/opportunities" },
        { label: "My Applications", icon: FileText, path: "/academician/applications" },
        { label: "Notifications", icon: Bell, path: "/academician/notifications" },
      ]},
    ],
  },
  institution: {
    title: "Institution Portal",
    menu: [
      { group: "Overview", items: [
        { label: "Dashboard", icon: BarChart3, path: "/institution" },
        { label: "Portfolio Verification", icon: Award, path: "/institution/portfolio-verification" },
      ]},
      { group: "Analytics", items: [
        { label: "Skill Demand", icon: TrendingUp, path: "/institution/analytics/skill-demand" },
        { label: "Internship Analytics", icon: Briefcase, path: "/institution/analytics/internship-participation" },
        { label: "Placement Readiness", icon: Target, path: "/institution/analytics/placement-readiness" },
        { label: "Student Skill Gaps", icon: Activity, path: "/institution/analytics/student-skill-gaps" },
        { label: "Assessments", icon: FileText, path: "/institution/assessments" },
        { label: "Notifications", icon: Bell, path: "/institution/notifications" },
      ]},
    ],
  },
};

const DashboardLayout = ({ userRole = "student" }) => {
  const prefs = readLocalPreferences();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    Boolean(prefs.appearance?.sidebarCollapsed || prefs.dashboard?.sidebarBehavior === "collapsed")
  );
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userData, setUserData] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const config = roleNavConfig[userRole] || roleNavConfig.student;

  // ===== Data fetching =====
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        try {
          const parsed = JSON.parse(user);
          setUserData(parsed);
        } catch {
          localStorage.removeItem("user");
        }
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (userRole !== "admin") return;
    const dest = readLocalPreferences().dashboard?.defaultLandingPage;
    if (!dest || dest === "/admin" || dest === "/admin/dashboard") return;
    if (location.pathname === "/admin" || location.pathname === "/admin/dashboard") {
      navigate(dest, { replace: true });
    }
  }, [userRole, location.pathname, navigate]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/notifications/me/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUnreadNotifications(data.unreadCount || 0);
        }
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // ===== Fixed logout =====
  const handleLogout = async () => {
    setProfileDropdown(false);
    const token = localStorage.getItem("token");
    try {
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      /* still clear the local session */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    window.location.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "lg:w-16" : "lg:w-64"}`}
      >
        <div className="h-full overflow-y-auto flex flex-col">
          {/* Logo / Title */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <img src="/campus2career-icon.png" alt="Campus2Career" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xl font-bold text-gray-900">Campus2Career</span>
              </div>
            )}
            {sidebarCollapsed && <img src="/campus2career-icon.png" alt="C2C" className="w-8 h-8 rounded-lg object-cover mx-auto" />}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-1 rounded-md text-gray-500 hover:bg-gray-100"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-6">
            {config.menu.map((section) => (
              <div key={section.group}>
                {!sidebarCollapsed && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                    {section.group}
                  </p>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        title={sidebarCollapsed ? item.label : ""}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors`}
              title={sidebarCollapsed ? "Logout" : ""}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header + main content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-[260px]"}`}>
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          {/* Left: mobile menu + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {config.title.split(" ")[0]}
            </h1>
          </div>

          {/* Center: Quick search */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right: notifications + profile */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => navigate(`/${userRole}/notifications`)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell size={18} />
              {unreadNotifications > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadNotifications}</span>}
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Avatar src={userData?.profileImage} name={userData?.name || "User"} size="sm" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{userData?.name || "User"}</p>
                  <p className="text-[11px] text-gray-500">{userRole === "admin" ? "Administrator" : (userData?.role || userRole)}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              <AnimatePresence>
                {profileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-30"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userData?.name || "User"}</p>
                      <p className="text-xs text-gray-500">{userRole === "admin" ? "Administrator" : (userData?.role || userRole)}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { setProfileDropdown(false); navigate(`/${userRole}/profile`); }}
                        className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <User size={16} /> My Profile
                      </button>
                      <button
                        onClick={() => { setProfileDropdown(false); navigate(userRole === "admin" ? "/admin/settings" : `/${userRole}/profile`); }}
                        className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <Settings size={16} /> Settings
                      </button>
                      {userRole === "admin" && (
                        <>
                          <button
                            onClick={() => { setProfileDropdown(false); navigate("/admin/settings?section=security"); }}
                            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            <KeyRound size={16} /> Security
                          </button>
                          <button
                            onClick={() => { setProfileDropdown(false); navigate("/admin/settings?section=notifications"); }}
                            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            <Bell size={16} /> Notifications
                          </button>
                        </>
                      )}
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut size={16} /> Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={`p-5 lg:p-6 admin-main-pad ${readLocalPreferences().appearance?.compactLayout ? "lg:p-4" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
