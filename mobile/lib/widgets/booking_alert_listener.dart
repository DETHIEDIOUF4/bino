import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class BookingAlertListener extends StatefulWidget {
  final Widget? child;
  const BookingAlertListener({super.key, required this.child});

  @override
  State<BookingAlertListener> createState() => _BookingAlertListenerState();
}

class _BookingAlertListenerState extends State<BookingAlertListener> {
  final Set<String> _shown = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _listen());
  }

  void _listen() {
    final socket = context.read<AuthProvider>().socket;
    socket.onNotification(_handleNotification);
    socket.onBookingStatus(_handleBookingStatus);
  }

  void _handleNotification(dynamic data) {
    if (!mounted) return;
    final type = data['type']?.toString();
    final id = data['id']?.toString() ?? data['relatedBooking']?.toString();
    if (id != null && _shown.contains(id)) return;

    if (type == 'booking_accepted') {
      if (id != null) _shown.add(id);
      _showAcceptedDialog(data);
    } else if (type == 'trip_started') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(data['message']?.toString() ?? 'Votre conducteur vous a pris en charge !'),
          action: SnackBarAction(
            label: 'Suivre',
            onPressed: () {
              final bookingId = data['relatedBooking']?.toString() ?? data['data']?['bookingId']?.toString();
              final tripId = data['relatedTrip']?.toString() ?? data['data']?['tripId']?.toString();
              if (tripId != null) {
                context.push('/tracking/$tripId/passenger${bookingId != null ? '?bookingId=$bookingId' : ''}');
              }
            },
          ),
        ),
      );
    }
  }

  void _handleBookingStatus(dynamic data) {
    if (!mounted) return;
    final status = data['status']?.toString();
    if (status == 'in_progress') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passager à bord — trajet en cours')),
      );
    }
  }

  void _showAcceptedDialog(dynamic data) {
    final extra = data['data'] as Map<String, dynamic>? ?? {};
    final driverName = extra['driverName']?.toString() ?? 'Votre conducteur';
    final pickup = extra['pickup']?['label']?.toString() ?? '';
    final dropoff = extra['dropoff']?['label']?.toString() ?? '';
    final bookingId = data['relatedBooking']?.toString() ?? extra['bookingId']?.toString();
    final tripId = data['relatedTrip']?.toString() ?? extra['tripId']?.toString();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Demande acceptée !'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$driverName a accepté votre demande.'),
            if (pickup.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Prise en charge : $pickup', style: const TextStyle(fontSize: 13)),
            ],
            if (dropoff.isNotEmpty)
              Text('Destination : $dropoff', style: const TextStyle(fontSize: 13)),
            const SizedBox(height: 8),
            const Text('Le conducteur est en route vers vous.', style: TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Plus tard')),
          if (bookingId != null)
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.push('/booking/$bookingId');
              },
              child: const Text('Voir détails'),
            ),
          if (tripId != null)
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.push('/tracking/$tripId/passenger${bookingId != null ? '?bookingId=$bookingId' : ''}');
              },
              child: const Text('Suivre'),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) => widget.child ?? const SizedBox.shrink();
}
