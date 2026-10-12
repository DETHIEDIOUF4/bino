import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/ui_components.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic> _upcoming = [];
  Map<String, dynamic>? _activeBooking;
  int _driverPendingCount = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final socket = context.read<AuthProvider>().socket;
      socket.onNotification((_) {
        if (mounted) _load();
      });
      socket.onBookingStatus((_) {
        if (mounted) _load();
      });
    });
  }

  Map<String, dynamic>? _pickActiveBooking(List bookings) {
    const priority = ['in_progress', 'confirmed', 'pending'];
    for (final status in priority) {
      for (final b in bookings) {
        if (b['status'] == status) return b as Map<String, dynamic>;
      }
    }
    return null;
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    if (auth.user?.role == 'admin') {
      setState(() => _loading = false);
      return;
    }
    try {
      final statsRes = await auth.api.get('/users/me/stats');
      final bookingsRes = await auth.api.get('/bookings/my');
      final bookings = bookingsRes['data'] as List;
      final active = bookings.where((b) => b['status'] != 'completed' && b['status'] != 'cancelled').toList();

      int driverPending = 0;
      if (auth.user?.isApprovedDriver == true) {
        try {
          final reqRes = await auth.api.get('/bookings/driver/requests');
          final requests = reqRes['data'] as List;
          driverPending = requests.where((r) => r['status'] == 'pending').length;
        } catch (_) {}
      }

      setState(() {
        _stats = statsRes['data'] as Map<String, dynamic>;
        _upcoming = active.take(3).toList();
        _activeBooking = _pickActiveBooking(active);
        _driverPendingCount = driverPending;
      });
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user!;
    final isAdmin = user.role == 'admin';
    final canUseApp = user.isPassenger || user.isDriver;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          color: AppColors.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 110),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Header(user: user, onNotifications: () => context.push('/notifications')),
                const SizedBox(height: 20),

                if (isAdmin) ...[
                  _AdminNotice(
                    onRegister: () => context.go('/register'),
                    onLogout: () async {
                      await context.read<AuthProvider>().logout();
                      if (context.mounted) context.go('/login');
                    },
                  ),
                  const SizedBox(height: 20),
                ],

                _HeroCard(
                  user: user,
                  onSearch: canUseApp ? () => context.push('/search') : null,
                  onCreate: user.isApprovedDriver ? () => context.push('/create-trip') : null,
                ),
                const SizedBox(height: 16),

                if (_activeBooking != null && canUseApp)
                  _ActiveTripBanner(
                    booking: _activeBooking!,
                    onTap: () => context.push('/booking/${_activeBooking!['_id']}'),
                    onTrack: () {
                      final tripId = _activeBooking!['trip']?['_id'];
                      final bookingId = _activeBooking!['_id'];
                      if (tripId != null) {
                        context.push('/tracking/$tripId/passenger?bookingId=$bookingId');
                      }
                    },
                  ),
                if (_activeBooking != null && canUseApp) const SizedBox(height: 12),

                if (user.isApprovedDriver && _driverPendingCount > 0) ...[
                  _DriverRequestsBanner(
                    count: _driverPendingCount,
                    onTap: () => context.push('/driver-requests'),
                  ),
                  const SizedBox(height: 12),
                ],

                const SizedBox(height: 4),

                if (_stats != null) ...[
                  Row(
                    children: [
                      StatChip(icon: Icons.route, label: 'Trajets', value: '${_stats!['tripCount'] ?? user.tripCount}'),
                      const SizedBox(width: 10),
                      StatChip(icon: Icons.star, label: 'Note', value: '${(_stats!['rating'] ?? user.rating).toStringAsFixed(1)}'),
                      const SizedBox(width: 10),
                      StatChip(icon: Icons.eco, label: 'CO₂', value: '${_stats!['co2SavedKg'] ?? 0} kg'),
                    ],
                  ),
                  const SizedBox(height: 20),
                ] else ...[
                  Row(
                    children: const [
                      StatChip(icon: Icons.eco, label: 'CO₂ évité', value: '0.18kg/km'),
                      SizedBox(width: 10),
                      StatChip(icon: Icons.savings_outlined, label: 'Économie', value: '~60%'),
                    ],
                  ),
                  const SizedBox(height: 20),
                ],

                if (canUseApp)
                  ActionCard(
                    icon: Icons.map_rounded,
                    title: 'Carte & géolocalisation',
                    subtitle: 'Choisissez départ et arrivée sur la carte',
                    color: const Color(0xFF0D9488),
                    badge: 'GPS',
                    onTap: () => context.push('/search'),
                  ),
                if (canUseApp) const SizedBox(height: 12),

                const Text('Actions rapides', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),

                if (user.isPassenger) ...[
                  ActionCard(
                    icon: Icons.search_rounded,
                    title: 'Trouver un covoiturage',
                    subtitle: 'Matching IA — départ, destination, horaire',
                    color: AppColors.primary,
                    badge: 'IA',
                    onTap: () => context.push('/search'),
                  ),
                  const SizedBox(height: 12),
                ],

                if (user.isDriver) ...[
                  ActionCard(
                    icon: Icons.directions_car_filled,
                    title: user.isApprovedDriver ? 'Demandes passagers' : 'Compte en validation',
                    subtitle: user.isApprovedDriver
                        ? 'Acceptez ou refusez les demandes'
                        : 'Votre permis est en cours de vérification admin',
                    color: user.isApprovedDriver ? const Color(0xFF2563EB) : AppColors.warning,
                    onTap: user.isApprovedDriver ? () => context.push('/driver-requests') : null,
                  ),
                  const SizedBox(height: 12),
                ],

                ActionCard(
                  icon: Icons.star_rounded,
                  title: 'Évaluations',
                  subtitle: 'Notez vos derniers trajets',
                  color: const Color(0xFFF59E0B),
                  onTap: () => context.push('/ratings'),
                ),
                const SizedBox(height: 12),

                ActionCard(
                  icon: Icons.route_outlined,
                  title: 'Mes trajets',
                  subtitle: 'Historique et trajets à venir',
                  color: const Color(0xFF6366F1),
                  onTap: () => context.go('/bookings'),
                ),

                if (_upcoming.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const Text('Prochains trajets', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  ..._upcoming.map((b) => _UpcomingTripCard(
                        booking: b,
                        onTap: () => context.push('/booking/${b['_id']}'),
                        onTrack: () {
                          final tripId = b['trip']?['_id'];
                          final bookingId = b['_id'];
                          if (tripId != null) {
                            context.push('/tracking/$tripId/passenger?bookingId=$bookingId');
                          }
                        },
                      )),
                ],

                if (_loading)
                  const Padding(
                    padding: EdgeInsets.only(top: 24),
                    child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final dynamic user;
  final VoidCallback onNotifications;
  const _Header({required this.user, required this.onNotifications});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 26,
          backgroundColor: AppColors.primaryLight,
          child: Text(
            '${user.firstName[0]}${user.lastName[0]}',
            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 18),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Bonjour 👋', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
              Text(user.firstName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              if (user.role == 'admin')
                const Text('Compte administrateur', style: TextStyle(color: AppColors.warning, fontSize: 12, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
        IconButton(
          onPressed: onNotifications,
          icon: const Icon(Icons.notifications_none_rounded),
          style: IconButton.styleFrom(
            backgroundColor: Colors.white,
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
        ),
      ],
    );
  }
}

class _AdminNotice extends StatelessWidget {
  final VoidCallback onRegister;
  final VoidCallback onLogout;
  const _AdminNotice({required this.onRegister, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFED7AA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.info_outline, color: AppColors.warning),
              SizedBox(width: 8),
              Text('Compte admin détecté', style: TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'L\'app mobile est faite pour les passagers et conducteurs. Utilisez l\'admin web pour gérer la plateforme, ou créez un compte test.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(onPressed: onRegister, child: const Text('Créer compte test')),
              ),
              const SizedBox(width: 8),
              OutlinedButton(onPressed: onLogout, child: const Text('Déconnexion')),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  final dynamic user;
  final VoidCallback? onSearch;
  final VoidCallback? onCreate;
  const _HeroCard({required this.user, this.onSearch, this.onCreate});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: AppTheme.heroGradient,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Covoiturage quotidien', style: TextStyle(color: Colors.white70, fontSize: 13)),
          const SizedBox(height: 6),
          const Text(
            'Partagez vos trajets,\néconomisez ensemble',
            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, height: 1.2),
          ),
          const SizedBox(height: 16),
          if (onSearch != null)
            ElevatedButton(
              onPressed: onSearch,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary),
              child: const Text('Rechercher un trajet'),
            ),
          if (onCreate != null) ...[
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: onCreate,
              style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white70)),
              child: const Text('Proposer un trajet'),
            ),
          ],
        ],
      ),
    );
  }
}

