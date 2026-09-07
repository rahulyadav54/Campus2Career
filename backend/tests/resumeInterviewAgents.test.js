import test from "node:test";
import assert from "node:assert/strict";
import { analyzeResumeForRole, generateMockInterviewPlan } from "../services/resumeInterviewAgent.js";

test("analyzeResumeForRole flags missing keywords and gives ATS score", () => {
  const student = {
    name: "Asha",
    targetRole: "Data Analyst",
    skills: ["Python", "SQL", "Excel", "Power BI"],
    certifications: [{ name: "Tableau Fundamentals" }],
    projects: [{ title: "Sales Dashboard", technologies: ["Python", "SQL", "Power BI"] }],
  };

  const result = analyzeResumeForRole(student, "Data Analyst", "Need Python, SQL, Tableau, Statistics, dashboarding and reporting skills");

  assert.ok(result.atsScore >= 40, "ATS score should reflect a meaningful resume fit");
  assert.ok(result.missingKeywords.some((item) => /statistics|tableau/i.test(item.keyword)), "Missing keywords should highlight gaps");
  assert.ok(result.strengths.length >= 2, "Summary should list strengths");
});

test("generateMockInterviewPlan creates role-based questions and a score range", () => {
  const student = {
    name: "Asha",
    targetRole: "Data Analyst",
    skills: ["Python", "SQL", "Excel", "Power BI"],
  };

  const result = generateMockInterviewPlan(student, "Data Analyst", "mixed");

  assert.ok(result.questions.length >= 3, "Interview plan should include multiple questions");
  assert.ok(result.overallScore >= 0 && result.overallScore <= 100, "Overall score should be within range");
  assert.ok(result.questions.some((q) => /SQL|Python|dashboard|business question|data story/i.test(q.text)), "Role questions should include relevant technical topics");
});
