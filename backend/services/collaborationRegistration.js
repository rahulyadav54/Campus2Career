import XLSX from "xlsx";
import { registrationDetailsSchema } from "../models/collaborationRegistrationDetails.js";

const REQUIRED = ["name", "email", "phone", "institution", "department", "year", "rollNo"];

export const parseRegistrationDetails = (body = {}, user = {}, options = {}) => {
  const details = {
    name: String(body.name || user.name || "").trim(),
    email: String(body.email || user.email || "").trim().toLowerCase(),
    phone: String(body.phone || user.phone || "").trim(),
    institution: String(body.institution || user.institution || "").trim(),
    department: String(body.department || user.department || "").trim(),
    year: String(body.year || user.year || "").trim(),
    rollNo: String(body.rollNo || user.rollNo || "").trim(),
    teamName: String(body.teamName || "").trim(),
    teamMembers: String(body.teamMembers || "").trim(),
    coverLetter: String(body.coverLetter || "").trim(),
  };

  const missing = REQUIRED.filter((k) => !details[k]);
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    const err = new Error("Invalid email address");
    err.statusCode = 400;
    throw err;
  }
  if (options.requireTeamName && !details.teamName) {
    const err = new Error("Team name is required");
    err.statusCode = 400;
    throw err;
  }
  return details;
};

const fmtDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toISOString();
  } catch {
    return String(d);
  }
};

export const registrationToRow = (reg, type) => {
  const s = reg.student || {};
  const d = reg.details || {};
  const row = {
    "#": 0,
    Name: d.name || s.name || "",
    Email: d.email || s.email || "",
    Phone: d.phone || s.phone || "",
    Institution: d.institution || s.institution || "",
    Department: d.department || s.department || "",
    Year: d.year || s.year || "",
    "Roll No": d.rollNo || s.rollNo || "",
    Status: reg.status || "",
    "Registered At": fmtDate(reg.registeredAt || reg.appliedAt || reg.createdAt),
  };
  if (type === "challenges") {
    row["Team Name"] = d.teamName || reg.teamName || "";
    row["Team Members"] = d.teamMembers || "";
  }
  if (type === "projects") {
    row["Cover Letter"] = d.coverLetter || reg.coverLetter || "";
  }
  return row;
};

export const registrationsToRows = (regs, type) =>
  regs.map((r, i) => ({ ...registrationToRow(r, type), "#": i + 1 }));

export const exportRegistrationsCsv = (rows, filename) => {
  if (!rows.length) {
    return { content: "No registrations yet\n", filename, contentType: "text/csv" };
  }
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return { content: lines.join("\n"), filename, contentType: "text/csv; charset=utf-8" };
};

export const exportRegistrationsXlsx = (rows, filename) => {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Message: "No registrations yet" }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Registrations");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return { content: buffer, filename, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
};

export const COLLAB_TYPE_MAP = {
  workshops: { modelKey: "workshop", regField: "workshop", label: "Workshop" },
  "guest-lectures": { modelKey: "guestLecture", regField: "guestLecture", label: "Guest Lecture" },
  challenges: { modelKey: "challenge", regField: "challenge", label: "Challenge" },
  projects: { modelKey: "project", regField: "project", label: "Project" },
};

export { registrationDetailsSchema };
