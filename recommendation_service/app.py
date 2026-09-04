from flask import Flask, request, jsonify
from flask_cors import CORS
import re

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from ml_engine import placement_ml_model, nlp_resume_parser

app = Flask(__name__)
CORS(app)

def build_student_text_profile(student):
    skills = " ".join(student.get('skills') or [])
    interests = " ".join(student.get('interests') or [])
    department = student.get('department') or ""
    course = student.get('course') or ""
    projects_text = " ".join([f"{p.get('title', '')} {p.get('description', '')} {' '.join(p.get('technologies', []))}" for p in (student.get('projects') or [])])
    return f"{skills} {skills} {interests} {department} {course} {projects_text}".strip().lower()

def build_job_text_profile(job):
    title = job.get('title') or ""
    description = job.get('description') or ""
    skills_req = " ".join(job.get('skillsRequired') or job.get('requiredSkills') or [])
    eligibility = job.get('eligibility') or ""
    return f"{title} {skills_req} {skills_req} {description} {eligibility}".strip().lower()

def calculate_ml_similarity(student_text, job_text):
    if not SKLEARN_AVAILABLE or not student_text or not job_text:
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([student_text, job_text])
        sim_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        score = float(sim_matrix[0][0]) * 100
        return round(score, 1)
    except Exception:
        return 0.0

def calculate_job_match(student, job):
    weights = {'tfidf': 0.4, 'skills': 0.4, 'location': 0.1, 'cgpa': 0.1}
    
    # 1. Exact / Overlap Skill Score
    student_skills = [s.lower().strip() for s in (student.get('skills') or []) if s]
    job_skills = [s.lower().strip() for s in (job.get('skillsRequired') or job.get('requiredSkills') or []) if s]
    
    if job_skills:
        matched_skills = [s for s in student_skills if any(js in s or s in js for js in job_skills)]
        missing_skills = [s for s in job_skills if not any(s in ss or ss in s for ss in student_skills)]
        overlap_score = (len(matched_skills) / max(1, len(job_skills))) * 100
    else:
        matched_skills = student_skills
        missing_skills = []
        overlap_score = 70.0

    # 2. TF-IDF Cosine Similarity Score
    student_text = build_student_text_profile(student)
    job_text = build_job_text_profile(job)
    tfidf_score = calculate_ml_similarity(student_text, job_text)
    
    if tfidf_score == 0.0:
        tfidf_score = overlap_score

    skills_combined_score = (overlap_score * weights['skills']) + (tfidf_score * weights['tfidf'])

    # 3. Location Match Score
    location_score = 50.0
    job_location = (job.get('location') or '').lower()
    preferred_locs = [l.lower() for l in (student.get('preferredLocations') or [])]
    if preferred_locs and any(loc in job_location for loc in preferred_locs):
        location_score = 100.0
    elif student.get('remotePref') == 'remote' or 'remote' in job_location:
        location_score = 80.0

    # 4. CGPA Score
    cgpa = float(student.get('cgpa') or 0.0)
    cgpa_score = 100.0 if cgpa >= 7.0 else max(50.0, (cgpa / 10.0) * 100.0)

    # 5. Local Random Forest Placement Probability Predictor
    placement_prob = placement_ml_model.predict_placement_probability(student)

    total_score = skills_combined_score + (location_score * weights['location']) + (cgpa_score * weights['cgpa'])
    final_match_score = min(99.9, max(10.0, round(total_score, 1)))

    return {
        'match_score': final_match_score,
        'tfidf_similarity': tfidf_score,
        'placement_probability': placement_prob,
        'matched_skills': list(set(matched_skills)),
        'missing_skills': list(set(missing_skills))
    }

def get_match_category(score):
    if score >= 80: return 'Top Match'
    elif score >= 60: return 'Good Match'
    elif score >= 40: return 'Near Miss'
    else: return 'Not Suitable'

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'sklearn_available': SKLEARN_AVAILABLE,
        'models': ['Scikit-Learn TF-IDF Vectorizer', 'RandomForest Placement Classifier', 'Local spaCy NLP Parser']
    })

@app.route('/recommend', methods=['POST'])
def recommend_jobs():
    try:
        data = request.json or {}
        student = data.get('student', {})
        jobs = data.get('jobs', [])
        
        recommendations = []
        for job in jobs:
            match_data = calculate_job_match(student, job)
            recommendations.append({
                'job_id': job.get('_id') or job.get('id'),
                'job_title': job.get('title'),
                'match_score': match_data['match_score'],
                'tfidf_similarity': match_data['tfidf_similarity'],
                'placement_probability': match_data['placement_probability'],
                'matched_skills': match_data['matched_skills'],
                'missing_skills': match_data['missing_skills'],
                'category': get_match_category(match_data['match_score'])
            })
        
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        return jsonify({
            'recommendations': recommendations,
            'total_analyzed': len(jobs),
            'model': 'Custom Trained Random Forest & TF-IDF Cosine Similarity'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/parse-resume-local', methods=['POST'])
def parse_resume_local():
    try:
        data = request.json or {}
        text = data.get('resumeText', '')
        parsed = nlp_resume_parser.parse(text)
        return jsonify({'success': True, 'data': parsed})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)