import { API_URL } from '../../config/api';
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronDown, RefreshCw } from "lucide-react";

export default function AcademicianMyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawn, setShowWithdrawn] = useState(false);
  const [withdrawnApplications, setWithdrawnApplications] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/academician-opportunities/applications/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load applications");
      }
      setApplications(Array.isArray(data) ? data : Array.isArray(data.applications) ? data.applications : []);
    } catch (error) {
      toast.error(error.message || "Failed to load applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId) => {
    try {
      const response = await fetch(`${API_URL}/api/academician-opportunities/applications/${applicationId}/withdraw`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to withdraw application");
      }
      const withdrawnApp = applications.find((app) => app._id === applicationId);
      if (withdrawnApp) {
        setWithdrawnApplications((prev) => [...prev, { ...withdrawnApp, withdrawnAt: new Date() }]);
      }
      setApplications(applications.filter((app) => app._id !== applicationId));
      toast.success("Application withdrawn successfully");
    } catch (error) {
      toast.error(error.message || "Failed to withdraw application");
    }
  };

  const getStatusBadge = (status) => {
    const normalized = (status || "").toLowerCase();
    const config = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending Review" },
      approved: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
      "under review": { bg: "bg-indigo-100", text: "text-indigo-800", label: "Under Review" },
    };
    const found = Object.entries(config).find(([key]) => normalized.includes(key));
    if (found) {
      const { bg, text, label } = found[1];
      return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{label}</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
  };

  const canWithdraw = (status) => {
    const normalized = (status || "").toLowerCase();
    return ["pending", "under review"].some((s) => normalized.includes(s));
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading applications...</div>
        </div>
      </div>
    );
  }

  const displayed = showWithdrawn ? withdrawnApplications : applications;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Tracking</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">My Applications</h1>
          <p className="text-gray-600 mt-1">Track your faculty program applications and their status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchApplications}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => setShowWithdrawn(!showWithdrawn)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            {showWithdrawn ? "Active" : "Withdrawn"} <ChevronDown size={16} className={`transition-transform ${showWithdrawn ? "rotate-180" : ""}`} />
          </button>
          <span className="text-sm text-gray-600">{displayed.length} {showWithdrawn ? "withdrawn" : "active"}</span>
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {showWithdrawn ? "No withdrawn applications" : "No applications yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {showWithdrawn ? "Withdrawn applications will appear here." : "Browse opportunities and apply to track them here."}
          </p>
          {!showWithdrawn && (
            <button
              onClick={() => navigate("/academician/opportunities")}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Browse Opportunities
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayed.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{app.opportunity?.title || app.title || "Opportunity"}</div>
                      <div className="text-sm text-gray-500">{app.opportunity?.location || app.location || ""}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {app.opportunity?.type || app.type || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(app.createdAt || app.appliedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!showWithdrawn && canWithdraw(app.status) && (
                        <button
                          onClick={() => handleWithdraw(app._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Withdraw
                        </button>
                      )}
                      {showWithdrawn && (
                        <span className="text-gray-500 text-xs">Withdrawn</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
