import User from "../models/UserModel.js";
import CareerMission from "../models/CareerMission.js";
import AIAutomationLog from "../models/AIAutomationLog.js";
import Opportunity from "../models/OpportunityModel.js";
import { logSuccess, logFailed } from "./aiLogger.js";
import { getRequiredSkillsForRole, getAllKnownRoles } from "./roleSkillMap.js";
import { buildOpportunityScout } from "./opportunityScout.js";
import { analyzeResumeForRole, generateMockInterviewPlan } from "./resumeInterviewAgent.js";
import { rankCandidatesForRole, buildRecruiterShortlist } from "./recruiterIntelligenceAgent.js";
import { calculatePlacementReadiness, buildReadinessSummary } from "./placementReadinessAgent.js";
import { generateInstitutionInsights } from "./institutionInsightsAgent.js";

const normalizeArray = (value = []) =>
  [...new Set(
    (Array.isArray(value) ? value : [value])
      .filter(Boolean)
      .map((item) => String(item).trim())
      .filter(Boolean)
  )];

const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const buildStudentContext = (student = {}) => ({
  id: student._id || student.id || null,
  name: student.name || "",
  role: student.role || "student",
  skills: normalizeArray(student.skills || []),
  interests: normalizeArray(student.interests || []),
  certifications: normalizeArray(student.certifications?.map((c) => c?.name || c) || []),
  projects: Array.isArray(student.projects) ? student.projects : [],
  targetRole: student.targetRole || "",
  department: student.department || "",
  cgpa: Number(student.cgpa || 0),
  profileCompletion: Number(student.profileCompletion || 0),
  skillProfile: student.skillProfile || {},
  resumeUrl: student.resumeUrl || "",
});

const getRoleHint = (targetRole = "") => {
  const normalized = String(targetRole || "").trim();
  if (!normalized) return "career_agent";

  const roleName = normalized.toLowerCase();
  if (roleName.includes("data") || roleName.includes("analyst")) return "career_agent";
  if (roleName.includes("developer") || roleName.includes("engineer")) return "career_agent";
  if (roleName.includes("product") || roleName.includes("manager")) return "career_agent";
  if (roleName.includes("design") || roleName.includes("ui")) return "career_agent";
  if (roleName.includes("risk") || roleName.includes("alert") || roleName.includes("at-risk")) return "mentor_agent";
  if (roleName.includes("resume") || roleName.includes("ats")) return "resume_agent";
  if (roleName.includes("interview")) return "interview_agent";
  if (roleName.includes("job") || roleName.includes("opportunity")) return "opportunity_agent";
  return "career_agent";
};

