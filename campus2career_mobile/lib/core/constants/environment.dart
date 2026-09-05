import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'app_config.dart';

class Environment {
  static const AppFlavor _flavor = bool.fromEnvironment('dart.vm.product')
      ? AppFlavor.production
      : bool.fromEnvironment('STAGING') ? AppFlavor.staging : AppFlavor.development;

  static AppConfig get config => AppConfig.fromFlavor(_flavor);

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
