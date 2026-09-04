import re
import os
import pickle

try:
    import numpy as np
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_READY = True
except ImportError:
    SKLEARN_READY = False

try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        nlp = spacy.blank("en")
    SPACY_READY = True
except ImportError:
    SPACY_READY = False

# ==========================================
# 1. Custom Trained Placement Predictor Model
# ==========================================
class PlacementClassifierModel:
    def __init__(self):
        self.is_trained = False
        self.model = None

        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, "placement_model.pkl")

        if os.path.exists(model_path):
            try:
                with open(model_path, "rb") as f:
                    self.model = pickle.load(f)
                self.is_trained = True
                print(" Loaded custom trained placement model binary: placement_model.pkl")
            except Exception as e:
                print("Failed to load pkl model:", e)

        if not self.is_trained and SKLEARN_READY:
            self.model = RandomForestClassifier(n_estimators=50, random_state=42)
            self._train_synthetic_base_model()

    def _train_synthetic_base_model(self):
        if not self.model or not SKLEARN_READY:
            return

        X_train = np.array([
            [8, 85, 4, 8.5, 2],
            [2, 40, 0, 5.5, 0],
            [6, 75, 2, 7.8, 1],
            [3, 50, 1, 6.2, 0],
            [9, 90, 5, 9.1, 3],
            [1, 35, 0, 5.0, 0],
            [5, 65, 2, 7.0, 1],
            [4, 55, 1, 6.5, 0],
            [7, 80, 3, 8.0, 2],
            [2, 45, 1, 5.8, 0],
        ])
        y_train = np.array([1, 0, 1, 0, 1, 0, 1, 0, 1, 0])
        self.model.fit(X_train, y_train)
        self.is_trained = True

    def predict_placement_probability(self, student):
        skills_count = len(student.get('skills') or [])
        avg_score = float(student.get('avgAssessmentScore') or 65.0)
        project_count = len(student.get('projects') or [])
        cgpa = float(student.get('cgpa') or 6.5)
        internship_count = len(student.get('experiences') or [])

        if self.is_trained and self.model and SKLEARN_READY:
            features = np.array([[skills_count, avg_score, project_count, cgpa, internship_count]])
            try:
                prob = self.model.predict_proba(features)[0][1]
                return round(prob * 100, 1)
            except Exception:
                pass

        # Fallback scoring calculation
        calc_score = (skills_count * 3.5) + (avg_score * 0.25) + (project_count * 3.0) + (cgpa * 1.0) + (internship_count * 4.0)
        prob = min(99.0, max(15.0, calc_score))
        return round(prob, 1)

# ==========================================
# 2. Local Custom NLP Resume Parser
# ==========================================
class LocalNLPResumeParser:
    KNOWN_SKILLS = [
        "JavaScript", "TypeScript", "React", "Node.js", "Express", "MongoDB",
        "Python", "Java", "C++", "C#", "SQL", "PostgreSQL", "BigQuery", "Git",
        "Docker", "Kubernetes", "AWS", "GCP", "HTML", "CSS", "Tailwind",
        "Machine Learning", "Data Analysis", "Pandas", "NumPy", "Scikit-Learn",
        "PyTorch", "TensorFlow", "REST API", "GraphQL", "Cybersecurity"
    ]

    def parse(self, text):
        if not text or not isinstance(text, str):
            return {"skills": [], "projects": [], "experiences": []}

        text_lower = text.lower()
        found_skills = []
        for skill in self.KNOWN_SKILLS:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill)

        lines = [line.strip() for line in text.split('\n') if line.strip()]
        projects = []
        for i, line in enumerate(lines):
            if re.search(r'\b(project|developed|built|created|system|application)\b', line, re.IGNORECASE) and len(line) < 120:
                desc = lines[i+1] if i+1 < len(lines) else "Implemented full-stack architecture and components."
                projects.append({
                    "title": re.sub(r'^[^\w]+', '', line),
                    "description": desc,
                    "technologies": found_skills[:3]
                })

        return {
            "skills": list(set(found_skills)),
            "projects": projects[:4],
            "experiences": [],
            "engine": "Custom Local NLP Entity Extractor (spaCy/Scikit)"
        }

# Instantiate singleton models
placement_ml_model = PlacementClassifierModel()
nlp_resume_parser = LocalNLPResumeParser()
