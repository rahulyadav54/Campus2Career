import 'api_helper.dart';

class AcademicianService {
  final ApiHelper _api;
  AcademicianService(this._api);

  Future<Map<String, dynamic>> fetchDashboard() async {
    final data = await _api.get('/academician/dashboard');
    return Map<String, dynamic>.from(data);
  }

  Future<List<Map<String, dynamic>>> fetchOpportunities({String? type}) async {
    final q = type != null ? {'type': type} : null;
    final data = await _api.get('/academician-opportunities', query: q);
    return _parseList(data);
  }

  Future<Map<String, dynamic>> fetchOpportunityDetail(String id) async {
    final data = await _api.get('/academician-opportunities/$id');
    return Map<String, dynamic>.from(data);
  }

  Future<List<Map<String, dynamic>>> fetchMyApplications() async {
    final data = await _api.get('/academician-opportunities/my-applications');
    return _parseList(data);
  }

  Future<void> applyToOpportunity(String id, {String? statement}) async {
    await _api.post('/academician-opportunities/$id/apply', body: {'statement': statement});
  }

  Future<List<Map<String, dynamic>>> fetchMentorshipPrograms() async {
    final data = await _api.get('/mentorship');
    return _parseList(data);
  }

  List<Map<String, dynamic>> _parseList(dynamic data) {
    if (data is List) return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    if (data is Map && data['data'] is List) {
      return (data['data'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }
}
