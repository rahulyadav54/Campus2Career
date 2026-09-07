import test from "node:test";
import assert from "node:assert/strict";
import { buildOpportunityScout, matchStudentOpportunities } from "../services/opportunityScout.js";

test("buildOpportunityScout ranks high-fit opportunities for the student", () => {
  const student = {
    name: "Asha",
    targetRole: "Data Analyst",
    skills: ["Python", "SQL", "Excel", "Tableau", "Power BI"],
    interests: ["data", "visualization"],
    profileCompletion: 88,
  };

  const opportunities = [
    {
      _id: "1",
      title: "Junior Data Analyst",
      requiredSkills: ["Python", "SQL", "Excel", "Statistics", "Power BI"],
      type: "job",
      location: "Remote",
      description: "Analyze business data and support dashboards.",
    },
    {
      _id: "2",
      title: "Frontend Developer",
      requiredSkills: ["React", "CSS", "JavaScript", "HTML"],
      type: "job",
      location: "Hybrid",
      description: "Build frontend interfaces.",
    },
    {
      _id: "3",
      title: "Data Visualization Intern",
      requiredSkills: ["Tableau", "Power BI", "Excel"],
      type: "internship",
      location: "Remote",
      description: "Create dashboards and support data storytelling.",
    },
  ];

  const result = buildOpportunityScout(student, opportunities);

  assert.ok(result.matches.length >= 2, "Expected at least two high-fit matches");
  assert.ok(result.matches[0].matchScore >= 60, "Top match should score decently above threshold");
  assert.ok(result.matches.some((match) => /Data Analyst|Visualization/i.test(match.title)), "Expected a data-centric role to rank highly");
  assert.ok(result.recommendations.some((item) => /Python|SQL|Power BI|Tableau|Statistics/gi.test(item.skill)), "Recommendations should include role-relevant skills");

  const directMatch = matchStudentOpportunities(student, opportunities);
  assert.ok(directMatch.length >= 2, "Direct helper should return ranked opportunities");
});
