import '../services/api_helper.dart';

class AiService {
  final ApiHelper _api;
  AiService(this._api);

  Future<Map<String, dynamic>> chatFile({
    required String filePath,
    required String filename,
  }) async {
    final data = await _api.postMultipart(
      '/ai/chat-file',
      fileField: 'file',
      filePath: filePath,
      filename: filename,
    );
    return data is Map ? Map<String, dynamic>.from(data) : {'success': false};
  }

  Future<String> chat({
    required String message,
    List<Map<String, String>> history = const [],
    Map<String, dynamic>? context,
    List<Map<String, String>> attachments = const [],
  }) async {
    final data = await _api.post('/ai/chat', body: {
      'message': message,
      'history': history,
      if (context != null) 'context': context,
      if (attachments.isNotEmpty) 'attachments': attachments,
    });
    if (data is Map) {
      return (data['response'] ?? data['message'] ?? '').toString();
    }
    return data.toString();
  }

  Future<List<Map<String, dynamic>>> listChatHistories() async {
    final data = await _api.get('/chat-history');
    if (data is Map && data['histories'] is List) {
      return (data['histories'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return const [];
  }

  Future<Map<String, dynamic>?> getChatHistory(String id) async {
    final data = await _api.get('/chat-history/$id');
    if (data is Map && data['history'] is Map) return Map<String, dynamic>.from(data['history']);
    return data is Map ? Map<String, dynamic>.from(data) : null;
  }

  Future<String> saveChatHistory({
    String? id,
    required String title,
    required List<Map<String, String>> messages,
  }) async {
    if (id == null || id.isEmpty) {
      final data = await _api.post('/chat-history', body: {'title': title, 'messages': messages});
      if (data is Map && data['history'] is Map) return (data['history']['_id'] ?? '').toString();
      return '';
    }
    await _api.put('/chat-history/$id', body: {'title': title, 'messages': messages});
    return id;
  }

  Future<void> deleteChatHistory(String id) async {
    await _api.delete('/chat-history/$id');
  }

  Future<Map<String, dynamic>> importResume({
    required String filePath,
    required String filename,
  }) async {
    final data = await _api.postMultipart(
      '/ai/import-resume',
      fileField: 'resume',
      filePath: filePath,
      filename: filename,
    );
    return data is Map ? Map<String, dynamic>.from(data) : {'success': false};
  }

  Future<Map<String, dynamic>> readinessScore() async {
    final data = await _api.get('/ai/readiness-score');
    return data is Map ? Map<String, dynamic>.from(data) : {};
  }
}
