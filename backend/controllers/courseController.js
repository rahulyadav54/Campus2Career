import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";

export const listCourses = async (req, res) => {
  try {
    const { skill, level, platform, provider, search } = req.query;
    const filter = { status: "published" };

    if (skill) filter.skills = { $in: [skill] };
    if (level) filter.level = level;
    if (platform) filter.platform = platform;
    if (provider) filter.provider = provider;
    if (search) filter.title = { $regex: search, $options: "i" };

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ message: "Failed to load courses", error: err.message });
  }
};

export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ message: "Failed to load course", error: err.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, createdBy: req.user._id });
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
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course", error: err.message });
  }
};

export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const existing = await CourseEnrollment.findOne({ student: req.user._id, course: courseId });
    if (existing) return res.status(400).json({ message: "Already enrolled in this course" });

    const enrollment = await CourseEnrollment.create({ student: req.user._id, course: courseId });
    res.status(201).json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ message: "Failed to enroll", error: err.message });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { progressPercent, status } = req.body;

    const enrollment = await CourseEnrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: "Not enrolled in this course" });

    enrollment.progressPercent = Math.min(100, Math.max(0, progressPercent ?? enrollment.progressPercent));
    if (status) enrollment.status = status;

    if (enrollment.status === "in_progress" && !enrollment.startedAt) {
      enrollment.startedAt = new Date();
    }
    if (enrollment.status === "completed" && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
    }

    await enrollment.save();
    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ message: "Failed to update progress", error: err.message });
  }
};

export const completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { certificateUrl, certificateId, certificateIssueDate } = req.body;

    const enrollment = await CourseEnrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: "Not enrolled in this course" });

    enrollment.status = "completed";
    enrollment.progressPercent = 100;
    enrollment.completedAt = new Date();
    if (certificateUrl) enrollment.certificateUrl = certificateUrl;
    if (certificateId) enrollment.certificateId = certificateId;
    if (certificateIssueDate) enrollment.certificateIssueDate = certificateIssueDate;

    await enrollment.save();
    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ message: "Failed to complete course", error: err.message });
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await CourseEnrollment.find({ student: req.user._id })
      .populate("course")
      .sort({ enrolledAt: -1 });
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
