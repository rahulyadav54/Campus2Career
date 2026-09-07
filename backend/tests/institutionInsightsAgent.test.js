import test from 'node:test';
import assert from 'node:assert/strict';
import { generateInstitutionInsights } from '../services/institutionInsightsAgent.js';

test('generateInstitutionInsights produces cohort forecast and department view', () => {
  const students = [
    { name: 'Asha', department: 'CSE', skills: ['Python', 'SQL', 'Power BI'], cgpa: 8.8, profileCompletion: 90, targetRole: 'Data Analyst', projects: [{ title: 'Dashboard' }], experiences: [{ role: 'Data Intern' }] },
    { name: 'Rohan', department: 'CSE', skills: ['JavaScript', 'React'], cgpa: 7.6, profileCompletion: 75, targetRole: 'Full Stack Developer', projects: [], experiences: [] },
    { name: 'Meera', department: 'ECE', skills: ['Python', 'SQL'], cgpa: 8.1, profileCompletion: 66, targetRole: 'Data Analyst', projects: [{ title: 'Analytics Project' }], experiences: [] },
  ];

  const result = generateInstitutionInsights({ students, term: '2026-27 Placement Cycle' });

  assert.ok(result.summary.toLowerCase().includes('institution') || result.summary.toLowerCase().includes('placement'), 'Summary should describe institutional readiness');
  assert.ok(Array.isArray(result.departments), 'Departments should be provided');
  assert.ok(result.topSkills.length > 0, 'Top skill demand should be computed');
  assert.ok(result.forecast.nextCycleReadiness >= 0, 'Forecast should include a numeric readiness score');
});