export const buildCareerMission = (student = {}, targetRole = "") => {
  const effectiveRole = String(targetRole || student.targetRole || "").trim();
  const requiredSkills = getRequiredSkillsForRole(effectiveRole) || [];
  const studentSkills = normalizeArray([
    ...(student.skills || []),
    ...(student.skillProfile?.strengths || []),
    ...(student.skillProfile?.gaps || []),
  ]);

  const strongSkills = requiredSkills.filter((skill) => studentSkills.includes(skill.toLowerCase()));
  const missingSkills = requiredSkills.filter((skill) => !studentSkills.includes(skill.toLowerCase()));
  const skillCoverage = requiredSkills.length
    ? clamp(Math.round((strongSkills.length / requiredSkills.length) * 100))
    : 0;

  const profileCompletion = Number(student.profileCompletion || 0);
  const readinessBase = clamp(
    Math.round((skillCoverage * 0.7) + (profileCompletion * 0.3))
  );

  const recommendedCourses = requiredSkills
    .filter((skill) => missingSkills.includes(skill))
    .slice(0, 5)
    .map((skill) => ({
      title: `Master ${skill} for ${effectiveRole}`,
      provider: "Campus2Career Learning",
      url: "",
      skill,
      source: "role_skill_map",
      reason: `${skill} appears as a high-priority requirement in ${effectiveRole} roles and is currently missing from the student profile.`,
    }));

  const recommendedProjects = requiredSkills
    .filter((skill) => missingSkills.includes(skill))
    .slice(0, 3)
    .map((skill) => ({
      title: `${effectiveRole} project: ${skill} workflow`,
      description: `Build a portfolio project that demonstrates ${skill} in a realistic ${effectiveRole} scenario.`,
      skills: [skill],
      reason: `This project helps close the ${skill} gap and makes your profile more credible to recruiters.`,
    }));

  const roadmap = [
    {
      week: 1,
      title: `Strengthen core ${effectiveRole} fundamentals`,
      description: `Begin with the highest-priority missing skills and align them to your current profile.`,
      actions: [
        `Complete the ${missingSkills[0] || "core skill"} learning path`,
        "Review 2 project examples aligned with your target role",
      ],
      skills: missingSkills.slice(0, 3),
      completed: false,
    },
    {
      week: 2,
      title: `Apply the new skill in a portfolio project`,
      description: `Translate learning into a visible project that recruiters can review.`,
      actions: [
        "Build a mini project using the new skill set",
        "Document outcomes and measurable results",
      ],
      skills: missingSkills.slice(0, 2),
      completed: false,
    },
    {
      week: 3,
      title: `Optimize your resume and interview readiness`,
      description: `Align resume language, keywords, and candidate story to the target role.`,
      actions: [
        "Update resume keywords for the target role",
        "Practice mock interview questions for the role",
      ],
      skills: requiredSkills.slice(0, 3),
      completed: false,
    },
    {
      week: 4,
      title: `Target opportunities with high-fit matches`,
      description: `Apply selectively to opportunities that match your readiness and skill profile.`,
      actions: [
        "Review top matched jobs and internships",
        "Submit only the highest-confidence applications",
      ],
      skills: requiredSkills.slice(0, 2),
      completed: false,
    },
  ];

  return {
    studentId: student._id || student.id || null,
    targetRole: effectiveRole || "Career Goal",
    targetIndustry: student.interests?.[0] || "",
    currentReadiness: readinessBase,
    skillCoverage,
    skillGaps: missingSkills,
    prioritySkills: missingSkills.slice(0, 5),
    strongSkills: strongSkills.slice(0, 5),
    missingSkills: missingSkills.slice(0, 10),
    recommendedCourses,
    recommendedProjects,
    interviewPlan: missingSkills.slice(0, 4).map((skill) => ({
      skill,
      description: `Prepare for ${skill} related interview questions and scenario-based practice.`,
      priority: "high",
    })),
    roadmap,
    status: "active",
    confidence: clamp(70 + Math.min(20, strongSkills.length * 4) + Math.min(10, profileCompletion / 10)),
    why: {
      coverage: `You already cover ${strongSkills.length} of ${requiredSkills.length || 0} priority skills for this role.`,
      readiness: `Readiness is weighted from skill coverage and profile completeness, which keeps the score explainable and traceable.`,
      missing: missingSkills.length
        ? `The most significant gaps are ${missingSkills.slice(0, 3).join(", ")}.`
        : "No major role gaps are currently detected from the mapped skill set.",
    },
  };
};

export const resolveAIAgent = ({ targetRole, intent, requestType }) => {
  const combined = `${String(targetRole || "")} ${String(intent || "")} ${String(requestType || "")}`.toLowerCase();

  if (combined.includes("resume") || combined.includes("ats") || combined.includes("cover letter")) return "resume_agent";
  if (combined.includes("interview") || combined.includes("mock")) return "interview_agent";
  if (combined.includes("opportunity") || combined.includes("job") || combined.includes("internship")) return "opportunity_agent";
  if (combined.includes("mentor") || combined.includes("risk") || combined.includes("at-risk") || combined.includes("warning")) return "mentor_agent";
  if (combined.includes("skill") || combined.includes("gap")) return "skill_gap_agent";
  if (combined.includes("recruiter") || combined.includes("candidate") || combined.includes("ranking")) return "recruiter_agent";
  if (combined.includes("readiness") || combined.includes("placement")) return "readiness_agent";
  if (combined.includes("institution") || combined.includes("forecast") || combined.includes("industry")) return "institution_insights_agent";

  return getRoleHint(targetRole);
};

