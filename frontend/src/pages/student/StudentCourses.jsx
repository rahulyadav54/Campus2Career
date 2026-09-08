import { useEffect, useState, useCallback } from "react";
import { BookOpen, Globe, Clock, Award, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";
import CourseCard from "../../components/learning/CourseCard";

const levelLabel = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

const CATEGORIES = [
  "Programming", "AI & Machine Learning", "Data Science", "Web Development",
  "Cloud Computing", "DevOps", "Database", "Career Skills", "Interview Preparation",
];

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterFree, setFilterFree] = useState("all");
  const [bookmarks, setBookmarks] = useState(new Set());
  const navigate = useNavigate();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterLevel !== "all") params.set("level", filterLevel);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterFree === "free") params.set("isFree", "true");
      if (filterFree === "paid") params.set("isFree", "false");
      const res = await apiClient.get(`/api/courses?${params.toString()}`);
      setCourses(res.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [search, filterLevel, filterCategory, filterFree]);

  useEffect(() => {
    fetchCourses();
    apiClient.get("/api/learning/bookmarks").then((res) => {
      setBookmarks(new Set((res.data || []).map((b) => String(b.course?._id || b.course))));
    }).catch(() => {});
  }, [fetchCourses]);

  const toggleBookmark = async (courseId) => {
    try {
      const res = await apiClient.post(`/api/learning/bookmarks/${courseId}`);
      const next = new Set(bookmarks);
      if (res.data?.bookmarked) next.add(String(courseId));
      else next.delete(String(courseId));
      setBookmarks(next);
      toast.success(res.data?.bookmarked ? "Course saved" : "Removed from saved");
    } catch (err) {
      toast.error(err.message || "Failed to update bookmark");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Learning Hub</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Explore Courses</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Discover courses to build job-ready skills. Internal Campus2Career courses and trusted external providers.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, skills, technologies..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterFree} onChange={(e) => setFilterFree(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">Free & Paid</option>
            <option value="free">Free only</option>
            <option value="paid">Paid only</option>
          </select>
          <button onClick={() => navigate("/student/my-courses?tab=recommended")} className="px-3 py-2 text-indigo-600 border border-indigo-200 rounded-lg text-sm hover:bg-indigo-50">
            See Recommended
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-gray-500 py-12">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading courses…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onBookmark={toggleBookmark}
              bookmarked={bookmarks.has(String(course._id))}
            />
          ))}
          {!courses.length && <p className="text-gray-500 text-sm col-span-full text-center py-8">No courses found. Try different filters.</p>}
        </div>
      )}
    </div>
  );
}
