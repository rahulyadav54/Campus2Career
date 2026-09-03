import Institution from "../models/InstitutionModel.js";
import User from "../models/UserModel.js";
import Job from "../models/JobModel.js";
import Opportunity from "../models/OpportunityModel.js";
import CareerPathway from "../models/CareerPathwayModel.js";
import Application from "../models/ApplicationModel.js";
import AssessmentAttempt from "../models/AssessmentAttemptModel.js";

const DEMAND_WEIGHT = { low: 1, medium: 2, high: 3, very_high: 4 };

// Resolve institution name filter when the logged in user is an institution admin
const resolveInstitutionScope = async (user) => {
  if (!user || user.role !== "institution") return null;
  const institution = await Institution.findOne({ adminUser: user._id });
  return institution ? institution.name : null;
};

const aggregateSkillDemand = async (institutionName = null) => {
  const studentFilter = { role: "student", status: "active" };
  if (institutionName) studentFilter.institution = institutionName;

  const [students, pathways, jobs, opportunities] = await Promise.all([
    User.find(studentFilter).select("skills skillProfile.strengths"),
    CareerPathway.find({ isActive: true }).select("requiredSkills niceToHaveSkills demandLevel industry role"),
    Job.find({ isActive: true, status: "approved" }).select("skillsRequired"),
    Opportunity.find({ status: "approved" }).select("requiredSkills type")
  ]);

  const demand = {}; // key = lowercase skill

  const bump = (skill, weight = 1) => {
    const key = String(skill).trim().toLowerCase();
    if (!key) return;
    demand[key] = demand[key] || { skill: String(skill).trim(), studentCount: 0, pathwayCount: 0, jobCount: 0, opportunityCount: 0, demandScore: 0, industries: new Set() };
    demand[key].demandScore += weight;
  };

  // Student skills & assessed strengths
  for (const s of students) {
    const seen = new Set();
    for (const skill of [...(s.skills || []), ...(s.skillProfile?.strengths || [])]) {
      const key = String(skill).trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      bump(skill, 1);
      demand[key].studentCount += 1;
    }
  }

  // Career pathway demand (weighted by demand level)
  for (const p of pathways) {
    const w = DEMAND_WEIGHT[p.demandLevel] || 2;
    for (const skill of [...(p.requiredSkills || []), ...(p.niceToHaveSkills || [])]) {
      const key = String(skill).trim().toLowerCase();
      if (!key) continue;
      bump(skill, w);
      demand[key].pathwayCount += 1;
      demand[key].industries.add(p.industry);
    }
  }

  // Approved job postings
  for (const j of jobs) {
    for (const skill of j.skillsRequired || []) {
      const key = String(skill).trim().toLowerCase();
      if (!key) continue;
      bump(skill, 2);
      demand[key].jobCount += 1;
    }
  }

  // Approved opportunities
  for (const o of opportunities) {
    for (const skill of o.requiredSkills || []) {
      const key = String(skill).trim().toLowerCase();
      if (!key) continue;
      bump(skill, 1);
      demand[key].opportunityCount += 1;
    }
  }

  const rows = Object.values(demand)
    .map((row) => ({
      skill: row.skill,
      demandScore: row.demandScore,
      studentCount: row.studentCount,
      pathwayCount: row.pathwayCount,
      jobCount: row.jobCount,
      opportunityCount: row.opportunityCount,
      industries: [...row.industries].slice(0, 5)
    }))
    .sort((a, b) => b.demandScore - a.demandScore || b.studentCount - a.studentCount);

  return rows;
};
const aggregatePlacementReadiness = async (institutionName = null) => {
  const studentFilter = { role: "student", status: "active" };
  if (institutionName) studentFilter.institution = institutionName;

  const students = await User.find(studentFilter).select(
    "department skills skillProfile cgpa isPlaced placementDetails"
  );
  const studentIds = students.map((student) => student._id);
  const [attempts, applications] = await Promise.all([
    AssessmentAttempt.find({ student: { $in: studentIds }, submittedAt: { $exists: true } }).select("student passed"),
    Application.find({ student: { $in: studentIds } }).select("student status")
  ]);

  const grouped = {};
  for (const s of students) {
    const dept = s.department || "Unassigned";
    if (!grouped[dept]) {
      grouped[dept] = {
        department: dept,
        totalStudents: 0,
        skillsCoverage: 0,
        skillsSum: 0,
        cgpaSum: 0,
        assessed: 0,
        passedAssessments: 0,
        applications: 0,
        placed: 0
      };
    }
    const g = grouped[dept];
    g.totalStudents += 1;
    g.skillsCoverage += (s.skills?.length || 0) > 0 ? 1 : 0;
    g.skillsSum += s.skills?.length || 0;
    g.cgpaSum += s.cgpa || 0;
    if (s.isPlaced) g.placed += 1;
  }

  const studentDepartment = new Map(students.map((student) => [student._id.toString(), student.department || "Unassigned"]));

  for (const a of attempts) {
    const dept = studentDepartment.get(a.student.toString()) || "Unassigned";
    if (!grouped[dept]) continue;
    grouped[dept].assessed += 1;
    if (a.passed) grouped[dept].passedAssessments += 1;
  }

  for (const app of applications) {
    const dept = studentDepartment.get(app.student.toString()) || "Unassigned";
    if (!grouped[dept]) continue;
    grouped[dept].applications += 1;
  }

  const breakdown = Object.values(grouped).map((g) => {
    const skillRate = g.totalStudents ? Math.round((g.skillsCoverage / g.totalStudents) * 100) : 0;
    const assessmentRate = g.totalStudents ? Math.round((g.assessed / g.totalStudents) * 100) : 0;
    const passRate = g.assessed ? Math.round((g.passedAssessments / g.assessed) * 100) : 0;
    const applyRate = g.totalStudents ? Math.round((g.applications / g.totalStudents) * 100) : 0;
    const placementRate = g.totalStudents ? Math.round((g.placed / g.totalStudents) * 100) : 0;
    const avgCgpa = g.totalStudents ? Math.round((g.cgpaSum / g.totalStudents) * 10) / 10 : 0;

    // Weighted readiness score (0-100)
    const readinessScore = Math.round(
      skillRate * 0.35 +
      Math.min(100, avgCgpa * 10) * 0.15 +
      assessmentRate * 0.2 +
      Math.min(100, applyRate * 2) * 0.15 +
      placementRate * 0.15
    );

    return {
      department: g.department,
      totalStudents: g.totalStudents,
      skillsCoverage: g.skillsCoverage,
      skillRate,
      avgSkills: g.totalStudents ? Math.round((g.skillsSum / g.totalStudents) * 10) / 10 : 0,
      avgCgpa,
      assessed: g.assessed,
      assessmentRate,
      passedAssessments: g.passedAssessments,
      passRate,
      applications: g.applications,
      applyRate,
      placed: g.placed,
      placementRate,
      readinessScore
    };
  });

  breakdown.sort((a, b) => b.readinessScore - a.readinessScore);

  const totals = {
    totalStudents: students.length,
    placed: students.filter((s) => s.isPlaced).length,
    placementRate: students.length ? Math.round((students.filter((s) => s.isPlaced).length / students.length) * 100) : 0,
    assessed: students.length ? Math.round((attempts.length / students.length) * 100) : 0
  };

  return { breakdown, totals };
};

// GET /api/career/analytics/skill-demand
export const getSkillDemandAnalytics = async (req, res) => {
  try {
    const institutionName = await resolveInstitutionScope(req.user);
    const skillDemand = await aggregateSkillDemand(institutionName);
    res.json({ institution: institutionName || "all-institutions", skillDemand: skillDemand.slice(0, 25) });
  } catch (error) {
    res.status(500).json({ message: "Unable to load skill demand analytics", error: error.message });
  }
};

// GET /api/career/analytics/placement-readiness
export const getPlacementReadinessAnalytics = async (req, res) => {
  try {
    const institutionName = await resolveInstitutionScope(req.user);
    const data = await aggregatePlacementReadiness(institutionName);
    res.json({ institution: institutionName || "all-institutions", ...data });
  } catch (error) {
    res.status(500).json({ message: "Unable to load placement readiness", error: error.message });
  }
};
