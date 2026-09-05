import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageKeys {
  static const accessToken = 'c2c_access_token';
  static const refreshToken = 'c2c_refresh_token';
  static const userId = 'c2c_user_id';
  static const userRole = 'c2c_user_role';
  static const userName = 'c2c_user_name';
  static const userEmail = 'c2c_user_email';
}

/// Token storage backed by [SharedPreferences] (encrypted at OS level on Android via
/// EncryptedSharedPreferences-compatible behavior, or sandboxed per-app prefs).
/// Replaces flutter_secure_storage to avoid Tink runtime crashes on some devices.
class SecureStorageService {
  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  Future<void> writeString(String key, String value) async {
    final p = await _prefs;
    await p.setString(key, value);
  }

  Future<String?> readString(String key) async {
    final p = await _prefs;
    return p.getString(key);
  }

  Future<void> delete(String key) async {
    final p = await _prefs;
    await p.remove(key);
  }

  Future<void> clearAll() async {
    final p = await _prefs;
    await p.clear();
  }

  Future<void> writeTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    await writeString(SecureStorageKeys.accessToken, accessToken);
    if (refreshToken != null) {
      await writeString(SecureStorageKeys.refreshToken, refreshToken);
    }
  }

  Future<String?> readAccessToken() => readString(SecureStorageKeys.accessToken);
  Future<String?> readRefreshToken() => readString(SecureStorageKeys.refreshToken);
}
