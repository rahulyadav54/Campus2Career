import { useState, useEffect, useMemo } from "react";
import {
  Briefcase, Users, FileText, Calendar, TrendingUp, Target,
  Clock, CheckCircle, User, BarChart3, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import { StatCard, LoadingSkeleton, EmptyState, StatusBadge } from "../../components/ui";
import AnnouncementBanner from "../../components/AnnouncementBanner";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    approvedStudents: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [recruiterInfo, setRecruiterInfo] = useState({ name: "", company: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const [profileRes, jobsRes, studentsRes, appsRes] = await Promise.allSettled([
          axios.get(`${API_URL}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/jobs/recruiter`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/recruiter/students`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/applications/recruiter`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (profileRes.status === "fulfilled") {
          const user = profileRes.value.data.user || profileRes.value.data;
          setRecruiterInfo({ name: user.name, company: user.company });
        }

        const jobs = jobsRes.status === "fulfilled" ? (jobsRes.value.data || []) : [];
        const students = studentsRes.status === "fulfilled" ? (studentsRes.value.data || []) : [];
        const applications = appsRes.status === "fulfilled" ? (appsRes.value.data || []) : [];

        const activeJobs = jobs.filter((job) => job.isActive).length;
        const pendingApplications = applications.filter((app) => app.status === "pending recruiter review").length;
        const interviewsScheduled = applications.filter((app) => app.status === "interview scheduled").length;
        const hired = applications.filter((app) => app.status === "hired").length;

        setStats({
          totalJobs: jobs.length,
          activeJobs,
          totalApplications: applications.length,
          approvedStudents: students.length,
          pendingApplications,
          interviewsScheduled,
          hired,
        });

        setRecentJobs(jobs.slice(0, 5));
        setRecentApplications(applications.slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          toast.error("Could not load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const statCards = useMemo(() => [
    {
      icon: Briefcase,
      iconColor: "indigo",
      value: stats.totalJobs,
      label: "Total Jobs",
      sublabel: `${stats.activeJobs} active`,
    },
    {
      icon: Users,
      iconColor: "blue",
      value: stats.totalApplications,
      label: "Applications",
      sublabel: `${stats.pendingApplications || 0} pending`,
    },
    {
      icon: Calendar,
      iconColor: "purple",
      value: stats.interviewsScheduled || 0,
      label: "Interviews",
      sublabel: "Scheduled",
    },
    {
      icon: CheckCircle,
      iconColor: "green",
      value: stats.hired || 0,
      label: "Hires",
      sublabel: "Successfully placed",
    },
    {
      icon: Users,
      iconColor: "orange",
      value: stats.approvedStudents,
      label: "Eligible Students",
      sublabel: "For your jobs",
    },
  ], [stats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={2} />
          ))}
        </div>
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {recruiterInfo.company ? `${recruiterInfo.company} Recruiting` : "Recruiter Dashboard"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {recruiterInfo.name || "Recruiter"}
          </p>
        </div>
        <button
          onClick={() => navigate("/recruiter/create-job")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
        >
          <Briefcase className="w-4 h-4" />
          Post New Job
        </button>
      </div>

      {/* Announcements */}
      <AnnouncementBanner />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard
            key={i}
            icon={card.icon}
            iconColor={card.iconColor}
            value={card.value}
            label={card.label}
            sublabel={card.sublabel}
            loading={loading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate("/recruiter/create-job")}
                className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition text-left"
              >
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="font-medium text-indigo-900">New Job Post</div>
                  <div className="text-xs text-indigo-600 mt-0.5">Create a job listing</div>
                </div>
              </button>
              <button
                onClick={() => navigate("/recruiter/applications")}
                className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-left"
              >
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Review Applications</div>
                  <div className="text-xs text-blue-600 mt-0.5">
                    {stats.pendingApplications || 0} pending
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate("/recruiter/analytics")}
                className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition text-left"
              >
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-medium text-purple-900">View Analytics</div>
                  <div className="text-xs text-purple-600 mt-0.5">Hiring metrics</div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
              <button
                onClick={() => navigate("/recruiter/jobs")}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all →
              </button>
            </div>

            {recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{job.company || job.recruiter?.name || "Company"}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{job.location}</span>
                          <span>•</span>
                          <span>{job.type}</span>
                        </div>
                      </div>
                      <StatusBadge status={job.isActive ? "active" : "inactive"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Briefcase}
                title="No jobs posted yet"
                description="Post your first job to start receiving applications."
                actionLabel="Create Job"
                onAction={() => navigate("/recruiter/create-job")}
              />
            )}
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              <button
                onClick={() => navigate("/recruiter/applications")}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all →
              </button>
            </div>

            {recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div key={app._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{app.student?.name || "Student"}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{app.job?.title || "Job Position"}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No applications yet"
                description="Applications will appear when students apply to your jobs."
              />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Application Pipeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Application Pipeline</h3>
            <div className="space-y-3">
              {[
                { label: "Total", value: stats.totalApplications, color: "bg-gray-100 text-gray-600" },
                { label: "Pending", value: stats.pendingApplications || 0, color: "bg-yellow-100 text-yellow-700" },
                { label: "Interviews", value: stats.interviewsScheduled || 0, color: "bg-purple-100 text-purple-700" },
                { label: "Hired", value: stats.hired || 0, color: "bg-green-100 text-green-700" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>
                    {item.label}
                  </span>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Navigation</h3>
            <div className="space-y-1">
              <button
                onClick={() => navigate("/recruiter/jobs")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                <Briefcase className="w-4 h-4" />
                My Jobs
              </button>
              <button
                onClick={() => navigate("/recruiter/applications")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                <Users className="w-4 h-4" />
                Applications
              </button>
              <button
                onClick={() => navigate("/recruiter/students")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                <User className="w-4 h-4" />
                Eligible Students
              </button>
              <button
                onClick={() => navigate("/recruiter/analytics")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
