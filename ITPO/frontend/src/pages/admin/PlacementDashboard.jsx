import { useState, useEffect, useMemo } from "react";
import {
  Users, UserCheck, UserPlus, Briefcase, FileText, Award,
  Clock, CheckCircle, TrendingUp, Calendar, BarChart3,
  Bell, Shield, ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { StatCard, StatusBadge, LoadingSkeleton, EmptyState } from "../../components/ui";

const DATE_RANGES = [
  { label: "Today", value: "today" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "This Year", value: "year" },
];

const PlacementDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.get("/api/admin/dashboard/stats");
        setStats(data);
      } catch (err) {
        if (err.status !== 401 && err.status !== 403) {
          console.error("Failed to fetch admin stats:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        icon: Users,
        iconColor: "blue",
        value: stats.users?.totalStudents || 0,
        label: "Total Students",
        sublabel: `${stats.users?.activeStudents || 0} active, ${stats.users?.pendingStudents || 0} pending`,
        trend: "+12%",
        trendDirection: "up",
      },
      {
        icon: UserCheck,
        iconColor: "purple",
        value: stats.applications?.placedStudents || 0,
        label: "Placed Students",
        sublabel: `${stats.applications?.placementRate || 0}% placement rate`,
        trend: "+8%",
        trendDirection: "up",
      },
      {
        icon: Users,
        iconColor: "indigo",
        value: stats.users?.totalRecruiters || 0,
        label: "Recruiters",
        sublabel: `${stats.users?.pendingRecruiters || 0} pending approval`,
        trend: "+5%",
        trendDirection: "up",
      },
      {
        icon: Briefcase,
        iconColor: "orange",
        value: stats.jobs?.totalJobs || 0,
        label: "Total Jobs",
        sublabel: `${stats.jobs?.activeJobs || 0} active, ${stats.jobs?.pendingJobs || 0} pending`,
        trend: "+3%",
        trendDirection: "up",
      },
      {
        icon: FileText,
        iconColor: "green",
        value: stats.applications?.totalApplications || 0,
        label: "Applications",
        sublabel: "All time",
        trend: "+15%",
        trendDirection: "up",
      },
      {
        icon: Award,
        iconColor: "yellow",
        value: `${stats.applications?.placementRate || 0}%`,
        label: "Placement Rate",
        sublabel: `${stats.users?.totalStudents || 0} total students`,
        trend: "+4%",
        trendDirection: "up",
      },
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={2} />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <LoadingSkeleton lines={8} />
          <LoadingSkeleton lines={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Cell Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Operational overview and key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                dateRange === range.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <StatCard
            key={i}
            icon={card.icon}
            iconColor={card.iconColor}
            value={card.value}
            label={card.label}
            sublabel={card.sublabel}
            trend={card.trend}
            trendDirection={card.trendDirection}
            loading={loading}
            onClick={() => {
              if (card.label === "Pending Approvals") navigate("/admin/user-approvals");
              if (card.label === "Recruiters") navigate("/admin/users");
              if (card.label === "Total Jobs") navigate("/admin/job-verification");
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate("/admin/job-verification")}
                className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition text-left"
              >
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="font-medium text-indigo-900">Approve Jobs</div>
                  <div className="text-xs text-indigo-600 mt-0.5">
                    {stats?.jobs?.pendingJobs || 0} pending
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate("/admin/user-approvals")}
                className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition text-left"
              >
                <UserPlus className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-900">Verify Users</div>
                  <div className="text-xs text-yellow-600 mt-0.5">
                    {stats?.users?.pendingStudents || 0} pending
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate("/admin/post")}
                className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition text-left"
              >
                <Bell className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">New Announcement</div>
                  <div className="text-xs text-green-600 mt-0.5">Notify students</div>
                </div>
              </button>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Server Status</span>
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Database Connection</span>
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Pending Approvals</span>
                <span className="text-xs font-medium text-yellow-600">
                  {(stats?.users?.pendingStudents || 0) + (stats?.users?.pendingRecruiters || 0) + (stats?.jobs?.pendingJobs || 0)} total
                </span>
              </div>
            </div>
          </div>

          {/* Application Pipeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Application Pipeline</h2>
              <button
                onClick={() => navigate("/admin/analytics")}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View Analytics →
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-600">Total Applications</div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-indigo-600 rounded-full" style={{ width: "100%" }} />
                </div>
                <div className="w-16 text-right text-sm font-medium text-gray-900">
                  {stats?.applications?.totalApplications || 0}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-600">Placed</div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{
                      width: `${stats?.applications?.totalApplications > 0
                        ? (stats.applications.placedStudents / stats.applications.totalApplications) * 100
                        : 0}%`,
                    }}
                  />
                </div>
                <div className="w-16 text-right text-sm font-medium text-green-700">
                  {stats?.applications?.placedStudents || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pending Approvals</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-700">Student registrations</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                  {stats?.users?.pendingStudents || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-700">Recruiter registrations</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                  {stats?.users?.pendingRecruiters || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-700">Job postings</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                  {stats?.jobs?.pendingJobs || 0}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/admin/user-approvals")}
              className="w-full mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium text-center"
            >
              Review all →
            </button>
          </div>

          {/* Quick Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Management</h3>
            <div className="space-y-1">
              <button
                onClick={() => navigate("/admin/users")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                <Users className="w-4 h-4" />
                User Management
              </button>
              <button
                onClick={() => navigate("/admin/job-verification")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                <Shield className="w-4 h-4" />
                Job Verification
              </button>
              <button
                onClick={() => navigate("/admin/analytics")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button
                onClick={() => navigate("/admin/post")}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                <Bell className="w-4 h-4" />
                Announcements
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementDashboard;
