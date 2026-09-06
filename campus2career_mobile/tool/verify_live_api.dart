import 'dart:convert';
import 'dart:io';

/// Smoke-checks the live Render API used by the Android client.
/// Does not apply to a job (avoids polluting production applications).
void main() async {
  const base = 'https://campus2career-cpe2.onrender.com';

  final health = await _get('$base/api/health');
  stdout.writeln('health=${health.statusCode} body=${health.body}');
  if (health.statusCode != 200) {
    stderr.writeln('Health check failed');
    exitCode = 1;
    return;
  }

  final candidates = <({String email, String password})>[
    (email: Platform.environment['C2C_EMAIL'] ?? 'student@campus2career.com', password: Platform.environment['C2C_PASSWORD'] ?? 'Student@1234'),
    (email: 'recruiter.nimbus@portal.campus2career.com', password: 'Recruiter@1234'),
    (email: 'student.001@bulk.campus2career.com', password: 'Student@1234'),
    (email: 'recruiter@campus2career.com', password: 'Recruiter@1234'),
  ];

  String? token;
  for (final c in candidates) {
    final login = await _post('$base/api/auth/login', {'email': c.email, 'password': c.password});
    stdout.writeln('login ${c.email}=${login.statusCode}');
    if (login.statusCode == 200) {
      token = (jsonDecode(login.body) as Map)['token'] as String?;
      break;
    }
  }

  if (token == null || token.isEmpty) {
    stdout.writeln('No demo login succeeded; health is OK. Use C2C_EMAIL/C2C_PASSWORD for a real student.');
    return;
  }

  final jobs = await _get('$base/api/jobs', token: token);
  stdout.writeln('jobs=${jobs.statusCode} count=${_count(jobs.body)}');

  final courses = await _get('$base/api/courses', token: token);
  stdout.writeln('courses=${courses.statusCode} bodyType=${courses.body.length}');

  final apps = await _get('$base/api/applications/me', token: token);
  stdout.writeln('applications=${apps.statusCode}');

  if (jobs.statusCode != 200 || courses.statusCode != 200) {
    exitCode = 1;
  }
}

int _count(String body) {
  final decoded = jsonDecode(body);
  if (decoded is List) return decoded.length;
  if (decoded is Map && decoded['data'] is List) return (decoded['data'] as List).length;
  if (decoded is Map && decoded['jobs'] is List) return (decoded['jobs'] as List).length;
  return -1;
}

Future<({int statusCode, String body})> _get(String url, {String? token}) async {
  final client = HttpClient();
  try {
    final req = await client.getUrl(Uri.parse(url));
    req.headers.set(HttpHeaders.acceptHeader, 'application/json');
    if (token != null) req.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
    final res = await req.close();
    final body = await res.transform(utf8.decoder).join();
    return (statusCode: res.statusCode, body: body);
  } finally {
    client.close();
  }
}

Future<({int statusCode, String body})> _post(String url, Map<String, dynamic> json) async {
  final client = HttpClient();
  try {
    final req = await client.postUrl(Uri.parse(url));
    req.headers.contentType = ContentType.json;
    req.add(utf8.encode(jsonEncode(json)));
    final res = await req.close();
    final body = await res.transform(utf8.decoder).join();
    return (statusCode: res.statusCode, body: body);
  } finally {
    client.close();
  }
}
