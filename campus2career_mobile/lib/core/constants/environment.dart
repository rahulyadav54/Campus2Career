import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'app_config.dart';

class Environment {
  static AppConfig get config {
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) {
      return AppConfig(
        flavor: AppFlavor.development,
        name: 'Campus2Career (Custom)',
        apiBaseUrl: override,
        enableLogging: true,
        enableCache: true,
      );
    }
    // Debug APKs must hit the live API. 10.0.2.2 only works on an emulator
    // with a local backend. Override with --dart-define=API_BASE_URL=...
    return AppConfig.production.copyWith(enableLogging: kDebugMode);
  }

  static Future<void> setPreferredOrientations() async {
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  }

  static void log(String message, {String tag = 'C2C'}) {
    if (kDebugMode || config.enableLogging) {
      debugPrint('[$tag] $message');
    }
  }
}
