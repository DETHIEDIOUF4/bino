import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
    final socket = context.read<AuthProvider>().socket;
    socket.onNotification((data) {
      if (mounted) {
        setState(() => _notifications.insert(0, data));
      }
    });
  }

  Future<void> _load() async {
    try {
      final res = await context.read<AuthProvider>().api.get('/notifications');
      setState(() => _notifications = res['data'] as List);
    } catch (_) {}
    setState(() => _loading = false);
  }

  void _openNotification(dynamic n) {
    final type = n['type']?.toString();
    final bookingId = n['relatedBooking']?.toString() ?? n['data']?['bookingId']?.toString();
    final tripId = n['relatedTrip']?.toString() ?? n['data']?['tripId']?.toString();

    if (bookingId != null && (type == 'booking_accepted' || type == 'trip_started' || type == 'confirmation')) {
      context.push('/booking/$bookingId');
      return;
    }
    if (tripId != null && type == 'booking_accepted') {
      context.push('/tracking/$tripId/passenger${bookingId != null ? '?bookingId=$bookingId' : ''}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? const Center(child: Text('Aucune notification'))
              : ListView.builder(
                  itemCount: _notifications.length,
                  itemBuilder: (_, i) {
                    final n = _notifications[i];
                    return ListTile(
                      leading: const CircleAvatar(child: Icon(Icons.notifications)),
                      title: Text(n['title'] ?? ''),
                      subtitle: Text(n['message'] ?? ''),
                      onTap: () => _openNotification(n),
                    );
                  },
                ),
    );
  }
}
