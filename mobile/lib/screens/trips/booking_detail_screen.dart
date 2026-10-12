import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/payment_service.dart';

class BookingDetailScreen extends StatefulWidget {
  final String bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  Map<String, dynamic>? _booking;
  Map<String, dynamic>? _payment;
  String? _trackUrl;
  bool _loading = true;
  bool _paying = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await context.read<AuthProvider>().api.get('/bookings/${widget.bookingId}');
      final data = res['data'] as Map<String, dynamic>;
      setState(() {
        _booking = data['booking'] as Map<String, dynamic>;
        _payment = data['payment'] as Map<String, dynamic>?;
        _trackUrl = data['trackUrl']?.toString();
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
    setState(() => _loading = false);
  }

  Future<void> _pay() async {
    setState(() => _paying = true);
    try {
      final paid = await PaymentService.payBooking(context.read<AuthProvider>().api, widget.bookingId);
      if (paid && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Paiement confirmé !')));
        await _load();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
    setState(() => _paying = false);
  }

  Future<void> _callDriver(String? phone) async {
    if (phone == null || phone.isEmpty) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé — conducteur en route';
      case 'in_progress':
        return 'En cours — passager à bord';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.primary)));
    }

    if (_booking == null) {
      return const Scaffold(body: Center(child: Text('Réservation introuvable')));
    }

    final trip = _booking!['trip'] as Map<String, dynamic>?;
    final driver = trip?['driver'] as Map<String, dynamic>?;
    final pickup = _booking!['pickup'] as Map<String, dynamic>?;
    final dropoff = _booking!['dropoff'] as Map<String, dynamic>?;
    final status = _booking!['status']?.toString() ?? '';
    final tripId = trip?['_id']?.toString();
    final user = context.read<AuthProvider>().user;
    final isDriver = user?.id == driver?['_id']?.toString();

    final requestedTime = _booking!['requestedTime'] != null
        ? DateFormat('HH:mm · d MMM', 'fr_CA').format(DateTime.parse(_booking!['requestedTime']))
        : null;

    return Scaffold(
      appBar: AppBar(title: const Text('Détails du trajet')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _statusLabel(status),
                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ),
            const SizedBox(height: 20),
            if (driver != null) ...[
              const Text('Conducteur', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              const SizedBox(height: 10),
              Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.primaryLight,
                    child: Text(
                      (driver['firstName']?.toString() ?? '?')[0],
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text('${driver['firstName']} ${driver['lastName']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text('★ ${(driver['rating'] ?? 0).toStringAsFixed(1)} · ${driver['phone'] ?? ''}'),
                  trailing: driver['phone'] != null
                      ? IconButton(
                          icon: const Icon(Icons.phone, color: AppColors.primary),
                          onPressed: () => _callDriver(driver['phone']?.toString()),
                        )
                      : null,
                ),
              ),
              if (driver['vehicle'] != null) ...[
                const SizedBox(height: 8),
                Text(
                  '${driver['vehicle']['brand']} ${driver['vehicle']['model']} · ${driver['vehicle']['color']} · ${driver['vehicle']['licensePlate']}',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
              ],
              const SizedBox(height: 20),
            ],
            const Text('Itinéraire', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 10),
            _PointRow(icon: Icons.trip_origin, color: AppColors.primary, label: 'Prise en charge', value: pickup?['label']?.toString() ?? '—'),
            const SizedBox(height: 8),
            _PointRow(icon: Icons.place, color: AppColors.danger, label: 'Destination', value: dropoff?['label']?.toString() ?? '—'),
            if (requestedTime != null) ...[
              const SizedBox(height: 16),
              _PointRow(icon: Icons.schedule, color: AppColors.warning, label: 'Heure souhaitée', value: requestedTime),
            ],
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Contribution', style: TextStyle(fontWeight: FontWeight.w600)),
                  Text('${_booking!['fareAmount']}\$', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppColors.primary)),
                ],
              ),
            ),
            if (_payment != null) ...[
              const SizedBox(height: 8),
              Text(
                _payment!['status'] == 'completed'
                    ? 'Paiement effectué'
                    : PaymentService.stripeEnabled
                        ? 'Paiement en ligne disponible'
                        : 'À régler directement avec le conducteur',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
            ],
            const SizedBox(height: 24),
            if (!isDriver && status == 'confirmed' && _payment?['status'] == 'pending' && PaymentService.stripeEnabled)
              ElevatedButton(
                onPressed: _paying ? null : _pay,
                child: _paying
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('Payer ${_booking!['fareAmount']}\$'),
              ),
            if (_trackUrl != null && !isDriver) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: _trackUrl!));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Lien de suivi web copié')),
                  );
                },
                icon: const Icon(Icons.link),
                label: const Text('Copier le lien suivi web'),
              ),
            ],
            if (tripId != null && (status == 'confirmed' || status == 'in_progress')) ...[
              if (!isDriver && status == 'confirmed' && PaymentService.stripeEnabled) const SizedBox(height: 10),
              ElevatedButton.icon(
                onPressed: () => context.push(
                  '/tracking/$tripId/${isDriver ? 'driver' : 'passenger'}?bookingId=${widget.bookingId}',
                ),
                icon: const Icon(Icons.map),
                label: Text(isDriver ? 'Suivi & prise en charge' : 'Suivre le conducteur'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PointRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String value;

  const _PointRow({required this.icon, required this.color, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
              Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }
}
