import '../models/interview_session.dart';
import 'api_helper.dart';

class InterviewService {
  final ApiHelper _api;
  InterviewService(this._api);

  static const _base = '/interviews';

  Future<InterviewStartResult> start({
    required String targetRole,
    String interviewType = 'mixed',
    String difficulty = 'intermediate',
    String personality = 'professional',
    int durationMinutes = 10,
    bool resumeBased = false,
    String jobDescription = '',
  }) async {
    final data = await _api.post<Map<String, dynamic>>('$_base/start', body: {
      'targetRole': targetRole,
      'interviewType': interviewType,
      'difficulty': difficulty,
      'personality': personality,
      'durationMinutes': durationMinutes,
      'resumeBased': resumeBased,
      'jobDescription': jobDescription,
    });
    return InterviewStartResult.fromJson(data);
  }

  Future<InterviewTurnResult> confirmReady(String sessionId) async {
    final data = await _api.post<Map<String, dynamic>>('$_base/$sessionId/answer', body: {
      'confirmReady': true,
    });
    return InterviewTurnResult.fromJson(data);
  }

  Future<InterviewTurnResult> submitAnswer({
    required String sessionId,
    required String transcript,
    required int questionIndex,
  }) async {
    final data = await _api.post<Map<String, dynamic>>('$_base/$sessionId/answer', body: {
      'transcript': transcript,
      'questionIndex': questionIndex,
    });
    return InterviewTurnResult.fromJson(data);
  }

  Future<InterviewReport> endInterview(String sessionId) async {
    final data = await _api.post<Map<String, dynamic>>('$_base/$sessionId/end', body: {});
    return InterviewReport.fromJson(data);
  }

  Future<InterviewReport> getReport(String sessionId) async {
    final data = await _api.get<Map<String, dynamic>>('$_base/$sessionId/report');
    return InterviewReport.fromJson(data);
  }

  Future<List<InterviewHistoryItem>> getHistory() async {
    final data = await _api.get<Map<String, dynamic>>('$_base/history');
    final list = data['sessions'] ?? data['history'];
    if (list is! List) return [];
    return list.whereType<Map>().map((e) => InterviewHistoryItem.fromJson(Map<String, dynamic>.from(e))).toList();
  }
}
