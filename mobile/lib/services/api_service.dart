import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/config/app_config.dart';

class ApiService {
  String? _token;

  void setToken(String? token) => _token = token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}$path'),
        headers: _headers,
        body: jsonEncode(body),
      );
      return _handleResponse(response);
    } on http.ClientException {
      throw ApiException(
        'Impossible de joindre le serveur. Vérifiez que le backend est démarré.',
        0,
      );
    }
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? query}) async {
    try {
      final uri = Uri.parse('${AppConfig.apiBaseUrl}$path').replace(queryParameters: query);
      final response = await http.get(uri, headers: _headers);
      return _handleResponse(response);
    } on http.ClientException {
      throw ApiException(
        'Impossible de joindre le serveur. Vérifiez que le backend est démarré.',
        0,
      );
    }
  }

  Future<Map<String, dynamic>> patch(String path, Map<String, dynamic> body) async {
    try {
      final response = await http.patch(
        Uri.parse('${AppConfig.apiBaseUrl}$path'),
        headers: _headers,
        body: jsonEncode(body),
      );
      return _handleResponse(response);
    } on http.ClientException {
      throw ApiException(
        'Impossible de joindre le serveur. Vérifiez que le backend est démarré.',
        0,
      );
    }
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.body.isEmpty) {
      throw ApiException(
        'Réponse vide du serveur (code ${response.statusCode}). Le backend est-il démarré ?',
        response.statusCode,
      );
    }

    Map<String, dynamic> data;
    try {
      data = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException(
        'Réponse invalide du serveur. Vérifiez l\'URL API : ${AppConfig.apiBaseUrl}',
        response.statusCode,
      );
    }

    if (response.statusCode >= 400) {
      throw ApiException(data['message']?.toString() ?? 'Erreur serveur', response.statusCode);
    }
    return data;
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}
