export const parseUserAgent = (ua = "") => {
  const value = String(ua || "");
  let browser = "Unknown browser";
  if (/edg/i.test(value)) browser = "Microsoft Edge";
  else if (/chrome|crios/i.test(value) && !/edg/i.test(value)) browser = "Chrome";
  else if (/firefox|fxios/i.test(value)) browser = "Firefox";
  else if (/safari/i.test(value) && !/chrome/i.test(value)) browser = "Safari";

  let os = "Unknown OS";
  if (/windows/i.test(value)) os = "Windows";
  else if (/mac os|macintosh/i.test(value)) os = "macOS";
  else if (/android/i.test(value)) os = "Android";
  else if (/iphone|ipad|ios/i.test(value)) os = "iOS";
  else if (/linux/i.test(value)) os = "Linux";

  return { browser, os };
};

export const clientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "";
};
