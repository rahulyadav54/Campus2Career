import 'package:dio/dio.dart';
import '../models/resume_document.dart';
import 'api_helper.dart';

class ResumeOptimizerService {
  final ApiHelper _api;
  ResumeOptimizerService(this._api);

  static const _base = '/resume-optimizer';

  Future<CareerDashboard> getDashboard() async {
    final data = await _api.get<Map<String, dynamic>>('$_base/dashboard');
    return CareerDashboard.fromJson(data['dashboard'] is Map ? Map<String, dynamic>.from(data['dashboard']) : {});
  }

  Future<List<ResumeDocument>> listResumes() async {
    final data = await _api.get<Map<String, dynamic>>('$_base');
    final list = data['resumes'];
    if (list is! List) return [];
    return list.whereType<Map>().map((e) => ResumeDocument.fromJson(Map<String, dynamic>.from(e))).toList();
  }

  Future<ResumeDocument> getResume(String id) async {
    final data = await _api.get<Map<String, dynamic>>('$_base/$id');
    return ResumeDocument.fromJson(Map<String, dynamic>.from(data['resume'] as Map));
  }

  Future<ResumeDocument> createResume({String? title, bool fromProfile = true, String? targetRole}) async {
    final data = await _api.post<Map<String, dynamic>>('$_base', body: {
      'title': title ?? 'My Resume',
      'fromProfile': fromProfile,
      if (targetRole != null) 'targetRole': targetRole,
    });
    return ResumeDocument.fromJson(Map<String, dynamic>.from(data['resume'] as Map));
  }

  Future<ResumeDocument> updateResume(String id, {String? title, Map<String, dynamic>? content, String? targetRole}) async {
    final data = await _api.put<Map<String, dynamic>>('$_base/$id', body: {
      if (title != null) 'title': title,
      if (content != null) 'content': content,
      if (targetRole != null) 'targetRole': targetRole,
    });
    return ResumeDocument.fromJson(Map<String, dynamic>.from(data['resume'] as Map));
  }

  Future<ResumeDocument> uploadResume({required String filePath, String? filename, String? title}) async {
    final data = await _api.postMultipart<Map<String, dynamic>>(
      '$_base/upload',
      fileField: 'resume',
      filePath: filePath,
      filename: filename,
      fields: {if (title != null) 'title': title},
    );
    return ResumeDocument.fromJson(Map<String, dynamic>.from(data['resume'] as Map));
  }

  Future<Map<String, dynamic>> analyze(String id, {String? jobDescription}) async {
    final data = await _api.post<Map<String, dynamic>>('$_base/$id/analyze', body: {
      if (jobDescription != null) 'jobDescription': jobDescription,
    });
    return data['analysis'] is Map ? Map<String, dynamic>.from(data['analysis']) : {};
  }

  Future<List<Map<String, dynamic>>> getJobMatches({String? resumeId}) async {
    final data = await _api.get<Map<String, dynamic>>('$_base/jobs/match', query: {
      if (resumeId != null) 'resumeId': resumeId,
    });
    final list = data['matches'] ?? data['jobs'];
    if (list is! List) return [];
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<List<Map<String, dynamic>>> getCompanies({String? targetRole}) async {
    final data = await _api.get<Map<String, dynamic>>('$_base/companies', query: {
      if (targetRole != null) 'targetRole': targetRole,
    });
    final list = data['companies'];
    if (list is! List) return [];
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> getSkillGaps({String? targetRole}) async {
    final data = await _api.get<Map<String, dynamic>>('$_base/skill-gaps', query: {
      if (targetRole != null) 'targetRole': targetRole,
    });
    return data['gaps'] is Map ? Map<String, dynamic>.from(data['gaps']) : {};
  }

  Future<Map<String, dynamic>> getInterviewContext(String id) async {
    final data = await _api.get<Map<String, dynamic>>('$_base/$id/interview-context');
    return data['context'] is Map ? Map<String, dynamic>.from(data['context']) : {};
  }
}
