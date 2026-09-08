import mongoose from "mongoose";

const studentLearningActivitySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  activityType: {
    type: String,
    enum: ["lesson_complete", "quiz_complete", "course_enroll", "course_complete", "course_view"],
    required: true,
  },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "CourseLesson" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  activityDate: { type: Date, default: Date.now },
}, { timestamps: true });

studentLearningActivitySchema.index({ student: 1, activityDate: -1 });
studentLearningActivitySchema.index({ student: 1, activityType: 1, activityDate: -1 });

export default mongoose.model("StudentLearningActivity", studentLearningActivitySchema);
