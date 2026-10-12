import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import '../core/config/app_config.dart';

class NotificationService {
  static Future<void> init({Future<void> Function(String token)? onToken}) async {
    if (!AppConfig.firebaseEnabled) return;

    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      final token = await messaging.getToken();
      if (token != null && onToken != null) await onToken(token);

      FirebaseMessaging.onMessage.listen((msg) {
        debugPrint('FCM: ${msg.notification?.title}');
      });
    } catch (e) {
      debugPrint('Firebase non configuré: $e');
    }
  }
}