class _ActiveTripBanner extends StatelessWidget {
  final Map<String, dynamic> booking;
  final VoidCallback onTap;
  final VoidCallback onTrack;

  const _ActiveTripBanner({required this.booking, required this.onTap, required this.onTrack});

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'En attente de confirmation';
      case 'confirmed':
        return 'Conducteur en route';
      case 'in_progress':
        return 'Trajet en cours';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = booking['status']?.toString() ?? '';
    final pickup = booking['pickup']?['label']?.toString() ?? '';
    final dropoff = booking['dropoff']?['label']?.toString() ?? '';
    final driver = booking['trip']?['driver'];
    final isPending = status == 'pending';
    final canTrack = status == 'confirmed' || status == 'in_progress';

    final bgColor = isPending ? const Color(0xFFFFF7ED) : AppColors.primaryLight;
    final borderColor = isPending ? const Color(0xFFFED7AA) : AppColors.primary.withValues(alpha: 0.3);
    final accentColor = isPending ? AppColors.warning : AppColors.primary;

    return Material(
      color: bgColor,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isPending ? Icons.hourglass_top_rounded : Icons.directions_car_filled,
                  color: accentColor,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _statusLabel(status),
                      style: TextStyle(fontWeight: FontWeight.w700, color: accentColor, fontSize: 14),
                    ),
                    if (pickup.isNotEmpty)
                      Text(
                        '$pickup → $dropoff',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                    if (driver != null && !isPending)
                      Text(
                        'Avec ${driver['firstName']} ${driver['lastName']}',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                    if (isPending)
                      const Text(
                        'En attente de réponse du conducteur',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                  ],
                ),
              ),
              if (canTrack)
                IconButton(
                  icon: const Icon(Icons.map_rounded, color: AppColors.primary),
                  onPressed: onTrack,
                  tooltip: 'Suivre',
                )
              else
                Icon(Icons.chevron_right, color: accentColor),
            ],
          ),
        ),
      ),
    );
  }
}

