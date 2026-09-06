enum AppFlavor { development, staging, production }

class AppConfig {
  final AppFlavor flavor;
  final String name;
  final String apiBaseUrl;
  final bool enableLogging;
  final bool enableCache;

  const AppConfig({
    required this.flavor,
    required this.name,
    required this.apiBaseUrl,
    required this.enableLogging,
    required this.enableCache,
  });

  AppConfig copyWith({bool? enableLogging}) {
    return AppConfig(
      flavor: flavor,
      name: name,
      apiBaseUrl: apiBaseUrl,
      enableLogging: enableLogging ?? this.enableLogging,
      enableCache: enableCache,
    );
  }

  static const development = AppConfig(
    flavor: AppFlavor.development,
    name: 'Campus2Career (Dev)',
    apiBaseUrl: 'https://campus2career-cpe2.onrender.com',
    enableLogging: true,
    enableCache: true,
  );

  static const staging = AppConfig(
    flavor: AppFlavor.staging,
    name: 'Campus2Career (Staging)',
    apiBaseUrl: 'https://campus2career-cpe2.onrender.com',
    enableLogging: true,
    enableCache: true,
  );

  static const production = AppConfig(
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
