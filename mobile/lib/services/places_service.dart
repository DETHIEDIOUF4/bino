import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/config/app_config.dart';
import 'location_service.dart';

class PlaceSuggestion {
  final String placeId;
  final String description;
  final String mainText;
  final String secondaryText;

  PlaceSuggestion({
    required this.placeId,
    required this.description,
    required this.mainText,
    required this.secondaryText,
  });

  factory PlaceSuggestion.fromJson(Map<String, dynamic> json) {
    final structured = json['structured_formatting'] as Map<String, dynamic>? ?? {};
    return PlaceSuggestion(
      placeId: json['place_id'] ?? '',
      description: json['description'] ?? '',
      mainText: structured['main_text'] ?? json['description'] ?? '',
      secondaryText: structured['secondary_text'] ?? '',
    );
  }
}

class PlacesService {
  static const _base = 'https://maps.googleapis.com/maps/api/place';

  static Future<List<PlaceSuggestion>> search(String query) async {
    if (query.trim().length < 2) return [];

    final uri = Uri.parse('$_base/autocomplete/json').replace(queryParameters: {
      'input': query,
      'key': AppConfig.googleMapsApiKey,
      'language': 'fr',
      'components': 'country:ca',
      'types': 'geocode|establishment',
    });

    try {
      final res = await http.get(uri);
      final data = jsonDecode(res.body) as Map<String, dynamic>;

      if (data['status'] != 'OK' && data['status'] != 'ZERO_RESULTS') {
        return [];
      }

      final predictions = data['predictions'] as List? ?? [];
      return predictions.map((p) => PlaceSuggestion.fromJson(p as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<LocationPoint?> getPlaceDetails(String placeId) async {
    final uri = Uri.parse('$_base/details/json').replace(queryParameters: {
      'place_id': placeId,
      'fields': 'geometry,formatted_address,name',
      'key': AppConfig.googleMapsApiKey,
      'language': 'fr',
    });

    try {
      final res = await http.get(uri);
      final data = jsonDecode(res.body) as Map<String, dynamic>;

      if (data['status'] != 'OK') return null;

      final result = data['result'] as Map<String, dynamic>;
      final geometry = result['geometry'] as Map<String, dynamic>;
      final location = geometry['location'] as Map<String, dynamic>;
      final label = result['formatted_address'] as String? ?? result['name'] as String? ?? '';

      return LocationPoint(
        lat: (location['lat'] as num).toDouble(),
        lng: (location['lng'] as num).toDouble(),
        label: label,
      );
    } catch (_) {
      return null;
    }
  }
}
