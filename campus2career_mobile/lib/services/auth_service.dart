import '../core/storage/secure_storage_service.dart';
import '../models/auth_session.dart';
import '../models/user.dart';
import 'api_helper.dart';

class AuthService {
  final ApiHelper _api;
  final SecureStorageService _storage;

  AuthService(this._api, this._storage);

  Future<AuthSession> login(String email, String password, {String? role}) async {
    final body = {'email': email.trim(), 'password': password};
    if (role != null && role.isNotEmpty) body['role'] = role;
    final data = await _api.post('/auth/login', body: body);
    final session = AuthSession.fromJson(Map<String, dynamic>.from(data));
    await _persist(session);
    return session;
  }

  Future<User> fetchProfile() async {
    final data = await _api.get('/auth/profile');
    final userData = (data is Map && data['user'] is Map)
        ? Map<String, dynamic>.from(data['user'])
        : Map<String, dynamic>.from(data);
    final user = User.fromJson(userData);
    await _storage.writeString(SecureStorageKeys.userId, user.id);
    await _storage.writeString(SecureStorageKeys.userRole, user.role);
    await _storage.writeString(SecureStorageKeys.userName, user.name);
    await _storage.writeString(SecureStorageKeys.userEmail, user.email);
    return user;
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }

  Future<AuthSession?> readSession() async {
    final token = await _storage.readAccessToken();
    if (token == null || token.isEmpty) return null;
    final id = await _storage.readString(SecureStorageKeys.userId);
    final name = await _storage.readString(SecureStorageKeys.userName) ?? '';
    final email = await _storage.readString(SecureStorageKeys.userEmail) ?? '';
    final role = await _storage.readString(SecureStorageKeys.userRole) ?? 'student';
    return AuthSession(
      accessToken: token,
      refreshToken: await _storage.readRefreshToken(),
      user: User(id: id ?? '', name: name, email: email, role: role),
    );
  }

  Future<void> _persist(AuthSession s) async {
    await _storage.writeTokens(accessToken: s.accessToken, refreshToken: s.refreshToken);
    await _storage.writeString(SecureStorageKeys.userId, s.user.id);
    await _storage.writeString(SecureStorageKeys.userRole, s.user.role);
    await _storage.writeString(SecureStorageKeys.userName, s.user.name);
    await _storage.writeString(SecureStorageKeys.userEmail, s.user.email);
  }
}
