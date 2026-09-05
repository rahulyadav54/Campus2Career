import { API_URL } from '../../config/api';
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  GraduationCap,
  Briefcase,
  Users,
  FlaskConical,
  MapPin,
  Calendar,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

const typeConfig = {
  fdp: { icon: GraduationCap, label: "Faculty Development Program", color: "bg-indigo-100 text-indigo-700" },
  "faculty-internship": { icon: Briefcase, label: "Faculty Internship", color: "bg-blue-100 text-blue-700" },
  consultancy: { icon: Users, label: "Consultancy", color: "bg-emerald-100 text-emerald-700" },
  research: { icon: FlaskConical, label: "Research Collaboration", color: "bg-purple-100 text-purple-700" },
};

export default function AcademicianOpportunityDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/academician-opportunities/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load opportunity");
      }
      setItem(data.opportunity || data);
    } catch (error) {
      toast.error(error.message || "Unable to load opportunity details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const response = await fetch(`${API_URL}/api/academician-opportunities/${id}/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Application failed");
      }
      toast.success("Application submitted successfully!");
      navigate("/academician/applications");
    } catch (error) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading opportunity details...</div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Opportunity not found</h3>
          <button onClick={() => navigate("/academician/opportunities")} className="text-indigo-600 hover:text-indigo-800">Back to opportunities</button>
        </div>
      </div>
    );
  }

  const config = typeConfig[item.type] || typeConfig.fdp;
  const Icon = config.icon;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <button
        onClick={() => navigate("/academician/opportunities")}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
      >
        <ArrowLeft size={16} /> Back to opportunities
      </button>

      <article className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
              <Icon size={24} />
            </div>
            <div className="flex-1">
              <span className={`inline-block text-xs font-medium px-2 py-1 rounded mb-2 ${config.color}`}>{config.label}</span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{item.title}</h1>
              {item.organization && <p className="text-gray-600 mt-1">{item.organization}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {item.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={18} className="text-gray-400" />
                <span>{item.location}</span>
              </div>
            )}
            {item.deadline && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={18} className="text-gray-400" />
                <span>Deadline: {new Date(item.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
          </div>

          {item.eligibility && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Eligibility</h2>
              <p className="text-gray-700">{item.eligibility}</p>
            </div>
          )}

          {item.requiredSkills?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {item.requiredSkills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {item.benefits && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Benefits</h2>
              <p className="text-gray-700">{item.benefits}</p>
            </div>
          )}

          {item.link && (
            <div>
              <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                <ExternalLink size={16} /> Visit external link
              </a>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleApply}
              disabled={applying}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {applying ? "Applying..." : "Apply Now"}
            </button>
          </div>
        </div>
      </article>
    </main>
  );
}
