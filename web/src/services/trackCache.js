const PREFIX = 'bino_track_';

export function loadTrackCache(bookingId) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${bookingId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTrackCache(bookingId, payload) {
  const prev = loadTrackCache(bookingId);
  const mergedTimeline = mergeTimeline(prev?.timeline, payload.timeline);

  const entry = {
    ...payload,
    timeline: mergedTimeline,
    cachedAt: new Date().toISOString(),
    history: appendHistory(prev?.history, payload),
  };

  localStorage.setItem(`${PREFIX}${bookingId}`, JSON.stringify(entry));
  return entry;
}

function mergeTimeline(oldSteps, newSteps) {
  if (!oldSteps?.length) return newSteps;
  if (!newSteps?.length) return oldSteps;

  return newSteps.map((step, i) => {
    const prev = oldSteps[i];
    if (prev?.done && !step.done) {
      return { ...step, done: true, at: prev.at || step.at };
    }
    return step;
  });
}

function appendHistory(prevHistory, payload) {
  const history = Array.isArray(prevHistory) ? [...prevHistory] : [];
  history.push({
    status: payload.status,
    tripStatus: payload.trip?.status,
    at: payload.updatedAt || new Date().toISOString(),
  });
  return history.slice(-50);
}

export function clearTrackCache(bookingId) {
  localStorage.removeItem(`${PREFIX}${bookingId}`);
}
