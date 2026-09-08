import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import CourseModule from "../models/CourseModule.js";
import CourseLesson from "../models/CourseLesson.js";
import StudentLearningActivity from "../models/StudentLearningActivity.js";
import NotificationService from "../services/notificationService.js";
import { EVENTS } from "../constants/notificationEvents.js";
import { generateCertificateId } from "../utils/certificateUtils.js";

const recalcProgress = async (enrollment, courseId) => {
  const totalLessons = await CourseLesson.countDocuments({ course: courseId });
  if (!totalLessons) return enrollment.progressPercent;
  const completed = enrollment.completedLessons?.length || 0;
  const percent = Math.round((completed / totalLessons) * 100);
  enrollment.progressPercent = percent;
  if (percent > 0 && enrollment.status === "not_started") {
    enrollment.status = "in_progress";
    enrollment.startedAt = enrollment.startedAt || new Date();
  }
  if (percent >= 100) {
    enrollment.status = "completed";
    enrollment.completedAt = enrollment.completedAt || new Date();
  }
  return percent;
};

const maybeNotifyProgress = async (enrollment, userId, courseTitle) => {
  const milestones = [50, 100];
  for (const m of milestones) {
    if (enrollment.progressPercent >= m && enrollment.progressMilestoneNotified < m) {
      enrollment.progressMilestoneNotified = m;
      if (m === 50) {
        await NotificationService.notify({
          userId,
          event: EVENTS.COURSE_PROGRESS_MILESTONE,
          data: { courseTitle, progress: m, courseId: enrollment.course },
        });
      }
    }
  }
};

export const listCourses = async (req, res) => {
  try {
    const {
      skill, level, platform, provider, search, category,
      isFree, certificate, courseType, targetRole,
    } = req.query;

    const filter = { status: "published" };

    if (skill) filter.skills = { $in: [skill] };
    if (level) filter.level = level;
    if (platform) filter.platform = platform;
    if (provider) filter.provider = provider;
    if (category) filter.category = category;
    if (courseType) filter.courseType = courseType;
    if (isFree === "true") filter.isFree = true;
    if (isFree === "false") filter.isFree = false;
    if (certificate === "true") filter.certificateAvailable = true;
    if (targetRole) filter.targetRoles = { $in: [targetRole] };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ message: "Failed to load courses", error: err.message });
  }
};

export const adminListCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ message: "Failed to load courses", error: err.message });
  }
};

export const getCourseStats = async (req, res) => {
  try {
    const [total, published, draft, enrollments, completed] = await Promise.all([
      Course.countDocuments(),
      Course.countDocuments({ status: "published" }),
      Course.countDocuments({ status: "draft" }),
      CourseEnrollment.countDocuments(),
      CourseEnrollment.countDocuments({ status: "completed" }),
    ]);
    const completionRate = enrollments ? Math.round((completed / enrollments) * 100) : 0;
    res.json({
      success: true,
      data: { total, published, draft, enrollments, completed, completionRate },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load stats", error: err.message });
  }
};

export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const modules = await CourseModule.find({ course: course._id }).sort({ order: 1 });
    const lessons = await CourseLesson.find({ course: course._id }).sort({ order: 1 });
    const modulesWithLessons = modules.map((mod) => ({
      ...mod.toObject(),
      lessons: lessons.filter((l) => String(l.module) === String(mod._id)),
    }));

    res.json({ success: true, data: { ...course.toObject(), modules: modulesWithLessons } });
  } catch (err) {
    res.status(500).json({ message: "Failed to load course", error: err.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.courseType === "internal" && !body.externalUrl) {
      body.externalUrl = "";
      body.platform = body.platform || "Campus2Career";
    }
    const course = await Course.create({ ...body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    res.status(400).json({ message: "Failed to create course", error: err.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(400).json({ message: "Failed to update course", error: err.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    await CourseLesson.deleteMany({ course: req.params.id });
    await CourseModule.deleteMany({ course: req.params.id });
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course", error: err.message });
  }
};

export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const existing = await CourseEnrollment.findOne({ student: req.user._id, course: courseId });
    if (existing) return res.status(400).json({ message: "Already enrolled in this course" });

    const enrollment = await CourseEnrollment.create({
      student: req.user._id,
      course: courseId,
      status: "not_started",
      lastAccessedAt: new Date(),
    });

    await StudentLearningActivity.create({
      student: req.user._id,
      activityType: "course_enroll",
      course: courseId,
      activityDate: new Date(),
    });

    await NotificationService.notify({
      userId: req.user._id,
      event: EVENTS.COURSE_ENROLLED,
      data: { courseTitle: course.title, courseId },
    });

    const populated = await CourseEnrollment.findById(enrollment._id).populate("course");
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to enroll", error: err.message });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { progressPercent, status } = req.body;

    const enrollment = await CourseEnrollment.findOne({ student: req.user._id, course: courseId }).populate("course");
    if (!enrollment) return res.status(404).json({ message: "Not enrolled in this course" });

    if (progressPercent !== undefined) {
      enrollment.progressPercent = Math.min(100, Math.max(0, progressPercent));
    }
    if (status) enrollment.status = status;
    enrollment.lastAccessedAt = new Date();

    if (enrollment.status === "in_progress" && !enrollment.startedAt) {
      enrollment.startedAt = new Date();
    }

    await enrollment.save();
    await maybeNotifyProgress(enrollment, req.user._id, enrollment.course?.title);
    await enrollment.save();

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ message: "Failed to update progress", error: err.message });
  }
};

export const completeLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const lesson = await CourseLesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const enrollment = await CourseEnrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: "Not enrolled in this course" });

    const completedSet = new Set((enrollment.completedLessons || []).map(String));
    if (!completedSet.has(String(lessonId))) {
      enrollment.completedLessons.push(lessonId);
    }
    enrollment.lastLesson = lessonId;
    enrollment.lastLessonTitle = lesson.title;
    enrollment.lastAccessedAt = new Date();
    enrollment.learningMinutes += lesson.durationMinutes || 10;
    enrollment.status = "in_progress";
    if (!enrollment.startedAt) enrollment.startedAt = new Date();

    await recalcProgress(enrollment, courseId);
    await enrollment.save();

    await StudentLearningActivity.create({
      student: req.user._id,
      activityType: "lesson_complete",
      course: courseId,
      lesson: lessonId,
      activityDate: new Date(),
    });

    if (enrollment.status === "completed") {
      await finalizeCompletion(enrollment, req.user);
    } else {
      await maybeNotifyProgress(enrollment, req.user._id, (await Course.findById(courseId))?.title);
      await enrollment.save();
    }

    const populated = await CourseEnrollment.findById(enrollment._id).populate("course");
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to complete lesson", error: err.message });
  }
};

