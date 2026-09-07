import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAutomationOverview } from '../services/aiOrchestrator.js';

test('buildAutomationOverview returns a structured automation snapshot', () => {
  const overview = buildAutomationOverview({
    studentsAnalyzed: 12,
    opportunitiesMatched: 7,
    skillGapsDetected: 5,
    resumesOptimized: 9,
    atRiskStudents: 2,
    activeAutomations: [
      'Opportunity Scout',
      'Skill Gap Monitor',
      'Career Planner',
      'Resume Intelligence',
    ],
  });

  assert.equal(overview.summary.studentsAnalyzed, 12);
  assert.equal(overview.summary.recommendationsGenerated, 24);
  assert.equal(overview.systemHealth, 'healthy');
  assert.ok(overview.automationCoverage > 0);
  assert.equal(overview.queueStatus.ready, true);
  assert.ok(Array.isArray(overview.activeAutomations));
});
