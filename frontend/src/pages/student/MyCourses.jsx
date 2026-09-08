import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen, Compass, Target, TrendingUp, Flame, Award, GraduationCap,
  Sparkles, ChevronRight, Loader2,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";
import CourseCard, { EnrollmentCard } from "../../components/learning/CourseCard";

const TABS = [
  { id: "my-courses", label: "My Courses", icon: BookOpen },
  { id: "recommended", label: "Recommended", icon: Sparkles },
  { id: "paths", label: "Learning Paths", icon: Compass },
  { id: "skill-gaps", label: "Skill Gaps", icon: Target },
];

export default function MyCourses() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "my-courses";

  const [hub, setHub] = useState(null);
  const [paths, setPaths] = useState([]);
  const [skillGapData, setSkillGapData] = useState(null);
  const [assistantQ, setAssistantQ] = useState("");
  const [assistantA, setAssistantA] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState(new Set());

  const loadHub = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/learning/hub");
      setHub(res.data);
      const saved = new Set((res.data?.saved || []).map((c) => c._id));
      setBookmarks(saved);
    } catch (err) {
      toast.error(err.message || "Failed to load learning hub");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPaths = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/learning/paths");
      setPaths(res.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load paths");
    }
  }, []);

  const loadSkillGaps = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/learning/skill-gaps");
      setSkillGapData(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load skill gaps");
    }
  }, []);

  useEffect(() => {
    loadHub();
  }, [loadHub]);

  useEffect(() => {
    if (activeTab === "paths") loadPaths();
    if (activeTab === "skill-gaps") loadSkillGaps();
  }, [activeTab, loadPaths, loadSkillGaps]);

  const setTab = (tab) => setSearchParams({ tab });

  const toggleBookmark = async (courseId) => {
    try {
      const res = await apiClient.post(`/api/learning/bookmarks/${courseId}`);
      const next = new Set(bookmarks);
      if (res.data?.bookmarked) next.add(courseId);
      else next.delete(courseId);
      setBookmarks(next);
      toast.success(res.data?.bookmarked ? "Course saved" : "Removed from saved");
    } catch (err) {
      toast.error(err.message || "Failed to update bookmark");
    }
  };

  const askAssistant = async () => {
    if (!assistantQ.trim()) return;
    setAssistantLoading(true);
    try {
      const res = await apiClient.post("/api/learning/assistant", { question: assistantQ });
      setAssistantA(res.data?.answer || "No response");
    } catch (err) {
      toast.error(err.message || "Assistant unavailable");
    } finally {
      setAssistantLoading(false);
    }
  };

  const hasEnrollments = (hub?.inProgress?.length || 0) + (hub?.completed?.length || 0) + (hub?.notStarted?.length || 0) > 0;
  const stats = hub?.stats || {};

  if (loading && !hub) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-500 min-h-[40vh]">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading your learning hub…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Learning Hub</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">My Courses</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Track your learning progress, continue your courses, and build job-ready skills.
        </p>
      </header>

      {/* Learning stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Enrolled", value: stats.coursesEnrolled, icon: BookOpen },
          { label: "Completed", value: stats.coursesCompleted, icon: Award },
          { label: "Lessons", value: stats.lessonsCompleted, icon: GraduationCap },
          { label: "Hours", value: stats.learningHours, icon: ClockIcon },
          { label: "Streak", value: `${stats.streak || 0} days`, icon: Flame, highlight: stats.streak > 0 },
          { label: "Certificates", value: stats.certificates, icon: Award },
        ].map(({ label, value, icon: Icon, highlight }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${highlight ? "text-orange-500" : "text-indigo-600"}`} />
            <p className="text-lg font-bold text-gray-900">{value ?? 0}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Continue learning */}
      {hub?.continueLearning && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Continue Learning</h2>
          <EnrollmentCard enrollment={hub.continueLearning} featured />
        </section>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
        <button
          onClick={() => navigate("/student/courses")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 ml-auto"
        >
          Explore Courses <ChevronRight size={16} />
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "my-courses" && (
        <div className="space-y-8">
          {!hasEnrollments ? (
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-bold text-gray-900">Start Your Learning Journey</h2>
              <p className="text-gray-600 mt-2 max-w-lg mx-auto">
                Based on your profile, we&apos;ve found courses that can help you become job-ready.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <button onClick={() => navigate("/student/courses")} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                  Explore Courses
                </button>
                <button onClick={() => setTab("recommended")} className="px-5 py-2.5 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium">
                  See Recommended Courses
                </button>
              </div>
            </div>
          ) : (
            <>
              {hub?.inProgress?.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">In Progress</h2>
                  <div className="space-y-3">
                    {hub.inProgress.map((e) => <EnrollmentCard key={e._id} enrollment={e} />)}
                  </div>
                </section>
              )}
              {hub?.completed?.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Completed</h2>
                  <div className="space-y-3">
                    {hub.completed.map((e) => (
                      <div key={e._id} className="bg-white border border-green-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                          <h3 className="font-semibold text-gray-900">{e.course?.title}</h3>
                          {e.certificateId && (
                            <p className="text-xs text-gray-500 mt-1">Certificate ID: {e.certificateId}</p>
                          )}
                        </div>
                        {e.certificateId && (
                          <button
                            onClick={() => navigate(`/certificates/verify/${e.certificateId}`)}
                            className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm hover:bg-indigo-50"
                          >
                            View Certificate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Saved courses */}
          {hub?.saved?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Saved Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hub.saved.map((course) => (
                  <CourseCard key={course._id} course={course} bookmarked onBookmark={toggleBookmark} />
                ))}
              </div>
            </section>
          )}

          {/* Recently viewed */}
          {hub?.recentlyViewed?.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Recently Viewed</h2>
                <button onClick={() => navigate("/student/courses")} className="text-sm text-indigo-600 hover:text-indigo-700">
                  Continue Exploring
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hub.recentlyViewed.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => navigate(`/student/courses/${c._id}`)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations preview when empty */}
          {!hasEnrollments && hub?.recommendations?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommended For You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hub.recommendations.map((rec) => (
                  <CourseCard
                    key={rec.course._id}
                    course={rec.course}
                    relevance={rec.relevanceScore}
                    reason={rec.reason}
                    onBookmark={toggleBookmark}
                    bookmarked={bookmarks.has(rec.course._id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "recommended" && (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">Personalized courses based on your skills, target role, and career goals.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(hub?.recommendations || []).map((rec) => (
              <CourseCard
                key={rec.course._id}
                course={rec.course}
                relevance={rec.relevanceScore}
                reason={rec.whyThisCourse || rec.reason}
                onBookmark={toggleBookmark}
                bookmarked={bookmarks.has(rec.course._id)}
              />
            ))}
            {!hub?.recommendations?.length && (
              <p className="text-gray-500 col-span-full">Complete your profile and set a target role to get recommendations.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "paths" && (
        <div className="space-y-4">
          {paths.map((path) => (
            <div key={path._id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{path.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{path.targetRole}</p>
                  <p className="text-sm text-gray-600 mt-2">{path.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-indigo-600">{path.progressPercent}%</p>
                  <p className="text-xs text-gray-500">{path.completedCourses}/{path.totalCourses} courses</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${path.progressPercent}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(path.courses || []).map((c, i) => (
                  <div key={c._id || i} className="flex items-center gap-1 text-sm">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${c.enrollment?.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {i + 1}
                    </span>
                    <button onClick={() => navigate(`/student/courses/${c._id}`)} className="text-indigo-600 hover:underline">
                      {c.title}
                    </button>
                    {i < path.courses.length - 1 && <ChevronRight size={14} className="text-gray-400" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!paths.length && <p className="text-gray-500">No learning paths available yet.</p>}
        </div>
      )}

      {activeTab === "skill-gaps" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-amber-600" /> Skill Gaps
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {(skillGapData?.skillGaps || []).map((s) => (
                <span key={s} className="px-2 py-1 bg-white border border-amber-200 rounded text-sm text-amber-800">{s}</span>
              ))}
              {!skillGapData?.skillGaps?.length && (
                <p className="text-sm text-gray-600">Set a target role in your profile to identify skill gaps.</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(skillGapData?.courses || []).map((rec) => (
              <CourseCard
                key={rec.course._id}
                course={rec.course}
                relevance={rec.relevanceScore}
                reason={rec.reason}
                onBookmark={toggleBookmark}
                bookmarked={bookmarks.has(rec.course._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Learning Assistant */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={20} /> AI Learning Assistant
        </h2>
        <p className="text-sm text-gray-500 mt-1">Ask what to learn next for your target career.</p>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <input
            value={assistantQ}
            onChange={(e) => setAssistantQ(e.target.value)}
            placeholder="What should I learn for an AI internship?"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            onKeyDown={(e) => e.key === "Enter" && askAssistant()}
          />
          <button
            onClick={askAssistant}
            disabled={assistantLoading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
          >
            {assistantLoading ? "Thinking…" : "Ask"}
          </button>
        </div>
        {assistantA && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">{assistantA}</div>
        )}
      </section>
    </div>
  );
}

function ClockIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
