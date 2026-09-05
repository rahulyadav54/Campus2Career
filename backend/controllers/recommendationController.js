import Job from '../models/JobModel.js';
import User from '../models/UserModel.js';
import { calculateJobMatch } from '../services/jobMatchingService.js';

const buildRecommendation = (job, student) => {
  const { overallScore, skillScore, matchedSkills, missingSkills, matchStatus, breakdown } =
    calculateJobMatch(student, job);

  return {
    job_id:        job._id,
    job_title:     job.title,
    company:       job.recruiter?.company || job.recruiter?.name || 'Company Name',
    location:      job.location,
    match_score:   overallScore,
    skill_score:   skillScore,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    match_status:  matchStatus,
    breakdown,
    // legacy field kept for UI badge compatibility
    category: matchStatus,
    job_details: {
      description: job.description,
      duration:    job.duration,
      stipend:     job.stipend,
      type:        job.type,
    },
  };
};

export const getJobRecommendations = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select(
      'skills department specialization preferredLocations cgpa'
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const jobs = await Job.find({ isActive: true, status: 'approved' })
      .populate('recruiter', 'company name');

    const recommendations = jobs
      .map(job => buildRecommendation(job, student))
      .filter(rec => rec.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score);

    res.json({
      student_profile: {
        skills:         student.skills,
        department:     student.department,
        specialization: student.specialization,
        cgpa:           student.cgpa,
      },
      total_jobs_analyzed: jobs.length,
      recommendations,
      summary: {
        top_matches:  recommendations.filter(r => r.match_score >= 80).length,
        good_matches: recommendations.filter(r => r.match_score >= 60 && r.match_score < 80).length,
        near_misses:  recommendations.filter(r => r.match_score >= 40 && r.match_score < 60).length,
      },
    });
  } catch (error) {
    console.error('Job recommendation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getJobRecommendationsForStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId).select(
      'skills department specialization preferredLocations cgpa name'
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const jobs = await Job.find({ isActive: true, status: 'approved' })
      .populate('recruiter', 'company name');

    const recommendations = jobs
      .map(job => buildRecommendation(job, student))
      .filter(rec => rec.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);

    res.json({ student_name: student.name, recommendations });
  } catch (error) {
    console.error('Job recommendation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
