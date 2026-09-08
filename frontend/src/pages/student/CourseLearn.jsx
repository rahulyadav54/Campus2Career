import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

export default function CourseLearn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes, enrollRes] = await Promise.all([
          apiClient.get(`/api/courses/${id}`),
          apiClient.get(`/api/courses/my/enrollments/${id}`),
        ]);
        setCourse(courseRes.data);
        setEnrollment(enrollRes.data);

        const modules = courseRes.data?.modules || [];
        const completed = new Set((enrollRes.data?.completedLessons || []).map(String));
        let firstIncomplete = null;
        for (const mod of modules) {
          for (const lesson of mod.lessons || []) {
            if (!completed.has(String(lesson._id))) {
              firstIncomplete = lesson;
              break;
            }
          }
          if (firstIncomplete) break;
        }
        setActiveLesson(firstIncomplete || modules[0]?.lessons?.[0] || null);
      } catch (err) {
        toast.error(err.message || "Failed to load course");
        navigate(`/student/courses/${id}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const completedSet = new Set((enrollment?.completedLessons || []).map(String));

  const completeLesson = async (lessonId) => {
    setCompleting(true);
    try {
      const res = await apiClient.post(`/api/courses/${id}/lessons/${lessonId}/complete`);
      setEnrollment(res.data);
      toast.success("Lesson completed!");

      if (res.data.status === "completed") {
        toast.success("Congratulations! Course completed. Your certificate is ready.");
      }

      const modules = course?.modules || [];
      let next = null;
      for (const mod of modules) {
        for (const lesson of mod.lessons || []) {
          if (!completedSet.has(String(lesson._id)) && String(lesson._id) !== String(lessonId)) {
            next = lesson;
            break;
          }
          if (String(lesson._id) === String(lessonId)) {
            // find next after current
          }
        }
      }
      // Find next lesson after completion
      const allLessons = modules.flatMap((m) => m.lessons || []);
      const idx = allLessons.findIndex((l) => String(l._id) === String(lessonId));
      if (idx >= 0 && idx < allLessons.length - 1) {
        setActiveLesson(allLessons[idx + 1]);
      }
    } catch (err) {
      toast.error(err.message || "Failed to complete lesson");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-500 min-h-[50vh]">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading course…
      </div>
    );
  }

  const modules = course?.modules || [];

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      <button onClick={() => navigate(`/student/courses/${id}`)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-4">
        <ArrowLeft size={18} /> Back to course
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4 max-h-[70vh] overflow-y-auto">
          <h2 className="font-semibold text-gray-900 mb-3">{course?.title}</h2>
          <p className="text-sm text-gray-500 mb-4">Progress: {enrollment?.progressPercent || 0}%</p>
          {modules.map((mod, mi) => (
            <div key={mod._id} className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Module {mi + 1}</p>
              <ul className="space-y-1">
                {(mod.lessons || []).map((lesson) => {
                  const done = completedSet.has(String(lesson._id));
                  const active = String(activeLesson?._id) === String(lesson._id);
                  return (
                    <li key={lesson._id}>
                      <button
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                          active ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {done ? <CheckCircle size={14} className="text-green-600 shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />}
                        <span className="line-clamp-2">{lesson.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        <main className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          {activeLesson ? (
            <>
              <h1 className="text-xl font-bold text-gray-900">{activeLesson.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{activeLesson.durationMinutes} min</p>
              <div className="prose prose-sm max-w-none mt-6 text-gray-700 whitespace-pre-wrap">
                {activeLesson.content || "Lesson content will be available here."}
              </div>
              {activeLesson.videoUrl && (
                <a href={activeLesson.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 mt-4 text-sm">
                  Watch video <ChevronRight size={14} />
                </a>
              )}
              {!completedSet.has(String(activeLesson._id)) && (
                <button
                  onClick={() => completeLesson(activeLesson._id)}
                  disabled={completing}
                  className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                  {completing ? "Saving…" : "Mark Lesson Complete"}
                </button>
              )}
              {completedSet.has(String(activeLesson._id)) && (
                <p className="mt-6 text-green-600 text-sm font-medium flex items-center gap-1">
                  <CheckCircle size={16} /> Lesson completed
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500">No lessons available in this course yet.</p>
          )}
        </main>
      </div>
    </div>
  );
}
