import { useEffect, useState } from "react";
import { Plus, Trash2, BookOpen, ClipboardList } from "lucide-react";
import apiClient from "../../services/apiClient";

const emptyQuestion = { text: "", category: "technical", skill: "", type: "mcq", difficulty: "medium", marks: 1, options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] };
const emptyTemplate = { title: "", description: "", timeLimitMinutes: 30, passingScore: 60, questions: [] };

export default function QuestionBankManagement() {
  const [questions, setQuestions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [tab, setTab] = useState("questions");
  const [qForm, setQForm] = useState(emptyQuestion);
  const [tForm, setTForm] = useState(emptyTemplate);
  const [message, setMessage] = useState("");

  const loadAll = () => Promise.all([
    apiClient.get("/api/question-bank/questions"),
    apiClient.get("/api/question-bank/templates")
  ]).then(([qData, tData]) => {
    setQuestions(qData.questions || []);
    setTemplates(tData.templates || []);
  }).catch((err) => setMessage(err.message));

  useEffect(() => { loadAll(); }, []);

  const saveQuestion = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/question-bank/questions", qForm);
      setMessage("Question added");
      setQForm(emptyQuestion);
      loadAll();
    } catch (err) { setMessage(err.message); }
  };

  const deleteQuestion = async (id) => {
    try {
      await apiClient.delete(`/api/question-bank/questions/${id}`);
      setMessage("Question removed");
      loadAll();
    } catch (err) { setMessage(err.message); }
  };

  const saveTemplate = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/question-bank/templates", tForm);
      setMessage("Assessment template created");
      setTForm(emptyTemplate);
      loadAll();
    } catch (err) { setMessage(err.message); }
  };

  const updateOption = (idx, field, value) => {
    const opts = qForm.options.map((o, i) => {
      if (field === "isCorrect") return { ...o, isCorrect: i === idx };
      return i === idx ? { ...o, [field]: value } : o;
    });
    setQForm({ ...qForm, options: opts });
  };

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Admin</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Question Bank & Assessments</h1>
      </header>

      {message && <p className="text-sm text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg">{message}</p>}

      <div className="flex gap-2 border-b">
        {[["questions", "Questions", BookOpen], ["templates", "Templates", ClipboardList]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {tab === "questions" && (
        <div className="space-y-6">
          <form onSubmit={saveQuestion} className="bg-white border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Add Question</h2>
            <textarea required value={qForm.text} onChange={(e) => setQForm({ ...qForm, text: e.target.value })}
              placeholder="Question text" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={qForm.category} onChange={(e) => setQForm({ ...qForm, category: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                <option value="technical">Technical</option>
                <option value="soft">Soft Skill</option>
                <option value="aptitude">Aptitude</option>
              </select>
              <input required value={qForm.skill} onChange={(e) => setQForm({ ...qForm, skill: e.target.value })} placeholder="Skill (e.g. JavaScript)" className="px-3 py-2 border rounded-lg text-sm" />
              <select value={qForm.type} onChange={(e) => setQForm({ ...qForm, type: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                <option value="mcq">MCQ</option>
                <option value="true_false">True/False</option>
                <option value="rating">Rating</option>
              </select>
              <select value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            {(qForm.type === "mcq" || qForm.type === "true_false") && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Options (select correct answer)</p>
                {(qForm.type === "true_false" ? qForm.options.slice(0, 2) : qForm.options).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => updateOption(i, "isCorrect", true)} />
                    <input value={opt.text} onChange={(e) => updateOption(i, "text", e.target.value)}
                      placeholder={qForm.type === "true_false" ? (i === 0 ? "True" : "False") : `Option ${i + 1}`}
                      className="flex-1 px-3 py-1.5 border rounded-lg text-sm" />
                  </div>
                ))}
              </div>
            )}
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <Plus size={16} /> Add Question
            </button>
          </form>

          <div className="space-y-2">
            {questions.map((q) => (
              <div key={q._id} className="bg-white border rounded-xl p-4 flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium text-sm">{q.text}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{q.category} · {q.skill} · {q.type} · {q.difficulty}</p>
                </div>
                <button onClick={() => deleteQuestion(q._id)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {questions.length === 0 && <p className="text-gray-500 text-sm">No questions yet.</p>}
          </div>
        </div>
      )}

      {tab === "templates" && (
        <div className="space-y-6">
          <form onSubmit={saveTemplate} className="bg-white border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Create Assessment Template</h2>
            <input required value={tForm.title} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} placeholder="Template title" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <textarea value={tForm.description} onChange={(e) => setTForm({ ...tForm, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm"><span className="text-gray-600">Time limit (minutes)</span>
                <input type="number" min={5} value={tForm.timeLimitMinutes} onChange={(e) => setTForm({ ...tForm, timeLimitMinutes: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </label>
              <label className="text-sm"><span className="text-gray-600">Passing score (%)</span>
                <input type="number" min={0} max={100} value={tForm.passingScore} onChange={(e) => setTForm({ ...tForm, passingScore: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Select questions</p>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                {questions.map((q) => (
                  <label key={q._id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={tForm.questions.includes(q._id)}
                      onChange={(e) => setTForm({ ...tForm, questions: e.target.checked ? [...tForm.questions, q._id] : tForm.questions.filter((id) => id !== q._id) })} />
                    <span>{q.text} <span className="text-gray-400 capitalize">({q.category})</span></span>
                  </label>
                ))}
                {questions.length === 0 && <p className="text-gray-400 text-xs">Add questions first</p>}
              </div>
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <Plus size={16} /> Create Template
            </button>
          </form>

          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t._id} className="bg-white border rounded-xl p-4">
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{t.questions?.length || 0} questions · {t.timeLimitMinutes} min · Pass: {t.passingScore}%</p>
                {t.description && <p className="text-sm text-gray-700 mt-1">{t.description}</p>}
              </div>
            ))}
            {templates.length === 0 && <p className="text-gray-500 text-sm">No templates yet.</p>}
          </div>
        </div>
      )}
    </main>
  );
}
