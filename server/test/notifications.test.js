#!/usr/bin/env node
/**
 * Unit tests for the notification derivations.
 *
 * These run against a synthetic state with a fixed clock, so every alert can be
 * asserted exactly — including the ones that only occur at particular times of
 * day (a doctor running late) or after a state change (an acknowledged alert).
 *
 *   node test/notifications.test.js
 */

import { buildNotifications } from '../src/routes/notifications.js';

let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const DATE = '2026-09-11';

/** A minimal but realistic store. */
function makeState(overrides = {}) {
  return {
    settings: {
      travel: { assumedSpeedKmh: 18, checkInBufferMinutes: 10 },
      queue: { averageConsultMinutes: 6, lateThresholdMinutes: 10 },
      emergency: { emergencyNumber: '112', ambulanceNumber: '108' },
    },
    hospitals: [{ id: 'hos001', name: 'AuraLife City Hospital', distanceKm: 6 }],
    doctors: [
      { id: 'doc001', name: 'Dr. Anjali Mehra', department: 'General Medicine', room: 'Room 4', hospitalId: 'hos001' },
    ],
    destinations: [{ name: 'General Medicine · Dr. Anjali Mehra', floor: 2 }],
    facilities: [
      { id: 'fac001', name: 'Elevator A', type: 'elevator', serves: [1, 2, 3], status: 'in-service' },
      { id: 'fac002', name: 'Elevator B', type: 'elevator', serves: [1, 2, 3], status: 'in-service' },
    ],
    emergencies: [],
    appointments: [],
    ...overrides,
  };
}

function appointment(over = {}) {
  return {
    id: 'apt001',
    token: 42,
    patientName: 'Demo Patient',
    doctorId: 'doc001',
    hospitalId: 'hos001',
    department: 'General Medicine',
    date: DATE,
    time: '11:40',
    status: 'waiting',
    ...over,
  };
}

const at = (h, m = 0) => new Date(2026, 8, 11, h, m, 0, 0);
const run = (state, now) => buildNotifications(state, { patientName: 'Demo Patient', now });
const find = (items, type) => items.find((i) => i.type === type);

console.log('AURALIFE notification derivations\n');

/* ------------------------------------------------------------- leave time -- */
console.log('leave-time');
{
  // 6 km at 18 km/h = 20 min travel, +10 min check-in. Appointment at 11:40,
  // queue position 2 → expected call 11:40. Leave by 11:10. At 10:30 → 40 min.
  const state = makeState({
    appointments: [
      appointment({ id: 'a0', token: 40, patientName: 'Other One' }),
      appointment({ id: 'a1', token: 41, patientName: 'Other Two' }),
      appointment(),
    ],
  });
  const n = run(state, at(10, 30));
  const leave = find(n, 'leave-time');
  check('an actionable leave-time alert is produced', Boolean(leave));
  check('it states the remaining time', /Leave home in 40 minutes/.test(leave.title), leave && leave.title);
  check('travel time is derived from distance and speed', leave.basis.travelMinutes === 20, leave && String(leave.basis.travelMinutes));
  check('the basis exposes its inputs', leave.basis.distanceKm === 6 && leave.basis.assumedSpeedKmh === 18);

  // Far outside the window → suppressed rather than shown as "660 minutes".
  const early = run(state, at(1, 0));
  check('no leave alert hours ahead of time', !find(early, 'leave-time'));

  // Past the leave-by moment → escalates to "leave now".
  const late = run(state, at(11, 20));
  const now = find(late, 'leave-time');
  check('past the leave-by point it says leave now', now && /Leave now/.test(now.title));
  check('and is raised to warning', now && now.severity === 'warning');
}

/* ------------------------------------------------------------ doctor late -- */
console.log('\ndoctor-late');
{
  const state = makeState({
    appointments: [
      appointment({ id: 'a0', token: 40, patientName: 'Other One', time: '11:00', status: 'in-progress' }),
      appointment(),
    ],
  });
  // Token 40 was due at 11:00 and is still in consult at 11:18 → 18 min late.
  const n = run(state, at(11, 18));
  const late = find(n, 'doctor-late');
  check('a delay past the threshold raises an alert', Boolean(late));
  check('the delay is computed, not canned', /running 18 minutes late/.test(late.title), late && late.title);
  check('the basis records the scheduled time', late.basis.scheduledTime === '11:00');

  // A 6-minute slip is under the 10-minute threshold → no alert.
  const small = run(state, at(11, 6));
  check('a delay under the threshold is not reported', !find(small, 'doctor-late'));
}

