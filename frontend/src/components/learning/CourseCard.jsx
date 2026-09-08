import { BookOpen, Clock, Award, Star, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const levelLabel = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
const levelColor = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default function CourseCard({ course, relevance, reason, onBookmark, bookmarked, compact }) {
  const navigate = useNavigate();
  if (!course) return null;

  const isExternal = course.courseType === "external";

  return (
    <div className={`bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow flex flex-col ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0">
          <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
            <BookOpen className="text-indigo-600 w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {course.provider}{course.platform && course.platform !== course.provider ? ` · ${course.platform}` : ""}
              {isExternal && <span className="ml-1 text-xs text-amber-600">(External)</span>}
            </p>
          </div>
        </div>
        {course.rating > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
            <Star size={12} /> {course.rating}
          </span>
        )}
      </div>

      {!compact && course.description && (
        <p className="text-gray-700 mt-3 text-sm line-clamp-2">{course.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <span className={`text-xs px-2 py-1 rounded capitalize ${levelColor[course.level] || levelColor.beginner}`}>
          {levelLabel[course.level] || course.level}
        </span>
        {course.category && (
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">{course.category}</span>
        )}
        {(course.skills || []).slice(0, 3).map((s) => (
          <span key={s} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded">{s}</span>
        ))}
      </div>

      {reason && (
        <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg p-2 mt-3 line-clamp-3">
          <span className="font-medium">Why this course? </span>{reason}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Clock size={12} /> {course.duration || "Self-paced"}</span>
          {course.lessonCount > 0 && <span>{course.lessonCount} lessons</span>}
        </div>
        {course.certificateAvailable && (
          <span className="flex items-center gap-1 text-indigo-600"><Award size={12} /> Certificate</span>
        )}
      </div>

      {relevance != null && (
        <p className="text-xs text-emerald-600 font-medium mt-2">{relevance}% relevance</p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => navigate(`/student/courses/${course._id}`)}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          View Course
        </button>
        {onBookmark && (
          <button
            onClick={() => onBookmark(course._id)}
            className={`px-3 py-2 rounded-lg border text-sm ${bookmarked ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            {bookmarked ? "Saved" : "Save"}
          </button>
        )}
        {isExternal && course.externalUrl && (
          <a
            href={course.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            title="View on provider"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
}

export function EnrollmentCard({ enrollment, featured }) {
  const navigate = useNavigate();
  const course = enrollment?.course || {};
  const progress = enrollment?.progressPercent || 0;
  const completedLessons = enrollment?.completedLessons?.length || 0;
  const totalLessons = course.lessonCount || 0;

  return (
    <div className={`bg-white border rounded-xl p-5 ${featured ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
            <BookOpen className="text-indigo-600 w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900">{course.title}</h3>
            <p className="text-sm text-gray-500">{course.provider} · {levelLabel[course.level] || course.level}</p>
            {enrollment.lastLessonTitle && (
              <p className="text-xs text-gray-500 mt-1">Last lesson: {enrollment.lastLessonTitle}</p>
            )}
            {enrollment.lastAccessedAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                Last accessed {new Date(enrollment.lastAccessedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="w-full sm:w-48">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            {totalLessons > 0 && (
              <p className="text-xs text-gray-500 mt-1">{completedLessons} / {totalLessons} lessons</p>
            )}
          </div>
          <button
            onClick={() => navigate(course.courseType === "internal" ? `/student/courses/${course._id}/learn` : `/student/courses/${course._id}`)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            Continue Learning
          </button>
        </div>
      </div>
    </div>
  );
}
