# AURALIFE: detailed workshop summary

## One-sentence description

AURALIFE is a connected hospital-care prototype that gives patients, front-desk staff, and hospital administrators a shared view of the care journey: selecting a hospital, finding the right department or doctor, booking, receiving a token, following a queue, reaching the destination, escalating an emergency, and reviewing records or feedback.

## Problem statement

Patients often experience a hospital visit as a set of disconnected tasks. They must decide which hospital and department to use, search for an available doctor, wait without clear queue information, find unfamiliar rooms, repeat information, and get help quickly if the situation becomes urgent. At the same time, staff and administrators need to coordinate walk-ins, appointments, emergency priority cases, doctors, and capacity, often without the same live context the patient sees.

The result is avoidable uncertainty, missed appointments, crowding at reception, and delays in directing the right person to the right care location. This is especially hard for first-time visitors, older adults, attendants, and people who speak different languages.

## Proposed solution

AURALIFE acts as a single digital front door for the hospital visit. It does not attempt to diagnose patients. It helps people navigate the operational side of getting care and makes that information visible to the hospital team.

The prototype brings together:

- Hospital selection and doctor/department discovery
- Appointment booking, consultation fee selection, token generation, and a payment mock-up
- Live queue status, estimated wait, and walk-in check-in
- Indoor directions with floor, distance, time, accessible-route preference, and route handoff
- An emergency fast-track alert that creates a priority appointment and gives staff an acknowledgment action
- Hospital ambulance availability and direct request flow
- Consent-aware health record viewing and access logging
- Feedback collection, staff tasks, operational analytics, and role-based workspaces
- English, Telugu, and Hindi patient-facing labels

## Who uses it

| User | What AURALIFE helps them do |
|---|---|
| Patient or attendant | Choose a hospital, book care, see a token and wait estimate, navigate, request urgent help, view records, and submit feedback |
| Front-desk or clinical staff | Check in walk-ins, monitor the active queue, complete the current visit, and see urgent tasks |
| Administrator | Monitor daily queue conditions, doctor capacity, no-shows, feedback, emergency alerts, and ambulance requests |

## How the main flow works

1. The patient selects one or more hospitals.
2. The app maps a stated problem to a department and shows relevant doctors.
3. The patient chooses a slot and receives an appointment token.
4. The patient sees the current queue, people ahead, estimated wait, doctor, and room.
5. The navigation view guides the patient from the entrance to the destination, including an accessible route option.
6. Staff manage the same queue, including walk-ins and the next patient.
7. If an urgent situation occurs, the patient can send an emergency alert. The server routes it to a hospital and doctor, creates a zero-fee priority token, and gives the administrator an acknowledgment action.
8. After care, the patient can review consent-aware records and submit feedback. Administrators can use the resulting operational data.

## Technical implementation in this repository

The repository contains a Vite client and an Express server with a JSON-backed demo database.

- `client/src/api/client.js` provides the browser API client.
- `client/src/hooks/useResource.js` supports resource fetching in the client.
- `server/src/index.js` starts the API.
- `server/src/db.js` reads and mutates the seeded JSON state.
- `server/data/auralife.json` seeds 4 Visakhapatnam hospitals, 15 departments, doctors, destinations, ambulances, patients, appointments, feedback, and staff tasks.
- `server/src/routes/catalog.js` exposes hospitals, departments, doctors, problem-to-specialist mapping, and destinations.
- `server/src/routes/appointments.js` creates and manages appointments, tokens, payment state, and walk-ins.
- `server/src/routes/operations.js` manages emergency alerts, ambulance requests, patient records, feedback, staff tasks, and computed analytics.
- `server/src/routes/assistant.js` provides a rule-based assistant endpoint for common service questions.
- `preview (2).html` is a feature-rich standalone UI prototype showing Patient, Maps, Staff, and Admin experiences.

## Important prototype details to say clearly

- The hospitals, doctors, queues, records, ambulance availability, payments, and metrics are demo or seeded data. They are not live clinical data.
- The emergency flow is a prototype workflow. A real deployment needs clinical governance, escalation policies, fallback channels, location verification, and integration with emergency dispatch.
- The assistant answers service-navigation questions. It should not provide diagnosis or replace a clinician.
- Records are presented as consent-aware and access-logged. A production system would also need authentication, role-based authorization, encryption, retention rules, audit review, and compliance with applicable health-data law.

## Workshop takeaway

The value of AURALIFE is coordination. A hospital visit becomes easier when the patient and the hospital work from the same operational information: who the patient is seeing, when they will be seen, where to go, what to do during an emergency, and what the care team needs to prepare.

## Suggested 5-minute demo

1. Select AuraLife City Hospital and open the Patient view.
2. Show token #42, estimated wait, doctor room, and the live queue.
3. Open Maps and demonstrate a route to the doctor or Emergency Department. Turn on the accessible route preference.
4. Send an emergency fast-track request, then switch to Admin and acknowledge the alert.
5. Open Staff workspace and show queue control or walk-in check-in.
6. Finish with records, feedback, and analytics, explaining that each is demo data but represents the shared operational view.
