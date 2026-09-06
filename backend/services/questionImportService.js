import XLSX from "xlsx";

const VALID_TYPES = ["mcq", "mcq_multi", "rating", "true_false", "short_answer", "descriptive"];
const VALID_CATEGORIES = ["technical", "soft", "aptitude"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

const normalizeHeader = (h) => (h || "").toString().trim().toLowerCase().replace(/\s+/g, "");

export const QUESTION_IMPORT_COLUMNS = ["question", "type", "category", "skill", "difficulty", "option1", "option2", "option3", "option4", "correctAnswer", "marks", "negativeMarks", "explanation"];

export function buildImportTemplateCsv() {
  const rows = [
    '"What does HTML stand for?","mcq","technical","HTML","easy","Hyper Text Markup Language","High Text Machine Language","Hyper Tool Multi Language","Hyper Transfer Markup Language","A","2","0","HTML stands for HyperText Markup Language."',
    '"React is a JavaScript library.","true_false","technical","React","easy","True","False","","","A","1","0","React is a JS library by Meta."',
  ];
  return [QUESTION_IMPORT_COLUMNS.join(","), ...rows].join("\n");
}
export function parseQuestionFile(fileBuffer, filename) {
  const lower = (filename || "").toLowerCase();
  let rows = [];
  try {
    let ws;
    if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
      const content = Buffer.isBuffer(fileBuffer) ? fileBuffer.toString("utf8") : String(fileBuffer);
      ws = XLSX.read(content, { type: "string" });
    } else {
      ws = XLSX.read(fileBuffer, { type: "buffer" });
    }
    const sheet = ws.Sheets[ws.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch (err) {
    return { valid: [], invalid: [{ row: 0, errors: ["Could not parse file: " + err.message] }], duplicates: 0 };
  }

  const valid = [];
  const invalid = [];
  const seen = new Set();

  rows.forEach((raw, idx) => {
    const mapped = {};
    Object.keys(raw).forEach((key) => { mapped[normalizeHeader(key)] = raw[key]; });
    const errors = [];
    const text = String(mapped.question || "").trim();
    const type = String(mapped.type || "mcq").trim().toLowerCase();
    const category = String(mapped.category || "technical").trim().toLowerCase();
    const skill = String(mapped.skill || "").trim();
    const difficulty = String(mapped.difficulty || "medium").trim().toLowerCase();
    const marks = parseFloat(mapped.marks) || 1;
    const negativeMarks = parseFloat(mapped.negativemarks || mapped.negativemarking || 0) || 0;

    if (!text) errors.push("Missing question text");
    if (!VALID_TYPES.includes(type)) errors.push("Invalid type: " + type);
    if (!VALID_CATEGORIES.includes(category)) errors.push("Invalid category: " + category);
    if (!skill) errors.push("Missing skill");
    if (!VALID_DIFFICULTIES.includes(difficulty)) errors.push("Invalid difficulty: " + difficulty);
    if (!(marks > 0)) errors.push("Marks must be positive");
    if (negativeMarks < 0) errors.push("Negative marks cannot be negative");
    if (seen.has(text.toLowerCase())) errors.push("Duplicate question text in file");
    else seen.add(text.toLowerCase());

    const parsed = { text, type, category, skill, difficulty, marks, negativeMarks, explanation: String(mapped.explanation || "").trim(), options: [], correctAnswerText: "", tags: [] };
    const options = [1, 2, 3, 4].map((i) => String(mapped["option" + i] || "").trim()).filter(Boolean);
    const code = String(mapped.correctanswer || "").trim().toUpperCase();

    if (type === "true_false") {
      if (options.length === 0) options.push("True", "False");
      const tTrue = code === "A" || code === "TRUE" || code === "1";
      const tFalse = code === "B" || code === "FALSE" || code === "0";
      if (!tTrue && !tFalse) errors.push("True/False needs correctAnswer A/B or TRUE/FALSE");
      else parsed.options = [{ text: options[0] || "True", isCorrect: tTrue }, { text: options[1] || "False", isCorrect: tFalse }];
    } else if (type === "mcq" || type === "mcq_multi") {
      if (options.length < 2) errors.push("MCQ needs at least 2 options");
      const map = { A: 0, B: 1, C: 2, D: 3 };
      const indexes = code.split(",").map((s) => s.trim()).filter(Boolean).map((s) => map[s]).filter((i) => i !== undefined);
      if (indexes.length === 0) errors.push("correctAnswer must map to option letters (A-D)");
      if (type === "mcq" && indexes.length !== 1) errors.push("MCQ (single) needs exactly one correct option");
      parsed.options = options.map((t, i) => ({ text: t, isCorrect: type === "mcq" ? indexes[0] === i : indexes.includes(i) }));
    } else {
      if (!code) errors.push(type + " questions need a correctAnswer / keywords");
      parsed.correctAnswerText = code;
    }

    if (errors.length) invalid.push({ row: idx + 2, text, errors });
    else valid.push(parsed);
  });

  return { valid, invalid, duplicates: rows.length - seen.size };
}

export function questionToCsvRow(q) {
  const letters = ["A", "B", "C", "D"];
  const correct = q.options
    ? q.options.map((o, i) => (o.isCorrect ? letters[i] : "")).filter(Boolean).join(",")
    : (q.correctAnswerText || "");
  const options = (q.options || []).map((o) => o.text);
  const esc = (v) => "\"" + String(v ?? "").replace(/"/g, '""') + "\"";
  return [esc(q.text), esc(q.type), esc(q.category), esc(q.skill), esc(q.difficulty), ...options.map(esc), esc(correct), esc(q.marks), esc(q.negativeMarks || 0), esc(q.explanation || "")].join(",");
}
