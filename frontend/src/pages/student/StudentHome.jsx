import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, FileText, Award, Target, TrendingUp, BookOpen,
  BarChart3, Calendar, Sparkles, CheckCircle, AlertCircle,
  ChevronRight, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../../services/apiClient";
import { StatCard, LoadingSkeleton, EmptyState } from "../../components/ui";

const StudentHome = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [profileRes, appsRes, jobsRes, coursesRes, recommendationsRes] = await Promise.allSettled([
          apiClient.get("/api/auth/profile"),
          apiClient.get("/api/applications/me"),
          apiClient.get("/api/jobs"),
          apiClient.get("/api/courses/my/enrollments"),
          apiClient.get("/api/recommendations/jobs"),
        ]);

        const profile = profileRes.status === "fulfilled" ? (profileRes.value?.user || profileRes.value) : null;
        const applications = appsRes.status === "fulfilled" ? (Array.isArray(appsRes.value) ? appsRes.value : appsRes.value?.applications || []) : [];
        const jobs = jobsRes.status === "fulfilled" ? jobsRes.value : [];
        const enrollments = coursesRes.status === "fulfilled" ? (Array.isArray(coursesRes.value) ? coursesRes.value : coursesRes.value?.enrollments || []) : [];
        const recommendations = recommendationsRes.status === "fulfilled" ? recommendationsRes.value : [];

        setDashboardData({ profile, applications, jobs, enrollments, recommendations });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast.error("Could not load some dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const { profile, applications, enrollments, recommendations } = dashboardData || {};

  const stats = {
    enrolledCourses: enrollments?.length || 0,
    completedCourses: enrollments?.filter(e => e.status === "completed")?.length || 0,
    certificates: profile?.certifications?.length || 0,
    totalApplications: applications?.length || 0,
    activeApplications: applications?.filter(a => ["applied", "under review", "interview scheduled"].includes(a.status))?.length || 0,
    interviews: applications?.filter(a => a.status === "interview scheduled")?.length || 0,
    profileCompletion: profile?.profileCompletion || 0,
  };

  const applicationStages = [
    { key: "applied", label: "Applied", icons: FileText, color: "bg-gray-100 text-gray-600" },
    { key: "pending mentor approval", label: "Under Review", icons: AlertCircle, color: "bg-yellow-100 text-yellow-700" },
    { key: "shortlisted", label: "Shortlisted", icons: TrendingUp, color: "bg-blue-100 text-blue-700" },
    { key: "interview scheduled", label: "Interview", icons: Calendar, color: "bg-purple-100 text-purple-700" },
    { key: "offered", label: "Offered", icons: CheckCircle, color: "bg-green-100 text-green-700" },
    { key: "rejected", label: "Rejected", icons: FileText, color: "bg-red-100 text-red-700" },
    { key: "hired", label: "Hired", icons: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
  ];

  const getApplicationStageCount = (stageKey) => {
    const keys = stageKey === "shortlisted" ? ["shortlisted", "under review"] : [stageKey];
    return applications?.filter(a => keys.includes(a.status?.toLowerCase()))?.length || 0;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const inProgressCourse = enrollments?.find(e => e.status !== "completed");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={2} />
          ))}
        </div>
        <LoadingSkeleton lines={10} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {profile?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {profile?.role === "student" ? "Your career & learning workspace" : "Welcome back to Campus2Career"}
          </p>
        </div>
        <button
          onClick={() => navigate("/student/career")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" />
          AI Career Advisor
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          iconColor="indigo"
          value={stats.enrolledCourses}
          label="Courses Enrolled"
          loading={loading}
        />
        <StatCard
          icon={Award}
          iconColor="green"
          value={stats.completedCourses}
          label="Courses Completed"
          loading={loading}
        />
        <StatCard
          icon={Award}
          iconColor="yellow"
          value={stats.certificates}
          label="Certificates"
          loading={loading}
        />
        <StatCard
          icon={FileText}
          iconColor="blue"
          value={stats.totalApplications}
          label="Jobs Applied"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Continue Learning</h2>
              <button
                onClick={() => navigate("/student/my-courses")}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all
              </button>
            </div>

            {inProgressCourse ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{inProgressCourse.course?.title || "Course"}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {inProgressCourse.course?.provider || "Campus2Career"} · {inProgressCourse.course?.level || "Mixed"}
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress: {inProgressCourse.progress || 0}%</span>
                        <span>Module {inProgressCourse.currentModule || 1} of {inProgressCourse.course?.modules?.length || "?"}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${inProgressCourse.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/student/courses/${inProgressCourse.course?._id}`)}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No courses enrolled yet"
                description="Browse courses to start learning."
                actionLabel="Explore Courses"
                onAction={() => navigate("/student/courses")}
              />
            )}
          </div>

          {/* Recommended Opportunities */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recommended Opportunities</h2>
              <button
                onClick={() => navigate("/student/jobs")}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all
              </button>
            </div>

            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, 4).map((rec) => (
                  <div key={rec.job_id || rec._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{rec.job_title || rec.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{rec.company}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{rec.location}</span>
                          <span>•</span>
                          <span>{rec.job_details?.type || rec.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">{rec.match_score || rec.matchScore}%</div>
                        <p className="text-xs text-gray-500">Match</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/student/jobs/${rec.job_id || rec._id}`)}
                      className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View Opportunity →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No recommendations yet"
                description="Complete your skill profile to get personalised recommendations."
                actionLabel="Skill Assessment"
                onAction={() => navigate("/student/assessment")}
              />
            )}
          </div>

          {/* Application Tracker */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Application Tracker</h2>
              <button
                onClick={() => navigate("/student/applications")}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all
              </button>
            </div>

            {applications && applications.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mb-4">
                {applicationStages.map((stage) => {
                  const Icon = stage.icons;
                  const count = getApplicationStageCount(stage.key);
                  return (
                    <div key={stage.key} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-1 ${stage.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500">{stage.label}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No applications yet"
                description="Apply to jobs and internships to get started."
                actionLabel="Browse Jobs"
                onAction={() => navigate("/student/jobs")}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Profile Completion */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Profile Completion</h3>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-indigo-600">
                  {profile?.name?.[0] || "U"}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{profile?.name || "Student"}</p>
                <p className="text-xs text-gray-500">{profile?.email || "student@college.edu"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{stats.profileCompletion}%</span>
                <span className="text-gray-600">{profile?.skills?.length || 0} skills</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${stats.profileCompletion}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => navigate("/student/profile")}
              className="w-full mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Complete your profile →
            </button>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Upcoming</h3>
            <div className="space-y-3 text-sm">
              {applications?.filter(a => a.status === "interview scheduled" && a.interviewDate).slice(0, 3).map((app) => (
                <div key={app._id} className="border-l-2 border-indigo-600 pl-3">
                  <p className="font-medium text-gray-900">{app.job?.title || app.position || "Interview"}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(app.interviewDate).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              ))}
              {(!applications?.some(a => a.status === "interview scheduled" && a.interviewDate)) && (
                <p className="text-xs text-gray-500">No upcoming interviews</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/student/jobs")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition"
              >
                <Briefcase className="w-4 h-4" />
                Browse Jobs
              </button>
              <button
                onClick={() => navigate("/student/courses")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition"
              >
                <BookOpen className="w-4 h-4" />
                Explore Courses
              </button>
              <button
                onClick={() => navigate("/student/profile")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition"
              >
                <TrendingUp className="w-4 h-4" />
                Skill Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
