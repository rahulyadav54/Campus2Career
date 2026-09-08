class ResumeDocument {
  final String id;
  final String title;
  final String templateId;
  final String targetRole;
  final Map<String, dynamic> content;
  final int? atsScore;
  final bool isDefault;
  final DateTime? updatedAt;

  ResumeDocument({
    required this.id,
    required this.title,
    required this.templateId,
    required this.targetRole,
    required this.content,
    this.atsScore,
    this.isDefault = false,
    this.updatedAt,
  });

  factory ResumeDocument.fromJson(Map<String, dynamic> json) {
    return ResumeDocument(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? 'My Resume').toString(),
      templateId: (json['templateId'] ?? 'campus2career_ats').toString(),
      targetRole: (json['targetRole'] ?? '').toString(),
      content: json['content'] is Map ? Map<String, dynamic>.from(json['content']) : {},
      atsScore: json['atsScore'] is num ? (json['atsScore'] as num).toInt() : null,
      isDefault: json['isDefault'] == true,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'].toString()) : null,
    );
  }
}

class CareerDashboard {
  final int careerReadiness;
  final Map<String, int> scores;

  CareerDashboard({required this.careerReadiness, required this.scores});

  factory CareerDashboard.fromJson(Map<String, dynamic> json) {
    final scoresRaw = json['scores'];
    final scores = <String, int>{};
    if (scoresRaw is Map) {
      for (final e in scoresRaw.entries) {
        if (e.value is num) scores[e.key] = (e.value as num).toInt();
      }
    }
    return CareerDashboard(
      careerReadiness: (json['careerReadiness'] is num) ? (json['careerReadiness'] as num).toInt() : 0,
      scores: scores,
    );
  }
}
