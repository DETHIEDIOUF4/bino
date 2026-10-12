import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../services/payment_service.dart';
import '../services/notification_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final SocketService _socket = SocketService();

  UserModel? _user;
  String? _token;
  bool _loading = false;
  String? _error;

  UserModel? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null;
  bool get loading => _loading;
  String? get error => _error;
  ApiService get api => _api;
  SocketService get socket => _socket;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    if (_token != null) {
      _api.setToken(_token);
      try {
        await fetchProfile();
        _socket.connect(_token!);
        await PaymentService.init(_api);
        await _initPush();
      } catch (_) {
        await logout();
      }
    }
    notifyListeners();
  }

  Future<void> _initPush() async {
    await NotificationService.init(onToken: (token) async {
      try {
        await _api.patch('/users/me', {'fcmToken': token});
      } catch (_) {}
    });
  }

  Future<bool> login(String email, String password) async {
    _setLoading(true);
    try {
      final res = await _api.post('/auth/login', {'email': email, 'password': password});
      await _saveSession(res['data']['token'], res['data']['user']);
      await PaymentService.init(_api);
      await _initPush();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> register(Map<String, dynamic> data) async {
    _setLoading(true);
    try {
      final res = await _api.post('/auth/register', data);
      await _saveSession(res['data']['token'], res['data']['user']);
      await PaymentService.init(_api);
      await _initPush();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchProfile() async {
    final res = await _api.get('/users/me');
    _user = UserModel.fromJson(res['data']);
    notifyListeners();
  }

  Future<bool> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    _setLoading(true);
    try {
      final body = <String, dynamic>{};
      if (firstName != null) body['firstName'] = firstName;
      if (lastName != null) body['lastName'] = lastName;
      if (phone != null) body['phone'] = phone;

      final res = await _api.patch('/users/me', body);
      _user = UserModel.fromJson(res['data']);
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateDriverInfo({
    required String licenseNumber,
    required String brand,
    required String model,
    required String licensePlate,
    required int seats,
    String color = 'Non spécifié',
    int? year,
  }) async {
    _setLoading(true);
    try {
      final res = await _api.patch('/users/me', {
        'driverLicenseNumber': licenseNumber,
        'vehicle': {
          'brand': brand,
          'model': model,
          'year': year ?? DateTime.now().year,
          'color': color,
          'licensePlate': licensePlate.toUpperCase(),
          'seats': seats,
        },
      });
      _user = UserModel.fromJson(res['data']);
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> becomeDriver({
    required String licenseNumber,
    required String brand,
    required String model,
    required String licensePlate,
    required int seats,
    String color = 'Non spécifié',
    int? year,
  }) async {
    _setLoading(true);
    try {
      final res = await _api.patch('/users/me', {
        'becomeDriver': true,
        'driverLicenseNumber': licenseNumber,
        'vehicle': {
          'brand': brand,
          'model': model,
          'year': year ?? DateTime.now().year,
          'color': color,
          'licensePlate': licensePlate.toUpperCase(),
          'seats': seats,
        },
      });
      _user = UserModel.fromJson(res['data']);
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    _socket.disconnect();
    _token = null;
    _user = null;
    _api.setToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    notifyListeners();
  }

  Future<void> _saveSession(String token, Map<String, dynamic> userJson) async {
    _token = token;
    _user = UserModel.fromJson(userJson);
    _api.setToken(token);
    _socket.connect(token);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    notifyListeners();
  }

  void _setLoading(bool value) {
    _loading = value;
    _error = null;
    notifyListeners();
  }
}
