import { applyTheme } from "./theme";

const STORAGE_KEY = "c2c-admin-preferences";

export const defaultAdminPreferences = {
  appearance: {
    theme: "light",
    sidebarCollapsed: false,
    compactLayout: false,
    enableAnimations: true,
    accentColor: "indigo",
  },
  locale: {
    language: "en",
    timeZone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
  },
  dashboard: {
    defaultLandingPage: "/admin",
    itemsPerPage: 10,
    density: "comfortable",
    sidebarBehavior: "expanded",
  },
};

export const readLocalPreferences = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultAdminPreferences;
  } catch {
    return defaultAdminPreferences;
  }
};

export const writeLocalPreferences = (prefs) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  const appearance = prefs.appearance || defaultAdminPreferences.appearance;
  document.documentElement.dataset.compact = appearance.compactLayout ? "true" : "false";
  document.documentElement.dataset.animations = appearance.enableAnimations === false ? "off" : "on";
};

export const applyAppearance = (appearance = {}) => {
  if (appearance.theme) {
    localStorage.setItem("c2c-theme", appearance.theme);
    applyTheme(appearance.theme);
  }
  document.documentElement.dataset.compact = appearance.compactLayout ? "true" : "false";
  document.documentElement.dataset.animations = appearance.enableAnimations === false ? "off" : "on";
};

export const passwordChecks = (value = "") => ({
  length: value.length >= 8,
  upper: /[A-Z]/.test(value),
  lower: /[a-z]/.test(value),
  number: /\d/.test(value),
  special: /[^A-Za-z0-9]/.test(value),
});

export const passwordScore = (value = "") =>
  Object.values(passwordChecks(value)).filter(Boolean).length;
