import AIAutomationLog from "../models/AIAutomationLog.js";

const logAIAction = async ({
  user = null,
  agent,
  action,
  input = null,
  output = null,
  status = "success",
  confidence = 0,
  sourceData = null,
  errorMessage = "",
  metadata = null,
}) => {
  try {
    const log = await AIAutomationLog.create({
      user,
      agent,
      action,
      input,
      output,
      status,
      confidence: Math.round(confidence),
      sourceData,
      errorMessage,
      metadata,
    });
    return log;
  } catch (error) {
    console.error("Failed to log AI action:", error.message);
    return null;
  }
};

export const logSuccess = (params) => logAIAction({ ...params, status: "success" });
export const logFailed = (params) =>
  logAIAction({ ...params, status: "failed", errorMessage: params.errorMessage || params.error?.message || "" });
export const logPartial = (params) => logAIAction({ ...params, status: "partial" });
export const logPending = (params) => logAIAction({ ...params, status: "pending" });

export default logAIAction;
