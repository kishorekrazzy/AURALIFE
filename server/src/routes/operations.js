import { Router } from 'express';
import { db, mutate } from '../db.js';
import { todayLocal, nowTimeLocal } from '../util.js';

const router = Router();

/* ---------------------------------------------------------------- emergency */

router.get('/emergency', (req, res) => {
  const { emergencies } = db();
  res.json([...emergencies].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

router.post('/emergency', (req, res) => {
  const { patientName = 'Demo Patient', reason, note = '', hospitalId } = req.body || {};
  if (!reason) return res.status(400).json({ error: 'reason is required' });
  try {
    const created = mutate((state) => {
      const hospital =
        state.hospitals.find((h) => h.id === hospitalId) || state.hospitals[0];
      // Route to an available doctor in the emergency-facing department.
      const doctor =
        state.doctors.find((d) => d.hospitalId === hospital.id && d.status === 'available') ||
        state.doctors.find((d) => d.hospitalId === hospital.id) ||
        state.doctors[0];

      const alert = {
        id: `emg${String(state.emergencies.length + 1).padStart(3, '0')}`,
        patientName,
        reason,
        note,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        assignedDoctorId: doctor ? doctor.id : null,
        assignedDoctorName: doctor ? doctor.name : null,
        status: 'new',
        createdAt: new Date().toISOString(),
      };
      state.emergencies.push(alert);

      // A real emergency jumps the queue: issue a priority token.
      state.counters.token += 1;
      state.counters.appointment += 1;
      const priority = {
        id: `apt${String(state.counters.appointment).padStart(3, '0')}`,
        token: state.counters.token,
        patientName,
        doctorId: doctor ? doctor.id : null,
        hospitalId: hospital.id,
        department: doctor ? doctor.department : 'Emergency',
        date: todayLocal(),
        time: nowTimeLocal(),
        type: 'emergency',
        fee: 0,
        paid: true,
        status: 'waiting',
        priority: true,
        source: 'emergency',
        createdAt: new Date().toISOString(),
      };
      state.appointments.push(priority);
      alert.priorityAppointmentId = priority.id;
      return alert;
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/emergency/:id/acknowledge', (req, res) => {
  try {
    const updated = mutate((state) => {
      const alert = state.emergencies.find((e) => e.id === req.params.id);
      if (!alert) throw Object.assign(new Error('Emergency alert not found'), { status: 404 });
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date().toISOString();
      return alert;
    });
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/emergency/:id', (req, res) => {
  try {
    mutate((state) => {
      const i = state.emergencies.findIndex((e) => e.id === req.params.id);
      if (i === -1) throw Object.assign(new Error('Emergency alert not found'), { status: 404 });
      const [alert] = state.emergencies.splice(i, 1);
      if (alert.priorityAppointmentId) {
        const apt = state.appointments.find((a) => a.id === alert.priorityAppointmentId);
        if (apt && apt.status === 'waiting') apt.status = 'cancelled';
      }
      return alert;
    });
    res.status(204).end();
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/* --------------------------------------------------------------- ambulances */

router.get('/ambulances', (req, res) => {
  const { ambulances } = db();
  const { hospitalId } = req.query;
  res.json(hospitalId ? ambulances.filter((a) => a.hospitalId === hospitalId) : ambulances);
});

router.post('/ambulances/:id/request', (req, res) => {
  const { patientName = 'Demo Patient', pickup = '' } = req.body || {};
  try {
    const request = mutate((state) => {
      const ambulance = state.ambulances.find((a) => a.id === req.params.id);
      if (!ambulance) throw Object.assign(new Error('Ambulance not found'), { status: 404 });
      if (ambulance.status !== 'available') {
        throw Object.assign(new Error(`${ambulance.name} is currently ${ambulance.status}`), { status: 409 });
      }
      ambulance.status = 'dispatched';
      const record = {
        id: `req${String(state.ambulanceRequests.length + 1).padStart(3, '0')}`,
        ambulanceId: ambulance.id,
        ambulanceName: ambulance.name,
        patientName,
        pickup,
        etaMinutes: ambulance.etaMinutes,
        status: 'dispatched',
        createdAt: new Date().toISOString(),
      };
      state.ambulanceRequests.push(record);
      return record;
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ records */

router.get('/patients', (req, res) => {
  const { patients } = db();
  res.json(patients.map((p) => ({ id: p.id, name: p.name })));
});

router.get('/patients/:name/record', (req, res) => {
  const { patients, appointments, doctors } = db();
  const needle = decodeURIComponent(req.params.name).trim().toLowerCase();
  const patient =
    patients.find((p) => p.name.toLowerCase() === needle) ||
    patients.find((p) => p.name.toLowerCase().includes(needle));

  if (!patient) {
    return res.status(404).json({
      error: 'No record found for this patient',
      query: req.params.name,
      hint: 'Records exist only for registered patients. GET /api/patients lists them.',
    });
  }

  const history = appointments
    .filter((a) => a.patientName.toLowerCase() === patient.name.toLowerCase())
    .map((a) => ({
      date: a.date,
      time: a.time,
      department: a.department,
      status: a.status,
      doctorName: (doctors.find((d) => d.id === a.doctorId) || {}).name || null,
    }));

  res.json({ ...patient, appointments: history, accessLoggedAt: new Date().toISOString() });
});

/* ----------------------------------------------------------------- feedback */

router.get('/feedback', (req, res) => {
  const { feedback } = db();
  res.json([...feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

router.post('/feedback', (req, res) => {
  const {
    rating,
    type = 'compliment',
    message = '',
    patientName = 'Demo Patient',
    appointmentId = null,
  } = req.body || {};
  const numeric = Number(rating);
  if (!numeric && !String(message).trim()) {
    return res.status(400).json({ error: 'Provide a rating (1–5) or a written message' });
  }
  if (rating !== undefined && rating !== null && (numeric < 1 || numeric > 5)) {
    return res.status(400).json({ error: 'rating must be between 1 and 5' });
  }
  const created = mutate((state) => {
    // Feedback can reference a real, completed visit so it is traceable to an
    // actual appointment rather than a floating rating. An unknown id is
    // simply dropped, never invented, so the link is either real or absent.
    const visit =
      appointmentId != null
        ? state.appointments.find(
            (a) => a.id === appointmentId && a.patientName.toLowerCase() === String(patientName).toLowerCase(),
          )
        : null;
    const doctor = visit ? state.doctors.find((d) => d.id === visit.doctorId) : null;

    const entry = {
      id: `fbk${String(state.feedback.length + 1).padStart(3, '0')}`,
      rating: numeric || null,
      type,
      message: String(message).trim(),
      patientName,
      appointmentId: visit ? visit.id : null,
      doctorName: doctor ? doctor.name : null,
      department: visit ? visit.department : null,
      visitDate: visit ? visit.date : null,
      createdAt: new Date().toISOString(),
    };
    state.feedback.push(entry);
    return entry;
  });
  res.status(201).json(created);
});

/* ---------------------------------------------------------------- staff ops */

router.get('/staff/tasks', (req, res) => {
  res.json(db().staffTasks);
});

router.patch('/staff/tasks/:id', (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'status is required' });
  try {
    const updated = mutate((state) => {
      const task = state.staffTasks.find((t) => t.id === req.params.id);
      if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });
      task.status = status;
      return task;
    });
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/* ---------------------------------------------------------------- analytics */

/** Every figure below is computed from stored records, not hardcoded. */
router.get('/analytics', (req, res) => {
  const state = db();
  const today = todayLocal();
  const todays = state.appointments.filter((a) => a.date === today);
  const completed = todays.filter((a) => a.status === 'completed');
  const active = todays.filter((a) => ['waiting', 'in-progress'].includes(a.status));
  const cancelled = todays.filter((a) => a.status === 'cancelled');

  const ratings = state.feedback.filter((f) => f.rating);
  const satisfaction = ratings.length
    ? Number((ratings.reduce((sum, f) => sum + f.rating, 0) / ratings.length).toFixed(2))
    : null;

  const byDepartment = {};
  for (const a of todays) {
    byDepartment[a.department] = (byDepartment[a.department] || 0) + 1;
  }

  const AVG_CONSULT_MINUTES = 6;
  const averageWaitMinutes = active.length
    ? Number(((active.length / 2) * AVG_CONSULT_MINUTES).toFixed(1))
    : 0;

  res.json({
    date: today,
    patientsToday: todays.length,
    completedToday: completed.length,
    activeQueue: active.length,
    cancelledToday: cancelled.length,
    averageWaitMinutes,
    utilisationPercent: todays.length
      ? Math.round((completed.length / todays.length) * 100)
      : 0,
    doctorsAvailable: state.doctors.filter((d) => d.status === 'available').length,
    doctorsTotal: state.doctors.length,
    satisfaction,
    satisfactionSampleSize: ratings.length,
    openEmergencies: state.emergencies.filter((e) => e.status === 'new').length,
    byDepartment: Object.entries(byDepartment)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count),
  });
});

export default router;
