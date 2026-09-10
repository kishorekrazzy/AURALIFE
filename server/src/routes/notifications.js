import { Router } from 'express';
import { db, mutate } from '../db.js';
import { todayLocal } from '../util.js';

const router = Router();

/**
 * Derived patient alerts.
 *
 * Nothing here is stored copy or a canned message: each notification is
 * computed from records at request time, and every one carries `basis` — the
 * inputs it was derived from — so any number shown to a patient can be checked.
 * If the inputs for an alert are missing, the alert is simply not produced.
 */

const ACTIVE = new Set(['waiting', 'in-progress']);

/** Combine a local date (YYYY-MM-DD) and time (HH:MM) into a Date. */
function at(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

const minutesBetween = (a, b) => Math.round((a.getTime() - b.getTime()) / 60000);

function formatDuration(mins) {
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} hour${h === 1 ? '' : 's'}`;
}

function buildNotifications(state, { patientName, now = new Date() }) {
  const out = [];
  const settings = state.settings || {};
  const travel = settings.travel || { assumedSpeedKmh: 18, checkInBufferMinutes: 10 };
  const queueCfg = settings.queue || { averageConsultMinutes: 6, lateThresholdMinutes: 10 };

  const mine = state.appointments
    .filter((a) => a.patientName.toLowerCase() === String(patientName).toLowerCase())
    .filter((a) => ACTIVE.has(a.status));

  const queue = state.appointments
    .filter((a) => ACTIVE.has(a.status))
    .sort((a, b) => {
      if (Boolean(a.priority) !== Boolean(b.priority)) return a.priority ? -1 : 1;
      return a.token - b.token;
    });

  const next = mine.sort((a, b) => a.token - b.token)[0] || null;
  const position = next ? queue.findIndex((q) => q.id === next.id) : -1;
  const doctor = next ? state.doctors.find((d) => d.id === next.doctorId) : null;
  const hospital = next ? state.hospitals.find((h) => h.id === next.hospitalId) : null;

  /* ---------------------------------------------------- 1. when to leave --- */
  if (next && position >= 0 && hospital && typeof hospital.distanceKm === 'number') {
    const consultMinutes = queueCfg.averageConsultMinutes;
    const scheduled = at(next.date, next.time);
    const queueCallTime = new Date(now.getTime() + position * consultMinutes * 60000);
    // Whichever is later: the booked slot, or where the queue has actually got to.
    const expectedCall =
      scheduled && scheduled > queueCallTime ? scheduled : queueCallTime;

    const travelMinutes = Math.max(
      1,
      Math.round((hospital.distanceKm / travel.assumedSpeedKmh) * 60),
    );
    const leaveBy = new Date(
      expectedCall.getTime() - (travelMinutes + travel.checkInBufferMinutes) * 60000,
    );
    const leaveInMinutes = minutesBetween(leaveBy, now);
    // Only worth telling someone to leave when it is actually actionable.
    const RELEVANCE_WINDOW_MINUTES = 180;

    if (leaveInMinutes > 0 && leaveInMinutes <= RELEVANCE_WINDOW_MINUTES) {
      out.push({
        id: `leave-${next.id}`,
        type: 'leave-time',
        severity: leaveInMinutes <= 15 ? 'warning' : 'info',
        title: `Leave home in ${formatDuration(leaveInMinutes)} to arrive before your token`,
        body: `Token #${next.token} is expected around ${expectedCall.toTimeString().slice(0, 5)}. Allow ${travelMinutes} min travel plus ${travel.checkInBufferMinutes} min check-in.`,
        at: now.toISOString(),
        action: { label: 'View route', view: 'navigation' },
        basis: {
          distanceKm: hospital.distanceKm,
          assumedSpeedKmh: travel.assumedSpeedKmh,
          travelMinutes,
          checkInBufferMinutes: travel.checkInBufferMinutes,
          expectedCallTime: expectedCall.toISOString(),
          queuePosition: position,
        },
      });
    } else if (leaveInMinutes <= 0 && leaveInMinutes > -30) {
      // Only just past the leave-by moment — still worth acting on.
      out.push({
        id: `leave-now-${next.id}`,
        type: 'leave-time',
        severity: 'warning',
        title: 'Leave now to arrive before your token',
        body: `Travel time to ${hospital.name} is about ${travelMinutes} min and your token is due around ${expectedCall.toTimeString().slice(0, 5)}.`,
        at: now.toISOString(),
        action: { label: 'View route', view: 'navigation' },
        basis: {
          distanceKm: hospital.distanceKm,
          assumedSpeedKmh: travel.assumedSpeedKmh,
          travelMinutes,
          expectedCallTime: expectedCall.toISOString(),
        },
      });
    }
  }

  /* --------------------------------------------------- 2. doctor running late */
  const serving = queue.find((q) => q.status === 'in-progress');
  if (serving && next && serving.doctorId === next.doctorId) {
    const scheduled = at(serving.date, serving.time);
    if (scheduled) {
      const delay = minutesBetween(now, scheduled);
      if (delay >= queueCfg.lateThresholdMinutes) {
        const servingDoctor = state.doctors.find((d) => d.id === serving.doctorId);
        out.push({
          id: `late-${serving.doctorId}-${serving.id}`,
          type: 'doctor-late',
          severity: 'warning',
          title: `Doctor is running ${delay} minutes late`,
          body: `${servingDoctor ? servingDoctor.name : 'The consulting doctor'} is currently seeing token #${serving.token}, which was scheduled for ${serving.time}. Your estimated wait has been updated.`,
          at: now.toISOString(),
          action: { label: 'Live queue', view: 'queue' },
          basis: {
            servingToken: serving.token,
            scheduledTime: serving.time,
            delayMinutes: delay,
            thresholdMinutes: queueCfg.lateThresholdMinutes,
          },
        });
      }
    }
  }

  /* ------------------------------------------------------- 3. you are next --- */
  if (next && position === 0) {
    out.push({
      id: `now-serving-${next.id}`,
      type: 'queue-position',
      severity: 'critical',
      title: 'You are being seen now',
      body: `Token #${next.token} — please go to ${doctor ? doctor.room : 'the consulting room'}.`,
      at: now.toISOString(),
      action: { label: 'Live queue', view: 'queue' },
      basis: { token: next.token, queuePosition: position },
    });
  } else if (next && position === 1) {
    out.push({
      id: `next-${next.id}`,
      type: 'queue-position',
      severity: 'critical',
      title: 'You are next in queue',
      body: `Token #${next.token} — please wait near ${doctor ? doctor.room : 'the consulting room'}.`,
      at: now.toISOString(),
      action: { label: 'Live queue', view: 'queue' },
      basis: { token: next.token, queuePosition: position },
    });
  }

  /* ------------------------------------------------- 4. route changed -------- */
  const outOfService = (state.facilities || []).filter((f) => f.status !== 'in-service');
  if (outOfService.length) {
    const destinationFloor = doctor
      ? (state.destinations.find((d) => d.name.includes(doctor.department)) || {}).floor
      : null;
    for (const facility of outOfService) {
      const affectsMe =
        destinationFloor == null ||
        (Array.isArray(facility.serves) && facility.serves.includes(destinationFloor));
      if (!affectsMe) continue;
      const alternatives = (state.facilities || []).filter(
        (f) =>
          f.id !== facility.id &&
          f.type === facility.type &&
          f.status === 'in-service',
      );
      out.push({
        id: `facility-${facility.id}`,
        type: 'route-change',
        severity: 'warning',
        title: `Route changed because ${facility.name} is unavailable`,
        body: alternatives.length
          ? `Your step-free route now uses ${alternatives[0].name}. Allow a little extra walking time.`
          : `No alternative ${facility.type} is in service. Ask at the reception desk for assistance.`,
        at: facility.updatedAt || now.toISOString(),
        action: { label: 'Open navigation', view: 'navigation' },
        basis: {
          facility: facility.name,
          status: facility.status,
          note: facility.note || null,
          alternative: alternatives.length ? alternatives[0].name : null,
          destinationFloor,
        },
      });
    }
  }

  /* --------------------------------------------- 5. emergency acknowledged --- */
  for (const alert of state.emergencies || []) {
    if (alert.patientName.toLowerCase() !== String(patientName).toLowerCase()) continue;
    if (alert.status === 'acknowledged') {
      out.push({
        id: `emergency-ack-${alert.id}`,
        type: 'emergency',
        severity: 'critical',
        title: 'Emergency team acknowledged your alert',
        body: `${alert.assignedDoctorName || 'The on-call team'} at ${alert.hospitalName} has confirmed your priority request. Proceed to the Emergency Department entrance.`,
        at: alert.acknowledgedAt || alert.createdAt,
        basis: {
          alertId: alert.id,
          reason: alert.reason,
          acknowledgedAt: alert.acknowledgedAt || null,
        },
      });
    } else if (alert.status === 'new') {
      out.push({
        id: `emergency-sent-${alert.id}`,
        type: 'emergency',
        severity: 'critical',
        title: 'Emergency alert sent — waiting for acknowledgement',
        body: `${alert.hospitalName} has received your alert. If your condition is life-threatening, call ${(settings.emergency || {}).emergencyNumber || '112'} now rather than waiting.`,
        at: alert.createdAt,
        basis: { alertId: alert.id, reason: alert.reason, status: alert.status },
      });
    }
  }

  const rank = { critical: 0, warning: 1, info: 2 };
  return out.sort(
    (a, b) => (rank[a.severity] - rank[b.severity]) || b.at.localeCompare(a.at),
  );
}

