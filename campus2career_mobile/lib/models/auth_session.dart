import 'user.dart';

class AuthSession {
  final String accessToken;
  final String? refreshToken;
  final User user;

  const AuthSession({required this.accessToken, this.refreshToken, required this.user});

  factory AuthSession.fromJson(Map<String, dynamic> j) {
    final token = (j['token'] ?? j['accessToken'] ?? '').toString();
    final refresh = (j['refreshToken'] ?? '').toString();
    final userJson = (j['user'] is Map) ? Map<String, dynamic>.from(j['user']) : <String, dynamic>{};
    return AuthSession(
      accessToken: token,
      refreshToken: refresh.isEmpty ? null : refresh,
      user: User.fromJson(userJson),
    );
  }
}
