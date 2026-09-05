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
      const res = await fetch(`${API_URL}/api/collaborations/my-collaborations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch registrations");
      const data = await res.json();
      const payload = data.data || data;
      
      const flat = [];
      
      (payload.workshopRegs || []).forEach((reg) => {
        const w = reg.workshop || {};
        flat.push({
          _id: reg._id,
          type: "workshop",
          title: w.title,
          description: w.description,
          date: w.date,
          time: w.time,
          location: w.location,
          status: reg.status || "registered",
          registeredAt: reg.registeredAt,
          deadline: w.applicationDeadline || w.date,
        });
      });
      
      (payload.guestLectureRegs || []).forEach((reg) => {
        const gl = reg.guestLecture || {};
        flat.push({
          _id: reg._id,
          type: "guest-lecture",
          title: gl.title,
          description: gl.description,
          date: gl.date,
          time: gl.time,
          location: gl.location || gl.organization,
          status: reg.status || "registered",
          registeredAt: reg.registeredAt,
          deadline: gl.applicationDeadline || gl.date,
        });
      });
      
      (payload.challengeRegs || []).forEach((reg) => {
        const ch = reg.challenge || {};
        flat.push({
          _id: reg._id,
          type: "challenge",
          title: ch.title,
          description: ch.description,
          date: ch.startDate,
          time: ch.startDate,
          location: ch.theme,
          status: reg.status || "registered",
          registeredAt: reg.registeredAt,
          deadline: ch.registrationDeadline || ch.endDate,
          teamName: reg.teamName,
        });
      });
      
      (payload.projectApps || []).forEach((app) => {
        const p = app.project || {};
        flat.push({
          _id: app._id,
          type: "project",
          title: p.title,
          description: p.description,
          date: p.createdAt,
          time: p.duration,
          location: p.company,
          status: app.status || "applied",
          registeredAt: app.appliedAt,
          deadline: p.applicationDeadline,
        });
      });
      
      flat.sort((a, b) => new Date(b.registeredAt || b.date) - new Date(a.registeredAt || a.date));
      setRegistrations(flat);
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
        `${API_URL}/api/collaborations/my-collaborations/${id}`,
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
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
          Tracking
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
          Collaboration Registrations
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Track your workshop registrations, challenge enrollments, and project applications.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-2 rounded-lg border whitespace-nowrap capitalize font-medium text-xs sm:text-sm transition-colors ${
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
        <div className="space-y-3 sm:space-y-4">
          {filteredRegistrations.map((reg) => {
            const TypeIcon = getTypeIcon(reg.type);
            const StatusIcon = getStatusIcon(reg.status);
            return (
              <div
                key={reg._id}
                className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <TypeIcon className="text-indigo-600 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                        {reg.title || reg.name || "Untitled"}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 capitalize mt-1">
                        {reg.type.replace("-", " ")}
                      </p>
                      <div className="flex flex-wrap gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          Registered: {new Date(reg.registeredAt || reg.createdAt).toLocaleDateString()}
                        </div>
                        {reg.deadline && (
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            Deadline: {new Date(reg.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                        reg.status
                      )}`}
                    >
                      <StatusIcon size={12} />
                      {reg.status}
                    </span>
                    {reg.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancel(reg._id)}
                        className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {reg.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600">{reg.notes}</p>
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
