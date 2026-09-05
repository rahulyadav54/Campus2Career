import InternshipProgress from "../models/InternshipProgressModel.js";
import User from "../models/UserModel.js";

export const createProgress = async (req, res) => {
  try {
    if (!req.body.title || !req.body.startDate) {
      return res.status(400).json({ message: "Title and start date are required" });
    }
    const progress = await InternshipProgress.create({
      title: req.body.title,
      organization: req.body.organization || "",
      description: req.body.description || "",
      startDate: req.body.startDate,
      opportunity: req.body.opportunity || undefined,
      student: req.user._id,
      institution: req.user.institution || "",
      mentor: req.user.assignedMentor || null
    });
    res.status(201).json({ progress });
  } catch (error) {
    res.status(400).json({ message: "Unable to create internship record", error: error.message });
  }
};

export const getRecord = async (req, res) => {
  try {
    const record = await InternshipProgress.findById(req.params.id)
      .populate("student", "name email department rollNo institution")
      .populate("mentor", "name email")
      .populate("opportunity", "title type organization");
    if (!record) return res.status(404).json({ message: "Record not found" });

    const isOwner = record.student._id.toString() === req.user._id.toString();
    const isMentor = record.mentor && record.mentor._id.toString() === req.user._id.toString();
    const mentee = req.user.role === "mentor"
      ? await User.findOne({ _id: record.student._id, assignedMentor: req.user._id })
      : null;
    const isStaff = ["admin", "institution"].includes(req.user.role);

    if (!isOwner && !isMentor && !mentee && !isStaff) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json({ record });
  } catch (error) {
    res.status(500).json({ message: "Unable to load record", error: error.message });
  }
};

export const getMyProgress = async (req, res) => {
  try {
    const records = await InternshipProgress.find({ student: req.user._id })
      .populate("mentor", "name email")
      .sort({ createdAt: -1 });
    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Unable to load records", error: error.message });
  }
};

export const addWeeklyUpdate = async (req, res) => {
  try {
    const record = await InternshipProgress.findOne({ _id: req.params.id, student: req.user._id });
    if (!record) return res.status(404).json({ message: "Record not found" });
    record.weeklyUpdates.push(req.body);
    await record.save();
    res.json({ record });
  } catch (error) {
    res.status(400).json({ message: "Unable to add update", error: error.message });
  }
};

export const submitCompletion = async (req, res) => {
  try {
    const record = await InternshipProgress.findOne({ _id: req.params.id, student: req.user._id });
    if (!record) return res.status(404).json({ message: "Record not found" });
    record.completionEvidence = req.body.completionEvidence || "";
    record.completionRemarks = req.body.completionRemarks || "";
    record.skillsGained = req.body.skillsGained || [];
    record.status = "completed";
    record.endDate = new Date();
    await record.save();
    res.json({ record });
  } catch (error) {
    res.status(400).json({ message: "Unable to submit completion", error: error.message });
  }
};

export const getMenteeRecords = async (req, res) => {
  try {
    const mentees = await User.find({ assignedMentor: req.user._id, role: "student" }).select("_id");
    const records = await InternshipProgress.find({ student: { $in: mentees.map(m => m._id) } })
      .populate("student", "name email department rollNo")
      .sort({ createdAt: -1 });
    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Unable to load records", error: error.message });
  }
};

export const addMentorFeedback = async (req, res) => {
  try {
    const record = await InternshipProgress.findById(req.params.id)
      .populate("student", "assignedMentor");
    if (!record) return res.status(404).json({ message: "Record not found" });
    if (record.student.assignedMentor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    record.mentorFeedback.push({ by: req.user._id, text: req.body.text, rating: req.body.rating });
    await record.save();
    res.json({ record });
  } catch (error) {
    res.status(400).json({ message: "Unable to add feedback", error: error.message });
  }
};

export const issueCertificate = async (req, res) => {
  try {
    const record = await InternshipProgress.findById(req.params.id).populate("student", "assignedMentor");
    if (!record) return res.status(404).json({ message: "Record not found" });

    if (record.student.assignedMentor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the assigned mentor can issue this certificate" });
    }

    if (record.status !== "completed") {
      return res.status(400).json({ message: "Certificate can only be issued for completed internships" });
    }

    const certificateNumber = req.body.certificateNumber ||
      `C2C-${new Date().getFullYear()}-${String(record._id).slice(-6).toUpperCase()}`;
    const updated = await InternshipProgress.findByIdAndUpdate(
      req.params.id,
      {
        certificateIssued: true,
        certificateUrl: req.body.certificateUrl || "",
        certificateNumber,
        finalRating: req.body.finalRating
      },
      { new: true, runValidators: true }
    ).populate("student", "name email");

    res.json({ record: updated, certificateNumber });
  } catch (error) {
    res.status(400).json({ message: "Unable to issue certificate", error: error.message });
  }
};

export const getAllRecords = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    let studentIds = null;
    if (req.query.institution) {
      const students = await User.find({ role: "student", institution: req.query.institution }).select("_id");
      studentIds = students.map((s) => s._id);
      filter.student = { $in: studentIds };
    }

    const records = await InternshipProgress.find(filter)
      .populate("student", "name email department institution")
      .populate("mentor", "name email")
      .sort({ createdAt: -1 });
    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Unable to load records", error: error.message });
  }
};
