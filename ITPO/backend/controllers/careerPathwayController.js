import CareerPathway from "../models/CareerPathwayModel.js";
import LearningResource from "../models/LearningResourceModel.js";
import User from "../models/UserModel.js";
import AssessmentAttempt from "../models/AssessmentAttemptModel.js";
import Job from "../models/JobModel.js";
import Opportunity from "../models/OpportunityModel.js";

const DEMAND_WEIGHT = { low: 1, medium: 2, high: 3, very_high: 4 };
const normalize = (arr = []) => [...new Set(arr.map((s) => String(s).trim().toLowerCase()))].filter(Boolean);

// Admin: create pathway
export const createPathway = async (req, res) => {
  try {
    const pathway = await CareerPathway.create(req.body);
    res.status(201).json({ pathway });
  } catch (error) {
    res.status(400).json({ message: "Unable to create pathway", error: error.message });
  }
};

// Admin: list all pathways
export const listAllPathways = async (req, res) => {
  try {
    const pathways = await CareerPathway.find().sort({ industry: 1, role: 1 });
    res.json({ pathways });
  } catch (error) {
    res.status(500).json({ message: "Unable to load pathways", error: error.message });
  }
};

// Admin: update pathway
export const updatePathway = async (req, res) => {
  try {
    const pathway = await CareerPathway.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pathway) return res.status(404).json({ message: "Pathway not found" });
    res.json({ pathway });
  } catch (error) {
    res.status(400).json({ message: "Unable to update pathway", error: error.message });
  }
};

// Admin: delete pathway
export const deletePathway = async (req, res) => {
  try {
    await CareerPathway.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Pathway removed" });
  } catch (error) {
    res.status(500).json({ message: "Unable to remove pathway", error: error.message });
  }
};

// Student: get personalised career guidance (skills + interests + industry demand)
export const getCareerGuidance = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("skills interests skillProfile cgpa department");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const allSkills = normalize([...(student.skills || []), ...(student.skillProfile?.strengths || [])]);
    const interestNormalized = normalize(student.interests);

    const [pathways, jobs, opportunities] = await Promise.all([
      CareerPathway.find({ isActive: true }),
      Job.find({ isActive: true, status: "approved" }).select("skillsRequired location"),
      Opportunity.find({ status: "approved", audience: "student" }).select("requiredSkills type")
    ]);

    const jobSkillCount = {};
    jobs.forEach((j) => (j.skillsRequired || []).forEach((s) => {
      const k = String(s).trim().toLowerCase();
      if (k) jobSkillCount[k] = (jobSkillCount[k] || 0) + 1;
    }));

    const scored = pathways.map((p) => {
      const required = normalize(p.requiredSkills);
      const allPathSkills = normalize([...(p.requiredSkills || []), ...(p.niceToHaveSkills || [])]);
      const matched = required.filter((s) => allSkills.includes(s));
      const matchedNice = allPathSkills.filter((s) => allSkills.includes(s)).length;
      const missing = required.filter((s) => !allSkills.includes(s));
      const skillScore = required.length ? (matched.length / required.length) * 55 : 0;

      // Interest overlap (role + industry + certifications keywords)
      const interestText = normalize([p.role, p.industry, ...(p.relatedRoles || []), ...(p.certifications || [])]);
      const interestHit = interestNormalized.filter((i) => interestText.some((t) => t.includes(i) || i.includes(t))).length;
      const interestScore = interestNormalized.length ? (interestHit / interestNormalized.length) * 20 : 8;

      // Industry demand weight + live job demand
      const demandScore = (DEMAND_WEIGHT[p.demandLevel] || 2) * 5; // up to 20
      const liveJobScore = Math.min(5, required.reduce((acc, s) => acc + (jobSkillCount[s] || 0), 0) / 2);

      const matchScore = Math.round(skillScore + interestScore + demandScore + liveJobScore + matchedNice);

      return { pathway: p, matchScore, matchedSkills: matched, missingSkills: missing, interestScore, demandLevel: p.demandLevel };
    }).sort((a, b) => b.matchScore - a.matchScore);

    const topPathways = scored.slice(0, 5);

    // Skill gaps from top pathways
    const topMissingSkills = [...new Set(topPathways.flatMap((p) => p.missingSkills))].slice(0, 10);

    // Real learning resources for gaps + interests
    const resourceQuerySkills = [...topMissingSkills, ...interestNormalized].slice(0, 12);
    const resources = resourceQuerySkills.length > 0
      ? await LearningResource.find({ skills: { $in: resourceQuerySkills }, isActive: true }).limit(12)
      : [];

    // Industry demand summary (pathway supply + live requirements)
    const industryDemand = {};
    pathways.forEach((p) => {
      industryDemand[p.industry] = industryDemand[p.industry] || { industry: p.industry, roles: 0, liveOpportunities: 0, demandLevel: "low", demandScore: 0 };
      industryDemand[p.industry].roles += 1;
      industryDemand[p.industry].demandScore += DEMAND_WEIGHT[p.demandLevel] || 2;
    });
    Object.values(industryDemand).forEach((ind) => {
      const avg = ind.demandScore / ind.roles;
      ind.demandLevel = avg >= 4 ? "very_high" : avg >= 3 ? "high" : avg >= 2 ? "medium" : "low";
    });
    const recommendedIndustries = Object.values(industryDemand)
      .sort((a, b) => b.demandScore - a.demandScore || b.roles - a.roles)
      .map((ind) => ({
        ...ind,
        matchedRoles: pathways
          .filter((p) => p.industry === ind.industry)
          .filter((p) => normalize(p.requiredSkills).some((s) => allSkills.includes(s)))
          .map((p) => p.role)
      }))
      .filter((ind) => ind.matchedRoles.length > 0 || ind.demandLevel === "very_high")
      .slice(0, 6);

    res.json({
      studentProfile: { skills: student.skills, strengths: student.skillProfile?.strengths, interests: student.interests, department: student.department, cgpa: student.cgpa },
      recommendedPathways: topPathways,
      recommendedIndustries,
      learningResources: resources,
      skillGaps: topMissingSkills
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load career guidance", error: error.message });
  }
};

