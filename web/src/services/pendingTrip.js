const KEY = 'bino_pending_trip';

export function savePendingTrip(payload) {
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadPendingTrip() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingTrip() {
  sessionStorage.removeItem(KEY);
}

/** @returns {Promise<string|null>} trip id if created */
export async function fulfillPendingTrip(api) {
  const pending = loadPendingTrip();
  if (!pending?.departure?.lat) return null;

  const { data } = await api.post('/trips', pending);
  clearPendingTrip();
  return data.data._id;
}
