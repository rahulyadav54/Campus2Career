import { useEffect, useState } from "react";
import { BookOpen, Clock, Award, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

const statusLabel = { not_started: "Not Started", in_progress: "In Progress", completed: "Completed" };
const statusColor = { not_started: "bg-gray-100 text-gray-700", in_progress: "bg-amber-100 text-amber-700", completed: "bg-green-100 text-green-700" };

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/courses/my/enrollments");
      setEnrollments(res.data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Learning Hub</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">My Courses</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Track your enrolled courses, progress, and certificates.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading your courses…
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {enrollments.map((enrollment) => {
            const course = enrollment.course || {};
            return (
              <div key={enrollment._id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <BookOpen className="text-indigo-600 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">{course.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{course.provider} · {course.platform}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs sm:text-sm text-gray-600">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded capitalize ${statusColor[enrollment.status] || statusColor.not_started}`}>
                          {statusLabel[enrollment.status] || enrollment.status}
                        </span>
                        <span className="flex items-center gap-1"><Clock size={12} /> Progress: {enrollment.progressPercent}%</span>
                      </div>
                      {enrollment.status === "completed" && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-indigo-600">
                          {enrollment.certificateId && <span>Certificate ID: {enrollment.certificateId}</span>}
                          {enrollment.certificateUrl && (
                            <a href={enrollment.certificateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                              <ExternalLink size={12} /> View Certificate
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/student/courses/${course._id}`)}
                    className="text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm font-medium"
                  >
                    Continue
                  </button>
                </div>
              </div>
            );
          })}
          {!enrollments.length && <p className="text-gray-500 text-sm">You have not enrolled in any courses yet.</p>}
        </div>
      )}
    </div>
  );
}
