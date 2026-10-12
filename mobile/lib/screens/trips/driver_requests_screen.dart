import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class DriverRequestsScreen extends StatefulWidget {
  const DriverRequestsScreen({super.key});

  @override
  State<DriverRequestsScreen> createState() => _DriverRequestsScreenState();
}

class _DriverRequestsScreenState extends State<DriverRequestsScreen> {
  List<dynamic> _requests = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await context.read<AuthProvider>().api.get('/bookings/driver/requests');
      setState(() => _requests = res['data'] as List);
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _accept(String id, String tripId) async {
    await context.read<AuthProvider>().api.patch('/bookings/$id/accept', {});
    _load();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Demande acceptée — en route vers le passager')));
      context.push('/tracking/$tripId/driver?bookingId=$id');
    }
  }

  Future<void> _reject(String id) async {
    await context.read<AuthProvider>().api.patch('/bookings/$id/reject', {});
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Demandes passagers')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _requests.isEmpty
              ? const Center(child: Text('Aucune demande pour le moment', style: TextStyle(color: AppColors.textMuted)))
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _requests.length,
                  itemBuilder: (_, i) {
                    final r = _requests[i];
                    final p = r['passenger'];
                    final isPending = r['status'] == 'pending';
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${p['firstName']} ${p['lastName']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                            Text('★ ${(p['rating'] ?? 0).toStringAsFixed(1)} · ${r['fareAmount']}\$', style: const TextStyle(color: AppColors.textMuted)),
                            if (r['pickup'] != null) ...[
                              const SizedBox(height: 8),
                              Text('📍 ${r['pickup']['label']}', style: const TextStyle(fontSize: 13)),
                            ],
                            if (r['dropoff'] != null)
                              Text('🏁 ${r['dropoff']['label']}', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                            if (r['requestedTime'] != null)
                              Text(
                                'Heure : ${DateFormat('HH:mm', 'fr_CA').format(DateTime.parse(r['requestedTime']))}',
                                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                              ),
                            const SizedBox(height: 12),
                            if (isPending)
                              Row(children: [
                                Expanded(child: ElevatedButton(onPressed: () => _accept(r['_id'], r['trip']['_id']), child: const Text('Accepter'))),
                                const SizedBox(width: 8),
                                Expanded(child: OutlinedButton(onPressed: () => _reject(r['_id']), child: const Text('Refuser'))),
                              ])
                            else
                              Text('Statut: ${r['status']}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
