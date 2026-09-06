const THEME_KEY = "c2c-theme";
const PREFS_KEY = "c2c-admin-preferences";

const LIGHT_ONLY_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/recruiter/register",
  "/academician/register",
];

export const getStoredTheme = () => {
  try {
    const explicit = localStorage.getItem(THEME_KEY);
    if (explicit === "light" || explicit === "dark" || explicit === "system") return explicit;
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    if (prefs?.appearance?.theme === "dark") return "dark";
  } catch {
    /* ignore */
  }
  return "light";
};

export const resolveTheme = (theme = getStoredTheme()) => {
  if (theme === "dark") return "dark";
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

export const isLightOnlyPath = (pathname = "") =>
  LIGHT_ONLY_PATHS.includes(pathname);

export const applyTheme = (theme = getStoredTheme(), pathname = window.location.pathname) => {
  const resolved = isLightOnlyPath(pathname) ? "light" : resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
};

export const setStoredTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme);
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    const next = {
      ...prefs,
      appearance: { ...(prefs.appearance || {}), theme },
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent("c2c-theme-change", { detail: theme }));
};

export const cycleTheme = () => {
  const current = getStoredTheme();
  const next = current === "light" ? "dark" : "light";
  setStoredTheme(next);
  return next;
};