/* --------------------------------------------------------- queue position -- */
console.log('\nqueue-position');
{
  const oneAhead = makeState({
    appointments: [
      appointment({ id: 'a0', token: 40, patientName: 'Other One', status: 'in-progress' }),
      appointment(),
    ],
  });
  const n = run(oneAhead, at(11, 30));
  const pos = find(n, 'queue-position');
  check('being one from the front reports "next in queue"', pos && /You are next in queue/.test(pos.title));
  check('it is critical severity', pos && pos.severity === 'critical');
  check('it names the room', pos && /Room 4/.test(pos.body));

  const serving = makeState({ appointments: [appointment({ status: 'in-progress' })] });
  const nowSeen = find(run(serving, at(11, 40)), 'queue-position');
  check('being at the front reports "being seen now"', nowSeen && /being seen now/.test(nowSeen.title));

  const far = makeState({
    appointments: [
      appointment({ id: 'a0', token: 38, patientName: 'A' }),
      appointment({ id: 'a1', token: 39, patientName: 'B' }),
      appointment({ id: 'a2', token: 40, patientName: 'C' }),
      appointment(),
    ],
  });
  check('no position alert when several are ahead', !find(run(far, at(11, 0)), 'queue-position'));
}

/* ------------------------------------------------------------ route change -- */
console.log('\nroute-change');
{
  const state = makeState({ appointments: [appointment()] });
  state.facilities[0].status = 'out-of-service';
  const route = find(run(state, at(11, 0)), 'route-change');
  check('an out-of-service lift raises a route alert', Boolean(route));
  check('it names the facility', route && /Elevator A is unavailable/.test(route.title));
  check('it offers the in-service alternative', route && /Elevator B/.test(route.body));
  check('the basis records the real status', route && route.basis.status === 'out-of-service');

  // With no alternative in service the advice changes rather than inventing one.
  state.facilities[1].status = 'maintenance';
  const none = find(run(state, at(11, 0)), 'route-change');
  check('with no alternative it says so instead of guessing', none && /No alternative/.test(none.body));

  const healthy = makeState({ appointments: [appointment()] });
  check('nothing is reported when every facility is in service', !find(run(healthy, at(11, 0)), 'route-change'));
}

/* --------------------------------------------------------------- emergency -- */
console.log('\nemergency');
{
  const sent = makeState({
    appointments: [appointment()],
    emergencies: [
      {
        id: 'emg001',
        patientName: 'Demo Patient',
        reason: 'Chest pain',
        hospitalName: 'AuraLife City Hospital',
        assignedDoctorName: 'Dr. Anjali Mehra',
        status: 'new',
        createdAt: at(11, 0).toISOString(),
      },
    ],
  });
  const pendingAlert = find(run(sent, at(11, 2)), 'emergency');
  check('a pending alert is reported as awaiting acknowledgement', pendingAlert && /waiting for acknowledgement/.test(pendingAlert.title));
  check('it tells the patient to call emergency services meanwhile', pendingAlert && /call 112/.test(pendingAlert.body));

  const acked = makeState({
    appointments: [appointment()],
    emergencies: [
      {
        id: 'emg001',
        patientName: 'Demo Patient',
        reason: 'Chest pain',
        hospitalName: 'AuraLife City Hospital',
        assignedDoctorName: 'Dr. Anjali Mehra',
        status: 'acknowledged',
        createdAt: at(11, 0).toISOString(),
        acknowledgedAt: at(11, 3).toISOString(),
      },
    ],
  });
  const ack = find(run(acked, at(11, 4)), 'emergency');
  check('an acknowledged alert is reported', ack && /Emergency team acknowledged your alert/.test(ack.title));
  check('it names the responding clinician', ack && /Dr. Anjali Mehra/.test(ack.body));
  check('it is critical severity', ack && ack.severity === 'critical');

  // Another patient's alert must not leak into this patient's feed.
  const other = makeState({
    appointments: [appointment()],
    emergencies: [{ ...acked.emergencies[0], patientName: 'Someone Else' }],
  });
  check("another patient's alert is not shown", !find(run(other, at(11, 4)), 'emergency'));
}

/* ------------------------------------------------------------------ shape --- */
console.log('\nordering & shape');
{
  const state = makeState({
    appointments: [
      appointment({ id: 'a0', token: 40, patientName: 'Other', status: 'in-progress', time: '11:00' }),
      appointment(),
    ],
  });
  state.facilities[0].status = 'out-of-service';
  const items = run(state, at(11, 25));
  check('critical alerts sort above warnings', items[0].severity === 'critical');
  check('every alert carries a basis', items.every((i) => i.basis && typeof i.basis === 'object'));
  check('every alert has a stable id', new Set(items.map((i) => i.id)).size === items.length);
  check('no alert is produced without a patient appointment', run(makeState(), at(11, 0)).length === 0);
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  · ${f}`);
  process.exit(1);
}
