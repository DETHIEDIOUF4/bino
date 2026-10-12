import api from './api';

export const PRESET_PLACES = [
  { label: 'Université Laval, Québec', lat: 46.7815, lng: -71.2771 },
  { label: 'Place de la Cité, Sainte-Foy', lat: 46.7698, lng: -71.2886 },
  { label: 'Gare du Palais, Québec', lat: 46.8139, lng: -71.2269 },
  { label: 'Place Royale, Vieux-Québec', lat: 46.8139, lng: -71.2025 },
  { label: 'Les Rivières, Québec', lat: 46.813, lng: -71.247 },
  { label: 'Centre-ville, Québec', lat: 46.8139, lng: -71.2082 },
  { label: 'Charlesbourg, Québec', lat: 46.866, lng: -71.256 },
  { label: 'Lévis (centre)', lat: 46.803, lng: -71.178 },
];

function toSuggestion(p, index) {
  return {
    placeId: `preset-${index}-${p.lat}`,
    description: p.label,
    mainText: p.label.split(',')[0],
    secondaryText: 'Québec · suggestion',
    preset: p,
    _raw: { preset: p },
  };
}

/** Suggestions locales (toujours disponibles, même si l’API ou CORS échoue). */
export function localPlaceSuggestions(query) {
  const q = (query || '').trim().toLowerCase();
  const list = !q
    ? PRESET_PLACES
    : PRESET_PLACES.filter((p) => p.label.toLowerCase().includes(q));
  return list.map(toSuggestion);
}

export async function searchPlaces(query) {
  const trimmed = query.trim();
  const local = localPlaceSuggestions(trimmed);

  if (trimmed.length < 2) {
    return local;
  }

  try {
    const { data } = await api.get('/places/autocomplete', { params: { input: trimmed } });
    const remote = (data.data || []).map((item) => ({
      ...item,
      _raw: item,
    }));
    if (remote.length > 0) {
      const seen = new Set();
      return [...local, ...remote].filter((item) => {
        const key = item.placeId || item.description;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return local;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[places] autocomplete API:', err?.message || err);
    }
    return local;
  }
}

export async function getPlaceDetails(placeId, suggestion) {
  if (placeId.startsWith('preset-')) {
    const p = suggestion?.preset || suggestion?._raw?.preset;
    if (p) return p;
  }

  try {
    const payload = suggestion?._raw || suggestion;
    const { data } = await api.post(`/places/details/${encodeURIComponent(placeId)}`, payload || {});
    return data.data;
  } catch {
    if (suggestion?.preset) return suggestion.preset;
    if (suggestion?._raw?.preset) return suggestion._raw.preset;
    if (suggestion?.osm) return suggestion.osm;
    return null;
  }
}
