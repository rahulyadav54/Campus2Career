import '../core/constants/app_constants.dart';
import '../models/job.dart';
import '../models/internship.dart';
import '../models/application.dart';
import 'api_helper.dart';

class RecruiterService {
  final ApiHelper _api;
  RecruiterService(this._api);

  Future<Map<String, dynamic>> fetchDashboard() async {
    final data = await _api.get('/recruiter/dashboard');
    return Map<String, dynamic>.from(data);
  }

  Future<List<Job>> fetchMyJobs({int page = 1}) async {
    final data = await _api.get('/recruiter/jobs', query: {'page': page, 'limit': AppConstants.defaultPageSize});
    return _parseList(data, (e) => Job.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<Job> createJob(Map<String, dynamic> body) async {
    final data = await _api.post('/recruiter/jobs', body: body);
    return Job.fromJson(Map<String, dynamic>.from(data));
  }

  Future<Job> updateJob(String id, Map<String, dynamic> body) async {
    final data = await _api.put('/recruiter/jobs/$id', body: body);
    return Job.fromJson(Map<String, dynamic>.from(data));
  }

  Future<void> closeJob(String id) async {
    await _api.put('/recruiter/jobs/$id/close', body: {});
  }

  Future<List<Application>> fetchApplicants(String jobId) async {
    final data = await _api.get('/recruiter/jobs/$jobId/applicants');
    return _parseList(data, (e) => Application.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<List<Internship>> fetchMyInternships() async {
    final data = await _api.get('/recruiter/internships');
    return _parseList(data, (e) => Internship.fromJson(Map<String, dynamic>.from(e)));
  }

  Future<List<Map<String, dynamic>>> fetchApplications() async {
    try {
      final data = await _api.get('/recruiter/applications');
      return _parseList(data, (e) => Map<String, dynamic>.from(e));
    } catch (_) {
      return const [];
    }
  }

  Future<List<Map<String, dynamic>>> fetchStudents({String? search}) async {
    final q = <String, dynamic>{};
    if (search != null && search.isNotEmpty) q['search'] = search;
    try {
      final data = await _api.get('/recruiter/students', query: q.isEmpty ? null : q);
      return _parseList(data, (e) => Map<String, dynamic>.from(e));
    } catch (_) {
      return const [];
    }
  }

  Future<Map<String, dynamic>> fetchAnalytics() async {
    final data = await _api.get('/recruiter/analytics');
    return Map<String, dynamic>.from(data);
  }

  Future<Map<String, dynamic>> createLearningProgram(Map<String, dynamic> body) async {
    final data = await _api.post('/recruiter/learning-programs', body: body);
    return Map<String, dynamic>.from(data);
  }

  List<T> _parseList<T>(dynamic data, T Function(Map<String, dynamic>) mapper) {
    if (data is List) return data.map((e) => mapper(Map<String, dynamic>.from(e as Map))).toList();
    if (data is Map && data['data'] is List) {
      return (data['data'] as List).map((e) => mapper(Map<String, dynamic>.from(e as Map))).toList();
    }
    if (data is Map && data['applications'] is List) {
      return (data['applications'] as List).map((e) => mapper(Map<String, dynamic>.from(e as Map))).toList();
    }
    if (data is Map && data['students'] is List) {
      return (data['students'] as List).map((e) => mapper(Map<String, dynamic>.from(e as Map))).toList();
    }
    if (data is Map && data['jobs'] is List) {
      return (data['jobs'] as List).map((e) => mapper(Map<String, dynamic>.from(e as Map))).toList();
    }
    return [];
  }
}
