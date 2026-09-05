class Announcement {
  final String id;
  final String title;
  final String content;
  final String type;
  final String priority;
  final String targetAudience;
  final DateTime? expiresAt;
  final String? createdByName;
  final String? createdByEmail;
  final DateTime? createdAt;

  const Announcement({
    required this.id,
    required this.title,
    required this.content,
    this.type = 'general',
    this.priority = 'medium',
    this.targetAudience = 'all',
    this.expiresAt,
    this.createdByName,
    this.createdByEmail,
    this.createdAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> j) => Announcement(
        id: (j['_id'] ?? j['id']).toString(),
        title: (j['title'] ?? '').toString(),
        content: (j['content'] ?? '').toString(),
        type: (j['type'] ?? 'general').toString(),
        priority: (j['priority'] ?? 'medium').toString(),
        targetAudience: (j['targetAudience'] ?? 'all').toString(),
        expiresAt: j['expiresAt'] != null ? DateTime.tryParse(j['expiresAt'].toString()) : null,
        createdByName: j['createdBy'] is Map ? (j['createdBy'] as Map)['name']?.toString() : null,
        createdByEmail: j['createdBy'] is Map ? (j['createdBy'] as Map)['email']?.toString() : null,
        createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt'].toString()) : null,
      );
}
