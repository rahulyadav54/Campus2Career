import User from "../models/UserModel.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import CourseBookmark from "../models/CourseBookmark.js";
import CourseModule from "../models/CourseModule.js";
import CourseLesson from "../models/CourseLesson.js";
import LearningPath from "../models/LearningPath.js";
import StudentLearningActivity from "../models/StudentLearningActivity.js";
import { getCourseRecommendations, getSkillGapCourses } from "../services/courseRecommendationService.js";
import { evaluateSkillGap } from "../services/skillGapEngine.js";
import { chatWithGemini, isGeminiConfigured } from "../services/geminiService.js";
import { COURSE_CATEGORIES } from "../constants/courseCategories.js";

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

async function computeStreak(studentId) {
  const activities = await StudentLearningActivity.find({
    student: studentId,
    activityType: { $in: ["lesson_complete", "quiz_complete", "course_complete"] },
  })
    .sort({ activityDate: -1 })
    .limit(90)
    .select("activityDate")
    .lean();

  if (!activities.length) return 0;

  const days = new Set(activities.map((a) => dayKey(new Date(a.activityDate))));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 90; i++) {
    const key = dayKey(cursor);
    if (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export const getLearningHub = async (req, res) => {
  try {
    const userId = req.user._id;
    const [enrollments, recommendations, bookmarks, recentActivity, stats] = await Promise.all([
      CourseEnrollment.find({ student: userId }).populate("course").sort({ lastAccessedAt: -1, updatedAt: -1 }),
      getCourseRecommendations(userId, { limit: 6 }),
      CourseBookmark.find({ student: userId }).populate("course").sort({ createdAt: -1 }).limit(12),
      StudentLearningActivity.find({ student: userId, activityType: "course_view" })
        .populate("course")
        .sort({ activityDate: -1 })
        .limit(6),
      getLearningStatsData(userId),
    ]);

    const continueLearning = enrollments
      .filter((e) => e.status !== "completed" && e.progressPercent > 0)
      .sort((a, b) => new Date(b.lastAccessedAt || b.updatedAt) - new Date(a.lastAccessedAt || a.updatedAt))[0]
      || enrollments.find((e) => e.status === "in_progress")
      || enrollments.find((e) => e.status === "not_started");

    const inProgress = enrollments.filter((e) => e.status === "in_progress" || (e.status === "not_started" && e.progressPercent > 0));
    const completed = enrollments.filter((e) => e.status === "completed");
    const notStarted = enrollments.filter((e) => e.status === "not_started" && e.progressPercent === 0);

    const recentCourses = [];
    const seen = new Set();
    for (const act of recentActivity) {
      const id = String(act.course?._id);
      if (act.course && !seen.has(id)) {
        seen.add(id);
        recentCourses.push(act.course);
      }
    }

    res.json({
      success: true,
      data: {
        continueLearning,
        inProgress,
        completed,
        notStarted,
        saved: bookmarks.map((b) => ({ ...b.course?.toObject?.() || b.course, bookmarkId: b._id })),
        recommendations,
        recentlyViewed: recentCourses,
        stats,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load learning hub", error: err.message });
  }
};

async function getLearningStatsData(userId) {
  const enrollments = await CourseEnrollment.find({ student: userId }).lean();
  const streak = await computeStreak(userId);
  const learningMinutes = enrollments.reduce((sum, e) => sum + (e.learningMinutes || 0), 0);
  const certificates = enrollments.filter((e) => e.certificateId).length;

  return {
    coursesEnrolled: enrollments.length,
    coursesCompleted: enrollments.filter((e) => e.status === "completed").length,
    lessonsCompleted: enrollments.reduce((sum, e) => sum + (e.completedLessons?.length || 0), 0),
    learningHours: Math.round((learningMinutes / 60) * 10) / 10,
    streak,
    certificates,
  };
}

export const getLearningStats = async (req, res) => {
  try {
    const stats = await getLearningStatsData(req.user._id);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ message: "Failed to load stats", error: err.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 12;
    const jobId = req.query.jobId || null;
    const data = await getCourseRecommendations(req.user._id, { limit, jobId });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: "Failed to load recommendations", error: err.message });
  }
};

export const getSkillGapCourseList = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const gap = evaluateSkillGap(user, user?.targetRole);
    const courses = await getSkillGapCourses(req.user._id, { limit: 12 });
    res.json({ success: true, data: { skillGaps: gap.missingSkills, courses, analysis: gap } });
  } catch (err) {
    res.status(500).json({ message: "Failed to load skill gap courses", error: err.message });
  }
};

export const listBookmarks = async (req, res) => {
  try {
    const bookmarks = await CourseBookmark.find({ student: req.user._id })
      .populate("course")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookmarks });
  } catch (err) {
    res.status(500).json({ message: "Failed to load bookmarks", error: err.message });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const { courseId } = req.params;
    const existing = await CourseBookmark.findOne({ student: req.user._id, course: courseId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, data: { bookmarked: false } });
    }
    const bookmark = await CourseBookmark.create({ student: req.user._id, course: courseId });
    res.json({ success: true, data: { bookmarked: true, bookmark } });
  } catch (err) {
    res.status(500).json({ message: "Failed to update bookmark", error: err.message });
  }
};

