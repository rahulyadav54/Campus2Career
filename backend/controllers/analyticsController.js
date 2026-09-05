import Institution from "../models/InstitutionModel.js";
import User from "../models/UserModel.js";
import Job from "../models/JobModel.js";
import Opportunity from "../models/OpportunityModel.js";
import CareerPathway from "../models/CareerPathwayModel.js";
import Application from "../models/ApplicationModel.js";
import AssessmentAttempt from "../models/AssessmentAttemptModel.js";
import InternshipProgress from "../models/InternshipProgressModel.js";
import SkillAssessment from "../models/SkillAssessmentModel.js";

// Build `count` month buckets (key + human label) ending at the current month
const buildMonthBuckets = (count) => {
  const now = new Date();
  const keys = [];
  const labels = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    labels.push(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
  }
  return { keys, labels };
};

// Map a date to a bucket index, clamping out-of-window dates to the nearest boundary
const monthIndex = (date, keys) => {
  if (!date) return keys.length - 1;
  const d = new Date(date);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  let idx = keys.indexOf(key);
  if (idx === -1) idx = key < keys[0] ? 0 : keys.length - 1;
  return idx;
};

const normalizeSkill = (arr = []) =>
  [...new Set((arr || []).map((s) => String(s).trim()).filter(Boolean))];

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

