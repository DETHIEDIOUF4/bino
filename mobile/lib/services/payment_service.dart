import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import '../services/api_service.dart';

class PaymentService {
  static bool stripeEnabled = false;
  static String? publishableKey;

  static Future<void> init(ApiService api) async {
    try {
      final res = await api.get('/payments/config');
      final data = res['data'] as Map<String, dynamic>;
      stripeEnabled = data['stripeEnabled'] == true;
      publishableKey = data['publishableKey']?.toString();
      if (stripeEnabled && publishableKey != null && publishableKey!.isNotEmpty) {
        Stripe.publishableKey = publishableKey!;
        await Stripe.instance.applySettings();
      }
    } catch (_) {
      stripeEnabled = false;
    }
  }

  static Future<bool> payBooking(ApiService api, String bookingId) async {
    if (!stripeEnabled) return false;

    final res = await api.post('/payments/intent', {'bookingId': bookingId});
    final clientSecret = res['data']['clientSecret']?.toString();
    if (clientSecret == null) return false;

    await Stripe.instance.initPaymentSheet(
      paymentSheetParameters: SetupPaymentSheetParameters(
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'AidaFALL',
        style: ThemeMode.light,
      ),
    );
    await Stripe.instance.presentPaymentSheet();
    await api.post('/payments/confirm', {'bookingId': bookingId});
    return true;
  }
}