export const trackCourseView = async (req, res) => {
  try {
    const { courseId } = req.params;
    await StudentLearningActivity.create({
      student: req.user._id,
      activityType: "course_view",
      course: courseId,
      activityDate: new Date(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to track view", error: err.message });
  }
};

export const listLearningPaths = async (req, res) => {
  try {
    const userId = req.user?._id;
    const filter = { status: "published" };
    if (req.query.role) filter.targetRole = { $regex: req.query.role, $options: "i" };

    const paths = await LearningPath.find(filter)
      .populate({ path: "courses.course", select: "title level duration skills thumbnail provider" })
      .sort({ title: 1 });

    let enrollments = [];
    if (userId) {
      enrollments = await CourseEnrollment.find({ student: userId }).select("course status progressPercent").lean();
    }
    const enrollmentMap = new Map(enrollments.map((e) => [String(e.course), e]));

    const data = paths.map((path) => {
      const courses = (path.courses || []).map((item) => {
        const c = item.course;
        const en = c ? enrollmentMap.get(String(c._id)) : null;
        return { ...c?.toObject?.() || c, order: item.order, enrollment: en };
      }).filter((c) => c._id || c.title);

      const completed = courses.filter((c) => c.enrollment?.status === "completed").length;
      const progressPercent = courses.length ? Math.round((completed / courses.length) * 100) : 0;

      return {
        ...path.toObject(),
        courses,
        progressPercent,
        completedCourses: completed,
        totalCourses: courses.length,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: "Failed to load learning paths", error: err.message });
  }
};

export const getLearningPath = async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id)
      .populate({ path: "courses.course" });
    if (!path) return res.status(404).json({ message: "Learning path not found" });

    const enrollments = await CourseEnrollment.find({ student: req.user._id }).lean();
    const enrollmentMap = new Map(enrollments.map((e) => [String(e.course), e]));

    const courses = (path.courses || []).map((item) => ({
      ...(item.course?.toObject?.() || item.course),
      order: item.order,
      enrollment: enrollmentMap.get(String(item.course?._id || item.course)) || null,
    }));

    const completed = courses.filter((c) => c.enrollment?.status === "completed").length;
    res.json({
      success: true,
      data: {
        ...path.toObject(),
        courses,
        progressPercent: courses.length ? Math.round((completed / courses.length) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load path", error: err.message });
  }
};

export const learningAssistant = async (req, res) => {
  try {
    const { question, jobId } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: "Question is required" });

    const user = await User.findById(req.user._id).lean();
    const gap = evaluateSkillGap(user, user?.targetRole);
    const recommendations = await getCourseRecommendations(req.user._id, { limit: 5, jobId });
    const enrollments = await CourseEnrollment.find({ student: req.user._id }).populate("course").limit(10);

    const context = {
      name: user.name,
      targetRole: user.targetRole || "Not set",
      skills: (user.skills || []).join(", ") || "None listed",
      skillGaps: (gap.missingSkills || []).join(", ") || "None identified",
      enrolledCourses: enrollments.map((e) => e.course?.title).filter(Boolean).join(", ") || "None",
      recommendations: recommendations.map((r) => `${r.course.title} (${r.relevanceScore}% — ${r.reason})`).join("\n"),
    };

    const systemPrompt = `You are the Campus2Career AI Learning Assistant. Help students plan learning paths.
Use ONLY the student context provided. Do not guarantee jobs. Use phrases like "may help strengthen preparation".
Be concise, actionable, and suggest specific next steps from recommended courses when relevant.`;

    const userPrompt = `Student context:
- Target role: ${context.targetRole}
- Current skills: ${context.skills}
- Skill gaps: ${context.skillGaps}
- Enrolled courses: ${context.enrolledCourses}
- Top recommendations:
${context.recommendations || "No recommendations yet"}

Question: ${question}`;

    let answer;
    try {
      if (isGeminiConfigured()) {
        const result = await chatWithGemini({
          systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });
        answer = result.response;
      } else {
        answer = buildFallbackAssistantAnswer(question, context, recommendations);
      }
    } catch {
      answer = buildFallbackAssistantAnswer(question, context, recommendations);
    }

    res.json({ success: true, data: { answer, recommendations: recommendations.slice(0, 3) } });
  } catch (err) {
    res.status(500).json({ message: "Assistant unavailable", error: err.message });
  }
};

function buildFallbackAssistantAnswer(question, context, recommendations) {
  const q = question.toLowerCase();
  if (q.includes("docker") || q.includes("why")) {
    const docker = recommendations.find((r) => (r.course.skills || []).some((s) => s.toLowerCase().includes("docker")));
    if (docker) return docker.reason;
  }
  if (recommendations.length) {
    const top = recommendations[0];
    return `Based on your profile targeting ${context.targetRole}, I suggest starting with "${top.course.title}". ${top.reason}`;
  }
  return `Focus on building skills aligned with ${context.targetRole}. Your top gaps are: ${context.skillGaps}. Explore courses in the Learning Hub to address these areas.`;
}

export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const enrollment = await CourseEnrollment.findOne({ certificateId })
      .populate("course")
      .populate("student", "name email");
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Certificate not found or invalid" });
    }
    res.json({
      success: true,
      data: {
        valid: true,
        certificateId: enrollment.certificateId,
        studentName: enrollment.student?.name,
        courseName: enrollment.course?.title,
        provider: enrollment.course?.provider,
        completionDate: enrollment.completedAt || enrollment.certificateIssueDate,
        status: enrollment.status === "completed" ? "verified" : "invalid",
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
};

export const getCategories = async (req, res) => {
  res.json({ success: true, data: COURSE_CATEGORIES });
};

// Admin learning path CRUD
export const createLearningPath = async (req, res) => {
  try {
    const path = await LearningPath.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: path });
  } catch (err) {
    res.status(400).json({ message: "Failed to create path", error: err.message });
  }
};

export const updateLearningPath = async (req, res) => {
  try {
    const path = await LearningPath.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: path });
  } catch (err) {
    res.status(400).json({ message: "Failed to update path", error: err.message });
  }
};

export const deleteLearningPath = async (req, res) => {
  try {
    await LearningPath.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Path deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete path", error: err.message });
  }
};

