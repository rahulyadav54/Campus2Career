import Opportunity from "../models/OpportunityModel.js";

const allowedProviders = ["recruiter", "academician", "institution", "admin"];

export const createOpportunity = async (req, res) => {
  try {
    if (!allowedProviders.includes(req.user.role)) return res.status(403).json({ message: "Your role cannot publish opportunities" });
    const opportunity = await Opportunity.create({ ...req.body, provider: req.user._id, status: req.user.role === "admin" ? "approved" : "pending" });
    res.status(201).json({ opportunity });
  } catch (error) {
    res.status(400).json({ message: "Unable to create opportunity", error: error.message });
  }
};

export const listOpportunities = async (req, res) => {
  try {
    const audience = req.user.role === "academician" ? { $in: ["academician", "both"] } : { $in: ["student", "both"] };
    const filter = { status: "approved", audience };
    if (req.query.type) filter.type = req.query.type;
    const opportunities = await Opportunity.find(filter).populate("provider", "name company institution designation").sort({ createdAt: -1 });
    res.json({ opportunities });
  } catch (error) {
    res.status(500).json({ message: "Unable to load opportunities", error: error.message });
  }
};

export const applyToOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOne({ _id: req.params.id, status: "approved" });
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
    const alreadyApplied = opportunity.applications.some((application) => application.applicant.toString() === req.user._id.toString());
    if (alreadyApplied) return res.status(409).json({ message: "You have already applied" });
    opportunity.applications.push({ applicant: req.user._id });
    await opportunity.save();
    res.status(201).json({ message: "Application submitted", opportunity });
  } catch (error) {
    res.status(500).json({ message: "Unable to apply", error: error.message });
  }
};

export const approveOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(req.params.id, { status: req.body.status || "approved" }, { new: true });
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
    res.json({ opportunity });
  } catch (error) {
    res.status(500).json({ message: "Unable to update opportunity", error: error.message });
  }
};

export const listPendingOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ status: "pending" }).populate("provider", "name company institution designation email").sort({ createdAt: -1 });
    res.json({ opportunities });
  } catch (error) {
    res.status(500).json({ message: "Unable to load pending opportunities", error: error.message });
  }
};