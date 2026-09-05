import '../core/constants/app_constants.dart';
import '../models/job.dart';
import '../models/internship.dart';
import '../models/application.dart';
import '../models/skill.dart';
import '../models/learning_resource.dart';
import '../models/notification.dart';
import '../models/announcement.dart';
import '../models/opportunity.dart';
import '../models/course.dart';
import '../models/job_recommendation.dart';
import 'api_helper.dart';

class StudentService {
  final ApiHelper _api;
  StudentService(this._api);

  Future<List<Job>> fetchJobs({int page = 1, String? search, String? location, String? type}) async {
    final q = <String, dynamic>{'page': page, 'limit': AppConstants.defaultPageSize};
    if (search != null && search.isNotEmpty) q['search'] = search;
    if (location != null && location.isNotEmpty) q['location'] = location;
    if (type != null && type.isNotEmpty) q['type'] = type;
    final data = await _api.get('/jobs', query: q);
    return _parseList(data, (e) => Job.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<List<JobRecommendation>> fetchRecommendedJobs() async {
    final data = await _api.get('/recommendations/jobs');
    if (data is Map && data['recommendations'] is List) {
      return (data['recommendations'] as List)
          .map((e) => JobRecommendation.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> fetchRecommendationSummary() async {
    final data = await _api.get('/recommendations/jobs');
    if (data is Map) {
      return Map<String, dynamic>.from(data['summary'] ?? {});
    }
    return {};
  }

  Future<List<Announcement>> fetchAnnouncements() async {
    final data = await _api.get('/posts/announcements');
    return _parseList(data, (e) => Announcement.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<List<Opportunity>> fetchOpportunities({String? type}) async {
    final q = type != null ? {'type': type} : null;
    final data = await _api.get('/opportunities', query: q);
    if (data is Map && data['opportunities'] is List) {
      return (data['opportunities'] as List)
          .map((e) => Opportunity.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    return _parseList(data, (e) => Opportunity.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<List<Course>> fetchCourses({String? search, String? level}) async {
    final q = <String, dynamic>{};
    if (search != null && search.isNotEmpty) q['search'] = search;
    if (level != null && level.isNotEmpty) q['level'] = level;
    final data = await _api.get('/courses', query: q.isEmpty ? null : q);
    if (data is Map && data['data'] is List) {
      return (data['data'] as List)
          .map((e) => Course.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    return _parseList(data, (e) => Course.fromJson(Map<String, dynamic>.from(e)));
  }


  Future<List<CourseEnrollment>> fetchMyEnrollments() async {
    final data = await _api.get('/courses/my/enrollments');
    if (data is Map && data['data'] is List) {
      return (data['data'] as List)
          .map((e) => CourseEnrollment.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    return _parseList(data, (e) => CourseEnrollment.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<List<Map<String, dynamic>>> fetchMyLearning() async {
    final data = await _api.get('/courses/my/enrollments');
    return _parseList(data, (e) => Map<String, dynamic>.from(e));
  }

  Future<List<Map<String, dynamic>>> fetchSkillAssessments() async {
    final data = await _api.get('/assessments/me');
    if (data is Map && data['assessments'] is List) {
      return (data['assessments'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return _parseList(data, (e) => Map<String, dynamic>.from(e));
  }

  Future<List<Map<String, dynamic>>> fetchAptitudeTests() async {
    final data = await _api.get('/aptitude/tests');
    if (data is Map && data['tests'] is List) {
      return (data['tests'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return _parseList(data, (e) => Map<String, dynamic>.from(e));
  }

  Future<Job> fetchJobDetail(String id) async {
    final data = await _api.get('/jobs/$id');
    return Job.fromJson(Map<String, dynamic>.from(data));
  }

  Future<List<Internship>> fetchInternships({int page = 1, String? search}) async {
    final q = <String, dynamic>{'page': page, 'limit': AppConstants.defaultPageSize, 'type': 'internship'};
    if (search != null && search.isNotEmpty) q['search'] = search;
    final data = await _api.get('/opportunities', query: q);
    if (data is Map && data['opportunities'] is List) {
      return (data['opportunities'] as List)
          .map((e) => Internship.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    return _parseList(data, (e) => Internship.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<List<Application>> fetchMyApplications({String? type}) async {
    final data = await _api.get('/applications/me');
    return _parseList(data, (e) => Application.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<Map<String, dynamic>> applyToJob(String jobId, {String? coverLetter}) async {
    final body = <String, dynamic>{};
    if (coverLetter != null) body['coverLetter'] = coverLetter;
    final data = await _api.post('/applications/$jobId/apply', body: body);
    return Map<String, dynamic>.from(data);
  }

  Future<SkillProfile> fetchSkillProfile() async {
    final data = await _api.get('/career/skill-mapping');
    if (data is Map && data['studentProfile'] is Map) {
      return _skillProfileFromCareer(Map<String, dynamic>.from(data['studentProfile']));
    }
    if (data is Map) return _skillProfileFromCareer(Map<String, dynamic>.from(data));
    return const SkillProfile();
  }

  SkillProfile _skillProfileFromCareer(Map<String, dynamic> j) {
    final strong = (j['strengths'] is List)
        ? (j['strengths'] as List).map((e) => e.toString()).toList()
        : const <String>[];
    final gaps = (j['gaps'] is List)
        ? (j['gaps'] as List).map((e) => e.toString()).toList()
        : const <String>[];
    final skills = (j['skills'] is List)
        ? j['skills'].asMap().entries.map((e) => SkillItem(name: e.value.toString(), score: 0)).toList()
        : const [];
    return SkillProfile(
      skills: skills,
      strongSkills: strong,
      improveSkills: gaps,
    );
  }

  Future<List<String>> fetchSkillGaps() async {
    final data = await _api.get('/career/skill-mapping');
    if (data is Map && data['studentProfile'] is Map) {
      final profile = data['studentProfile'] as Map;
      return (profile['gaps'] is List) ? List<String>.from(profile['gaps']) : const [];
    }
    return const [];
  }

  Future<List<LearningResource>> fetchRecommendations({List<String>? skills}) async {
    final q = skills != null && skills.isNotEmpty ? {'skills': skills.join(',')} : null;
    final data = await _api.get('/career/learning/recommendations', query: q);
    if (data is Map && data['recommendations'] is List) {
      return (data['recommendations'] as List)
          .map((e) => LearningResource.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    return _parseList(data, (e) => LearningResource.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<List<LearningResource>> fetchLearningPlatforms({String? category}) async {
    final q = category != null ? {'category': category} : null;
    final data = await _api.get('/learning-platforms', query: q);
    return _parseList(data, (e) => LearningResource.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<Course> fetchCourseDetail(String id) async {
    final data = await _api.get('/courses/$id');
    if (data is Map && data['data'] is Map) {
      return Course.fromJson(Map<String, dynamic>.from(data['data']));
    }
    return Course.fromJson(Map<String, dynamic>.from(data));
  }

  Future<void> enrollCourse(String courseId) async {
    await _api.post('/courses/$courseId/enroll', body: {});
  }

  Future<List<Map<String, dynamic>>> fetchCertificates() async {
    final enrollments = await fetchMyEnrollments();
    return enrollments
        .where((e) => e.status == 'completed' && e.course.certificateAvailable)
        .map((e) => <String, dynamic>{
            'title': e.course.title,
            'provider': e.course.provider ?? '',
            'issueDate': e.certificateIssueDate?.toIso8601String(),
            'certificateUrl': e.certificateUrl ?? '',
            'certificateId': e.certificateId ?? '',
            'courseId': e.course.id,
          })
        .toList();
  }

  Future<List<NotificationItem>> fetchNotifications() async {
    final data = await _api.get('/posts/announcements');
    if (data is List) {
      return data.map((e) => NotificationItem.fromJson(Map<String, dynamic>.from(e))).toList();
    }
    return _parseList(data, (e) => NotificationItem.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<void> applyToOpportunity(String opportunityId) async {
    await _api.post('/opportunities/$opportunityId/apply', body: {});
  }

  Future<Map<String, dynamic>> fetchCareerGuidance() async {
    final data = await _api.get('/career/guidance');
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }

  List<T> _parseList<T>(dynamic data, T Function(Map<String, dynamic>) mapper) {
    if (data is List) {
      return data.map((e) => mapper(Map<String, dynamic>.from(e as Map))).toList();
    }
    if (data is Map && data['data'] is List) {
      return (data['data'] as List)
          .map((e) => mapper(Map<String, dynamic>.from(e as Map)))
          .toList();
    }
    if (data is Map && data['items'] is List) {
      return (data['items'] as List)
          .map((e) => mapper(Map<String, dynamic>.from(e as Map)))
          .toList();
    }
    if (data is Map && data['opportunities'] is List) {
      return (data['opportunities'] as List)
          .map((e) => mapper(Map<String, dynamic>.from(e as Map)))
          .toList();
    }
    return <T>[];
  }
}
