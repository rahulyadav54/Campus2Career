import { validationResult, body, param } from "express-validator";

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }
  next();
};

export const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
  handleValidation
];

export const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("role").optional().isIn(["student", "recruiter", "academician"]).withMessage("Invalid role"),
  handleValidation
];

export const validateOpportunity = [
  body("title").trim().notEmpty().withMessage("Title required"),
  body("type").notEmpty().withMessage("Opportunity type required"),
  body("description").trim().notEmpty().withMessage("Description required"),
  handleValidation
];

export const validateAssessment = [
  body("responses").isArray({ min: 1 }).withMessage("At least one response required"),
  body("responses.*.skill").notEmpty().withMessage("Skill name required"),
  body("responses.*.category").isIn(["technical", "soft", "aptitude"]).withMessage("Invalid category"),
  body("responses.*.score").isFloat({ min: 0, max: 100 }).withMessage("Score must be 0-100"),
  handleValidation
];

export const validatePortfolioItem = [
  body("type").isIn(["skill", "certificate", "project", "internship", "achievement"]).withMessage("Invalid type"),
  body("title").trim().notEmpty().withMessage("Title required"),
  handleValidation
];

export const validateObjectId = (field = "id") => [
  param(field).isMongoId().withMessage("Invalid ID"),
  handleValidation
];
