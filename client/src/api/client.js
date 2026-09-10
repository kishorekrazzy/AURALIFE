/**
 * Single entry point for every network call.
 *
 * Rules enforced here:
 *  - Non-2xx responses become thrown ApiError objects carrying the server's
 *    message, so views render the real reason instead of silently falling back
 *    to invented placeholder data.
 *  - There is no local cache of "example" records. If the API is unreachable
 *    the UI shows an error state; it never substitutes made-up values.
 */

const BASE = '/api';

export class ApiError extends Error {
  constructor(message, { status, body, url } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const url = `${BASE}${path}`;
  let response;
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(
      'Cannot reach the AURALIFE server. Start it with "npm start" in /server.',
      { status: 0, url },
    );
  }

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && (payload.error || payload.message)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, { status: response.status, body: payload, url });
  }
  return payload;
}

const qs = (params = {}) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return search ? `?${search}` : '';
};

export const api = {
  health: () => request('/health'),

  // catalog
  hospitals: () => request('/hospitals'),
  hospital: (id) => request(`/hospitals/${id}`),
  departments: () => request('/departments'),
  doctors: (params) => request(`/doctors${qs(params)}`),
  problems: () => request('/problems'),
  specialists: (key) => request(`/problems/${encodeURIComponent(key)}/specialists`),
  destinations: (params) => request(`/destinations${qs(params)}`),
  insights: () => request('/insights'),

  // appointments & queue
  slots: (doctorId, date) => request(`/appointments/slots${qs({ doctorId, date })}`),
  appointments: (params) => request(`/appointments${qs(params)}`),
  book: (payload) => request('/appointments', { method: 'POST', body: payload }),
  updateAppointment: (id, patch) => request(`/appointments/${id}`, { method: 'PATCH', body: patch }),
  pay: (id) => request(`/appointments/${id}/pay`, { method: 'POST' }),
  queue: (params) => request(`/appointments/queue/live${qs(params)}`),
  serveNext: () => request('/appointments/queue/next', { method: 'POST' }),
  walkIn: (payload) => request('/appointments/queue/walkin', { method: 'POST', body: payload }),

  // operations
  emergencies: () => request('/emergency'),
  raiseEmergency: (payload) => request('/emergency', { method: 'POST', body: payload }),
  acknowledgeEmergency: (id) => request(`/emergency/${id}/acknowledge`, { method: 'POST' }),
  clearEmergency: (id) => request(`/emergency/${id}`, { method: 'DELETE' }),
  ambulances: (params) => request(`/ambulances${qs(params)}`),
  requestAmbulance: (id, payload) =>
    request(`/ambulances/${id}/request`, { method: 'POST', body: payload }),
  patients: () => request('/patients'),
  record: (name) => request(`/patients/${encodeURIComponent(name)}/record`),
  feedback: () => request('/feedback'),
  sendFeedback: (payload) => request('/feedback', { method: 'POST', body: payload }),
  staffTasks: () => request('/staff/tasks'),
  updateTask: (id, patch) => request(`/staff/tasks/${id}`, { method: 'PATCH', body: patch }),
  analytics: () => request('/analytics'),

  // notifications & safety
  notifications: (patientName) => request(`/notifications${qs({ patientName })}`),
  facilities: () => request('/facilities'),
  setFacilityStatus: (id, patch) => request(`/facilities/${id}`, { method: 'PATCH', body: patch }),
  emergencySafety: () => request('/emergency/safety'),

  // assistant
  ask: (message, patientName) => request('/assistant', { method: 'POST', body: { message, patientName } }),
};

export default api;
