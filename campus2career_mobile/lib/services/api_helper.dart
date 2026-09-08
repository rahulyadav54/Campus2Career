import 'package:dio/dio.dart';
import '../core/errors/failures.dart';
import '../core/network/api_client.dart';

class ApiHelper {
  final ApiClient _client;
  ApiHelper(this._client);

  Future<T> get<T>(String path, {Map<String, dynamic>? query, T Function(dynamic)? parse}) async {
    return _request(() => _client.dio.get(path, queryParameters: query), parse);
  }

  Future<T> post<T>(String path, {dynamic body, Map<String, dynamic>? query, T Function(dynamic)? parse}) async {
    return _request(() => _client.dio.post(path, data: body, queryParameters: query), parse);
  }

  Future<T> postMultipart<T>(
    String path, {
    required String fileField,
    required String filePath,
    String? filename,
    Map<String, String>? fields,
    T Function(dynamic)? parse,
  }) async {
    final form = FormData.fromMap({
      ...?fields,
      fileField: await MultipartFile.fromFile(filePath, filename: filename),
    });
    return _request(() => _client.dio.post(path, data: form), parse);
  }

  Future<T> put<T>(String path, {dynamic body, T Function(dynamic)? parse}) async {
    return _request(() => _client.dio.put(path, data: body), parse);
  }

  Future<T> patch<T>(String path, {dynamic body, T Function(dynamic)? parse}) async {
    return _request(() => _client.dio.patch(path, data: body), parse);
  }

  Future<T> delete<T>(String path, {T Function(dynamic)? parse}) async {
    return _request(() => _client.dio.delete(path), parse);
  }

  Future<String> getText(String path) async {
    try {
      final res = await _client.dio.get<String>(
        path,
        options: Options(responseType: ResponseType.plain, headers: {'Accept': 'text/html,text/plain,*/*'}),
      );
      if (res.statusCode == 401 || res.statusCode == 403) {
        throw AuthFailure(_extractMessage(res.data));
      }
      if ((res.statusCode ?? 0) >= 400) {
        throw ServerFailure(_extractMessage(res.data));
      }
      return res.data ?? '';
    } on DioException catch (e) {
      final err = e.error;
      if (err is AppFailure) throw err;
      throw ServerFailure();
    }
  }

  Future<T> _request<T>(Future<Response> Function() fn, T Function(dynamic)? parse) async {
    try {
      final res = await fn();
      if (res.statusCode == 401) {
        throw AuthFailure(_extractMessage(res.data));
      }
      final code = res.statusCode ?? 0;
      if (code == 401 || code == 403) {
        throw AuthFailure(_extractMessage(res.data));
      }
      if (code >= 400) {
        throw ServerFailure(_extractMessage(res.data));
      }
      final data = res.data;
      if (parse != null) return parse(data);
      return data as T;
    } on DioException catch (e) {
      final err = e.error;
      if (err is AppFailure) throw err;
      final body = e.response?.data;
      if (body != null) {
        throw ServerFailure(_extractMessage(body));
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw NetworkFailure();
      }
      throw ServerFailure();
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw ServerFailure();
    }
  }

  String _extractMessage(dynamic body) {
    if (body is Map) {
      final errors = body['errors'];
      if (errors is List && errors.isNotEmpty) {
        final first = errors.first;
        if (first is Map) {
          final msg = first['msg'] ?? first['message'];
          if (msg is String && msg.isNotEmpty) return msg;
        }
      }
      if (errors is Map && errors.isNotEmpty) {
        final first = errors.values.first;
        if (first is String && first.isNotEmpty) return first;
      }
      final m = body['message'];
      if (m is String && m.isNotEmpty) return m;
    }
    return 'Request failed';
  }
}
