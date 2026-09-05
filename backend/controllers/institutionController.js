import Institution from "../models/InstitutionModel.js";
import User from "../models/UserModel.js";
import Application from "../models/ApplicationModel.js";
import PortfolioItem from "../models/PortfolioItemModel.js";

// Admin: create institution
export const createInstitution = async (req, res) => {
  try {
    const { name, code, address, city, state, website, phone, email, type, departments } = req.body;
    const existing = await Institution.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: "Institution code already exists" });

    const institution = await Institution.create({ name, code, address, city, state, website, phone, email, type, departments: departments || [] });
    res.status(201).json({ institution });
  } catch (error) {
    res.status(500).json({ message: "Unable to create institution", error: error.message });
  }
};

// Admin: list all institutions
export const listInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find().populate("adminUser", "name email").sort({ name: 1 });
    res.json({ institutions });
  } catch (error) {
    res.status(500).json({ message: "Unable to list institutions", error: error.message });
  }
};

// Admin: assign institution admin
export const assignInstitutionAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndUpdate(userId, { role: "institution", status: "active" });
    const institution = await Institution.findByIdAndUpdate(req.params.id, { adminUser: userId }, { new: true });
    if (!institution) return res.status(404).json({ message: "Institution not found" });

    res.json({ message: "Institution admin assigned", institution });
  } catch (error) {
    res.status(500).json({ message: "Unable to assign admin", error: error.message });
  }
};

// Institution admin: get own institution
export const getMyInstitution = async (req, res) => {
  try {
    const institution = await Institution.findOne({ adminUser: req.user._id });
    if (!institution) return res.status(404).json({ message: "No institution linked to your account" });
    res.json({ institution });
  } catch (error) {
    res.status(500).json({ message: "Unable to load institution", error: error.message });
  }
};

// Institution admin: update institution details
export const updateInstitution = async (req, res) => {
  try {
    const institution = await Institution.findOne({ adminUser: req.user._id });
    if (!institution) return res.status(404).json({ message: "No institution linked to your account" });

    const allowed = ["name", "address", "city", "state", "website", "phone", "email", "departments", "logoUrl"];
    allowed.forEach((field) => { if (req.body[field] !== undefined) institution[field] = req.body[field]; });
    await institution.save();
    res.json({ institution });
  } catch (error) {
    res.status(500).json({ message: "Unable to update institution", error: error.message });
  }
};

// Institution admin: dashboard metrics
export const getInstitutionDashboard = async (req, res) => {
  try {
    const institution = await Institution.findOne({ adminUser: req.user._id });
    if (!institution) return res.status(404).json({ message: "No institution linked to your account" });

    const institutionName = institution.name;

    const [totalStudents, placedStudents, pendingStudents, totalAcademicians, pendingPortfolioItems] = await Promise.all([
      User.countDocuments({ role: "student", institution: institutionName }),
      User.countDocuments({ role: "student", institution: institutionName, isPlaced: true }),
      User.countDocuments({ role: "student", institution: institutionName, status: "pending" }),
      User.countDocuments({ role: "academician", institution: institutionName }),
      PortfolioItem.countDocuments({ verified: false })
    ]);

    const departmentBreakdown = await User.aggregate([
      { $match: { role: "student", institution: institutionName } },
      { $group: { _id: "$department", count: { $sum: 1 }, placed: { $sum: { $cond: ["$isPlaced", 1, 0] } } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      metrics: {
        totalStudents,
        placedStudents,
        placementRate: totalStudents ? Math.round((placedStudents / totalStudents) * 100) : 0,
        pendingStudents,
        totalAcademicians,
        pendingPortfolioItems
      },
      departmentBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load dashboard", error: error.message });
  }
};

// Institution admin: list students of own institution
export const getInstitutionStudents = async (req, res) => {
  try {
    const institution = await Institution.findOne({ adminUser: req.user._id });
    if (!institution) return res.status(404).json({ message: "No institution linked to your account" });

    const { department, status } = req.query;
    const filter = { role: "student", institution: institution.name };
    if (department) filter.department = department;
    if (status) filter.status = status;

    const students = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: "Unable to load students", error: error.message });
  }
};

// Institution admin: approve/reject pending students of own institution
export const approveInstitutionStudent = async (req, res) => {
  try {
    const institution = await Institution.findOne({ adminUser: req.user._id });
    if (!institution) return res.status(404).json({ message: "No institution linked to your account" });

    const student = await User.findOne({ _id: req.params.id, institution: institution.name, role: "student" });
    if (!student) return res.status(404).json({ message: "Student not found in your institution" });

    student.status = req.body.action === "approve" ? "active" : "pending";
    await student.save();
    res.json({ message: `Student ${req.body.action}d`, student: student.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ message: "Unable to update student", error: error.message });
  }
};

// Institution admin: verify portfolio items for own institution students
export const verifyInstitutionPortfolio = async (req, res) => {
  try {
    const institution = await Institution.findOne({ adminUser: req.user._id });
    if (!institution) return res.status(404).json({ message: "No institution linked to your account" });

    // Ensure the portfolio item belongs to a student of this institution
    const item = await PortfolioItem.findById(req.params.id).populate("owner", "institution");
    if (!item) return res.status(404).json({ message: "Portfolio item not found" });
    if (item.owner.institution !== institution.name) {
      return res.status(403).json({ message: "This item does not belong to your institution" });
    }

    const { action, rejectionReason } = req.body;
    item.verified = action === "verify";
    item.verifiedBy = req.user._id;
    item.verifiedAt = new Date();
    if (action === "reject" && rejectionReason) item.rejectionReason = rejectionReason;
    await item.save();

    res.json({ message: `Portfolio item ${action}d`, item });
  } catch (error) {
    res.status(500).json({ message: "Unable to update portfolio item", error: error.message });
  }
};

// Institution admin: list pending portfolio items for own institution
export const getPendingPortfolioItems = async (req, res) => {
  try {
    const institution = await Institution.findOne({ adminUser: req.user._id });
    if (!institution) return res.status(404).json({ message: "No institution linked to your account" });

    const students = await User.find({ role: "student", institution: institution.name }).select("_id");
    const studentIds = students.map((s) => s._id);

    const items = await PortfolioItem.find({ owner: { $in: studentIds }, verified: false })
      .populate("owner", "name email department rollNo")
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: "Unable to load portfolio items", error: error.message });
  }
};
