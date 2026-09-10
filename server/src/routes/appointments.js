import { Router } from 'express';
import { db, mutate } from '../db.js';
import { todayLocal, nowTimeLocal } from '../util.js';

const router = Router();

const ACTIVE = new Set(['waiting', 'in-progress']);

function nextId(state) {
  state.counters.appointment += 1;
  return `apt${String(state.counters.appointment).padStart(3, '0')}`;
}

function nextToken(state) {
  state.counters.token += 1;
  return state.counters.token;
}

/** Slot availability is derived from real bookings — never guessed client-side. */
router.get('/slots', (req, res) => {
  const state = db();
  const { doctorId, date } = req.query;
  if (!doctorId || !date) {
    return res.status(400).json({ error: 'doctorId and date are required query parameters' });
  }
  const doctor = state.doctors.find((d) => d.id === doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found', doctorId });

  const taken = new Set(
    state.appointments
      .filter((a) => a.doctorId === doctorId && a.date === date && a.status !== 'cancelled')
      .map((a) => a.time),
  );

  res.json({
    doctorId,
    doctorName: doctor.name,
    department: doctor.department,
    fee: doctor.fee,
    date,
    slots: state.slotTimes.map((time) => ({ time, available: !taken.has(time) })),
  });
});

router.get('/', (req, res) => {
  const state = db();
  const { hospitalId, date, doctorId, patientName, status } = req.query;
  let list = [...state.appointments];
  if (hospitalId) list = list.filter((a) => a.hospitalId === hospitalId);
  if (date) list = list.filter((a) => a.date === date);
  if (doctorId) list = list.filter((a) => a.doctorId === doctorId);
  if (status) list = list.filter((a) => a.status === status);
  if (patientName) {
    const needle = String(patientName).toLowerCase();
    list = list.filter((a) => a.patientName.toLowerCase() === needle);
  }
  const doctors = Object.fromEntries(state.doctors.map((d) => [d.id, d]));
  res.json(
    list
      .sort((a, b) => a.token - b.token)
      .map((a) => ({
        ...a,
        doctorName: doctors[a.doctorId] ? doctors[a.doctorId].name : null,
        room: doctors[a.doctorId] ? doctors[a.doctorId].room : null,
      })),
  );
});

router.post('/', (req, res) => {
  const { patientName, doctorId, date, time, type = 'new' } = req.body || {};
  const missing = ['patientName', 'doctorId', 'date', 'time'].filter((k) => !(req.body || {})[k]);
  if (missing.length) {
    return res.status(400).json({ error: 'Missing required fields', fields: missing });
  }

  try {
    const created = mutate((state) => {
      const doctor = state.doctors.find((d) => d.id === doctorId);
      if (!doctor) throw Object.assign(new Error('Doctor not found'), { status: 404 });
      if (!state.slotTimes.includes(time)) {
        throw Object.assign(new Error(`Slot ${time} is not part of this hospital's schedule`), { status: 400 });
      }
      const clash = state.appointments.find(
        (a) => a.doctorId === doctorId && a.date === date && a.time === time && a.status !== 'cancelled',
      );
      if (clash) throw Object.assign(new Error(`Slot ${time} is already booked`), { status: 409 });

      const appointment = {
        id: nextId(state),
        token: nextToken(state),
        patientName: String(patientName).trim(),
        doctorId,
        hospitalId: doctor.hospitalId,
        department: doctor.department,
        date,
        time,
        type,
        fee: doctor.fee,
        paid: false,
        status: 'waiting',
        source: 'appointment',
        createdAt: new Date().toISOString(),
      };
      state.appointments.push(appointment);
      return { ...appointment, doctorName: doctor.name, room: doctor.room };
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.patch('/:id', (req, res) => {
  const allowed = ['status', 'paid', 'time', 'date', 'type'];
  const patch = Object.fromEntries(
    Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)),
  );
  if (!Object.keys(patch).length) {
    return res.status(400).json({ error: 'No updatable fields supplied', allowed });
  }
  try {
    const updated = mutate((state) => {
      const appointment = state.appointments.find((a) => a.id === req.params.id);
      if (!appointment) throw Object.assign(new Error('Appointment not found'), { status: 404 });
      Object.assign(appointment, patch, { updatedAt: new Date().toISOString() });
      return appointment;
    });
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/:id/pay', (req, res) => {
  try {
    const paid = mutate((state) => {
      const appointment = state.appointments.find((a) => a.id === req.params.id);
      if (!appointment) throw Object.assign(new Error('Appointment not found'), { status: 404 });
      appointment.paid = true;
      appointment.paidAt = new Date().toISOString();
      appointment.paymentReference = `AURA-${appointment.id.toUpperCase()}-${appointment.token}`;
      return appointment;
    });
    res.json(paid);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/** The live queue is a projection of today's active appointments. */
router.get('/queue/live', (req, res) => {
  const state = db();
  const { hospitalId, department } = req.query;
  const today = todayLocal();
  const doctors = Object.fromEntries(state.doctors.map((d) => [d.id, d]));

  let list = state.appointments.filter((a) => ACTIVE.has(a.status));
  if (hospitalId) list = list.filter((a) => a.hospitalId === hospitalId);
  if (department) list = list.filter((a) => a.department === department);

  // Emergency (priority) entries are seen first, then ordinary tokens in order.
  const ordered = list.sort((a, b) => {
    if (Boolean(a.priority) !== Boolean(b.priority)) return a.priority ? -1 : 1;
    return a.token - b.token;
  });
  const serving = ordered.find((a) => a.status === 'in-progress') || null;
  const AVG_CONSULT_MINUTES = 6;

  res.json({
    date: today,
    servingToken: serving ? serving.token : null,
    total: ordered.length,
    averageConsultMinutes: AVG_CONSULT_MINUTES,
    entries: ordered.map((a, i) => ({
      id: a.id,
      token: a.token,
      patientName: a.patientName,
      status: a.status,
      department: a.department,
      doctorName: doctors[a.doctorId] ? doctors[a.doctorId].name : null,
      room: doctors[a.doctorId] ? doctors[a.doctorId].room : null,
      position: i,
      priority: Boolean(a.priority),
      estimatedWaitMinutes: a.status === 'in-progress' ? 0 : i * AVG_CONSULT_MINUTES,
    })),
  });
});

/** Serve the next patient: close the current consult, promote the next token. */
router.post('/queue/next', (req, res) => {
  try {
    const result = mutate((state) => {
      const active = state.appointments
        .filter((a) => ACTIVE.has(a.status))
        .sort((a, b) => {
          if (Boolean(a.priority) !== Boolean(b.priority)) return a.priority ? -1 : 1;
          return a.token - b.token;
        });
      if (!active.length) throw Object.assign(new Error('The queue is empty'), { status: 409 });

      const current = active.find((a) => a.status === 'in-progress');
      if (current) {
        current.status = 'completed';
        current.completedAt = new Date().toISOString();
      }
      const next = active.find((a) => a.status === 'waiting');
      if (next) {
        next.status = 'in-progress';
        next.startedAt = new Date().toISOString();
      }
      return { completed: current || null, nowServing: next || null };
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/** Walk-in / front-desk check-in. Both create a real token. */
router.post('/queue/walkin', (req, res) => {
  const { patientName, department = 'General Medicine', type = 'walk-in' } = req.body || {};
  if (!patientName || !String(patientName).trim()) {
    return res.status(400).json({ error: 'patientName is required' });
  }
  try {
    const created = mutate((state) => {
      const doctor =
        state.doctors.find((d) => d.department === department && d.status === 'available') ||
        state.doctors.find((d) => d.department === department);
      if (!doctor) {
        throw Object.assign(new Error(`No doctor is listed for ${department}`), { status: 409 });
      }
      const appointment = {
        id: nextId(state),
        token: nextToken(state),
        patientName: String(patientName).trim(),
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId,
        department: doctor.department,
        date: todayLocal(),
        time: nowTimeLocal(),
        type,
        fee: doctor.fee,
        paid: false,
        status: 'waiting',
        source: type,
        createdAt: new Date().toISOString(),
      };
      state.appointments.push(appointment);
      return { ...appointment, doctorName: doctor.name, room: doctor.room };
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
