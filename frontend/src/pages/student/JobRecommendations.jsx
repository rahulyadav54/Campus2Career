import { API_URL } from '../../config/api';
import { useState, useEffect } from 'react';
import { Star, MapPin, Clock, DollarSign, Target, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const INITIAL_SKILLS_SHOWN = 4;

const ScoreBadge = ({ score }) => {
  const color =
    score >= 80 ? 'text-green-600' :
    score >= 60 ? 'text-blue-600'  :
    score >= 40 ? 'text-yellow-600':
    score >= 20 ? 'text-orange-600': 'text-red-600';
  return <span className={`text-2xl font-bold ${color}`}>{score}%</span>;
};

const CategoryBadge = ({ status }) => {
  const styles =
    status === 'Excellent Match' ? 'bg-green-100 text-green-800 border-green-200' :
    status === 'Good Match'      ? 'bg-blue-100 text-blue-800 border-blue-200'    :
    status === 'Near Miss'       ? 'bg-yellow-100 text-yellow-800 border-yellow-200':
    status === 'Low Match'       ? 'bg-orange-100 text-orange-800 border-orange-200':
                                   'bg-red-100 text-red-800 border-red-200';
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border w-fit ${styles}`}>
      {status}
    </span>
  );
};

const SkillsList = ({ skills, variant }) => {
  const [expanded, setExpanded] = useState(false);
  if (!skills?.length) return null;
  const shown = expanded ? skills : skills.slice(0, INITIAL_SKILLS_SHOWN);
  const hidden = skills.length - INITIAL_SKILLS_SHOWN;

  const tagStyle = variant === 'matched'
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-orange-50 text-orange-700 border-orange-200';

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {shown.map((skill, i) => (
        <span key={i} className={`px-2 py-1 rounded-md text-xs border ${tagStyle}`}>
          {skill}
        </span>
      ))}
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md"
        >
          +{hidden} more <ChevronDown className="w-3 h-3" />
        </button>
      )}
      {expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md"
        >
          Show less <ChevronUp className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

const JobRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => { fetchRecommendations(); }, []);

  const fetchRecommendations = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/api/recommendations/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecommendations(response.data.recommendations || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast.error('Failed to load job recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Recommendations</h1>
          <p className="text-gray-600">Matches based on your skills, CGPA, and location preferences</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Excellent / Good</p>
                <p className="text-2xl font-bold text-green-600">
                  {(summary.top_matches || 0) + (summary.good_matches || 0)}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Near Misses</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.near_misses || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold text-indigo-600">{recommendations.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Job Cards */}
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recommendations Found</h3>
            <p className="text-gray-500">Complete your profile and add skills to get personalized recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.job_id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-gray-900">{rec.job_title}</h3>
                      <CategoryBadge status={rec.match_status} />
                    </div>
                    <p className="text-gray-600 mb-2">{rec.company}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {rec.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />{rec.location}
                        </div>
                      )}
                      {rec.job_details?.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />{rec.job_details.duration}
                        </div>
                      )}
                      {rec.job_details?.stipend && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />₹{rec.job_details.stipend}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score block */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <ScoreBadge score={rec.match_score} />
                    </div>
                    <p className="text-xs text-gray-500">Overall Match</p>
                  </div>
                </div>

                {/* Score breakdown */}
                {rec.breakdown && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 text-xs text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                    <span>Skills Match: <strong className="text-gray-800">{rec.skill_score}%</strong></span>
                    <span>CGPA Score: <strong className="text-gray-800">{rec.breakdown.cgpaMatch}</strong></span>
                    <span>Location Score: <strong className="text-gray-800">{rec.breakdown.locationMatch}</strong></span>
                  </div>
                )}

                {/* Skills */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  {rec.matched_skills?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">
                        ✓ Matched Skills ({rec.matched_skills.length})
                      </h4>
                      <SkillsList skills={rec.matched_skills} variant="matched" />
                    </div>
                  )}
                  {rec.missing_skills?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-orange-700 mb-2">
                        → Skills to Learn ({rec.missing_skills.length})
                      </h4>
                      <SkillsList skills={rec.missing_skills} variant="missing" />
                    </div>
                  )}
                  {rec.matched_skills?.length === 0 && rec.missing_skills?.length === 0 && (
                    <p className="text-sm text-gray-400 col-span-2">No required skills listed for this job.</p>
                  )}
                </div>

                {/* View details */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedJob(rec)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedJob.job_title}</h2>
                    <p className="text-gray-600">{selectedJob.company}</p>
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>

                <div className="space-y-5">
                  {/* Match summary */}
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Match Summary</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
                      <div>
                        <div className="text-xl font-bold text-indigo-600">{selectedJob.match_score}%</div>
                        <div className="text-gray-500">Overall</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">{selectedJob.skill_score}%</div>
                        <div className="text-gray-500">Skills</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">{selectedJob.matched_skills?.length || 0}</div>
                        <div className="text-gray-500">Matched</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-orange-600">{selectedJob.missing_skills?.length || 0}</div>
                        <div className="text-gray-500">To Learn</div>
                      </div>
                    </div>
                  </div>

                  {selectedJob.job_details?.description && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
                      <p className="text-gray-600">{selectedJob.job_details.description}</p>
                    </div>
                  )}

                  {/* All matched skills */}
                  {selectedJob.matched_skills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-700 mb-2">✓ Your Matched Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.matched_skills.map((s, i) => (
                          <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All missing skills */}
                  {selectedJob.missing_skills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-orange-700 mb-2">→ Skills to Learn</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.missing_skills.map((s, i) => (
                          <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {selectedJob.location && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                        <p className="text-gray-600">{selectedJob.location}</p>
                      </div>
                    )}
                    {selectedJob.job_details?.stipend && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Stipend</h3>
                        <p className="text-gray-600">₹{selectedJob.job_details.stipend}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobRecommendations;
