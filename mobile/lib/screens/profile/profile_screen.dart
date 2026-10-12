import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import 'become_driver_screen.dart';
import 'edit_driver_info_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _firstName;
  late TextEditingController _lastName;
  late TextEditingController _phone;
  bool _editing = false;

  @override
  void initState() {
    super.initState();
    _initControllers();
  }

  void _initControllers() {
    final user = context.read<AuthProvider>().user!;
    _firstName = TextEditingController(text: user.firstName);
    _lastName = TextEditingController(text: user.lastName);
    _phone = TextEditingController(text: user.phone);
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    final ok = await context.read<AuthProvider>().updateProfile(
          firstName: _firstName.text.trim(),
          lastName: _lastName.text.trim(),
          phone: _phone.text.trim(),
        );

    if (!mounted) return;

    if (ok) {
      setState(() => _editing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profil mis à jour')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<AuthProvider>().error ?? 'Erreur')),
      );
    }
  }

  void _cancelEdit() {
    final user = context.read<AuthProvider>().user!;
    setState(() {
      _editing = false;
      _firstName.text = user.firstName;
      _lastName.text = user.lastName;
      _phone.text = user.phone;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user!;
    final loading = auth.loading;

    final showBecomeDriver = user.role != 'admin' &&
        ((user.role == 'passenger' && user.driverStatus == 'none') || user.driverStatus == 'rejected');

    final isDriverAccount = user.isDriver || user.driverStatus != 'none';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon profil'),
        actions: [
          if (!_editing)
            TextButton(
              onPressed: () => setState(() => _editing = true),
              child: const Text('Modifier', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _ProfileHeader(user: user),
                const SizedBox(height: 24),

                _SectionTitle(_editing ? 'Modifier mes informations' : 'Mes informations'),
                Form(
                  key: _formKey,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          if (_editing) ...[
                            TextFormField(
                              controller: _firstName,
                              decoration: const InputDecoration(labelText: 'Prénom', prefixIcon: Icon(Icons.person_outline)),
                              validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _lastName,
                              decoration: const InputDecoration(labelText: 'Nom'),
                              validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _phone,
                              decoration: const InputDecoration(labelText: 'Téléphone', prefixIcon: Icon(Icons.phone_outlined)),
                              keyboardType: TextInputType.phone,
                              validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
                            ),
                            const SizedBox(height: 8),
                            TextFormField(
                              initialValue: user.email,
                              readOnly: true,
                              decoration: const InputDecoration(
                                labelText: 'Courriel',
                                prefixIcon: Icon(Icons.email_outlined),
                                helperText: 'Le courriel ne peut pas être modifié',
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(onPressed: loading ? null : _cancelEdit, child: const Text('Annuler')),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: loading ? null : _saveProfile,
                                    child: loading
                                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                        : const Text('Enregistrer'),
                                  ),
                                ),
                              ],
                            ),
                          ] else ...[
                            _InfoTile(icon: Icons.person_outline, label: 'Prénom', value: user.firstName),
                            _InfoTile(icon: Icons.person_outline, label: 'Nom', value: user.lastName),
                            _InfoTile(icon: Icons.email_outlined, label: 'Courriel', value: user.email),
                            _InfoTile(icon: Icons.phone_outlined, label: 'Téléphone', value: user.phone),
                            _InfoTile(icon: Icons.badge_outlined, label: 'Rôle', value: _roleLabel(user.role)),
                            if (user.driverStatus != 'none')
                              _InfoTile(
                                icon: Icons.verified_user_outlined,
                                label: 'Statut conducteur',
                                value: _driverStatusLabel(user.driverStatus),
                                valueColor: _statusColor(user.driverStatus),
                              ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),

                // Section passager → conducteur
                if (user.role != 'admin') ...[
                  const SizedBox(height: 24),
                  _SectionTitle('Compte conducteur'),
                  if (showBecomeDriver)
                    _ActionCard(
                      icon: Icons.directions_car_filled,
                      title: 'Devenir conducteur',
                      subtitle: user.driverStatus == 'rejected'
                          ? 'Votre demande a été refusée — soumettez à nouveau'
                          : 'Ajoutez votre permis et véhicule pour proposer des trajets',
                      color: AppColors.primary,
                      onTap: () async {
                        await Navigator.push(context, MaterialPageRoute(builder: (_) => const BecomeDriverScreen()));
                        if (mounted) setState(() {});
                      },
                    )
                  else if (user.isApprovedDriver)
                    Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.check_circle, color: AppColors.primary),
                              SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Compte conducteur validé — vous pouvez proposer des trajets.',
                                  style: TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w500),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        _ActionCard(
                          icon: Icons.edit_road,
                          title: 'Modifier véhicule & permis',
                          subtitle: 'Mettez à jour vos informations conducteur',
                          color: const Color(0xFF2563EB),
                          onTap: () async {
                            await Navigator.push(context, MaterialPageRoute(builder: (_) => const EditDriverInfoScreen()));
                            if (mounted) setState(() {});
                          },
                        ),
                      ],
                    )
                  else if (isDriverAccount && user.driverStatus == 'pending')
                    Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF7ED),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFFED7AA)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.hourglass_top, color: AppColors.warning),
                              SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Demande en cours de validation par un administrateur.',
                                  style: TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.4),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        _ActionCard(
                          icon: Icons.edit_road,
                          title: 'Modifier véhicule & permis',
                          subtitle: 'Corriger vos informations avant validation',
                          color: AppColors.warning,
                          onTap: () async {
                            await Navigator.push(context, MaterialPageRoute(builder: (_) => const EditDriverInfoScreen()));
                            if (mounted) setState(() {});
                          },
                        ),
                      ],
                    ),
                ],

                if (user.vehicle != null) ...[
                  const SizedBox(height: 20),
                  _SectionTitle('Mon véhicule'),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
                            child: const Icon(Icons.directions_car, color: AppColors.primary, size: 28),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${user.vehicle!['brand']} ${user.vehicle!['model']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                                Text('${user.vehicle!['licensePlate']} · ${user.vehicle!['color'] ?? ''}', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                                Text('${user.vehicle!['seats']} places · ${user.vehicle!['year'] ?? ''}', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],

                if (user.driverLicenseNumber != null && user.driverLicenseNumber!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: _InfoTile(icon: Icons.badge_outlined, label: 'Permis de conduire', value: user.driverLicenseNumber!),
                    ),
                  ),
                ],

                const SizedBox(height: 24),
              ],
            ),
          ),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: ElevatedButton.icon(
              onPressed: () => _confirmLogout(context, auth),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFEE2E2),
                foregroundColor: AppColors.danger,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Se déconnecter', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, AuthProvider auth) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Déconnexion', style: TextStyle(color: AppColors.danger))),
        ],
      ),
    );
    if (confirm == true && context.mounted) {
      await auth.logout();
      if (context.mounted) context.go('/login');
    }
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'passenger': return 'Passager';
      case 'driver': return 'Conducteur';
      case 'both': return 'Passager & Conducteur';
      case 'admin': return 'Administrateur';
      default: return role;
    }
  }

  String _driverStatusLabel(String status) {
    switch (status) {
      case 'pending': return 'En attente de validation';
      case 'approved': return 'Validé ✓';
      case 'rejected': return 'Refusé';
      default: return '—';
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'approved': return AppColors.primary;
      case 'pending': return AppColors.warning;
      case 'rejected': return AppColors.danger;
      default: return AppColors.textMuted;
    }
  }
}

class _ProfileHeader extends StatelessWidget {
  final dynamic user;
  const _ProfileHeader({required this.user});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          children: [
            CircleAvatar(
              radius: 52,
              backgroundColor: AppColors.primaryLight,
              child: Text(
                '${user.firstName[0]}${user.lastName[0]}',
                style: const TextStyle(fontSize: 32, color: AppColors.primary, fontWeight: FontWeight.w800),
              ),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                child: const Icon(Icons.edit, color: Colors.white, size: 14),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Text(user.fullName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
        Text(user.email, style: const TextStyle(color: AppColors.textMuted)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(20)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.star, color: Colors.amber, size: 18),
              Text(' ${user.rating.toStringAsFixed(1)} · ${user.tripCount} trajets', style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoTile({required this.icon, required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.textMuted),
          const SizedBox(width: 12),
          SizedBox(width: 110, child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 14))),
          Expanded(child: Text(value, style: TextStyle(fontWeight: FontWeight.w600, color: valueColor ?? AppColors.text))),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({required this.icon, required this.title, required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 12, height: 1.3)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
