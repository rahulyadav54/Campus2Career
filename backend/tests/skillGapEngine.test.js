import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSkillGap } from '../services/skillGapEngine.js';

test('evaluateSkillGap returns role coverage, strong skills, and missing skills for a target role', () => {
  const result = evaluateSkillGap({
    skills: ['Python', 'SQL', 'Excel', 'Power BI'],
    certifications: ['Google Data Analytics'],
    projects: [{ technologies: ['Python', 'SQL'] }],
    skillProfile: { strengths: ['Python', 'SQL'], gaps: ['Tableau'] },
    targetRole: 'Data Analyst',
  }, 'Data Analyst');

  assert.equal(result.targetRole, 'Data Analyst');
  assert.ok(result.skillCoverage >= 50);
  assert.ok(Array.isArray(result.strongSkills));
  assert.ok(Array.isArray(result.missingSkills));
  assert.ok(result.missingSkills.includes('Tableau') || result.missingSkills.includes('Statistics'));
  assert.ok(Array.isArray(result.recommendations));
  assert.ok(result.recommendations.length > 0);
  assert.ok(typeof result.why === 'string');
});

test('evaluateSkillGap does not silently default to Data Analyst when no target role is provided', () => {
  const result = evaluateSkillGap({
    skills: ['Python', 'SQL'],
    skillProfile: { strengths: ['Python'], gaps: [] },
  }, '');

  assert.equal(result.targetRole, '');
  assert.equal(result.skillCoverage, 0);
  assert.deepEqual(result.strongSkills, []);
  assert.deepEqual(result.missingSkills, []);
  assert.deepEqual(result.recommendations, []);
});