router.get('/notifications', (req, res) => {
  const state = db();
  const patientName = req.query.patientName || 'Demo Patient';
  const items = buildNotifications(state, { patientName });
  res.json({
    generatedAt: new Date().toISOString(),
    date: todayLocal(),
    patientName,
    unread: items.length,
    items,
  });
});

/** Facility status drives route notifications — admin/staff can change it. */
router.get('/facilities', (req, res) => {
  res.json(db().facilities || []);
});

router.patch('/facilities/:id', (req, res) => {
  const { status, note = '' } = req.body || {};
  const allowed = ['in-service', 'out-of-service', 'maintenance'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status', allowed });
  }
  try {
    const updated = mutate((state) => {
      const facility = (state.facilities || []).find((f) => f.id === req.params.id);
      if (!facility) throw Object.assign(new Error('Facility not found'), { status: 404 });
      facility.status = status;
      facility.note = note;
      facility.updatedAt = new Date().toISOString();
      return facility;
    });
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/** Safety configuration for the emergency workflow, shown verbatim in the UI. */
router.get('/emergency/safety', (req, res) => {
  const { settings } = db();
  res.json(
    (settings && settings.emergency) || {
      isHospitalAlertOnly: true,
      emergencyNumber: '112',
      ambulanceNumber: '108',
      productionRequirements: [],
    },
  );
});

export { buildNotifications };
export default router;
