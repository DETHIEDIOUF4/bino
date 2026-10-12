import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/location_service.dart';
import '../../widgets/address_search_field.dart';
import '../../widgets/map_picker.dart';

class CreateTripScreen extends StatefulWidget {
  const CreateTripScreen({super.key});

  @override
  State<CreateTripScreen> createState() => _CreateTripScreenState();
}

class _CreateTripScreenState extends State<CreateTripScreen> {
  LocationPoint? _departure;
  LocationPoint? _destination;
  int _seats = 3;
  int _waitMin = 5;
  bool _recurring = true;
  final _selectedDays = <int>{1, 2, 3, 4, 5};
  bool _loading = false;

  final _dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  Future<void> _pick(bool isDeparture) async {
    await Navigator.push(context, MaterialPageRoute(
      builder: (_) => MapPicker(
        title: isDeparture ? 'Départ' : 'Arrivée',
        initial: isDeparture ? _departure : _destination,
        onSelected: (p) => setState(() => isDeparture ? _departure = p : _destination = p),
      ),
    ));
  }

  Future<void> _create() async {
    if (_departure == null || _destination == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Indiquez le départ et l\'arrivée')));
      return;
    }
    setState(() => _loading = true);
    try {
      final departure = DateTime.now().add(const Duration(hours: 1));
      await context.read<AuthProvider>().api.post('/trips', {
        'departure': _departure!.toJson(),
        'arrival': _destination!.toJson(),
        'departureTime': departure.toIso8601String(),
        'availableSeats': _seats,
        'maxWaitMinutes': _waitMin,
        'isRecurring': _recurring,
        'recurringDays': _recurring ? _selectedDays.toList() : [],
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trajet publié!')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Proposer un trajet')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Point de départ', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 10),
            AddressSearchField(
              key: ValueKey('dep-${_departure?.label}'),
              label: 'Départ',
              icon: Icons.trip_origin,
              iconColor: AppColors.primary,
              initial: _departure,
              onChanged: (p) => setState(() => _departure = p),
              onMapTap: () => _pick(true),
            ),
            const SizedBox(height: 16),
            const Text('Point d\'arrivée', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 10),
            AddressSearchField(
              key: ValueKey('arr-${_destination?.label}'),
              label: 'Arrivée',
              icon: Icons.place,
              iconColor: AppColors.danger,
              initial: _destination,
              onChanged: (p) => setState(() => _destination = p),
              onMapTap: () => _pick(false),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () async {
                final loc = await LocationService.getCurrentLocation();
                if (loc != null) setState(() => _departure = loc);
              },
              icon: const Icon(Icons.my_location),
              label: const Text('Départ = ma position actuelle'),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                const Text('Places'),
                const SizedBox(width: 12),
                DropdownButton<int>(value: _seats, items: List.generate(7, (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}'))).toList(), onChanged: (v) => setState(() => _seats = v!)),
                const Spacer(),
                const Text('Attente'),
                DropdownButton<int>(value: _waitMin, items: [5, 10, 15, 20].map((n) => DropdownMenuItem(value: n, child: Text('$n min'))).toList(), onChanged: (v) => setState(() => _waitMin = v!)),
              ],
            ),
            SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Trajet récurrent'), value: _recurring, onChanged: (v) => setState(() => _recurring = v)),
            if (_recurring)
              Wrap(
                spacing: 8,
                children: List.generate(7, (i) => FilterChip(
                  label: Text(_dayLabels[i]),
                  selected: _selectedDays.contains(i),
                  selectedColor: AppColors.primaryLight,
                  onSelected: (v) => setState(() => v ? _selectedDays.add(i) : _selectedDays.remove(i)),
                )),
              ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _loading ? null : _create,
              child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Publier le trajet'),
            ),
          ],
        ),
      ),
    );
  }
}
