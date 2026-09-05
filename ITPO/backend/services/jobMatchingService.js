/**
 * Centralized Job Matching Service
 * Single source of truth for all job match calculations across the platform.
 */

/**
 * Normalize a skills array:
 * - filter nulls/empty
 * - trim whitespace
 * - lowercase
 * - deduplicate
 */
export const normalizeSkills = (skills = []) =>
  [...new Set(
    skills
      .filter(Boolean)
      .map(s => String(s).trim().toLowerCase())
  )];

/**
 * Map overall score to a human-readable status label.
 */
export const getMatchStatus = (score) => {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Near Miss';
  if (score >= 20) return 'Low Match';
  return 'Poor Match';
};

/**
 * Calculate full job match for a student against a job.
 *
 * Scoring breakdown (overall weighted score):
 *   Skills match   — 70%  (primary signal)
 *   CGPA           — 15%  (>= 7.5 → 100%, >= 6.0 → 60%, else 20%)
 *   Location pref  — 15%  (preferred location → 100%, else 40%)
 *
 * Matched/missing skills are ALWAYS pure skill-vs-skill, never affected
 * by the weighted factors above.
 *
 * @param {Object} student  - { skills[], cgpa, preferredLocations[] }
 * @param {Object} job      - { skillsRequired[], location }
 * @returns {Object} match result
 */
export const calculateJobMatch = (student, job) => {
  const requiredSkills = normalizeSkills(job.skillsRequired);
  const studentSkills  = normalizeSkills(student.skills);

  // --- Skill match (pure) ---
  const matchedSkills  = requiredSkills.filter(s => studentSkills.includes(s));
  const missingSkills  = requiredSkills.filter(s => !studentSkills.includes(s));
  const skillScore     = requiredSkills.length === 0
    ? 0
    : Math.round((matchedSkills.length / requiredSkills.length) * 100);

  // --- CGPA score ---
  const cgpa = parseFloat(student.cgpa) || 0;
  const cgpaScore = cgpa >= 7.5 ? 100 : cgpa >= 6.0 ? 60 : 20;

  // --- Location score ---
  const preferred = (student.preferredLocations || [])
    .map(l => String(l).trim().toLowerCase());
  const jobLocation = String(job.location || '').trim().toLowerCase();
  const locationScore = preferred.length > 0 && preferred.includes(jobLocation) ? 100 : 40;

  // --- Weighted overall score ---
  const overallScore = Math.round(
    (skillScore * 0.70) +
    (cgpaScore  * 0.15) +
    (locationScore * 0.15)
  );

  return {
    overallScore,
    skillScore,
    matchedSkills,
    missingSkills,
    matchStatus: getMatchStatus(overallScore),
    breakdown: {
      skillsMatch:   `${skillScore}%`,
      cgpaMatch:     `${cgpaScore}%`,
      locationMatch: `${locationScore}%`,
    },
  };
};
