import api from './api';

export async function searchPlaces(query) {
  if (query.trim().length < 2) return [];

  try {
    const { data } = await api.get('/places/autocomplete', { params: { input: query } });
    return (data.data || []).map((item) => ({
      ...item,
      _raw: item,
    }));
  } catch {
    return [];
  }
}

export async function getPlaceDetails(placeId, suggestion) {
  try {
    const payload = suggestion?._raw || suggestion;
    const { data } = await api.post(`/places/details/${encodeURIComponent(placeId)}`, payload || {});
    return data.data;
  } catch {
    if (suggestion?.preset) return suggestion.preset;
    if (suggestion?.osm) return suggestion.osm;
    return null;
  }
}

export const PRESET_PLACES = [
  { label: 'Université Laval, Québec', lat: 46.7815, lng: -71.2771 },
  { label: 'Place de la Cité, Sainte-Foy', lat: 46.7698, lng: -71.2886 },
  { label: 'Gare du Palais, Québec', lat: 46.8139, lng: -71.2269 },
  { label: 'Place Royale, Vieux-Québec', lat: 46.8139, lng: -71.2025 },
  { label: 'Les Rivières, Québec', lat: 46.813, lng: -71.247 },
  { label: 'Centre-ville, Québec', lat: 46.8139, lng: -71.2082 },
];
