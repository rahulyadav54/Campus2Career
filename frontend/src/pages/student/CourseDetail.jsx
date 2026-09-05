import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Clock, Award, BookOpen, Star, ExternalLink } from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

const levelLabel = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courseRes, enrollRes] = await Promise.all([
        apiClient.get(`/api/courses/${id}`),
        apiClient.get(`/api/courses/my/enrollments/${id}`).catch(() => ({ data: { data: null } }))
      ]);
      setCourse(courseRes.data.data);
      setEnrollment(enrollRes.data.data);
      if (enrollRes.data.data?.progressPercent !== undefined) {
        setProgress(String(enrollRes.data.data.progressPercent));
      }
    } catch (err) {
      toast.error(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEnroll = async () => {
    try {
      const res = await apiClient.post(`/api/courses/${id}/enroll`);
      setEnrollment(res.data.data);
      toast.success("Enrolled successfully");
    } catch (err) {
      toast.error(err.message || "Failed to enroll");
    }
  };

  const handleUpdateProgress = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post(`/api/courses/${id}/progress`, { progressPercent: Number(progress) });
      setEnrollment(res.data.data);
      toast.success("Progress updated");
    } catch (err) {
      toast.error(err.message || "Failed to update progress");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    try {
      const certUrl = prompt("Enter certificate URL (or leave blank):") || "";
      const certId = prompt("Enter certificate ID (or leave blank):") || "";
      const res = await apiClient.post(`/api/courses/${id}/complete`, {
        certificateUrl: certUrl,
        certificateId: certId,
        certificateIssueDate: new Date()
      });
      setEnrollment(res.data.data);
      toast.success("Course completed! Certificate added.");
    } catch (err) {
      toast.error(err.message || "Failed to complete course");
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto p-6 text-gray-500">Loading course…</div>;
  if (!course) return <div className="max-w-4xl mx-auto p-6 text-red-600">Course not found.</div>;

  const isEnrolled = !!enrollment;

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <button onClick={() => navigate("/student/courses")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base">
        <ArrowLeft size={18} /> Back to Courses
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">{course.provider} · {course.platform}</p>
          </div>
          <div className="flex items-center gap-2">
            {course.rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-amber-600">
                <Star size={14} /> {course.rating}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded capitalize ${levelLabel[course.level] === "Beginner" ? "bg-green-100 text-green-700" : levelLabel[course.level] === "Intermediate" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
              {levelLabel[course.level]}
            </span>
          </div>
        </div>

        <p className="text-gray-700 text-sm sm:text-base">{course.description}</p>

        <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-1"><Clock size={14} /> {course.duration || "Self-paced"}</div>
          {course.certificateAvailable && <div className="flex items-center gap-1 text-indigo-600"><Award size={14} /> Certificate Available</div>}
          <div className="flex items-center gap-1"><BookOpen size={14} /> {course.skills?.length || 0} skills</div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {(course.skills || []).map((s) => (
            <span key={s} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-50 text-indigo-700 rounded">{s}</span>
          ))}
        </div>

        {isEnrolled && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Progress: {enrollment.progressPercent}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleUpdateProgress} disabled={saving} className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm sm:text-base">
                {saving ? "Saving..." : "Update Progress"}
              </button>
              <button onClick={handleComplete} className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base">
                Mark Complete
              </button>
            </div>
            {enrollment.status === "completed" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                Completed on {new Date(enrollment.completedAt).toLocaleDateString()}
                {enrollment.certificateId && <div>Certificate ID: {enrollment.certificateId}</div>}
                {enrollment.certificateUrl && <a href={enrollment.certificateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 mt-1"><ExternalLink size={12} /> View Certificate</a>}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <a href={course.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm sm:text-base">
            <Globe size={16} /> Start Learning
          </a>
          {!isEnrolled && (
            <button onClick={handleEnroll} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm sm:text-base">
              Enroll Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
