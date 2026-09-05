import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB, { isDatabaseReady } from "./config/db.js";
import studentRoutes from "./routes/studentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import recruiterRoutes from "./routes/recruiterRoutes.js";
import mentorRoutes from "./routes/mentorRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import opportunityRoutes from "./routes/opportunityRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import realtimeRoutes from "./routes/realtimeRoutes.js";
import institutionRoutes from "./routes/institutionRoutes.js";
import questionBankRoutes from "./routes/questionBankRoutes.js";
import careerRoutes from "./routes/careerRoutes.js";
import internshipProgressRoutes from "./routes/internshipProgressRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();
const app = express();

// Trust Render/Vercel reverse proxy — required for express-rate-limit and correct req.ip
app.set('trust proxy', 1);

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Request size limits
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    // Explicit origins from env var (comma-separated)
    const configuredOrigins = (process.env.FRONTEND_URLS || "")
      .split(",")
      .map((v) => v.trim().replace(/\/$/, ""))
      .filter(Boolean);

    if (
      origin === "http://localhost:5173" ||
      origin === "http://localhost:5174" ||
      origin === "http://127.0.0.1:5173" ||
      configuredOrigins.includes(origin) ||
      // Any *.vercel.app deployment for this project (with or without hyphen)
      /^https:\/\/campus2career[a-z0-9-]*\.vercel\.app$/.test(origin) ||
      /^https:\/\/campus2-career[a-z0-9-]*\.vercel\.app$/.test(origin) ||
      // Hostinger custom domain
      origin === "https://campus2career.zayacodehub.in" ||
      // Render preview URLs
      /^https:\/\/campus2career[a-z0-9-]*\.onrender\.com$/.test(origin)
    ) {
      return callback(null, true);
    }

    // Log blocked origins to help diagnose future CORS issues
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting — applied after CORS so error responses include CORS headers
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false, message: { message: "Too many requests, please try again later" } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false, message: { message: "Too many login attempts, please try again later" } });
app.use("/api", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Serve static files from uploads directory
app.use('/uploads', (req, res, next) => {
  if (req.path.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
  }
  next();
}, express.static('uploads'));

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.get('/api/health', (req, res) => {
  const databaseReady = isDatabaseReady();
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'degraded',
    database: databaseReady ? 'connected' : 'disconnected'
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/realtime", realtimeRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/question-bank", questionBankRoutes);
app.use("/api/career", careerRoutes);
app.use("/api/internship-progress", internshipProgressRoutes);
app.use("/api/ai", aiRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  // CORS errors — return proper JSON so browser shows the real message
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS: origin not allowed' });
  }

  console.error('Server error:', err.message);

  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(400).json({
      message: `This ${field} is already registered`,
      field,
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
    return res.status(400).json({ message: 'Validation error', errors });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred',
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Backend startup stopped:", error.message);
    process.exitCode = 1;
  }
};

startServer();
