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

  Future<T> put<T>(String path, {dynamic body, T Function(dynamic)? parse}) async {
    return _request(() => _client.dio.put(path, data: body), parse);
  }

  Future<T> patch<T>(String path, {dynamic body, T Function(dynamic)? parse}) async {
    return _request(() => _client.dio.patch(path, data: body), parse);
  }

  Future<T> delete<T>(String path, {T Function(dynamic)? parse}) async {
    return _request(() => _client.dio.delete(path), parse);
  }

  Future<T> _request<T>(Future<Response> Function() fn, T Function(dynamic)? parse) async {
    try {
      final res = await fn();
      if (res.statusCode == 401) {
        throw AuthFailure(_extractMessage(res.data));
      }
      final code = res.statusCode ?? 0;
      if (code >= 400) {
        final msg = _extractMessage(res.data) ?? 'Request failed';
        throw ServerFailure(msg);
      }
      final data = res.data;
      if (parse != null) return parse(data);
      return data as T;
    } on DioException catch (e) {
      final err = e.error;
      if (err is AppFailure) throw err;
      throw ServerFailure();
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw ServerFailure();
    }
  }

  String _extractMessage(dynamic body) {
    if (body is Map) {
      final m = body['message'];
      if (m is String && m.isNotEmpty) return m;
    }
    return 'Request failed';
  }
}
