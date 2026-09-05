class AppFailure implements Exception {
  final String message;
  final int? statusCode;
  final String? code;
  final Map<String, dynamic>? details;

  AppFailure(this.message, {this.statusCode, this.code, this.details});

  @override
  String toString() => 'AppFailure($statusCode, $code, $message)';
}

class NetworkFailure extends AppFailure {
  NetworkFailure([String? message])
      : super(message ?? "You're offline. Please check your connection.",
            code: 'network');
}

class ServerFailure extends AppFailure {
  ServerFailure([String? message])
      : super(message ?? 'Campus2Career is temporarily unavailable. Please try again.',
            code: 'server');
}

class AuthFailure extends AppFailure {
  AuthFailure([String? message])
      : super(message ?? 'Your session has expired. Please log in again.',
            code: 'auth', statusCode: 401);
}

class ValidationFailure extends AppFailure {
  ValidationFailure(super.message, {super.details, super.statusCode})
      : super(code: 'validation');
}

class NotFoundFailure extends AppFailure {
  NotFoundFailure([String? message])
      : super(message ?? 'Resource not found.', code: 'not_found', statusCode: 404);
}
