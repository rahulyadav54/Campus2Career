import { useState } from "react";
import { CheckCircle, Target, BookOpen } from "lucide-react";

const defaultQuestions = [
  { skill: "JavaScript", category: "technical" },
  { skill: "Data Analysis", category: "technical" },
  { skill: "Communication", category: "soft" },
  { skill: "Problem Solving", category: "aptitude" },
  { skill: "Teamwork", category: "soft" }
];

export default function SkillAssessment() {
  const [scores, setScores] = useState(Object.fromEntries(defaultQuestions.map((item) => [item.skill, 50])));
  const [interests, setInterests] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
          responses: defaultQuestions.map((item) => ({ ...item, score: Number(scores[item.skill]) }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Assessment could not be saved");
      setResult(data.assessment);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Skill Development</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Build your Campus2Career skill profile</h1>
        <p className="text-gray-600 mt-2">Rate your current confidence. Scores below 60 become actionable skill gaps.</p>
      </header>
      {result ? (
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3"><CheckCircle className="text-green-600" /><h2 className="text-xl font-semibold">Assessment complete</h2></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg"><Target className="text-green-700" /><h3 className="font-semibold mt-2">Strengths</h3><p className="text-sm mt-1">{result.strengths.join(", ") || "Keep building your foundation"}</p></div>
            <div className="p-4 bg-amber-50 rounded-lg"><BookOpen className="text-amber-700" /><h3 className="font-semibold mt-2">Skill gaps</h3><p className="text-sm mt-1">{result.gaps.join(", ") || "No immediate gaps identified"}</p></div>
          </div>
          <div><h3 className="font-semibold">Recommended next steps</h3><ul className="list-disc pl-5 mt-2 text-gray-700">{result.learningRecommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <button onClick={() => setResult(null)} className="px-4 py-2 border rounded-lg">Retake assessment</button>
        </section>
      ) : (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          {defaultQuestions.map((item) => (
            <label key={item.skill} className="block">
              <div className="flex justify-between mb-2"><span className="font-medium text-gray-800">{item.skill}</span><span className="text-sm text-gray-500">{scores[item.skill]} / 100</span></div>
              <input type="range" min="0" max="100" value={scores[item.skill]} onChange={(event) => setScores({ ...scores, [item.skill]: event.target.value })} className="w-full accent-indigo-600" />
              <span className="text-xs text-gray-500 capitalize">{item.category} skill</span>
            </label>
          ))}
          <label className="block"><span className="font-medium text-gray-800">Career interests</span><input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="AI, healthcare, product design" className="mt-2 w-full px-3 py-2 border rounded-lg" /></label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="px-5 py-3 bg-indigo-600 text-white rounded-lg font-medium">Submit assessment</button>
        </form>
      )}
    </main>
  );
}