import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

/**
 * A deliberately non-generative assistant.
 *
 * Every reply is assembled from records in the datastore. When no intent
 * matches, it says so and offers what it can actually answer, rather than
 * inventing a plausible-sounding response. `grounding` lists the records used,
 * so any answer can be traced back to stored data.
 */

const INTENTS = [
  {
    id: 'token',
    keywords: ['token', 'my number', 'queue number', 'position'],
    run: (state, ctx) => {
      const mine = state.appointments
        .filter(
          (a) =>
            a.patientName.toLowerCase() === ctx.patientName.toLowerCase() &&
            ['waiting', 'in-progress'].includes(a.status),
        )
        .sort((a, b) => a.token - b.token)[0];
      if (!mine) {
        return {
          answer: `No active token is registered for ${ctx.patientName}. Book an appointment or check in at reception to receive one.`,
          grounding: ['appointments'],
        };
      }
      const queue = state.appointments
        .filter((a) => ['waiting', 'in-progress'].includes(a.status))
        .sort((a, b) => a.token - b.token);
      const ahead = queue.findIndex((a) => a.id === mine.id);
      const doctor = state.doctors.find((d) => d.id === mine.doctorId);
      return {
        answer: `Your token is #${mine.token} for ${mine.department}${doctor ? ` with ${doctor.name}` : ''}${doctor ? ` in ${doctor.room}` : ''}. There ${ahead === 1 ? 'is' : 'are'} ${ahead} ${ahead === 1 ? 'patient' : 'patients'} ahead of you, so the estimated wait is about ${ahead * 6} minutes.`,
        grounding: [`appointment:${mine.id}`, doctor ? `doctor:${doctor.id}` : null].filter(Boolean),
      };
    },
  },
  {
    id: 'wait',
    keywords: ['wait', 'how long', 'delay', 'time left'],
    run: (state) => {
      const active = state.appointments.filter((a) => ['waiting', 'in-progress'].includes(a.status));
      return {
        answer: `There ${active.length === 1 ? 'is' : 'are'} ${active.length} ${active.length === 1 ? 'patient' : 'patients'} in the live queue right now. At roughly 6 minutes per consultation the last token would be seen in about ${active.length * 6} minutes.`,
        grounding: ['appointments'],
      };
    },
  },
  {
    id: 'book',
    keywords: ['book', 'appointment', 'schedule', 'slot'],
    run: (state) => ({
      answer: `To book: open Appointments, pick one of the ${state.departments.length} departments, choose a doctor, then pick a free slot. Availability comes from live bookings, so a slot shown as free is genuinely open.`,
      grounding: ['departments', 'appointments'],
    }),
  },
  {
    id: 'departments',
    keywords: ['department', 'speciality', 'specialty', 'which doctors', 'services'],
    run: (state) => ({
      answer: `${state.departments.length} departments are listed: ${state.departments.map((d) => d.name).join(', ')}.`,
      grounding: ['departments'],
    }),
  },
  {
    id: 'doctors',
    keywords: ['doctor', 'available now', 'who is on duty', 'consultant'],
    run: (state) => {
      const free = state.doctors.filter((d) => d.status === 'available');
      const sample = free.slice(0, 4).map((d) => `${d.name} (${d.department}, ${d.room})`);
      return {
        answer: `${free.length} of ${state.doctors.length} doctors are marked available. For example: ${sample.join('; ')}.`,
        grounding: ['doctors'],
      };
    },
  },
  {
    id: 'fee',
    keywords: ['fee', 'cost', 'price', 'charge', 'payment', 'pay'],
    run: (state) => {
      const fees = state.doctors.map((d) => d.fee);
      const min = Math.min(...fees);
      const max = Math.max(...fees);
      return {
        answer: `Consultation fees range from ₹${min} to ₹${max} depending on the doctor. The exact fee is shown on the booking screen before you confirm, and payment is by UPI/QR.`,
        grounding: ['doctors'],
      };
    },
  },
  {
    id: 'record',
    keywords: ['record', 'history', 'report', 'prescription', 'blood group', 'allergy'],
    run: (state, ctx) => {
      const patient = state.patients.find(
        (p) => p.name.toLowerCase() === ctx.patientName.toLowerCase(),
      );
      if (!patient) {
        return {
          answer: `No health record is registered under ${ctx.patientName}. Records are created at your first consultation.`,
          grounding: ['patients'],
        };
      }
      return {
        answer: `Your record lists blood group ${patient.bloodGroup}, ${patient.allergies.length ? `allergies: ${patient.allergies.join(', ')}` : 'no recorded allergies'}, ${patient.visits.length} previous ${patient.visits.length === 1 ? 'visit' : 'visits'} and ${patient.reports.length} ${patient.reports.length === 1 ? 'report' : 'reports'}. Open Health Records to view it in full.`,
        grounding: [`patient:${patient.id}`],
      };
    },
  },
  {
    id: 'emergency',
    keywords: ['emergency', 'urgent', 'ambulance', 'accident'],
    run: (state) => {
      const free = state.ambulances.filter((a) => a.status === 'available');
      return {
        answer: `For an emergency, use the red Emergency button — it alerts the hospital team and issues a priority token immediately. ${free.length} of ${state.ambulances.length} ambulances are available right now${free.length ? `, the fastest with an ETA of about ${Math.min(...free.map((a) => a.etaMinutes))} minutes` : ''}.`,
        grounding: ['ambulances', 'emergencies'],
      };
    },
  },
  {
    id: 'navigation',
    keywords: ['where', 'find', 'route', 'direction', 'floor', 'navigate', 'map'],
    run: (state) => ({
      answer: `Indoor navigation covers ${state.destinations.length} destinations across ${Math.max(...state.destinations.map((d) => d.floor))} floors. Open Navigation and search for a department, room or facility to get a step-free route.`,
      grounding: ['destinations'],
    }),
  },
  {
    id: 'hospitals',
    keywords: ['hospital', 'nearby', 'branch', 'location', 'near me'],
    run: (state) => ({
      answer: `${state.hospitals.length} hospitals are connected: ${state.hospitals.map((h) => `${h.name} (${h.area}, ${h.distanceKm} km)`).join('; ')}.`,
      grounding: ['hospitals'],
    }),
  },
];

router.get('/assistant/topics', (req, res) => {
  res.json(INTENTS.map((i) => ({ id: i.id, examples: i.keywords.slice(0, 3) })));
});

router.post('/assistant', (req, res) => {
  const { message, patientName = 'Demo Patient' } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  const state = db();
  const text = String(message).toLowerCase();

  // Score intents by how many of their keywords appear; highest score wins.
  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const score = intent.keywords.reduce((n, k) => (text.includes(k) ? n + 1 : n), 0);
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }

  if (!best) {
    return res.json({
      intent: null,
      answered: false,
      answer:
        "I don't have data for that question, so I won't guess. I can answer questions about your token, waiting time, booking, departments, doctors, fees, health records, emergencies, ambulances, navigation and connected hospitals.",
      grounding: [],
      topics: INTENTS.map((i) => i.id),
    });
  }

  const result = best.run(state, { patientName });
  res.json({
    intent: best.id,
    answered: true,
    answer: result.answer,
    grounding: result.grounding,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
