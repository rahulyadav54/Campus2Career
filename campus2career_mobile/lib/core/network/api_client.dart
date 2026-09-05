import 'package:dio/dio.dart';
import '../constants/app_constants.dart';
import '../constants/environment.dart';
import '../errors/failures.dart';
import '../storage/secure_storage_service.dart';

class ApiClient {
  final Dio dio;
  ApiClient._(this.dio);

  static ApiClient create(SecureStorageService storage) {
    final config = Environment.config;
    final dio = Dio(BaseOptions(
      baseUrl: config.apiPrefix,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client': 'campus2career-mobile-android-${AppConstants.appVersion}',
      },
      validateStatus: (s) => s != null && s < 500,
    ));

    dio.interceptors.add(_AuthInterceptor(storage));
    if (config.enableLogging) {
      dio.interceptors.add(_LogInterceptor());
    }

    return ApiClient._(dio);
  }
}

class _AuthInterceptor extends Interceptor {
  final SecureStorageService storage;
  _AuthInterceptor(this.storage);

  @override
  Future<void> onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await storage.readAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final mapped = _mapDioError(err);
    handler.reject(DioException(
      requestOptions: err.requestOptions,
      error: mapped,
      type: err.type,
      response: err.response,
    ));
  }

  AppFailure _mapDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return NetworkFailure();
      case DioExceptionType.badResponse:
        final code = e.response?.statusCode ?? 0;
        final body = e.response?.data;
        final message = _extractMessage(body) ?? 'Request failed';
        if (code == 401) return AuthFailure(message);
        if (code == 404) return NotFoundFailure(message);
        if (code == 400) {
          return ValidationFailure(message, details: _extractDetails(body), statusCode: code);
        }
        return ServerFailure(message);
      default:
        return ServerFailure();
    }
  }

  String? _extractMessage(dynamic body) {
    if (body is Map) {
      final m = body['message'] ?? body['error'];
      if (m is String && m.isNotEmpty) return m;
    }
    return null;
  }

  Map<String, dynamic>? _extractDetails(dynamic body) {
    if (body is Map && body['errors'] is Map) {
      return Map<String, dynamic>.from(body['errors']);
    }
    return null;
  }
}

class _LogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    Environment.log('→ ${options.method} ${options.path}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    Environment.log('← ${response.statusCode} ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    Environment.log('✖ ${err.type} ${err.message}', tag: 'NET');
    handler.next(err);
  }
}
