import 'package:flutter_test/flutter_test.dart';
import 'package:campus2career_mobile/core/constants/app_config.dart';

void main() {
  test('AppConfig production URL is the Render backend', () {
    const c = AppConfig.production;
    expect(c.apiBaseUrl, contains('onrender.com'));
    expect(c.isProduction, isTrue);
  });

  test('debug default API is the live Render backend', () {
    expect(AppConfig.development.apiBaseUrl, contains('onrender.com'));
  });
}
