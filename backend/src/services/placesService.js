const QUEBEC_PRESETS = [
  { label: 'Université Laval, Québec, QC', lat: 46.7815, lng: -71.2771 },
  { label: 'Place de la Cité, Sainte-Foy, QC', lat: 46.7698, lng: -71.2886 },
  { label: 'Gare du Palais, Québec, QC', lat: 46.8139, lng: -71.2269 },
  { label: 'Place Royale, Vieux-Québec, QC', lat: 46.8139, lng: -71.2025 },
  { label: 'Les Rivières, Québec, QC', lat: 46.813, lng: -71.247 },
  { label: 'Centre-ville, Québec, QC', lat: 46.8139, lng: -71.2082 },
  { label: 'Charlesbourg, Québec, QC', lat: 46.866, lng: -71.256 },
  { label: 'Lévis (centre), QC', lat: 46.803, lng: -71.178 },
];

function localPresetSuggestions(input) {
  const q = input.trim().toLowerCase();
  if (q.length < 2) return [];

  return QUEBEC_PRESETS.filter((p) => p.label.toLowerCase().includes(q)).map((p, i) => ({
    placeId: `preset-${i}-${p.lat}`,
    description: p.label,
    mainText: p.label.split(',')[0],
    secondaryText: 'Québec · raccourci',
    preset: p,
  }));
}

async function nominatimSearch(input) {
  const params = new URLSearchParams({
    q: `${input}, Québec, Canada`,
    format: 'json',
    addressdetails: '0',
    limit: '6',
    countrycodes: 'ca',
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'AidaFALL/1.0 (covoiturage Quebec)' },
  });

  if (!res.ok) return [];
  const rows = await res.json();

  return rows.map((row) => ({
    placeId: `osm-${row.place_id}`,
    description: row.display_name,
    mainText: row.display_name.split(',')[0],
    secondaryText: row.display_name.split(',').slice(1, 3).join(',').trim(),
    osm: { lat: parseFloat(row.lat), lng: parseFloat(row.lon), label: row.display_name },
  }));
}

async function googleAutocomplete(input) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const params = new URLSearchParams({
    input,
    key,
    language: 'fr',
    components: 'country:ca',
    location: '46.8139,-71.2082',
    radius: '80000',
  });

  const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`);
  const data = await res.json();

  if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
    return (data.predictions || []).map((p) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));
  }

  console.warn('[Places] Google autocomplete:', data.status, data.error_message || '');
  return null;
}

async function googlePlaceDetails(placeId) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'geometry,formatted_address,name',
    key,
    language: 'fr',
  });

  const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);
  const data = await res.json();
  if (data.status !== 'OK') return null;

  const result = data.result;
  const loc = result.geometry.location;
  return {
    lat: loc.lat,
    lng: loc.lng,
    label: result.formatted_address || result.name || '',
  };
}

async function searchPlaces(input) {
  const trimmed = input.trim();
  if (trimmed.length < 2) return { suggestions: [], provider: 'none' };

  const presets = localPresetSuggestions(trimmed);

  const google = await googleAutocomplete(trimmed);
  if (google && google.length > 0) {
    return { suggestions: [...presets, ...google], provider: 'google' };
  }

  try {
    const osm = await nominatimSearch(trimmed);
    if (osm.length > 0) {
      return { suggestions: [...presets, ...osm], provider: 'osm' };
    }
  } catch (err) {
    console.warn('[Places] Nominatim error', err.message);
  }

  if (presets.length > 0) {
    return { suggestions: presets, provider: 'preset' };
  }

  return { suggestions: [], provider: google === null ? 'no-key' : 'empty' };
}

async function resolvePlace(placeId, suggestionPayload) {
  if (placeId.startsWith('preset-')) {
    if (suggestionPayload?.preset) return suggestionPayload.preset;
    const latStr = placeId.split('-').pop();
    const found = QUEBEC_PRESETS.find((p) => String(p.lat) === latStr);
    if (found) return found;
  }

  if (placeId.startsWith('osm-') && suggestionPayload?.osm) {
    return suggestionPayload.osm;
  }

  const google = await googlePlaceDetails(placeId);
  if (google) return google;

  return null;
}

module.exports = {
  searchPlaces,
  resolvePlace,
  QUEBEC_PRESETS,
};