// GET /api/career/analytics/skill-demand-trends
// Time-based skill demand analytics for institutions / admins
export const getSkillDemandTrends = async (req, res) => {
  try {
    const institutionName = await resolveInstitutionScope(req.user);
    const months = Math.min(24, Math.max(3, parseInt(req.query.months) || 12));
    const { keys, labels } = buildMonthBuckets(months);

    const studentFilter = { role: "student", status: "active" };
    if (institutionName) studentFilter.institution = institutionName;

    const [jobs, opportunities, pathways, students] = await Promise.all([
      Job.find({ isActive: true, status: "approved" }).select("skillsRequired createdAt"),
      Opportunity.find({ status: "approved" }).select("requiredSkills type createdAt"),
      CareerPathway.find({ isActive: true }).select("requiredSkills niceToHaveSkills industry role demandLevel createdAt updatedAt"),
      User.find(studentFilter).select("skills skillProfile.strengths skillProfile.lastAssessedAt")
    ]);

    const series = {};
    const ensure = (skill) => {
      const key = String(skill).trim().toLowerCase();
      if (!key) return null;
      if (!series[key]) series[key] = { skill: String(skill).trim(), monthly: new Array(keys.length).fill(0), industries: new Set(), total: 0 };
      return key;
    };
    const bump = (skill, idx, weight = 1, industry = null) => {
      const key = ensure(skill);
      if (key === null) return;
      series[key].monthly[idx] += weight;
      series[key].total += weight;
      if (industry) series[key].industries.add(industry);
    };

    for (const j of jobs) {
      const idx = monthIndex(j.createdAt, keys);
      for (const skill of j.skillsRequired || []) bump(skill, idx, 2);
    }
    for (const o of opportunities) {
      const idx = monthIndex(o.createdAt, keys);
      const weight = o.type === "internship" || o.type === "job" ? 2 : 1;
      for (const skill of o.requiredSkills || []) bump(skill, idx, weight, o.type);
    }
    for (const p of pathways) {
      const idx = monthIndex(p.updatedAt || p.createdAt, keys);
      const w = DEMAND_WEIGHT[p.demandLevel] || 2;
      for (const skill of [...(p.requiredSkills || []), ...(p.niceToHaveSkills || [])]) bump(skill, idx, w, p.industry);
    }
    for (const s of students) {
      const idx = monthIndex(s.skillProfile?.lastAssessedAt, keys);
      const seen = new Set();
      for (const skill of [...(s.skills || []), ...(s.skillProfile?.strengths || [])]) {
        const key = String(skill).trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        bump(skill, idx, 1);
      }
    }

    const trend = Object.values(series)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)
      .map((row) => ({
        skill: row.skill,
        total: row.total,
        monthly: row.monthly,
        industries: [...row.industries].slice(0, 3)
      }));

    const monthlyTotals = keys.map((_, i) => {
      let sum = 0;
      for (const row of Object.values(series)) sum += row.monthly[i] || 0;
      return { month: labels[i], monthKey: keys[i], demandScore: sum };
    });

    const peakMonth = monthlyTotals.reduce((a, b) => (b.demandScore > a.demandScore ? b : a), monthlyTotals[0]);

    res.json({
      institution: institutionName || "all-institutions",
      buckets: labels,
      months: keys,
      trend,
      monthlyTotals,
      summary: {
        months: keys.length,
        skillsTracked: Object.keys(series).length,
        peakMonth: peakMonth.month,
        peakSkill: trend[0]?.skill || null,
        topSkillCount: trend.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load skill demand trends", error: error.message });
  }
};

// GET /api/admin/analytics/recruitment-outcomes  (and /api/recruiter/analytics/recruitment-outcomes)
// Recruiter-specific hiring funnel analytics
export const getRecruitmentOutcomes = async (req, res) => {
  try {
    const isRecruiter = req.user.role === "recruiter";
    const recruiterId = req.user._id;
    const targetRecruiter = req.query.recruiter || (isRecruiter ? recruiterId : null);

    let jobFilter = { isActive: true };
    if (targetRecruiter) jobFilter.recruiter = targetRecruiter;
    if (!isRecruiter && req.query.company) jobFilter.company = req.query.company;

    const dateFilter = {};
    if (req.query.startDate) dateFilter.$gte = new Date(req.query.startDate);
    if (req.query.endDate) dateFilter.$lte = new Date(req.query.endDate);

    const [jobs, applications] = await Promise.all([
      Job.find({ ...jobFilter, ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) }).select("title status skillsRequired company createdAt"),
      targetRecruiter
        ? Application.find({ recruiter: targetRecruiter }).select("status createdAt student job")
        : Application.find({}).select("status createdAt student job")
    ]);

    const statusBuckets = {
      "pending mentor approval": 0,
      "rejected by mentor": 0,
      "pending recruiter review": 0,
      "rejected by recruiter": 0,
      "interview scheduled": 0,
      hired: 0
    };
    for (const app of applications) {
      if (app.status in statusBuckets) statusBuckets[app.status] += 1;
    }
    const totalApplications = applications.length;
    const hired = statusBuckets.hired;
    const interviews = statusBuckets["interview scheduled"];
    const applied = statusBuckets["pending mentor approval"];

    // Skills demanded across the recruiter's active jobs
    const skillCounts = {};
    for (const j of jobs) {
      for (const skill of j.skillsRequired || []) {
        const key = String(skill).trim().toLowerCase();
        if (!key) continue;
        skillCounts[key] = (skillCounts[key] || 0) + 1;
      }
    }
    const topSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((e) => ({ skill: e.skill.charAt(0).toUpperCase() + e.skill.slice(1), count: e.count }));

    // Monthly trend (applications + hires) over the last 12 months
    const { keys, labels } = buildMonthBuckets(12);
    const trend = keys.map((_, i) => ({ month: labels[i], monthKey: keys[i], applications: 0, interviews: 0, hired: 0 }));
    for (const app of applications) {
      const idx = monthIndex(app.createdAt, keys);
      if (app.status === "hired") trend[idx].hired += 1;
      else if (app.status === "interview scheduled") trend[idx].interviews += 1;
      trend[idx].applications += 1;
    }

    const conversion = {
      applicationToInterview: totalApplications ? Math.round((interviews / totalApplications) * 100) : 0,
      applicationToHire: totalApplications ? Math.round((hired / totalApplications) * 100) : 0,
      interviewToHire: interviews ? Math.round((hired / interviews) * 100) : 0
    };

    const appCountByJob = {};
    for (const app of applications) {
      if (app.job) appCountByJob[app.job.toString()] = (appCountByJob[app.job.toString()] || 0) + 1;
    }
    const recentJobs = jobs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((j) => ({
        title: j.title,
        status: j.status,
        company: j.company || "",
        applicationCount: appCountByJob[j._id.toString()] || 0,
        postedAt: j.createdAt
      }));

    res.json({
      recruiter: targetRecruiter ? (isRecruiter ? req.user.name : targetRecruiter) : null,
      scope: isRecruiter ? "self" : targetRecruiter ? "recruiter" : "all-recruiters",
      funnel: {
        jobsPosted: jobs.length,
        totalApplications,
        applied,
        pendingRecruiterReview: statusBuckets["pending recruiter review"],
        interviewsScheduled: interviews,
        hired
      },
      statusDistribution: Object.entries(statusBuckets).map(([status, count]) => ({ status, count })),
      conversion,
      monthlyTrend: trend,
      topSkills,
      recentJobs
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load recruitment outcomes", error: error.message });
  }
};

// GET /api/admin/analytics/internship-participation
// Institution-level internship participation and completion rates
export const getInternshipAnalytics = async (req, res) => {
  try {
    const institutionName = await resolveInstitutionScope(req.user);
    const months = Math.min(24, Math.max(3, parseInt(req.query.months) || 12));
    const { keys, labels } = buildMonthBuckets(months);

    const progressFilter = {};
    if (institutionName) progressFilter.institution = institutionName;

    const [records, opportunities] = await Promise.all([
      InternshipProgress.find(progressFilter).select("student institution title organization status startDate endDate skillsGained certificateIssued createdAt"),
      opportunityOppsForInstitution(institutionName)
    ]);

    const studentIds = [...new Set(records.map((r) => r.student))];
    const students = await User.find({ _id: { $in: studentIds } }).select("department institution name");
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

    const summary = {
      totalInternships: records.length,
      ongoing: 0,
      completed: 0,
      discontinued: 0,
      totalStudentsParticipated: studentIds.length,
      certificateRate: 0,
      avgDurationDays: 0
    };
    const byDepartment = {};
    const statusBreakdown = { ongoing: 0, completed: 0, discontinued: 0 };
    const orgCounts = {};
    const skillCounts = {};
    const trend = keys.map((_, i) => ({ month: labels[i], monthKey: keys[i], completed: 0, started: 0 }));
    let durationSum = 0;
    let durationCount = 0;

    for (const r of records) {
      statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
      summary[r.status] = (summary[r.status] || 0) + 1;

      const student = studentMap.get(r.student?.toString());
      const dept = student?.department || "Unassigned";
      if (!byDepartment[dept]) byDepartment[dept] = { department: dept, total: 0, completed: 0, ongoing: 0, discontinued: 0 };
      byDepartment[dept].total += 1;
      byDepartment[dept][r.status] += 1;

      const org = r.organization || "Unknown";
      orgCounts[org] = (orgCounts[org] || 0) + 1;

      for (const skill of r.skillsGained || []) {
        const key = String(skill).trim().toLowerCase();
        if (key) skillCounts[key] = (skillCounts[key] || 0) + 1;
      }

      if (r.status === "completed") {
        if (r.certificateIssued) summary.certificateRate += 1;
        if (r.startDate && r.endDate) {
          durationSum += (new Date(r.endDate) - new Date(r.startDate)) / (1000 * 60 * 60 * 24);
          durationCount += 1;
        }
        const idx = monthIndex(r.endDate, keys);
        trend[idx].completed += 1;
      }
      const startedIdx = monthIndex(r.startDate, keys);
      trend[startedIdx].started += 1;
    }

    summary.completionRate = records.length ? Math.round((summary.completed / records.length) * 100) : 0;
    summary.certificateRate = summary.completed ? Math.round((summary.certificateRate / summary.completed) * 100) : 0;
    summary.avgDurationDays = durationCount ? Math.round(durationSum / durationCount) : 0;

    const byDepartments = Object.values(byDepartment)
      .map((d) => ({ ...d, completionRate: d.total ? Math.round((d.completed / d.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);

    const topOrganizations = Object.entries(orgCounts)
      .map(([org, count]) => ({ organization: org, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const skillsGained = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill: skill.charAt(0).toUpperCase() + skill.slice(1), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    res.json({
      institution: institutionName || "all-institutions",
      months: keys.length,
      summary,
      statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })),
      byDepartment: byDepartments,
      completionTrend: trend,
      topOrganizations,
      skillsGained,
      programs: opportunities
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load internship analytics", error: error.message });
  }
};

// Build institution-scoped internship opportunity program stats (participation + completion)
const opportunityOppsForInstitution = async (institutionName) => {
  const opps = await Opportunity.find({ type: "internship", status: "approved" })
    .select("title provider requiredSkills applications createdAt");
  if (!institutionName) {
    return opps.map((o) => ({
      title: o.title,
      applications: o.applications.length,
      accepted: o.applications.filter((a) => a.status === "accepted" || a.status === "completed").length,
      completed: o.applications.filter((a) => a.status === "completed").length
    }));
  }
  const studentIds = (await User.find({ role: "student", institution: institutionName }).select("_id")).map((s) => s._id.toString());
  const studentSet = new Set(studentIds);
  return opps.map((o) => {
    const apps = o.applications.filter((a) => studentSet.has(a.applicant?.toString()));
    return {
      title: o.title,
      applications: apps.length,
      accepted: apps.filter((a) => a.status === "accepted" || a.status === "completed").length,
      completed: apps.filter((a) => a.status === "completed").length
    };
  }).filter((p) => p.applications > 0).sort((a, b) => b.applications - a.applications).slice(0, 10);
};

// GET /api/admin/analytics/student-skill-gaps
// Institution-wide skill gap distribution
export const getStudentSkillGapReport = async (req, res) => {
  try {
    const institutionName = await resolveInstitutionScope(req.user);
    const studentFilter = { role: "student", status: "active" };
    if (institutionName) studentFilter.institution = institutionName;

    const [students, jobs, pathways, opportunities, attempts, assessments] = await Promise.all([
      User.find(studentFilter).select("department skills skillProfile"),
      Job.find({ isActive: true, status: "approved" }).select("skillsRequired"),
      CareerPathway.find({ isActive: true }).select("requiredSkills niceToHaveSkills"),
      Opportunity.find({ status: "approved" }).select("requiredSkills"),
      AssessmentAttempt.find({ submittedAt: { $exists: true } }).select("student gaps"),
      SkillAssessment.find({}).select("student gaps")
    ]);

    const attemptGapByStudent = {};
    for (const a of attempts) attemptGapByStudent[a.student.toString()] = normalizeSkill(a.gaps);
    const assessmentGapByStudent = {};
    for (const a of assessments) assessmentGapByStudent[a.student.toString()] = normalizeSkill(a.gaps);

    // Demanded skills (in industry demand)
    const demanded = {};
    const bumpDemand = (skill, weight = 1) => {
      const key = String(skill).trim().toLowerCase();
      if (!key) return;
      demanded[key] = (demanded[key] || 0) + weight;
    };
    for (const j of jobs) for (const skill of j.skillsRequired || []) bumpDemand(skill, 2);
    for (const p of pathways) {
      const w = DEMAND_WEIGHT[p.demandLevel] || 2;
      for (const skill of [...(p.requiredSkills || []), ...(p.niceToHaveSkills || [])]) bumpDemand(skill, w);
    }
    for (const o of opportunities) for (const skill of o.requiredSkills || []) bumpDemand(skill, 2);

    // Per-student gap aggregation
    const gapCounts = {};
    const byDepartment = {};
    const distributionBuckets = { "0": 0, "1-2": 0, "3-5": 0, "6+": 0 };
    let studentsWithGaps = 0;
    let gapsSum = 0;

    for (const s of students) {
      const dept = s.department || "Unassigned";
      if (!byDepartment[dept]) byDepartment[dept] = { department: dept, totalStudents: 0, studentsWithGaps: 0, gapsSum: 0 };
      byDepartment[dept].totalStudents += 1;

      const idStr = s._id.toString();
      const profileGaps = normalizeSkill(s.skillProfile?.gaps);
      const attemptGaps = attemptGapByStudent[idStr] || [];
      const assessmentGaps = assessmentGapByStudent[idStr] || [];
      // Union of gap sources (lowercased)
      const allGaps = new Set([...profileGaps, ...attemptGaps, ...assessmentGaps]);
      const gapsArr = [...allGaps];

      if (gapsArr.length > 0) {
        studentsWithGaps += 1;
        gapsSum += gapsArr.length;
        byDepartment[dept].studentsWithGaps += 1;
        byDepartment[dept].gapsSum += gapsArr.length;
        for (const g of gapsArr) {
          gapCounts[g] = (gapCounts[g] || 0) + 1;
        }
      }

      const bucket = gapsArr.length === 0 ? "0" : gapsArr.length <= 2 ? "1-2" : gapsArr.length <= 5 ? "3-5" : "6+";
      distributionBuckets[bucket] += 1;
    }

    const gapFrequency = Object.entries(gapCounts)
      .map(([gap, count]) => ({ skill: gap.charAt(0).toUpperCase() + gap.slice(1), count }))
      .sort((a, b) => b.count - a.count);

    // Top skill gaps = missing skills that are also in high industry demand (priority)
    const topSkillGaps = gapFrequency
      .filter((g) => demanded[g.skill.toLowerCase()] > 0)
      .map((g) => ({
        skill: g.skill,
        gapCount: g.count,
        industryDemand: demanded[g.skill.toLowerCase()],
        priority: g.count + demanded[g.skill.toLowerCase()]
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 20);

    const demandedSkills = Object.entries(demanded)
      .map(([skill, count]) => ({ skill: skill.charAt(0).toUpperCase() + skill.slice(1), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    const byDepartments = Object.values(byDepartment).map((d) => ({
      department: d.department,
      totalStudents: d.totalStudents,
      studentsWithGaps: d.studentsWithGaps,
      gapRate: d.totalStudents ? Math.round((d.studentsWithGaps / d.totalStudents) * 100) : 0,
      avgGaps: d.studentsWithGaps ? Math.round((d.gapsSum / d.studentsWithGaps) * 10) / 10 : 0
    })).sort((a, b) => b.studentsWithGaps - a.studentsWithGaps);

    const totalStudents = students.length;

    res.json({
      institution: institutionName || "all-institutions",
      summary: {
        totalStudents,
        studentsWithGaps,
        studentsWithoutGaps: totalStudents - studentsWithGaps,
        pctWithGaps: totalStudents ? Math.round((studentsWithGaps / totalStudents) * 100) : 0,
        avgGapsPerStudent: totalStudents ? Math.round((gapsSum / totalStudents) * 10) / 10 : 0,
        totalUniqueGaps: gapFrequency.length
      },
      gapFrequency,
      topSkillGaps,
      byDepartment: byDepartments,
      distribution: Object.entries(distributionBuckets).map(([range, count]) => ({ range, count })),
      demandedSkills
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load student skill gap report", error: error.message });
  }
};
