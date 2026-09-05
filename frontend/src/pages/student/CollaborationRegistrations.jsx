import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";
import { toast } from "react-hot-toast";
import {
  Presentation,
  Trophy,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Filter,
} from "lucide-react";

export default function CollaborationRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/collaboration/my-registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch registrations");
      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : data.registrations || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this registration?"))
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/collaboration/my-registrations/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Cancellation failed");
      }
      toast.success("Registration cancelled");
      setRegistrations((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "workshop":
        return Presentation;
      case "guest-lecture":
        return Presentation;
      case "challenge":
        return Trophy;
      case "project":
        return Building2;
      default:
        return Presentation;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return CheckCircle;
      case "pending":
        return Clock;
      case "cancelled":
        return XCircle;
      default:
        return Clock;
    }
  };

  const filteredRegistrations =
    filter === "all"
      ? registrations
      : registrations.filter((r) => r.type === filter);

  const types = ["all", ...new Set(registrations.map((r) => r.type))];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
          Tracking
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Collaboration Registrations
        </h1>
        <p className="text-gray-600 mt-2">
          Track your workshop registrations, challenge enrollments, and project applications.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-2 rounded-lg border whitespace-nowrap capitalize font-medium transition-colors ${
              filter === type
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {type.replace("-", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading registrations...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((reg) => {
            const TypeIcon = getTypeIcon(reg.type);
            const StatusIcon = getStatusIcon(reg.status);
            return (
              <div
                key={reg._id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <TypeIcon className="text-indigo-600 w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {reg.title || reg.name || "Untitled"}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize mt-1">
                        {reg.type.replace("-", " ")}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          Registered: {new Date(reg.registeredAt || reg.createdAt).toLocaleDateString()}
                        </div>
                        {reg.deadline && (
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-gray-400" />
                            Deadline: {new Date(reg.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                        reg.status
                      )}`}
                    >
                      <StatusIcon size={12} />
                      {reg.status}
                    </span>
                    {reg.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancel(reg._id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {reg.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{reg.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!filteredRegistrations.length && !loading && (
        <div className="text-center py-12">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No registrations found
          </h3>
          <p className="text-gray-500">
            {filter === "all"
              ? "You have not registered for any workshops, challenges, or projects yet."
              : `You have no ${filter.replace("-", " ")} registrations.`}
          </p>
        </div>
      )}
    </div>
  );
}
