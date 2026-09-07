import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlacementReadiness, buildReadinessSummary } from '../services/placementReadinessAgent.js';

test('calculatePlacementReadiness produces a score and explainable breakdown', () => {
  const student = {
    name: 'Asha',
    skills: ['Python', 'SQL', 'Power BI', 'Statistics', 'Excel'],
    projects: [{ title: 'Sales Dashboard' }, { title: 'Data Cleaning Workflow' }],
    experiences: [{ role: 'Data Analyst Intern' }],
    cgpa: 8.8,
    profileCompletion: 90,
    targetRole: 'Data Analyst',
    certifications: [{ name: 'Power BI Fundamentals' }],
  };

  const result = calculatePlacementReadiness(student);

  assert.ok(result.overallScore >= 0 && result.overallScore <= 100, 'Overall score should stay within range');
  assert.ok(result.breakdown.skillCoverage >= 0, 'Skill coverage should be present');
  assert.ok(result.level, 'Readiness level should be set');
  assert.ok(result.recommendations.length >= 2, 'Recommendations should provide next steps');
});

test('buildReadinessSummary summarizes a student cohort into clear insight blocks', () => {
  const students = [
    { name: 'Asha', skills: ['Python', 'SQL'], cgpa: 8.8, profileCompletion: 90, projects: [{ title: 'Dashboard' }], experiences: [{ role: 'Intern' }], targetRole: 'Data Analyst' },
    { name: 'Rohan', skills: ['JavaScript'], cgpa: 7.5, profileCompletion: 60, projects: [], experiences: [], targetRole: 'Full Stack Developer' },
  ];

  const summary = buildReadinessSummary(students);
  assert.ok(summary.highPotential >= 0, 'High potential count should be numeric');
  assert.ok(summary.averageScore >= 0, 'Average score should be numeric');
  assert.ok(summary.overview.includes('readiness'), 'Summary should explain readiness insight');
});
