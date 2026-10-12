import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class EditDriverInfoScreen extends StatefulWidget {
  const EditDriverInfoScreen({super.key});

  @override
  State<EditDriverInfoScreen> createState() => _EditDriverInfoScreenState();
}

class _EditDriverInfoScreenState extends State<EditDriverInfoScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _license;
  late final TextEditingController _brand;
  late final TextEditingController _model;
  late final TextEditingController _plate;
  late final TextEditingController _color;
  late int _seats;
  late int _year;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user!;
    final v = user.vehicle ?? {};
    _license = TextEditingController(text: user.driverLicenseNumber ?? '');
    _brand = TextEditingController(text: v['brand']?.toString() ?? '');
    _model = TextEditingController(text: v['model']?.toString() ?? '');
    _plate = TextEditingController(text: v['licensePlate']?.toString() ?? '');
    _color = TextEditingController(text: v['color']?.toString() ?? 'Noir');
    _seats = (v['seats'] as int?) ?? 4;
    _year = (v['year'] as int?) ?? DateTime.now().year;
  }

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

    final ok = await context.read<AuthProvider>().updateDriverInfo(
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Informations conducteur mises à jour')),
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
      appBar: AppBar(title: const Text('Modifier véhicule & permis')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _license,
                decoration: const InputDecoration(labelText: 'Numéro de permis', prefixIcon: Icon(Icons.badge_outlined)),
                validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
              ),
              const SizedBox(height: 16),
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
                decoration: const InputDecoration(labelText: 'Plaque'),
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
                  const Text('Places'),
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
                    : const Text('Enregistrer'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
