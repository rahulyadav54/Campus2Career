class JobRecommendation {
  final String jobId;
  final String jobTitle;
  final String company;
  final String? location;
  final int matchScore;
  final int skillScore;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final String matchStatus;
  final String? description;
  final String? duration;
  final String? stipend;
  final String? type;

  const JobRecommendation({
    required this.jobId,
    required this.jobTitle,
    required this.company,
    this.location,
    required this.matchScore,
    required this.skillScore,
    this.matchedSkills = const [],
    this.missingSkills = const [],
    required this.matchStatus,
    this.description,
    this.duration,
    this.stipend,
    this.type,
  });

  factory JobRecommendation.fromJson(Map<String, dynamic> j) => JobRecommendation(
        jobId: (j['job_id'] ?? j['_id'] ?? j['id']).toString(),
        jobTitle: (j['job_title'] ?? j['title'] ?? '').toString(),
        company: (j['company'] ?? '').toString(),
        location: j['location']?.toString(),
        matchScore: (j['match_score'] as num?)?.toInt() ?? 0,
        skillScore: (j['skill_score'] as num?)?.toInt() ?? 0,
        matchedSkills: (j['matched_skills'] is List)
            ? List<String>.from(j['matched_skills'].map((e) => e.toString()))
            : const [],
        missingSkills: (j['missing_skills'] is List)
            ? List<String>.from(j['missing_skills'].map((e) => e.toString()))
            : const [],
        matchStatus: (j['match_status'] ?? j['category'] ?? 'Low Match').toString(),
        description: j['job_details'] is Map ? (j['job_details'] as Map)['description']?.toString() : null,
        duration: j['job_details'] is Map ? (j['job_details'] as Map)['duration']?.toString() : null,
        stipend: j['job_details'] is Map ? (j['job_details'] as Map)['stipend']?.toString() : null,
        type: j['job_details'] is Map ? (j['job_details'] as Map)['type']?.toString() : null,
      );

  String get scoreBadgeColor {
    if (matchScore >= 80) return 'green';
    if (matchScore >= 60) return 'blue';
    if (matchScore >= 40) return 'yellow';
    if (matchScore >= 20) return 'orange';
    return 'red';
  }
}
