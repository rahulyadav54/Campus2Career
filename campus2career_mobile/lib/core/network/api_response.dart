class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? statusCode;
  final Map<String, dynamic>? raw;

  const ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.statusCode,
    this.raw,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic) parse, {
    int? statusCode,
  }) {
    final data = parse(json['data'] ?? json);
      return ApiResponse(
        success: json['success'] == true || (statusCode != null && statusCode < 400),
        data: data,
        message: json['message'] as String?,
        statusCode: statusCode,
        raw: json,
      );
  }
}
