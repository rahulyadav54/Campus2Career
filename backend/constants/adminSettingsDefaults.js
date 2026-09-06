export const ADMIN_SETTINGS_DEFAULTS = {
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
  notifications: {
    channels: { email: true, push: false, inApp: true },
    frequency: "immediate",
    categories: {
      newUserRegistration: true,
      userApprovalRequest: true,
      studentApprovalRequest: true,
      jobVerification: true,
      programApproval: true,
      newAnnouncement: true,
      assessmentSubmission: true,
      assessmentCompletion: true,
      interviewRequest: true,
      securityAlerts: true,
      systemMaintenance: true,
      importantSystem: true,
    },
  },
  privacy: {
    profileVisibility: "staff",
    showEmail: false,
    showPhone: false,
    loginAlerts: true,
    activityVisibility: "admins",
  },
};

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

export const mergeAdminSettings = (stored = {}) => {
  const merge = (defaults, incoming) => {
    if (!isObject(defaults)) return incoming === undefined ? defaults : incoming;
    const result = { ...defaults };
    if (!isObject(incoming)) return result;
    for (const key of Object.keys(defaults)) {
      result[key] = merge(defaults[key], incoming[key]);
    }
    return result;
  };
  return merge(ADMIN_SETTINGS_DEFAULTS, stored);
};
