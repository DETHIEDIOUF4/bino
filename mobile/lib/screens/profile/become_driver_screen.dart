import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class BecomeDriverScreen extends StatefulWidget {
  const BecomeDriverScreen({super.key});

  @override
  State<BecomeDriverScreen> createState() => _BecomeDriverScreenState();
}

class _BecomeDriverScreenState extends State<BecomeDriverScreen> {
  final _formKey = GlobalKey<FormState>();
  final _license = TextEditingController();
  final _brand = TextEditingController();
  final _model = TextEditingController();
  final _plate = TextEditingController();
  final _color = TextEditingController(text: 'Noir');
  int _seats = 4;
  int _year = DateTime.now().year;

  @override
  void dispose() {
    _license.dispose();
    _brand.dispose();
    _model.dispose();
    _plate.dispose();
    _color.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final ok = await context.read<AuthProvider>().becomeDriver(
          licenseNumber: _license.text.trim(),
          brand: _brand.text.trim(),
          model: _model.text.trim(),
          licensePlate: _plate.text.trim(),
          seats: _seats,
          color: _color.text.trim(),
          year: _year,
        );

    if (!mounted) return;

    if (ok) {
      await context.read<AuthProvider>().fetchProfile();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Demande envoyée! Votre compte conducteur sera validé par un admin.')),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<AuthProvider>().error ?? 'Erreur')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = context.watch<AuthProvider>().loading;

    return Scaffold(
      appBar: AppBar(title: const Text('Devenir conducteur')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: AppColors.primary),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Vous gardez votre compte passager. Après validation admin, vous pourrez proposer des trajets.',
                        style: TextStyle(fontSize: 13, color: AppColors.primary, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text('Permis de conduire', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 12),
              TextFormField(
                controller: _license,
                decoration: const InputDecoration(labelText: 'Numéro de permis', prefixIcon: Icon(Icons.badge_outlined)),
                validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
              ),
              const SizedBox(height: 24),
              const Text('Véhicule', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 12),
              TextFormField(
                controller: _brand,
                decoration: const InputDecoration(labelText: 'Marque', prefixIcon: Icon(Icons.directions_car)),
                validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _model,
                decoration: const InputDecoration(labelText: 'Modèle'),
                validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _plate,
                decoration: const InputDecoration(labelText: 'Plaque d\'immatriculation'),
                textCapitalization: TextCapitalization.characters,
                validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _color,
                decoration: const InputDecoration(labelText: 'Couleur'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Text('Places disponibles'),
                  const SizedBox(width: 12),
                  DropdownButton<int>(
                    value: _seats,
                    items: List.generate(7, (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}'))).toList(),
                    onChanged: (v) => setState(() => _seats = v!),
                  ),
                  const Spacer(),
                  const Text('Année'),
                  DropdownButton<int>(
                    value: _year,
                    items: List.generate(15, (i) {
                      final y = DateTime.now().year - i;
                      return DropdownMenuItem(value: y, child: Text('$y'));
                    }).toList(),
                    onChanged: (v) => setState(() => _year = v!),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: loading ? null : _submit,
                child: loading
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Soumettre pour validation'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
