/** Interview lifecycle phases */
export const INTERVIEW_PHASES = {
  PREPARING: "preparing",
  WELCOME: "welcome",
  CAMERA_CHECK: "camera_check",
  AUDIO_CHECK: "audio_check",
  INTRODUCTION: "introduction",
  WARMUP: "warmup",
  TECHNICAL: "technical",
  BEHAVIORAL: "behavioral",
  SITUATIONAL: "situational",
  CLOSING: "closing",
  COMPLETE: "complete",
};

/** Real-time interviewer machine states */
export const INTERVIEWER_STATES = {
  IDLE: "idle",
  WELCOME: "welcome",
  SPEAKING: "speaking",
  LISTENING: "listening",
  THINKING: "thinking",
  ANALYZING: "analyzing",
  FOLLOW_UP: "follow_up",
  TRANSITIONING: "transitioning",
  PAUSED: "paused",
  COMPLETED: "completed",
  ERROR: "error",
};

/** Avatar emotional / behavioural states */
export const AVATAR_EMOTIONS = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  CURIOUS: "curious",
  IMPRESSED: "impressed",
  ENCOURAGING: "encouraging",
  SERIOUS: "serious",
  CONFUSED: "confused",
  CONCERNED: "concerned",
  GOODBYE: "goodbye",
};

export const STATUS_LABELS = {
  idle: "Standby",
  welcome: "Welcome",
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Thinking",
  analyzing: "Processing",
  follow_up: "Follow-up question",
  transitioning: "Next question",
  paused: "Paused",
  completed: "Interview completed",
  error: "Connection issue",
};

export const mapEmotionToAvatar = (emotion) => {
  const map = {
    idle: AVATAR_EMOTIONS.IDLE,
    speaking: AVATAR_EMOTIONS.SPEAKING,
    listening: AVATAR_EMOTIONS.LISTENING,
    thinking: AVATAR_EMOTIONS.THINKING,
    curious: AVATAR_EMOTIONS.CURIOUS,
    impressed: AVATAR_EMOTIONS.IMPRESSED,
    encouraging: AVATAR_EMOTIONS.ENCOURAGING,
    serious: AVATAR_EMOTIONS.SERIOUS,
    confused: AVATAR_EMOTIONS.CONFUSED,
    concerned: AVATAR_EMOTIONS.CONCERNED,
    goodbye: AVATAR_EMOTIONS.GOODBYE,
  };
  return map[emotion] || AVATAR_EMOTIONS.SPEAKING;
};

export const isReadyConfirmation = (text = "") => {
  const t = text.toLowerCase().trim();
  return /^(yes|yeah|yep|ready|i am ready|let's go|lets go|sure|ok|okay|go ahead|start)/i.test(t)
    || t.includes("yes") && t.length < 30;
};