async function finalizeCompletion(enrollment, user) {
  const course = await Course.findById(enrollment.course);
  const wasCompleted = enrollment.status === "completed" && enrollment.certificateId;

  if (!enrollment.certificateId) {
    enrollment.certificateId = generateCertificateId();
    enrollment.certificateIssueDate = new Date();
    enrollment.certificateUrl = `/certificates/verify/${enrollment.certificateId}`;
  }
  enrollment.completedAt = enrollment.completedAt || new Date();
  enrollment.progressPercent = 100;
  enrollment.status = "completed";
  await enrollment.save();

  if (!wasCompleted) {
    await StudentLearningActivity.create({
      student: user._id,
      activityType: "course_complete",
      course: enrollment.course,
      activityDate: new Date(),
    });

    await NotificationService.notify({
      userId: user._id,
      event: EVENTS.COURSE_COMPLETED,
      data: { courseTitle: course?.title, courseId: enrollment.course, certificateId: enrollment.certificateId },
    });
    await NotificationService.notify({
      userId: user._id,
      event: EVENTS.COURSE_CERTIFICATE_READY,
      data: { courseTitle: course?.title, certificateId: enrollment.certificateId, courseId: enrollment.course },
    });
  }
}

export const completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollment = await CourseEnrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: "Not enrolled in this course" });

    if (req.body.certificateUrl) enrollment.certificateUrl = req.body.certificateUrl;
    if (req.body.certificateId) enrollment.certificateId = req.body.certificateId;

    await finalizeCompletion(enrollment, req.user);

    const populated = await CourseEnrollment.findById(enrollment._id).populate("course");
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to complete course", error: err.message });
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await CourseEnrollment.find({ student: req.user._id })
      .populate("course")
      .sort({ lastAccessedAt: -1, enrolledAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ message: "Failed to load enrollments", error: err.message });
  }
};

export const getEnrollment = async (req, res) => {
  try {
    const enrollment = await CourseEnrollment.findOne({ student: req.user._id, course: req.params.courseId })
      .populate("course");
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ message: "Failed to load enrollment", error: err.message });
  }
};

// Admin module/lesson management
export const addModule = async (req, res) => {
  try {
    const module = await CourseModule.create({ ...req.body, course: req.params.courseId });
    res.status(201).json({ success: true, data: module });
  } catch (err) {
    res.status(400).json({ message: "Failed to add module", error: err.message });
  }
};

export const addLesson = async (req, res) => {
  try {
    const lesson = await CourseLesson.create({ ...req.body, course: req.params.courseId });
    const count = await CourseLesson.countDocuments({ course: req.params.courseId });
    await Course.findByIdAndUpdate(req.params.courseId, { lessonCount: count });
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    res.status(400).json({ message: "Failed to add lesson", error: err.message });
  }
};

export const updateModule = async (req, res) => {
  try {
    const module = await CourseModule.findOneAndUpdate(
      { _id: req.params.moduleId, course: req.params.courseId },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: module });
  } catch (err) {
    res.status(400).json({ message: "Failed to update module", error: err.message });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const lesson = await CourseLesson.findOneAndUpdate(
      { _id: req.params.lessonId, course: req.params.courseId },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: lesson });
  } catch (err) {
    res.status(400).json({ message: "Failed to update lesson", error: err.message });
  }
};

export const deleteModule = async (req, res) => {
  try {
    await CourseLesson.deleteMany({ module: req.params.moduleId });
    await CourseModule.deleteOne({ _id: req.params.moduleId, course: req.params.courseId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete module", error: err.message });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    await CourseLesson.deleteOne({ _id: req.params.lessonId, course: req.params.courseId });
    const count = await CourseLesson.countDocuments({ course: req.params.courseId });
    await Course.findByIdAndUpdate(req.params.courseId, { lessonCount: count });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete lesson", error: err.message });
  }
};
