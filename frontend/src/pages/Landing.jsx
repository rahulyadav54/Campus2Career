import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Briefcase,
  Users,
  Trophy,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Brain,
  BarChart,
  Zap,
  ChevronRight,
  Award,
  Building,
  Target,
  CheckCircle,
  Shield,
  Calendar,
  FileText,
  TrendingUp,
  Cpu,
  Users2,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

const AnimatedSection = ({ children, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StaggeredContainer = ({ children, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features = [
    {
      title: "AI-Powered Career Advisor",
      desc: "Intelligent chatbot and resume parser that guides students with personalized career advice and analyzes resume strength",
      icon: <Brain className="w-6 h-6" />,
      metric: "AI-Driven Insights",
      delay: 0.1
    },
    {
      title: "Skill Assessment & Mapping",
      desc: "Comprehensive skill evaluations, gap analysis, and learning recommendations tailored to industry requirements",
      icon: <BarChart className="w-6 h-6" />,
      metric: "360° Skill Profile",
      delay: 0.2
    },
    {
      title: "Smart Job Matching",
      desc: "Advanced algorithms match students with internships and jobs based on skills, preferences, and career goals",
      icon: <Target className="w-6 h-6" />,
      metric: "High-Precision Matching",
      delay: 0.3
    },
    {
      title: "Mentorship & Progress Tracking",
      desc: "Dedicated mentor-mentee connections with weekly progress updates, feedback loops, and certificate issuance",
      icon: <Users className="w-6 h-6" />,
      metric: "Guided Growth",
      delay: 0.4
    },
    {
      title: "Recruiter & Placement Dashboard",
      desc: "End-to-end hiring workflow from job posting and application review to interview scheduling and analytics",
      icon: <Building className="w-6 h-6" />,
      metric: "Full Recruitment Lifecycle",
      delay: 0.5
    },
    {
      title: "Admin & Institution Controls",
      desc: "Complete placement cell oversight with user approvals, job verification, opportunity management, and real-time monitoring",
      icon: <Shield className="w-6 h-6" />,
      metric: "Enterprise Governance",
      delay: 0.6
    },
  ];

  const stats = [
    { number: "6+", label: "User Roles Supported", icon: <Users className="w-5 h-5" /> },
    { number: "20+", label: "Core Modules", icon: <Building className="w-5 h-5" /> },
    { number: "100+", label: "API Endpoints", icon: <Trophy className="w-5 h-5" /> },
    { number: "4", label: "Portal Segments", icon: <Award className="w-5 h-5" /> }
  ];

  const processSteps = [
    {
      step: "01",
      title: "Register & Build Profile",
      description: "Students, mentors, recruiters, and academicians create accounts. Students upload resumes, add skills, projects, and complete assessments",
      icon: <FileText className="w-6 h-6" />,
      details: ["Multi-role registration", "Resume upload & AI parsing", "Skill assessment & mapping"]
    },
    {
      step: "02",
      title: "Explore & Apply",
      description: "Browse internships, jobs, and opportunities. Get AI-powered recommendations, career guidance, and learning resources",
      icon: <Cpu className="w-6 h-6" />,
      details: ["Job & internship matching", "AI career advisor", "Learning recommendations"]
    },
    {
      step: "03",
      title: "Track & Grow",
      description: "Mentors review applications, track progress, provide feedback. Students update weekly progress, earn certificates, and get placed",
      icon: <Target className="w-6 h-6" />,
      details: ["Mentor guidance", "Progress tracking", "Certificate issuance"]
    },
    {
      step: "04",
      title: "Manage & Analyze",
      description: "Admins and placement cells verify users, jobs, and portfolios. Recruiters manage postings, review applicants, and schedule interviews",
      icon: <Shield className="w-6 h-6" />,
      details: ["User & job verification", "Analytics dashboard", "Real-time monitoring"]
    }
  ];

  const testimonials = [
    {
      name: "Student",
      role: "Campus2Career Student",
      content: "The skill assessments and AI career advisor helped me identify my gaps and prepare better. Got placed through the platform!",
      company: "Student User"
    },
    {
      name: "Mentor",
      role: "Faculty Mentor",
      content: "Tracking my mentees' internship progress and providing weekly feedback has never been easier. The platform is very intuitive.",
      company: "Mentor User"
    },
    {
      name: "Recruiter",
      role: "HR Manager",
      content: "We can post jobs, review applications, and schedule interviews all in one place. The student matching is surprisingly accurate.",
      company: "Recruiter User"
    },
    {
      name: "Admin",
      role: "Placement Cell Officer",
      content: "Managing approvals, verifications, and analytics from a single dashboard saves us hours every week. Highly recommended.",
      company: "Admin User"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold text-gray-900 tracking-tight">Campus2Career</span>
              <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded">Enterprise</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium">Features</a>
              <a href="#process" className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium">Process</a>
              <a href="#results" className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium">Results</a>
              <a href="#testimonials" className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium">Testimonials</a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium">
                Sign In
              </Link>
              <Link to="/register" className="bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-black transition-colors text-sm font-medium shadow-sm">
                Get Started
              </Link>
            </div>

            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-4 space-y-3">
                <a href="#features" className="block text-gray-700 py-2 hover:text-gray-900 font-medium">Features</a>
                <a href="#process" className="block text-gray-700 py-2 hover:text-gray-900 font-medium">Process</a>
                <a href="#results" className="block text-gray-700 py-2 hover:text-gray-900 font-medium">Results</a>
                <a href="#testimonials" className="block text-gray-700 py-2 hover:text-gray-900 font-medium">Testimonials</a>
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link to="/login" className="block text-gray-700 py-2 hover:text-gray-900 font-medium">Sign In</Link>
                  <Link to="/register" className="block bg-gray-900 text-white px-4 py-2.5 rounded-lg text-center font-medium">
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm font-medium mb-8 border border-gray-200"
            >
              <Sparkles className="w-4 h-4 mr-2 text-gray-600" />
              Trusted by 62+ Leading Institutions Worldwide
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight"
            >
              The Modern Platform for
              <span className="block mt-3 text-gray-900">Campus Placements</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Complete campus placement ecosystem connecting students, mentors, recruiters, and placement cells through 
              AI-driven matching, skill assessments, progress tracking, and real-time analytics.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link
                to="/register"
                className="group bg-gray-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-black transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-medium hover:border-gray-400 hover:bg-gray-50 transition-all duration-300">
                Schedule Demo
              </button>
            </motion.div>

            <StaggeredContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex justify-center items-center mb-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600 font-medium leading-tight">{stat.label}</div>
                </motion.div>
              ))}
            </StaggeredContainer>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Placement Ecosystem
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything students, mentors, recruiters, and placement cells need in one platform
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: feature.delay }}
                className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-gray-900 transition-colors duration-300">
                  <div className="text-gray-700 group-hover:text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{feature.desc}</p>
                <div className="text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full inline-block">
                  {feature.metric}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Campus2Career Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A four-step workflow designed for students, mentors, recruiters, and placement cells
            </p>
          </AnimatedSection>

          <div className="relative">
            <div className="hidden lg:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gray-300"></div>
            <div className="grid md:grid-cols-3 gap-8">
              {processSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-bold mb-6">
                    {step.step}
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">{step.description}</p>
                  <div className="space-y-2">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <ChevronRight className="w-4 h-4 mr-2 text-gray-400" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Leading Institutions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See what our partners say about their experience with Campus2Career
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-50 rounded-xl p-8 border border-gray-200 hover:border-gray-300 transition-colors duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users2 className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500 mt-1">{testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic leading-relaxed">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection>
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to Transform Campus Placements?
              </h2>
              <p className="text-gray-300 mb-10 max-w-2xl mx-auto text-lg">
                Join students, mentors, recruiters, and institutions already using Campus2Career to streamline 
                placements, assessments, and career growth.
              </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-gray-900 px-8 py-4 rounded-xl font-medium hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-sm"
              >
                Start Free Trial
              </Link>
              <button className="border border-gray-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-white/10 transition-all duration-300">
                Request Enterprise Demo
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-8">No credit card required • 30-day free trial • Full support included</p>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Campus2Career</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Enterprise-grade platform transforming campus placements through intelligent technology and data-driven insights.
              </p>
              <div className="flex space-x-4 mt-6">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-white transition-colors text-sm">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-sm">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-sm">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-sm">API Access</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-white transition-colors text-sm">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-sm">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-sm">Case Studies</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-sm">Webinars</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2" />
                  contact@campus2career.com
                </li>
                <li className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  San Francisco, CA
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">
                © 2026 Campus2Career. All rights reserved. Enterprise Campus Placement Platform.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Managed by ZAYA CODE HUB
              </p>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-white text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}