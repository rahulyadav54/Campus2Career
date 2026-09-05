class Course {
  final String id;
  final String title;
  final String? description;
  final String? provider;
  final String? platform;
  final List<String> skills;
  final String? duration;
  final String? level;
  final bool certificateAvailable;
  final String? externalUrl;
  final String? thumbnail;
  final num rating;
  final bool isFree;
  final String? status;
  final DateTime? createdAt;

  const Course({
    required this.id,
    required this.title,
    this.description,
    this.provider,
    this.platform,
    this.skills = const [],
    this.duration,
    this.level,
    this.certificateAvailable = true,
    this.externalUrl,
    this.thumbnail,
    this.rating = 0,
    this.isFree = true,
    this.status,
    this.createdAt,
  });

  factory Course.fromJson(Map<String, dynamic> j) => Course(
        id: (j['_id'] ?? j['id']).toString(),
        title: (j['title'] ?? '').toString(),
        description: j['description'] as String?,
        provider: j['provider']?.toString(),
        platform: j['platform']?.toString(),
        skills: (j['skills'] is List)
            ? List<String>.from(j['skills'].map((e) => e.toString()))
            : const [],
        duration: j['duration']?.toString(),
        level: j['level']?.toString(),
        certificateAvailable: j['certificateAvailable'] == true,
        externalUrl: j['externalUrl']?.toString(),
        thumbnail: j['thumbnail']?.toString(),
        rating: j['rating'] as num? ?? 0,
        isFree: j['isFree'] == true,
        status: j['status']?.toString(),
        createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt'].toString()) : null,
      );

  String get levelLabel {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      default:
        return level ?? 'All Levels';
    }
  }
}

class CourseEnrollment {
  final String id;
  final String studentId;
  final Course course;
  final String status;
  final DateTime? enrolledAt;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final int progressPercent;
  final String? certificateUrl;
  final String? certificateId;
  final DateTime? certificateIssueDate;

  const CourseEnrollment({
    required this.id,
    required this.studentId,
    required this.course,
    this.status = 'not_started',
    this.enrolledAt,
    this.startedAt,
    this.completedAt,
    this.progressPercent = 0,
    this.certificateUrl,
    this.certificateId,
    this.certificateIssueDate,
  });

  factory CourseEnrollment.fromJson(Map<String, dynamic> j) => CourseEnrollment(
        id: (j['_id'] ?? j['id']).toString(),
        studentId: (j['student'] is Map ? (j['student'] as Map)['_id'] : j['student'])?.toString() ?? '',
        course: Course.fromJson(Map<String, dynamic>.from(j['course'] as Map)),
        status: (j['status'] ?? 'not_started').toString(),
        enrolledAt: j['enrolledAt'] != null ? DateTime.tryParse(j['enrolledAt'].toString()) : null,
        startedAt: j['startedAt'] != null ? DateTime.tryParse(j['startedAt'].toString()) : null,
        completedAt: j['completedAt'] != null ? DateTime.tryParse(j['completedAt'].toString()) : null,
        progressPercent: (j['progressPercent'] as num?)?.toInt() ?? 0,
        certificateUrl: j['certificateUrl']?.toString(),
        certificateId: j['certificateId']?.toString(),
        certificateIssueDate: j['certificateIssueDate'] != null
            ? DateTime.tryParse(j['certificateIssueDate'].toString())
            : null,
      );

  String get statusLabel {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'not_started':
      default:
        return 'Not Started';
    }
  }
}
