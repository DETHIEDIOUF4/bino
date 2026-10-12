import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/config/app_config.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/location_service.dart';
import '../../widgets/address_search_field.dart';
import '../../widgets/map_picker.dart';
import '../../widgets/ui_components.dart';

class SearchTripScreen extends StatefulWidget {
  const SearchTripScreen({super.key});

  @override
  State<SearchTripScreen> createState() => _SearchTripScreenState();
}

class _SearchTripScreenState extends State<SearchTripScreen> {
  LocationPoint? _departure;
  LocationPoint? _destination;
  double _fare = 6.0;
  List<dynamic> _results = [];
  bool _searching = false;

  Future<void> _pickDeparture() async {
    await Navigator.push(context, MaterialPageRoute(
      builder: (_) => MapPicker(title: 'Point de départ', initial: _departure, onSelected: (p) => setState(() => _departure = p)),
    ));
  }

  Future<void> _pickDestination() async {
    await Navigator.push(context, MaterialPageRoute(
      builder: (_) => MapPicker(title: 'Destination', initial: _destination, onSelected: (p) => setState(() => _destination = p)),
    ));
  }

  Future<void> _useMyLocation() async {
    final loc = await LocationService.getCurrentLocation();
    if (loc != null) setState(() => _departure = loc);
  }

  Future<void> _search() async {
    if (_departure == null || _destination == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sélectionnez départ et destination')));
      return;
    }
    setState(() => _searching = true);
    try {
      final res = await context.read<AuthProvider>().api.get('/trips/search', query: {
        'lat': _departure!.lat.toString(),
        'lng': _departure!.lng.toString(),
        'destLat': _destination!.lat.toString(),
        'destLng': _destination!.lng.toString(),
        'date': DateTime.now().toIso8601String(),
        'timeFlexibility': '30',
      });
      setState(() => _results = res['data'] as List);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
    setState(() => _searching = false);
  }

  Future<void> _book(dynamic result) async {
    final trip = result['trip'];
    try {
      await context.read<AuthProvider>().api.post('/trips/${trip['_id']}/book', {
        'pickup': _departure!.toJson(),
        'dropoff': _destination!.toJson(),
        'requestedTime': DateTime.now().toIso8601String(),
        'timeFlexibilityMinutes': 15,
        'fareAmount': _fare,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Demande envoyée au conducteur!')));
        context.pop();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rechercher')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Où partez-vous ?', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 10),
            AddressSearchField(
              key: ValueKey('dep-${_departure?.label}'),
              label: 'Départ',
              icon: Icons.trip_origin,
              iconColor: AppColors.primary,
              initial: _departure,
              onChanged: (p) => setState(() => _departure = p),
              onMapTap: _pickDeparture,
            ),
            const SizedBox(height: 16),
            const Text('Où allez-vous ?', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 10),
            AddressSearchField(
              key: ValueKey('dest-${_destination?.label}'),
              label: 'Destination',
              icon: Icons.place,
              iconColor: AppColors.danger,
              initial: _destination,
              onChanged: (p) => setState(() => _destination = p),
              onMapTap: _pickDestination,
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _useMyLocation,
              icon: const Icon(Icons.my_location),
              label: const Text('Utiliser ma position actuelle'),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE2E8F0))),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Contribution : ${_fare.toStringAsFixed(2)} \$', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  Slider(value: _fare, min: AppConfig.minFare, max: AppConfig.maxFare, divisions: 59, activeColor: AppColors.primary, onChanged: (v) => setState(() => _fare = v)),
                  Text('Entre ${AppConfig.minFare}\$ et ${AppConfig.maxFare}\$ — le conducteur ne fixe pas le prix', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _searching ? null : _search,
              child: _searching ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Lancer le matching IA'),
            ),
            const SizedBox(height: 24),
            if (_results.isEmpty && !_searching)
              const Center(child: Text('Aucun trajet compatible pour le moment', style: TextStyle(color: AppColors.textMuted)))
            else
              ..._results.map((r) {
                final trip = r['trip'];
                final driver = trip['driver'];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(backgroundColor: AppColors.primaryLight, child: Text(driver['firstName'][0], style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))),
                            const SizedBox(width: 12),
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('${driver['firstName']} ${driver['lastName']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                              Text('★ ${(driver['rating'] ?? 0).toStringAsFixed(1)} · ${r['suggestedFare']}\$ suggéré', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                            ])),
                            MatchBadge(percent: r['matchPercent'] ?? 0),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text('${trip['departure']['label']} → ${trip['arrival']['label']}', style: const TextStyle(fontSize: 13)),
                        Text('Détour: ${r['detourKm']} km', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(onPressed: () => _book(r), child: Text('Réserver · ${_fare.toStringAsFixed(2)}\$')),
                        ),
                      ],
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