// Student: skill -> role -> industry mapping based on assessment + skills + interests
export const getSkillMapping = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("skills interests skillProfile department cgpa");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const lastAttempt = await AssessmentAttempt.findOne({ student: req.user._id, submittedAt: { $exists: true } }).sort({ submittedAt: -1 });
    const pathways = await CareerPathway.find({ isActive: true });

    const allSkills = normalize([...(student.skills || []), ...(student.skillProfile?.strengths || []), ...(lastAttempt?.strengths || [])]);
    const interestNormalized = normalize(student.interests);
    const gaps = normalize([...(student.skillProfile?.gaps || []), ...(lastAttempt?.gaps || [])]);

    // skill -> roles -> industries
    const skillIndex = {};
    pathways.forEach((p) => {
      const required = normalize(p.requiredSkills);
      const nice = normalize(p.niceToHaveSkills);
      const skillPool = [...new Set([...required, ...nice])];
      skillPool.forEach((s) => {
        if (!skillIndex[s]) skillIndex[s] = { skill: s, roles: [], industries: [], requiredIn: 0, niceIn: 0 };
        if (required.includes(s)) skillIndex[s].requiredIn += 1;
        else skillIndex[s].niceIn += 1;
        if (!skillIndex[s].roles.includes(p.role)) skillIndex[s].roles.push(p.role);
        if (!skillIndex[s].industries.includes(p.industry)) skillIndex[s].industries.push(p.industry);
      });
    });

    const skillsMap = Object.values(skillIndex)
      .sort((a, b) => b.requiredIn - a.requiredIn)
      .map((entry) => ({ ...entry, hasSkill: allSkills.includes(entry.skill), isGap: gaps.includes(entry.skill), roles: entry.roles.slice(0, 4), industries: entry.industries.slice(0, 4) }));

    // Industry recommendation scores
    const industryScores = {};
    pathways.forEach((p) => {
      if (!industryScores[p.industry]) {
        industryScores[p.industry] = { industry: p.industry, roles: 0, matchedSkills: 0, totalSkills: 0, demandScore: 0, roleNames: [] };
      }
      const rec = industryScores[p.industry];
      rec.roles += 1;
      rec.demandScore += DEMAND_WEIGHT[p.demandLevel] || 2;
      rec.roleNames.push(p.role);
      const reqSkills = normalize(p.requiredSkills);
      rec.totalSkills += reqSkills.length;
      rec.matchedSkills += reqSkills.filter((s) => allSkills.includes(s)).length;
    });

    const recommendedIndustries = Object.values(industryScores)
      .map((ind) => {
        const interestText = normalize([ind.industry, ...ind.roleNames]);
        const interestHit = interestNormalized.filter((i) => interestText.some((t) => t.includes(i) || i.includes(t))).length;
        const interestScore = interestNormalized.length ? (interestHit / interestNormalized.length) * 100 : 40;
        const coverage = ind.totalSkills ? Math.round((ind.matchedSkills / ind.totalSkills) * 100) : 0;
        const avgDemand = ind.demandScore / ind.roles;
        const demandPts = Math.round(Math.min(100, avgDemand * 25));
        const total = Math.round(coverage * 0.5 + interestScore * 0.3 + demandPts * 0.2);
        return {
          industry: ind.industry,
          roles: ind.roles,
          roleNames: ind.roleNames.slice(0, 6),
          coverageScore: coverage,
          interestScore: Math.round(interestScore),
          demandScore: ind.demandScore,
          avgDemand,
          demandLevel: avgDemand >= 3 ? "high" : avgDemand >= 2 ? "medium" : "low",
          totalScore: total
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 8);

    const recommendedRoles = pathways
      .map((p) => {
        const reqSkills = normalize(p.requiredSkills);
        const matched = reqSkills.filter((s) => allSkills.includes(s));
        const missing = reqSkills.filter((s) => !allSkills.includes(s));
        const industryRef = industryScores[p.industry];
        const coverage = reqSkills.length ? Math.round((matched.length / reqSkills.length) * 60) : 0;
        const demandPts = (DEMAND_WEIGHT[p.demandLevel] || 2) * 8;
        const industryPts = industryRef ? Math.min(20, Math.round((industryRef.demandScore / industryRef.roles) * 6)) : 0;
        const total = coverage + demandPts + industryPts;
        return { role: p.role, industry: p.industry, matchScore: total, matchedSkills: matched, missingSkills: missing, demandLevel: p.demandLevel, salaryLPA: p.averageSalaryLPA };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    res.json({
      studentProfile: { skills: student.skills, strengths: student.skillProfile?.strengths, interests: student.interests, gaps, lastAssessedAt: lastAttempt?.submittedAt || student.skillProfile?.lastAssessedAt },
      skillsMap,
      recommendedIndustries,
      recommendedRoles
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load skill mapping", error: error.message });
  }
};
// Student: personalised learning recommendations from real courses/certifications
export const getLearningRecommendations = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("skills interests skillProfile department");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const lastAttempt = await AssessmentAttempt.findOne({ student: req.user._id, submittedAt: { $exists: true } }).sort({ submittedAt: -1 });

    const skills = normalize([...(student.skills || []), ...(student.skillProfile?.strengths || []), ...(lastAttempt?.strengths || [])]);
    const gaps = normalize([...(student.skillProfile?.gaps || []), ...(lastAttempt?.gaps || [])]);
    const interests = normalize(student.interests);

    const allResources = await LearningResource.find({ isActive: true });
    const ranked = allResources
      .map((r) => {
        const rSkills = normalize(r.skills);
        const gapMatch = rSkills.filter((s) => gaps.includes(s)).length;
        const interestMatch = rSkills.filter((s) => interests.includes(s)).length;
        const skillMatch = rSkills.filter((s) => skills.includes(s)).length;
        const gapScore = gapMatch * 30;
        const interestScore = interestMatch * 15;
        const skillScore = skillMatch * 5;
        const costScore = r.isFree ? 10 : 5;
        const score = gapScore + interestScore + skillScore + costScore;
        return { resource: r, score, gapMatch, interestMatch };
      })
      .filter((r) => r.score > 5)
      .sort((a, b) => b.score - a.score);

    const recommendations = ranked.slice(0, 12).map(({ resource, score, gapMatch, interestMatch }) => ({
      _id: resource._id,
      title: resource.title,
      provider: resource.provider,
      type: resource.type,
      skills: resource.skills,
      url: resource.url,
      durationHours: resource.durationHours,
      isFree: resource.isFree,
      level: resource.level,
      industry: resource.industry,
      matchScore: score,
      gapMatch,
      interestMatch
    }));

    const popular = allResources.slice(0, 8);

    res.json({ gaps, interests, recommendations, popular });
  } catch (error) {
    res.status(500).json({ message: "Unable to load learning recommendations", error: error.message });
  }
};

// Public: list active pathways with optional skill filter
// Public: list active pathways with optional skill filter
export const listPathways = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.industry) filter.industry = new RegExp(req.query.industry, "i");
    if (req.query.skill) filter.requiredSkills = { $in: [new RegExp(req.query.skill, "i")] };
    const pathways = await CareerPathway.find(filter).sort({ demandLevel: -1, role: 1 });
    res.json({ pathways });
  } catch (error) {
    res.status(500).json({ message: "Unable to load pathways", error: error.message });
  }
};

// Admin: CRUD for learning resources
export const createResource = async (req, res) => {
  try {
    const resource = await LearningResource.create(req.body);
    res.status(201).json({ resource });
  } catch (error) {
    res.status(400).json({ message: "Unable to create resource", error: error.message });
  }
};

export const listResources = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.skill) filter.skills = { $in: [new RegExp(req.query.skill, "i")] };
    if (req.query.type) filter.type = req.query.type;
    const resources = await LearningResource.find(filter).sort({ provider: 1, title: 1 });
    res.json({ resources });
  } catch (error) {
    res.status(500).json({ message: "Unable to load resources", error: error.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    await LearningResource.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Resource removed" });
  } catch (error) {
    res.status(500).json({ message: "Unable to remove resource", error: error.message });
  }
};
