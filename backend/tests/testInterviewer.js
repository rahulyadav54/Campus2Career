/**
 * testInterviewer.js
 * Verification script for AI Virtual Interviewer backend modules.
 */

import virtualInterviewService, {
  generateOpeningGreeting,
  generateNextQuestion,
  evaluateAnswer,
  generateFinalReport
} from "../services/virtualInterviewService.js";

import InterviewSession from "../models/InterviewSession.js";

console.log("==========================================");
console.log("AI Virtual Interviewer Backend Verification");
console.log("==========================================");
console.log("✅ virtualInterviewService default export methods:", Object.keys(virtualInterviewService));
console.log("✅ Named exports available:", typeof generateOpeningGreeting, typeof generateNextQuestion, typeof evaluateAnswer, typeof generateFinalReport);
console.log("✅ InterviewSession Mongoose Model loaded successfully:", InterviewSession.modelName);
console.log("==========================================");
