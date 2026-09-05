class NotificationItem {
  final String id;
  final String title;
  final String? body;
  final String? type;
  final bool read;
  final DateTime? createdAt;
  final Map<String, dynamic>? data;

  const NotificationItem({
    required this.id,
    required this.title,
    this.body,
    this.type,
    this.read = false,
    this.createdAt,
    this.data,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> j) => NotificationItem(
        id: (j['_id'] ?? j['id']).toString(),
        title: (j['title'] ?? '').toString(),
        body: (j['body'] ?? j['message'] ?? j['content'])?.toString(),
        type: j['type']?.toString(),
        read: j['read'] == true || j['isRead'] == true,
        createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt'].toString()) : null,
        data: j['data'] is Map ? Map<String, dynamic>.from(j['data']) : null,
      );
}
