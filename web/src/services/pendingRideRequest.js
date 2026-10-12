const KEY = 'bino_pending_ride_request';

export function savePendingRideRequest(payload) {
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadPendingRideRequest() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingRideRequest() {
  sessionStorage.removeItem(KEY);
}

export async function fulfillPendingRideRequest(api) {
  const pending = loadPendingRideRequest();
  if (!pending?.departure?.lat) return null;

  const { data } = await api.post('/ride-requests', pending);
  clearPendingRideRequest();
  return data.data._id;
}
