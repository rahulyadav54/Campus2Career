enum AppFlavor { development, staging, production }

class AppConfig {
  final AppFlavor flavor;
  final String name;
  final String apiBaseUrl;
  final bool enableLogging;
  final bool enableCache;

  const AppConfig._({
    required this.flavor,
    required this.name,
    required this.apiBaseUrl,
    required this.enableLogging,
    required this.enableCache,
  });

  static const development = AppConfig._(
    flavor: AppFlavor.development,
    name: 'Campus2Career (Dev)',
    apiBaseUrl: 'http://10.0.2.2:5000',
    enableLogging: true,
    enableCache: true,
  );

  static const staging = AppConfig._(
    flavor: AppFlavor.staging,
    name: 'Campus2Career (Staging)',
    apiBaseUrl: 'https://campus2career-cpe2.onrender.com',
    enableLogging: true,
    enableCache: true,
  );

  static const production = AppConfig._(
    flavor: AppFlavor.production,
    name: 'Campus2Career',
    apiBaseUrl: 'https://campus2career-cpe2.onrender.com',
    enableLogging: false,
    enableCache: true,
  );

  static AppConfig fromFlavor(AppFlavor f) {
    switch (f) {
      case AppFlavor.development:
        return development;
      case AppFlavor.staging:
        return staging;
      case AppFlavor.production:
        return production;
    }
  }

  String get apiPrefix => '$apiBaseUrl/api';

  bool get isProduction => flavor == AppFlavor.production;
}
