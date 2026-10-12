import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/auth/auth_widgets.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _license = TextEditingController();
  final _brand = TextEditingController();
  final _model = TextEditingController();
  final _plate = TextEditingController();

  String _role = 'passenger';

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _license.dispose();
    _brand.dispose();
    _model.dispose();
    _plate.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    final data = <String, dynamic>{
      'firstName': _firstName.text.trim(),
      'lastName': _lastName.text.trim(),
      'email': _email.text.trim(),
      'phone': _phone.text.trim(),
      'password': _password.text,
      'role': _role,
    };

    if (_role == 'driver' || _role == 'both') {
      data['driverLicenseNumber'] = _license.text.trim();
      data['vehicle'] = <String, dynamic>{
        'brand': _brand.text.trim(),
        'model': _model.text.trim(),
        'year': DateTime.now().year,
        'color': 'Non spécifié',
        'licensePlate': _plate.text.trim().toUpperCase(),
        'seats': 4,
      };
    }

    final auth = context.read<AuthProvider>();
    final ok = await auth.register(data);
    if (!mounted) return;

    if (ok) {
      final msg = (_role == 'driver' || _role == 'both')
          ? 'Compte créé ! Votre profil conducteur est en attente de validation.'
          : 'Compte créé avec succès !';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating));
      context.go('/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Erreur'), behavior: SnackBarBehavior.floating),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = context.watch<AuthProvider>().loading;
    final isDriver = _role == 'driver' || _role == 'both';

    return Scaffold(
      body: AuthBackground(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => context.canPop() ? context.pop() : context.go('/login'),
                    icon: const Icon(Icons.arrow_back_rounded),
                    style: IconButton.styleFrom(backgroundColor: Colors.white),
                  ),
                  const Expanded(
                    child: Text(
                      'Créer un compte',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Rejoignez AidaFALL',
                        style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Choisissez votre profil et complétez vos informations',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 14),
                      ),
                      const SizedBox(height: 24),
                      const Text('Je suis…', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      const SizedBox(height: 10),
                      RoleCard(
                        value: 'passenger',
                        title: 'Passager',
                        subtitle: 'Je cherche un covoiturage',
                        icon: Icons.person_outline_rounded,
                        selected: _role == 'passenger',
                        onTap: () => setState(() => _role = 'passenger'),
                      ),
                      const SizedBox(height: 8),
                      RoleCard(
                        value: 'driver',
                        title: 'Conducteur',
                        subtitle: 'Je propose des trajets',
                        icon: Icons.directions_car_outlined,
                        selected: _role == 'driver',
                        onTap: () => setState(() => _role = 'driver'),
                      ),
                      const SizedBox(height: 8),
                      RoleCard(
                        value: 'both',
                        title: 'Les deux',
                        subtitle: 'Passager et conducteur',
                        icon: Icons.swap_horiz_rounded,
                        selected: _role == 'both',
                        onTap: () => setState(() => _role = 'both'),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: AuthTextField(
                                    controller: _firstName,
                                    label: 'Prénom',
                                    hint: 'Alex',
                                    icon: Icons.badge_outlined,
                                    validator: (v) => v!.isEmpty ? 'Requis' : null,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: AuthTextField(
                                    controller: _lastName,
                                    label: 'Nom',
                                    hint: 'Martin',
                                    icon: Icons.badge_outlined,
                                    validator: (v) => v!.isEmpty ? 'Requis' : null,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            AuthTextField(
                              controller: _email,
                              label: 'Courriel',
                              hint: 'vous@exemple.com',
                              icon: Icons.mail_outline_rounded,
                              keyboardType: TextInputType.emailAddress,
                              validator: (v) => v!.isEmpty ? 'Requis' : null,
                            ),
                            const SizedBox(height: 16),
                            AuthTextField(
                              controller: _phone,
                              label: 'Téléphone',
                              hint: '418 555 0100',
                              icon: Icons.phone_outlined,
                              keyboardType: TextInputType.phone,
                              validator: (v) => v!.isEmpty ? 'Requis' : null,
                            ),
                            const SizedBox(height: 16),
                            AuthTextField(
                              controller: _password,
                              label: 'Mot de passe',
                              hint: 'Min. 8 caractères',
                              icon: Icons.lock_outline_rounded,
                              obscure: true,
                              validator: (v) => v!.length < 8 ? 'Min. 8 caractères' : null,
                            ),
                          ],
                        ),
                      ),
                      if (isDriver) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.directions_car, color: AppColors.primary, size: 20),
                                  SizedBox(width: 8),
                                  Text('Informations conducteur', style: TextStyle(fontWeight: FontWeight.w700)),
                                ],
                              ),
                              const SizedBox(height: 16),
                              AuthTextField(
                                controller: _license,
                                label: 'N° permis de conduire',
                                hint: 'QC-123456',
                                icon: Icons.credit_card_outlined,
                                validator: (v) => isDriver && v!.isEmpty ? 'Requis' : null,
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: AuthTextField(
                                      controller: _brand,
                                      label: 'Marque',
                                      hint: 'Toyota',
                                      icon: Icons.directions_car_outlined,
                                      validator: (v) => isDriver && v!.isEmpty ? 'Requis' : null,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: AuthTextField(
                                      controller: _model,
                                      label: 'Modèle',
                                      hint: 'Corolla',
                                      icon: Icons.directions_car_outlined,
                                      validator: (v) => isDriver && v!.isEmpty ? 'Requis' : null,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              AuthTextField(
                                controller: _plate,
                                label: 'Plaque d\'immatriculation',
                                hint: 'ABC 123',
                                icon: Icons.pin_outlined,
                                validator: (v) => isDriver && v!.isEmpty ? 'Requis' : null,
                              ),
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFF7ED),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.info_outline, color: AppColors.warning, size: 18),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Votre profil sera validé par notre équipe avant de proposer des trajets.',
                                        style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      AuthPrimaryButton(label: 'Créer mon compte', loading: loading, onPressed: _register),
                      const SizedBox(height: 16),
                      AuthLinkRow(
                        text: 'Déjà un compte ?',
                        action: 'Se connecter',
                        onTap: () => context.go('/login'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
