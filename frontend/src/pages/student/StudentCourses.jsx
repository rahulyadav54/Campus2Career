import { useEffect, useState } from "react";
import { BookOpen, Globe, Clock, Award, Filter, Search, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

const levelLabel = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
const levelColor = { beginner: "bg-green-100 text-green-700", intermediate: "bg-amber-100 text-amber-700", advanced: "bg-red-100 text-red-700" };

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const navigate = useNavigate();

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterLevel !== "all") params.set("level", filterLevel);
      const res = await apiClient.get(`/api/courses?${params.toString()}`);
      setCourses(res.data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search, filterLevel]);

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Learning Hub</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Explore Courses</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Learn from top platforms and earn certificates to boost your profile.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading courses…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {courses.map((course) => (
            <div key={course._id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-shadow flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2 sm:gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <BookOpen className="text-indigo-600 w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-1">{course.title}</h2>
                    <p className="text-xs sm:text-sm text-gray-500">{course.provider} · {course.platform}</p>
                  </div>
                </div>
                {course.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <Star size={12} /> {course.rating}
                  </span>
                )}
              </div>

              <p className="text-gray-700 mt-3 text-xs sm:text-sm line-clamp-2">{course.description}</p>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-50 text-indigo-700 rounded capitalize">{levelLabel[course.level] || course.level}</span>
                {(course.skills || []).slice(0, 3).map((s) => (
                  <span key={s} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-700 rounded">{s}</span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={12} /> {course.duration || "Self-paced"}
                </div>
                {course.certificateAvailable && (
                  <span className="flex items-center gap-1 text-indigo-600">
                    <Award size={12} /> Certificate
                  </span>
                )}
              </div>

              <button
                onClick={() => navigate(`/student/courses/${course._id}`)}
                className="mt-3 w-full px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm sm:text-base"
              >
                View Course
              </button>
            </div>
          ))}
          {!courses.length && <p className="text-gray-500 text-sm col-span-full">No courses found.</p>}
        </div>
      )}
    </div>
  );
}
