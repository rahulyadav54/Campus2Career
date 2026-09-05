import 'package:flutter/foundation.dart';
import '../core/errors/failures.dart';
import '../core/storage/secure_storage_service.dart';
import '../models/auth_session.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  final AuthService _auth;

  AuthProvider(this._auth, SecureStorageService storage);

  AuthStatus _status = AuthStatus.unknown;
  AuthSession? _session;
  User? _user;
  String? _error;
  bool _busy = false;

  AuthStatus get status => _status;
  AuthSession? get session => _session;
  User? get user => _user;
  String? get error => _error;
  bool get busy => _busy;
  bool get isAuthed => _status == AuthStatus.authenticated && _user != null;
  String get role => _user?.role ?? 'student';

  Future<void> bootstrap() async {
    try {
      final cached = await _auth.readSession();
      if (cached == null || cached.accessToken.isEmpty) {
        _status = AuthStatus.unauthenticated;
      } else {
        _session = cached;
        _user = cached.user;
        _status = AuthStatus.authenticated;
        try {
          final fresh = await _auth.fetchProfile();
          _user = fresh;
        } on AuthFailure {
          await logout();
        } on AppFailure catch (e) {
          debugPrint('Bootstrap profile fetch failed (offline?): ${e.message}');
        } catch (e) {
          debugPrint('Bootstrap profile fetch error: $e');
        }
      }
    } catch (e, st) {
      debugPrint('AuthProvider.bootstrap error: $e\n$st');
      _status = AuthStatus.unauthenticated;
    } finally {
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password, {String? role}) async {
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      final s = await _auth.login(email, password, role: role);
      _session = s;
      _user = s.user;
      _status = AuthStatus.authenticated;
      return true;
    } on AppFailure catch (f) {
      _error = f.message;
      return false;
    } catch (e) {
      _error = 'Something went wrong. Please try again.';
      return false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      await _auth.logout();
    } catch (e) {
      debugPrint('Logout error: $e');
    }
    _session = null;
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