class _DriverRequestsBanner extends StatelessWidget {
  final int count;
  final VoidCallback onTap;

  const _DriverRequestsBanner({required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFEFF6FF),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFBFDBFE)),
          ),
          child: Row(
            children: [
              const Icon(Icons.inbox_rounded, color: Color(0xFF2563EB)),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '$count demande${count > 1 ? 's' : ''} passager${count > 1 ? 's' : ''} en attente',
                  style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF2563EB)),
                ),
              ),
              const Icon(Icons.chevron_right, color: Color(0xFF2563EB)),
            ],
          ),
        ),
      ),
    );
  }
}

class _UpcomingTripCard extends StatelessWidget {
  final Map<String, dynamic> booking;
  final VoidCallback onTap;
  final VoidCallback onTrack;
  const _UpcomingTripCard({required this.booking, required this.onTap, required this.onTrack});

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'in_progress':
        return 'En cours';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final trip = booking['trip'];
    final status = booking['status']?.toString() ?? '';
    final pickup = booking['pickup']?['label']?.toString() ?? trip?['departure']?['label'] ?? 'Trajet';
    final time = booking['requestedTime'] != null
        ? DateFormat('HH:mm').format(DateTime.parse(booking['requestedTime']))
        : '';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: status == 'pending' ? const Color(0xFFFFF7ED) : AppColors.primaryLight,
          child: Icon(
            status == 'pending' ? Icons.hourglass_top : Icons.directions_car,
            color: status == 'pending' ? AppColors.warning : AppColors.primary,
            size: 20,
          ),
        ),
        title: Text(pickup, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text('${booking['fareAmount']}\$ · ${_statusLabel(status)}${time.isNotEmpty ? ' · $time' : ''}'),
        trailing: (status == 'confirmed' || status == 'in_progress')
            ? IconButton(icon: const Icon(Icons.map, color: AppColors.primary), onPressed: onTrack)
            : const Icon(Icons.chevron_right, size: 20),
      ),
    );
  }
}
