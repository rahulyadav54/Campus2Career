/** Get primary frontend URL for links in emails */
export function getFrontendBaseUrl() {
  const urls = (process.env.FRONTEND_URLS || "http://localhost:5173")
    .split(",")
    .map((v) => v.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return urls[0] || "http://localhost:5173";
}

export function buildFrontendUrl(path, role = "student") {
  const base = getFrontendBaseUrl();
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean.startsWith(`/${role}`)) return `${base}${clean}`;
  return `${base}/${role}${clean}`;
}

export function dashboardUrl(role = "student") {
  return buildFrontendUrl("", role);
}

export function applicationUrl(applicationId, role = "student") {
  return buildFrontendUrl("/applications", role) + (applicationId ? `?id=${applicationId}` : "");
}

export function interviewUrl(sessionId, role = "student") {
  if (sessionId) return `${getFrontendBaseUrl()}/${role}/virtual-interview/${sessionId}`;
  return buildFrontendUrl("/virtual-interview", role);
}

export function resumeAnalysisUrl(resumeId, role = "student") {
  if (resumeId) return `${getFrontendBaseUrl()}/${role}/resume-center/builder/${resumeId}`;
  return buildFrontendUrl("/resume-center", role);
}

export function jobUrl(jobId, role = "student") {
  if (jobId) return `${getFrontendBaseUrl()}/${role}/jobs?jobId=${jobId}`;
  return buildFrontendUrl("/jobs", role);
}

export function settingsUrl(role = "student") {
  if (role === "admin") return buildFrontendUrl("/settings?section=notifications", "admin");
  return buildFrontendUrl("/profile", role);
}

export default { getFrontendBaseUrl, buildFrontendUrl, dashboardUrl };
