import { API_URL } from '../../config/api';
import { useEffect, useState } from "react";
import { GraduationCap, Briefcase, FlaskConical, Users, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const tabs = [
  { key: "all", label: "All", endpoint: null },
  { key: "fdp", label: "FDPs", endpoint: "fdps" },
  { key: "faculty-internship", label: "Faculty Internships", endpoint: "faculty-internships" },
  { key: "consultancy", label: "Consultancy", endpoint: "consultancies" },
  { key: "research", label: "Research", endpoint: "research" },
];

const typeIcons = {
  fdp: GraduationCap,
  "faculty-internship": Briefcase,
  consultancy: Users,
  research: FlaskConical,
};

export default function AcademicianOpportunities() {
  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/academician-opportunities`;
      const endpoint = tabs.find((t) => t.key === activeTab)?.endpoint;
      if (endpoint) {
        url = `${url}/${endpoint}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load opportunities");
      }
      const results = endpoint ? (data.opportunities || []) : [
        ...(data.fdps || []),
        ...(data.facultyInternships || data.faculty_internships || []),
        ...(data.consultancies || []),
        ...(data.research || []),
      ];
      setItems(results);
    } catch (error) {
      toast.error(error.message || "Unable to load opportunities");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [activeTab]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Faculty programs</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Academician Opportunities</h1>
        <p className="text-gray-600 mt-2">Explore FDPs, faculty internships, consultancy assignments, and research collaborations.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg border whitespace-nowrap capitalize font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading opportunities...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities yet</h3>
          <p className="text-gray-600">Check back later for new programs in this category.</p>
        </div>
      ) : (
        <section className="grid md:grid-cols-2 gap-5">
          {items.map((item) => {
            const Icon = typeIcons[item.type] || GraduationCap;
            return (
              <article
                key={item._id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/academician/opportunities/${item._id}`)}
              >
                <div className="flex justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="text-indigo-600" size={20} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg text-gray-900">{item.title}</h2>
                      <p className="text-sm text-gray-500 capitalize">{item.type?.replace("-", " ")} · {item.location || "Remote"}</p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mt-4 line-clamp-2">{item.description}</p>
                {item.requiredSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.requiredSkills.slice(0, 4).map((skill) => (
                      <span key={skill} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded">{skill}</span>
                    ))}
                    {item.requiredSkills.length > 4 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">+{item.requiredSkills.length - 4}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Deadline: {item.deadline ? new Date(item.deadline).toLocaleDateString() : "Open"}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    View Details <ArrowRight size={14} />
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
