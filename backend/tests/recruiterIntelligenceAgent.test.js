import test from 'node:test';
import assert from 'node:assert/strict';
import { rankCandidatesForRole, buildRecruiterShortlist } from '../services/recruiterIntelligenceAgent.js';

test('rankCandidatesForRole scores strong candidates highest for a target role', () => {
  const candidates = [
    {
      name: 'Asha',
      skills: ['Python', 'SQL', 'Power BI', 'Statistics'],
      cgpa: 8.9,
      targetRole: 'Data Analyst',
      profileCompletion: 90,
      projects: [{ title: 'Dashboard', technologies: ['Power BI', 'SQL'] }],
    },
    {
      name: 'Rohan',
      skills: ['JavaScript', 'React', 'Node.js'],
      cgpa: 7.8,
      targetRole: 'Data Analyst',
      profileCompletion: 60,
      projects: [{ title: 'Portfolio', technologies: ['React'] }],
    },
    {
      name: 'Meera',
      skills: ['Python', 'SQL', 'Excel', 'Power BI'],
      cgpa: 8.4,
      targetRole: 'Data Analyst',
      profileCompletion: 85,
      projects: [{ title: 'Warehouse Data', technologies: ['Python', 'SQL'] }],
    },
  ];

  const ranked = rankCandidatesForRole(candidates, 'Data Analyst');
  assert.ok(ranked.length === 3, 'Ranking should include all candidates');
  assert.equal(ranked[0].name, 'Asha', 'Strongest fit should rank first');
  assert.ok(ranked[0].score >= ranked[1].score, 'Scores should be descending');
});

test('buildRecruiterShortlist recommends a shortlist with rationale', () => {
  const candidates = [
    {
      name: 'Asha',
      skills: ['Python', 'SQL', 'Power BI', 'Statistics'],
      cgpa: 8.9,
      targetRole: 'Data Analyst',
      profileCompletion: 90,
      experiences: [{ role: 'Data Intern' }],
    },
    {
      name: 'Meera',
      skills: ['Python', 'SQL', 'Excel'],
      cgpa: 8.1,
      targetRole: 'Data Analyst',
      profileCompletion: 72,
    },
  ];

  const shortlist = buildRecruiterShortlist(candidates, 'Data Analyst', { minScore: 70 });
  assert.ok(shortlist.topCandidates.length >= 1, 'Shortlist should include at least one candidate');
  assert.ok(shortlist.summary.toLowerCase().includes('shortlist') || shortlist.summary.toLowerCase().includes('recommend'), 'Summary should explain recommendation');
  assert.ok(shortlist.topCandidates[0].reasoning.length > 0, 'Reasoning should explain the decision');
});
