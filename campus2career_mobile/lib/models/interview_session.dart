class InterviewStartResult {
  final String sessionId;
  final String candidateName;
  final String greeting;
  final String questionText;
  final String speakText;
  final bool waitForReady;
  final int totalDurationMs;

  InterviewStartResult({
    required this.sessionId,
    required this.candidateName,
    required this.greeting,
    required this.questionText,
    required this.speakText,
    required this.waitForReady,
    required this.totalDurationMs,
  });

  factory InterviewStartResult.fromJson(Map<String, dynamic> json) {
    final q = json['question'];
    return InterviewStartResult(
      sessionId: (json['sessionId'] ?? '').toString(),
      candidateName: (json['candidateName'] ?? '').toString(),
      greeting: (json['greeting'] ?? '').toString(),
      questionText: q is Map ? (q['text'] ?? '').toString() : '',
      speakText: (json['speakText'] ?? json['greeting'] ?? '').toString(),
      waitForReady: json['waitForReady'] == true,
      totalDurationMs: json['totalDurationMs'] is num ? (json['totalDurationMs'] as num).toInt() : 600000,
    );
  }
}

class InterviewTurnResult {
  final String speakText;
  final String questionText;
  final int questionIndex;
  final String nextAction;
  final String emotion;
  final int? overallScore;
  final int thinkingPauseMs;

  InterviewTurnResult({
    required this.speakText,
    required this.questionText,
    required this.questionIndex,
    required this.nextAction,
    required this.emotion,
    this.overallScore,
    this.thinkingPauseMs = 800,
  });

  factory InterviewTurnResult.fromJson(Map<String, dynamic> json) {
    final q = json['nextQuestion'];
    final eval = json['evaluation'];
    return InterviewTurnResult(
      speakText: (json['speakText'] ?? '').toString(),
      questionText: q is Map ? (q['text'] ?? '').toString() : '',
      questionIndex: q is Map && q['index'] is num ? (q['index'] as num).toInt() : 0,
      nextAction: (json['nextAction'] ?? '').toString(),
      emotion: (json['emotion'] ?? 'neutral').toString(),
      overallScore: eval is Map && eval['overallScore'] is num ? (eval['overallScore'] as num).toInt() : null,
      thinkingPauseMs: json['thinkingPauseMs'] is num ? (json['thinkingPauseMs'] as num).toInt() : 800,
    );
  }
}

class InterviewReport {
  final String sessionId;
  final String targetRole;
  final int overallScore;
  final String summary;
  final List<String> strengths;
  final List<String> improvements;
  final List<Map<String, dynamic>> questions;

  InterviewReport({
    required this.sessionId,
    required this.targetRole,
    required this.overallScore,
    required this.summary,
    required this.strengths,
    required this.improvements,
    required this.questions,
  });

  factory InterviewReport.fromJson(Map<String, dynamic> json) {
    final report = json['report'] is Map ? json['report'] as Map : json;
    return InterviewReport(
      sessionId: (json['sessionId'] ?? report['sessionId'] ?? '').toString(),
      targetRole: (report['targetRole'] ?? '').toString(),
      overallScore: report['overallScore'] is num ? (report['overallScore'] as num).toInt() : 0,
      summary: (report['summary'] ?? '').toString(),
      strengths: (report['strengths'] is List) ? report['strengths'].map((e) => e.toString()).toList() : [],
      improvements: (report['improvements'] is List) ? report['improvements'].map((e) => e.toString()).toList() : [],
      questions: (report['questions'] is List)
          ? report['questions'].whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
          : [],
    );
  }
}

class InterviewHistoryItem {
  final String id;
  final String targetRole;
  final int? score;
  final String status;
  final DateTime? createdAt;

  InterviewHistoryItem({
    required this.id,
    required this.targetRole,
    this.score,
    required this.status,
    this.createdAt,
  });

  factory InterviewHistoryItem.fromJson(Map<String, dynamic> json) {
    return InterviewHistoryItem(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      targetRole: (json['targetRole'] ?? '').toString(),
      score: json['overallScore'] is num ? (json['overallScore'] as num).toInt() : null,
      status: (json['status'] ?? '').toString(),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }
}
