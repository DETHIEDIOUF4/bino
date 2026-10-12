import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

class LocationPoint {
  final double lat;
  final double lng;
  final String label;

  const LocationPoint({required this.lat, required this.lng, required this.label});

  Map<String, dynamic> toJson() => {'lat': lat, 'lng': lng, 'label': label};
}

class LocationService {
  static Future<bool> ensurePermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  static Future<LocationPoint?> getCurrentLocation() async {
    final ok = await ensurePermission();
    if (!ok) return null;

    final pos = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );

    String label = '${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}';
    try {
      final places = await placemarkFromCoordinates(pos.latitude, pos.longitude);
      if (places.isNotEmpty) {
        final p = places.first;
        label = [p.street, p.locality].where((e) => e != null && e.isNotEmpty).join(', ');
        if (label.isEmpty) label = p.name ?? label;
      }
    } catch (_) {}

    return LocationPoint(lat: pos.latitude, lng: pos.longitude, label: label);
  }

  static Future<String> labelFromCoords(double lat, double lng) async {
    try {
      final places = await placemarkFromCoordinates(lat, lng);
      if (places.isNotEmpty) {
        final p = places.first;
        return [p.street, p.locality].where((e) => e != null && e.isNotEmpty).join(', ');
      }
    } catch (_) {}
    return '$lat, $lng';
  }
}
