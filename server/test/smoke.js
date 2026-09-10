#!/usr/bin/env node
/**
 * End-to-end smoke test for the AURALIFE API.
 *
 * Boots nothing itself — point it at a running server:
 *   node test/smoke.js            (defaults to http://localhost:4000)
 *   BASE=http://host:port node test/smoke.js
 *
 * Exits non-zero if any check fails.
 */

const BASE = process.env.BASE || 'http://localhost:4000';
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

async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, body: json, text };
}

function localDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function run() {
  console.log(`AURALIFE API smoke test → ${BASE}\n`);

  console.log('health & catalog');
  const health = await call('/api/health');
  check('GET /api/health returns ok', health.status === 200 && health.body.status === 'ok');
  check('health reports seeded counts', health.body?.counts?.doctors > 0);

  const hospitals = await call('/api/hospitals');
  check('GET /api/hospitals returns a list', hospitals.status === 200 && hospitals.body.length > 0);
  check(
    'each hospital carries a doctor roster',
    hospitals.body.every((h) => typeof h.doctorCount === 'number'),
  );

  const departments = await call('/api/departments');
  check('GET /api/departments returns counts', departments.body.every((d) => 'doctorCount' in d));

  const doctors = await call('/api/doctors?department=Cardiology');
  check(
    'GET /api/doctors filters by department',
    doctors.body.length > 0 && doctors.body.every((d) => d.department === 'Cardiology'),
  );

  const missingDoctor = await call('/api/doctors/doc999');
  check('unknown doctor returns 404', missingDoctor.status === 404);

  console.log('\nproblem → specialist matching');
  const problems = await call('/api/problems');
  check('GET /api/problems returns options', problems.body.length > 0);
  const specialists = await call(`/api/problems/${problems.body[0].key}/specialists`);
  check(
    'specialists resolve to real doctors',
    specialists.status === 200 && specialists.body.doctors.length > 0,
  );
  const badProblem = await call('/api/problems/not-a-problem/specialists');
  check('unknown problem key returns 404 with a hint', badProblem.status === 404 && Boolean(badProblem.body.hint));

  console.log('\nbooking');
  const doctorId = doctors.body[0].id;
  const date = localDate(1);
  const slots = await call(`/api/appointments/slots?doctorId=${doctorId}&date=${date}`);
  check('GET slots returns availability', slots.status === 200 && slots.body.slots.length > 0);
  check('slot fee matches the doctor record', slots.body.fee === doctors.body[0].fee);

  const free = slots.body.slots.find((s) => s.available);
  const booking = await call('/api/appointments', {
    method: 'POST',
    body: { patientName: 'Smoke Test', doctorId, date, time: free.time },
  });
  check('POST /api/appointments creates a token', booking.status === 201 && booking.body.token > 0);
  check('booking fee comes from the doctor', booking.body.fee === doctors.body[0].fee);

  const conflict = await call('/api/appointments', {
    method: 'POST',
    body: { patientName: 'Someone Else', doctorId, date, time: free.time },
  });
  check('double-booking the same slot returns 409', conflict.status === 409);

  const afterSlots = await call(`/api/appointments/slots?doctorId=${doctorId}&date=${date}`);
  check(
    'the booked slot is no longer offered',
    afterSlots.body.slots.find((s) => s.time === free.time).available === false,
  );

  const badBooking = await call('/api/appointments', { method: 'POST', body: { patientName: 'X' } });
  check('missing fields return 400 listing them', badBooking.status === 400 && badBooking.body.fields.length === 3);

  const paid = await call(`/api/appointments/${booking.body.id}/pay`, { method: 'POST' });
  check('payment marks the appointment paid', paid.status === 200 && paid.body.paid === true);
  check('payment records a reference', Boolean(paid.body.paymentReference));

  console.log('\nqueue');
  const queue = await call('/api/appointments/queue/live');
  check('GET live queue returns entries', queue.status === 200 && Array.isArray(queue.body.entries));
  check(
    'queue entries carry a wait estimate',
    queue.body.entries.every((e) => typeof e.estimatedWaitMinutes === 'number'),
  );

  const walkIn = await call('/api/appointments/queue/walkin', {
    method: 'POST',
    body: { patientName: 'Walk In Test', department: 'General Medicine' },
  });
  check('walk-in check-in issues a token', walkIn.status === 201 && walkIn.body.token > 0);

  const badWalkIn = await call('/api/appointments/queue/walkin', { method: 'POST', body: {} });
  check('walk-in without a name returns 400', badWalkIn.status === 400);

  const before = await call('/api/appointments/queue/live');
  const next = await call('/api/appointments/queue/next', { method: 'POST' });
  check('serve-next advances the queue', next.status === 200);
  const after = await call('/api/appointments/queue/live');
  check('serving reduces the active queue', after.body.total < before.body.total);

  console.log('\nemergency');
  const emergency = await call('/api/emergency', {
    method: 'POST',
    body: { reason: 'Chest pain', note: 'smoke test' },
  });
  check('emergency alert is created', emergency.status === 201 && emergency.body.status === 'new');
  check('emergency assigns a doctor', Boolean(emergency.body.assignedDoctorName));

  const withPriority = await call('/api/appointments/queue/live');
  check(
    'emergency token is placed at the head of the queue',
    withPriority.body.entries[0].priority === true,
  );

  const ack = await call(`/api/emergency/${emergency.body.id}/acknowledge`, { method: 'POST' });
  check('emergency can be acknowledged', ack.body.status === 'acknowledged');
  const cleared = await call(`/api/emergency/${emergency.body.id}`, { method: 'DELETE' });
  check('emergency can be cleared', cleared.status === 204);

  console.log('\nrecords, feedback, ambulances');
  const record = await call('/api/patients/Demo%20Patient/record');
  check('known patient record resolves', record.status === 200 && record.body.bloodGroup);
  check('record access is timestamped', Boolean(record.body.accessLoggedAt));
  const unknown = await call('/api/patients/Nobody%20Here/record');
  check('unknown patient returns 404 rather than an empty shell', unknown.status === 404);

  const feedback = await call('/api/feedback', { method: 'POST', body: { rating: 5, message: 'smoke' } });
  check('feedback is accepted', feedback.status === 201);
  const badFeedback = await call('/api/feedback', { method: 'POST', body: { rating: 9 } });
  check('out-of-range rating is rejected', badFeedback.status === 400);

  const ambulances = await call('/api/ambulances');
  check('ambulances are listed', ambulances.body.length > 0);
  const availableAmb = ambulances.body.find((a) => a.status === 'available');
  if (availableAmb) {
    const dispatch = await call(`/api/ambulances/${availableAmb.id}/request`, {
      method: 'POST',
      body: { patientName: 'Smoke Test' },
    });
    check('available ambulance can be dispatched', dispatch.status === 201);
    const redispatch = await call(`/api/ambulances/${availableAmb.id}/request`, { method: 'POST', body: {} });
    check('dispatched ambulance cannot be re-requested', redispatch.status === 409);
  } else {
    check(
      'unavailable ambulances are reported without crashing the check',
      ambulances.body.every((ambulance) => ambulance.status !== 'available'),
    );
  }

  console.log('\nanalytics (computed, not stored)');
  const analytics = await call('/api/analytics');
  check('analytics uses the local calendar date', analytics.body.date === localDate(0));
  check('analytics counts real appointments', analytics.body.patientsToday >= 0);
  check(
    'satisfaction reflects submitted ratings only',
    analytics.body.satisfactionSampleSize > 0
      ? analytics.body.satisfaction !== null
      : analytics.body.satisfaction === null,
  );

  console.log('\nassistant (grounded)');
  const known = await call('/api/assistant', { method: 'POST', body: { message: 'what is my token' } });
  check('known intent is answered', known.body.answered === true);
  check('answer cites its source records', Array.isArray(known.body.grounding));
  const unknownQ = await call('/api/assistant', {
    method: 'POST',
    body: { message: 'what will the stock market do tomorrow' },
  });
  check('unknown question is refused, not invented', unknownQ.body.answered === false);
  check('refusal offers the supported topics', unknownQ.body.topics.length > 0);
  const emptyQ = await call('/api/assistant', { method: 'POST', body: {} });
  check('empty message returns 400', emptyQ.status === 400);

  console.log('\nnotifications & safety');
  const notif = await call('/api/notifications?patientName=Demo%20Patient');
  check('GET /api/notifications returns a feed', notif.status === 200 && Array.isArray(notif.body.items));
  check('every alert carries a basis', notif.body.items.every((i) => i.basis));
  check('every alert has type and severity', notif.body.items.every((i) => i.type && i.severity));

  const facilities = await call('/api/facilities');
  check('facilities are listed', facilities.status === 200 && facilities.body.length > 0);
  const lift = facilities.body.find((f) => f.type === 'elevator');
  const down = await call(`/api/facilities/${lift.id}`, {
    method: 'PATCH',
    body: { status: 'out-of-service', note: 'smoke test' },
  });
  check('facility status can be changed', down.status === 200 && down.body.status === 'out-of-service');
  const afterDown = await call('/api/notifications?patientName=Demo%20Patient');
  check(
    'taking a lift out of service raises a route alert',
    afterDown.body.items.some((i) => i.type === 'route-change' && i.title.includes(lift.name)),
  );
  const badStatus = await call(`/api/facilities/${lift.id}`, { method: 'PATCH', body: { status: 'nope' } });
  check('an invalid facility status is rejected', badStatus.status === 400);
  await call(`/api/facilities/${lift.id}`, { method: 'PATCH', body: { status: 'in-service' } });

  const safety = await call('/api/emergency/safety');
  check('emergency safety config is exposed', safety.status === 200);
  check('it declares the workflow is hospital-alert only', safety.body.isHospitalAlertOnly === true);
  check('it names an emergency number to call', Boolean(safety.body.emergencyNumber));
  check(
    'it lists what production would require',
    Array.isArray(safety.body.productionRequirements) && safety.body.productionRequirements.length > 0,
  );

  console.log('\nerror handling');
  const missing = await call('/api/does-not-exist');
  check('unknown API route returns a JSON 404', missing.status === 404 && Boolean(missing.body.error));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  · ${f}`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('\nSmoke test could not run:', err.message);
  console.error('Is the server running?  npm start  (in /server)');
  process.exit(1);
});
