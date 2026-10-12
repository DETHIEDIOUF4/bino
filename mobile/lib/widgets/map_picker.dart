import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../core/theme/app_theme.dart';
import '../services/location_service.dart';

class MapPicker extends StatefulWidget {
  final String title;
  final LocationPoint? initial;
  final ValueChanged<LocationPoint> onSelected;

  const MapPicker({
    super.key,
    required this.title,
    this.initial,
    required this.onSelected,
  });

  @override
  State<MapPicker> createState() => _MapPickerState();
}

class _MapPickerState extends State<MapPicker> {
  GoogleMapController? _controller;
  LatLng? _position;
  String _label = 'Sélectionnez un point';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    if (widget.initial != null) {
      _position = LatLng(widget.initial!.lat, widget.initial!.lng);
      _label = widget.initial!.label;
    } else {
      final loc = await LocationService.getCurrentLocation();
      if (loc != null) {
        _position = LatLng(loc.lat, loc.lng);
        _label = loc.label;
      } else {
        _position = const LatLng(45.5017, -73.5673);
        _label = 'Montréal';
      }
    }
    setState(() => _loading = false);
  }

  Future<void> _onTap(LatLng pos) async {
    final label = await LocationService.labelFromCoords(pos.latitude, pos.longitude);
    setState(() {
      _position = pos;
      _label = label.isNotEmpty ? label : 'Point sélectionné';
    });
  }

  void _confirm() {
    if (_position == null) return;
    widget.onSelected(LocationPoint(lat: _position!.latitude, lng: _position!.longitude, label: _label));
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: _loading || _position == null
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(target: _position!, zoom: 14),
                  onMapCreated: (c) {
                    _controller = c;
                    if (_position != null) c.animateCamera(CameraUpdate.newLatLng(_position!));
                  },
                  onTap: _onTap,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: true,
                  markers: {
                    Marker(markerId: const MarkerId('pick'), position: _position!),
                  },
                ),
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 24,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20)],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_label, style: const TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _confirm, child: const Text('Confirmer ce point')),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
