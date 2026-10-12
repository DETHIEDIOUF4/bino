import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  List<dynamic> _bookings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await context.read<AuthProvider>().api.get('/bookings/my');
      setState(() => _bookings = res['data'] as List);
    } catch (_) {}
    setState(() => _loading = false);
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'confirmed':
      case 'in_progress':
        return AppColors.primary;
      case 'pending':
        return AppColors.warning;
      case 'completed':
        return AppColors.accent;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes trajets')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _bookings.isEmpty
              ? const Center(child: Text('Aucun trajet réservé', style: TextStyle(color: AppColors.textMuted)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: _bookings.length,
                    itemBuilder: (_, i) {
                      final b = _bookings[i];
                      final trip = b['trip'] as Map<String, dynamic>?;
                      final driver = trip?['driver'] as Map<String, dynamic>?;
                      final status = b['status']?.toString() ?? '';
                      final pickup = b['pickup']?['label']?.toString() ?? '';
                      final dropoff = b['dropoff']?['label']?.toString() ?? '';
                      final time = b['requestedTime'] != null
                          ? DateFormat('HH:mm', 'fr_CA').format(DateTime.parse(b['requestedTime']))
                          : '';

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () => context.push('/booking/${b['_id']}'),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        driver != null ? '${driver['firstName']} ${driver['lastName']}' : 'Trajet',
                                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _statusColor(status).withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        _statusLabel(status),
                                        style: TextStyle(color: _statusColor(status), fontSize: 12, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                if (pickup.isNotEmpty) Text('📍 $pickup', style: const TextStyle(fontSize: 13)),
                                if (dropoff.isNotEmpty) Text('🏁 $dropoff', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Text('${b['fareAmount']}\$', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary)),
                                    if (time.isNotEmpty) ...[
                                      const Text(' · ', style: TextStyle(color: AppColors.textMuted)),
                                      Text(time, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                                    ],
                                    const Spacer(),
                                    if (status == 'confirmed' || status == 'in_progress')
                                      IconButton(
                                        icon: const Icon(Icons.map, color: AppColors.primary),
                                        onPressed: () => context.push(
                                          '/tracking/${trip!['_id']}/passenger?bookingId=${b['_id']}',
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
