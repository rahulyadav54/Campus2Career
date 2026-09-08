import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Globe, Clock, Award, BookOpen, Star, ExternalLink,
  CheckCircle, Bookmark, Play,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

const levelLabel = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courseRes, enrollRes, bookmarkRes] = await Promise.all([
        apiClient.get(`/api/courses/${id}`),
        apiClient.get(`/api/courses/my/enrollments/${id}`).catch(() => null),
        apiClient.get("/api/learning/bookmarks").catch(() => ({ data: [] })),
      ]);
      setCourse(courseRes.data);
      setEnrollment(enrollRes?.data || null);
      const saved = (bookmarkRes?.data || []).some((b) => String(b.course?._id || b.course) === String(id));
      setBookmarked(saved);
      apiClient.post(`/api/learning/recently-viewed/${id}`).catch(() => {});
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
    setEnrolling(true);
    try {
      const res = await apiClient.post(`/api/courses/${id}/enroll`);
      setEnrollment(res.data);
      toast.success("Enrolled successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      const res = await apiClient.post(`/api/learning/bookmarks/${id}`);
      setBookmarked(res.data?.bookmarked);
      toast.success(res.data?.bookmarked ? "Course saved" : "Removed from saved");
    } catch (err) {
      toast.error(err.message || "Failed to update bookmark");
    }
  };

  const handleComplete = async () => {
    try {
      const res = await apiClient.post(`/api/courses/${id}/complete`, {});
      setEnrollment(res.data);
      toast.success("Course completed! Your certificate is ready.");
    } catch (err) {
      toast.error(err.message || "Failed to complete course");
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto p-6 text-gray-500">Loading course…</div>;
  if (!course) return <div className="max-w-4xl mx-auto p-6 text-red-600">Course not found.</div>;

  const isEnrolled = !!enrollment;
  const isInternal = course.courseType === "internal";
  const isExternal = course.courseType === "external" || (!isInternal && course.externalUrl);
  const modules = course.modules || [];
  const totalLessons = course.lessonCount || modules.reduce((s, m) => s + (m.lessons?.length || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {course.category && <span className="text-xs px-2 py-1 bg-gray-100 rounded">{course.category}</span>}
              {isExternal && <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">External Course</span>}
              {isInternal && <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">Campus2Career Course</span>}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-1">{course.provider}{course.instructor ? ` · ${course.instructor}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {course.rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-amber-600"><Star size={14} /> {course.rating}</span>
            )}
            <span className="text-xs px-2 py-1 rounded capitalize bg-indigo-50 text-indigo-700">{levelLabel[course.level]}</span>
            <button onClick={toggleBookmark} className={`p-2 rounded-lg border ${bookmarked ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-300 text-gray-500"}`}>
              <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <p className="text-gray-700">{course.description}</p>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1"><Clock size={14} /> {course.duration || "Self-paced"}</span>
          {totalLessons > 0 && <span className="flex items-center gap-1"><BookOpen size={14} /> {totalLessons} lessons</span>}
          {course.certificateAvailable && <span className="flex items-center gap-1 text-indigo-600"><Award size={14} /> Certificate</span>}
          {course.isFree ? <span className="text-green-600 font-medium">Free</span> : <span>Paid</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          {(course.skills || []).map((s) => (
            <span key={s} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded">{s}</span>
          ))}
        </div>

        {course.prerequisites?.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Prerequisites</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
              {course.prerequisites.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        )}

        {course.learningOutcomes?.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Learning Outcomes</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
              {course.learningOutcomes.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </div>
        )}

        {modules.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Course Content</h3>
            <div className="space-y-3">
              {modules.map((mod, mi) => (
                <div key={mod._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 font-medium text-sm text-gray-800">
                    Module {mi + 1}: {mod.title}
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {(mod.lessons || []).map((lesson, li) => {
                      const done = enrollment?.completedLessons?.includes(lesson._id);
                      return (
                        <li key={lesson._id} className="px-4 py-2 flex items-center gap-2 text-sm">
                          {done ? <CheckCircle size={16} className="text-green-600" /> : <span className="w-4 h-4 rounded-full border border-gray-300" />}
                          <span className={done ? "text-gray-500" : "text-gray-800"}>{lesson.title}</span>
                          <span className="text-xs text-gray-400 ml-auto">{lesson.durationMinutes} min</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {isEnrolled && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Your progress</span>
              <span className="font-medium">{enrollment.progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${enrollment.progressPercent}%` }} />
            </div>
            {enrollment.status === "completed" && enrollment.certificateId && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <p className="text-green-700 font-medium">✓ Course completed</p>
                <p className="text-gray-600 mt-1">Certificate ID: {enrollment.certificateId}</p>
                <button
                  onClick={() => navigate(`/certificates/verify/${enrollment.certificateId}`)}
                  className="text-indigo-600 hover:underline mt-1 text-sm"
                >
                  View Certificate
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {isEnrolled ? (
            <>
              {isInternal && enrollment.status !== "completed" && (
                <button
                  onClick={() => navigate(`/student/courses/${id}/learn`)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  <Play size={16} /> Continue Learning
                </button>
              )}
              {enrollment.status !== "completed" && isInternal && modules.length === 0 && (
                <button onClick={handleComplete} className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                  Mark Complete
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {enrolling ? "Enrolling…" : "Enroll Now"}
            </button>
          )}
          {isExternal && course.externalUrl && (
            <a
              href={course.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
            >
              <Globe size={16} /> View on Provider
            </a>
          )}
          {isEnrolled && isInternal && (
            <button
              onClick={() => navigate(`/student/courses/${id}/learn`)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium"
            >
              <Play size={16} /> Start Learning
            </button>
          )}
        </div>

        {isExternal && (
          <p className="text-xs text-gray-500">
            This is an external course. Campus2Career provides metadata and links only. Certificates are issued by the provider, not Campus2Career.
          </p>
        )}
      </div>
    </div>
  );
}
