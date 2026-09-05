import 'api_helper.dart';

class InstitutionService {
  final ApiHelper _api;
  InstitutionService(this._api);

  Future<Map<String, dynamic>> fetchDashboard() async {
    final data = await _api.get('/institutions/dashboard');
    return Map<String, dynamic>.from(data);
  }

  Future<List<Map<String, dynamic>>> fetchStudents({int page = 1}) async {
    final data = await _api.get('/institutions/students', query: {'page': page, 'limit': 20});
    return _parseList(data);
  }

  Future<Map<String, dynamic>> fetchAnalytics() async {
    final data = await _api.get('/institutions/analytics');
    return Map<String, dynamic>.from(data);
  }

  Future<Map<String, dynamic>> fetchPlacementReadiness() async {
    final data = await _api.get('/institutions/placement-readiness');
    return Map<String, dynamic>.from(data);
  }

  List<Map<String, dynamic>> _parseList(dynamic data) {
    if (data is List) return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    if (data is Map && data['data'] is List) {
      return (data['data'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }
}