export const dispatchAIRequest = async ({ user, payload = {} }) => {
  const agent = resolveAIAgent({
    targetRole: payload.targetRole || payload.role || payload.intent || "",
    intent: payload.intent || payload.action || "",
    requestType: payload.requestType || "",
  });

  if (!user) {
    throw new Error("A student or user is required to run the orchestrator.");
  }

  try {
    const student = await User.findById(user._id || user.id).select(
      "name role skills interests targetRole department cgpa profileCompletion skillProfile certifications projects resumeUrl"
    );

    if (!student) {
      throw new Error("Student profile not found.");
    }

    const context = buildStudentContext(student.toObject());
    const targetRole = String(payload.targetRole || student.targetRole || "").trim();
    const request = {
      agent,
      intent: payload.intent || payload.action || "career_planning",
      targetRole,
      studentContext: context,
    };

    const opportunityPool = await Opportunity.find({ status: "approved", audience: { $in: ["student", "both"] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const opportunityScout = buildOpportunityScout(context, opportunityPool);
    const resumeAnalysis = analyzeResumeForRole(context, targetRole || context.targetRole || "Data Analyst", "Python, SQL, dashboarding, reporting, and stakeholder communication");
    const interviewPlan = generateMockInterviewPlan(context, targetRole || context.targetRole || "Data Analyst", "mixed");
    const recruiterShortlist = buildRecruiterShortlist([
      context,
      {
        name: "Sample Candidate",
        skills: ["Python", "SQL", "Power BI", "Excel", "Statistics"],
        cgpa: 8.7,
        targetRole: targetRole || context.targetRole || "Data Analyst",
        profileCompletion: 88,
        projects: [{ title: "Revenue Insights", technologies: ["Python", "SQL", "Power BI"] }],
        experiences: [{ role: "Data Analyst Intern" }],
      },
    ], targetRole || context.targetRole || "Data Analyst", { minScore: 72 });
    const readinessScore = calculatePlacementReadiness(context, targetRole || context.targetRole || "Data Analyst");
    const cohortSummary = buildReadinessSummary([
      context,
      {
        name: "Sample Candidate",
        skills: ["Python", "SQL", "Power BI", "Excel", "Statistics"],
        cgpa: 8.7,
        targetRole: targetRole || context.targetRole || "Data Analyst",
        profileCompletion: 88,
        projects: [{ title: "Revenue Insights" }],
        experiences: [{ role: "Data Analyst Intern" }],
      },
    ]);
    const institutionInsights = generateInstitutionInsights({
      students: [
        context,
        {
          name: "Sample Candidate",
          department: "CSE",
          skills: ["Python", "SQL", "Power BI", "Excel"],
          cgpa: 8.7,
          targetRole: targetRole || context.targetRole || "Data Analyst",
          profileCompletion: 88,
          projects: [{ title: "Revenue Insights", technologies: ["Python", "SQL", "Power BI"] }],
          experiences: [{ role: "Data Analyst Intern" }],
        },
      ],
      term: "2026-27 Placement Cycle",
    });

    const result =
      agent === "skill_gap_agent"
        ? {
            agent,
            action: "skill_gap_analysis",
            summary: "Skill gap analysis has been queued for this student profile.",
            targetRole,
            skillCoverage: targetRole ? buildCareerMission(context, targetRole).skillCoverage : 0,
            skillGaps: targetRole ? buildCareerMission(context, targetRole).skillGaps : [],
            why: "Skills are compared against role requirements and the current profile to detect missing, weak, and priority gaps.",
          }
        : agent === "opportunity_agent"
          ? {
              agent,
              action: "opportunity_scout",
              summary: "Opportunity matching is ranking the strongest student-job fit based on skill overlap and role relevance.",
              targetRole,
              matches: opportunityScout.matches,
              recommendations: opportunityScout.recommendations,
              why: "The opportunity scout compares the student profile against approved opportunities using role match, skill overlap, and readiness signals.",
            }
          : agent === "resume_agent"
            ? {
                agent,
                action: "resume_intelligence",
                summary: "Resume intelligence is highlighting the strongest keyword matches and the next most important optimizations.",
                targetRole,
                analysis: resumeAnalysis,
                why: "The resume intelligence layer measures ATS relevance, keyword gaps, and concrete improvements aligned with the student’s target role.",
              }
            : agent === "interview_agent"
              ? {
                  agent,
                  action: "mock_interview",
                  summary: "A role-specific mock interview plan has been generated for interview preparation.",
                  targetRole,
                  plan: interviewPlan,
                  why: "The interview engine generates role-specific questions and readiness guidance based on the student’s current profile and target job.",
                }
              : agent === "recruiter_agent"
                ? {
                    agent,
                    action: "candidate_ranking",
                    summary: "Recruiter AI is ranking candidates by role-fit, skill match, academics, and profile completeness.",
                    targetRole,
                    shortlist: recruiterShortlist,
                    rankedCandidates: rankCandidatesForRole([
                      context,
                      {
                        name: "Sample Candidate",
                        skills: ["Python", "SQL", "Power BI", "Excel", "Statistics"],
                        cgpa: 8.7,
                        targetRole: targetRole || context.targetRole || "Data Analyst",
                        profileCompletion: 88,
                        projects: [{ title: "Revenue Insights", technologies: ["Python", "SQL", "Power BI"] }],
                        experiences: [{ role: "Data Analyst Intern" }],
                      },
                    ], targetRole || context.targetRole || "Data Analyst"),
                    why: "The recruiter intelligence layer keeps shortlisting explainable by showing how score components support a fit decision.",
                  }
                : agent === "readiness_agent"
                  ? {
                      agent,
                      action: "placement_readiness",
                      summary: "Placement readiness is being calculated across skill coverage, academic performance, projects, and profile completeness.",
                      targetRole,
                      readiness: readinessScore,
                      cohortSummary,
                      why: "The readiness layer combines role-fit and portfolio evidence into a transparent score that links directly to placement outcomes.",
                    }
                  : agent === "institution_insights_agent"
                    ? {
                        agent,
                        action: "institution_forecast",
                        summary: "Institution-level readiness and skill trends are being mapped to the next placement cycle forecast.",
                        targetRole,
                        institutionInsights,
                        why: "The institution insights layer blends department readiness, high-frequency skills, and forecast risk to support campus-level placement planning.",
                      }
                    : {
                        agent,
                        action: "career_mission",
                        mission: buildCareerMission(context, targetRole || "Data Analyst"),
                        why: "The system cross-checks the student profile, role requirements, and skill coverage to generate an explainable roadmap.",
                      };

    const log = await logSuccess({
      user: student._id,
      agent,
      action: request.intent,
      input: { ...payload, studentContext: context },
      output: result,
      confidence: result.mission?.confidence || 82,
      sourceData: {
        targetRole,
        roleMapAvailable: Boolean(getRequiredSkillsForRole(targetRole)),
        studentSkills: context.skills,
      },
      metadata: {
        requestType: payload.requestType || "orchestration",
        generatedAt: new Date().toISOString(),
      },
    });

    if (targetRole) {
      const missionPayload = buildCareerMission(context, targetRole);
      await CareerMission.findOneAndUpdate(
        { student: student._id },
        { $set: { ...missionPayload, student: student._id, lastAnalyzedAt: new Date() } },
        { upsert: true, new: true }
      );
    }

    return {
      success: true,
      agent,
      result,
      logId: log?._id || null,
    };
  } catch (error) {
    await logFailed({
      user: user._id || user.id || null,
      agent: "orchestrator",
      action: payload.action || payload.intent || "orchestration_request",
      input: payload,
      output: { error: error.message },
      confidence: 0,
      errorMessage: error.message,
      sourceData: { trace: "ai_orchestrator.dispatchAIRequest" },
    });
    throw error;
  }
};

export const getRecentAILogs = async ({ user, limit = 20, roleFilter = null }) => {
  const query = {};
  if (user && user.role !== "admin") {
    query.user = user._id;
  }
  if (roleFilter) {
    query.agent = roleFilter;
  }

  const logs = await AIAutomationLog.find(query)
    .sort({ timestamp: -1 })
    .limit(Number(limit) || 20)
    .lean();

  return logs;
};

export const buildAutomationOverview = (metrics = {}) => {
  const summary = {
    studentsAnalyzed: Number(metrics.studentsAnalyzed || 0),
    opportunitiesMatched: Number(metrics.opportunitiesMatched || 0),
    skillGapsDetected: Number(metrics.skillGapsDetected || 0),
    resumesOptimized: Number(metrics.resumesOptimized || 0),
    atRiskStudents: Number(metrics.atRiskStudents || 0),
    recommendationsGenerated: Number(metrics.recommendationsGenerated || 0),
  };

  if (!summary.recommendationsGenerated) {
    summary.recommendationsGenerated = summary.studentsAnalyzed + summary.skillGapsDetected + summary.opportunitiesMatched;
  }

  const activeAutomations = metrics.activeAutomations || [
    "Opportunity Scout",
    "Skill Gap Monitor",
    "Career Planner",
    "Resume Intelligence",
    "Placement Readiness Monitor",
    "Recruiter AI Shortlist",
    "Institution Insights",
  ];

  const automationCoverage = Math.min(100, Math.round(((activeAutomations.length / 4) * 100)));

  return {
    summary,
    activeAutomations,
    automationCoverage,
    systemHealth: automationCoverage >= 60 ? "healthy" : "watchlist",
    queueStatus: {
      ready: true,
      lastRefresh: new Date().toISOString(),
      pending: 0,
    },
    confidence: 0.87,
  };
};

export const getOrchestratorOverview = async () => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  const [studentsAnalyzed, opportunitiesMatched, skillGapsDetected, resumesOptimized, atRiskStudents] = await Promise.all([
    AIAutomationLog.countDocuments({ agent: "career_agent", timestamp: { $gte: startOfDay } }),
    AIAutomationLog.countDocuments({ agent: "opportunity_agent", timestamp: { $gte: startOfDay } }),
    AIAutomationLog.countDocuments({ agent: "skill_gap_agent", timestamp: { $gte: startOfDay } }),
    AIAutomationLog.countDocuments({ agent: "resume_agent", timestamp: { $gte: startOfDay } }),
    AIAutomationLog.countDocuments({ agent: "mentor_agent", timestamp: { $gte: startOfDay } }),
  ]);

  return buildAutomationOverview({
    studentsAnalyzed,
    opportunitiesMatched,
    skillGapsDetected,
    resumesOptimized,
    atRiskStudents,
    activeAutomations: [
      "Opportunity Scout",
      "Skill Gap Monitor",
      "Career Planner",
      "Resume Intelligence",
      "Mock Interview Planner",
      "Recruiter AI Shortlist",
      "Placement Readiness Monitor",
      "Institution Insights",
    ],
  });
};

export const getKnownAIAgents = () => [
  "orchestrator",
  "career_agent",
  "skill_gap_agent",
  "opportunity_agent",
  "resume_agent",
  "interview_agent",
  "recruiter_agent",
  "mentor_agent",
  "institution_insights_agent",
  "readiness_agent",
];

export const getRoleCatalog = () => getAllKnownRoles();

export default {
  buildCareerMission,
  buildAutomationOverview,
  resolveAIAgent,
  dispatchAIRequest,
  getRecentAILogs,
  getOrchestratorOverview,
  getKnownAIAgents,
  getRoleCatalog,
};
