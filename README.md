# AURALIFE

Connected hospital care platform — an **Express API** with a **React (JSX)** front end.

Every value the interface shows comes from the server. There is no mock data, no
placeholder record and no client-side "example" fallback, so the UI cannot show a
doctor, fee, token or wait time that the backend does not actually hold.

```
Harshini/
├── server/          Express API + JSON datastore
│   ├── src/
│   │   ├── index.js         app entry, static hosting of the built client
│   │   ├── db.js            atomic JSON document store
│   │   ├── seed.js          seed data (hospitals, doctors, queue, records…)
│   │   ├── util.js          local-calendar date helpers
│   │   └── routes/          catalog · appointments · operations · notifications · assistant
│   ├── test/                58-check API smoke test + 32 notification unit tests
│   └── data/auralife.json   the datastore (git-ignored)
├── client/          Vite + React 18, plain JSX
│   └── src/
│       ├── api/client.js    the only place that talks to the network
│       ├── hooks/           useResource / useAction (loading·error·empty·data)
│       ├── components/      shell, UI primitives, notifications, assistant, emergency
│       ├── views/           9 screens
│       └── styles/          design tokens + component layer
└── preview (2).html  the original single-file prototype (kept for reference)
```

## Run it

```bash
npm run install:all     # installs server + client dependencies
npm run dev             # API on :4000, client on :5173 (with /api proxy)
```

Open **http://localhost:5173**.

For a single-origin production run:

```bash
npm run build           # builds the client into client/dist
npm start               # Express serves the API *and* the built client on :4000
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm test` | runs the notification unit tests, then the API smoke test (90 checks) |
| `npm run test:unit` | notification derivations only — no server needed |
| `npm run test:api` | API smoke test against a running server |
| `npm run seed` | resets the datastore to seed data |
| `npm run dev:server` / `npm run dev:client` | run one side only |

## Deploying to Netlify and GitHub Pages

This repository now includes a [Netlify configuration](netlify.toml) that builds
the React client, rewrites `/api/*` to a Netlify Function, and serves the SPA
entry point for every client route. In Netlify, import the repository and use
the committed configuration; no dashboard build settings are needed.

For GitHub Pages, the included workflow publishes the frontend when changes are
pushed to `main`. Before enabling it, create a repository variable named
`NETLIFY_API_URL` with the value of the deployed API, including `/api`, for
example `https://your-site.netlify.app/api`. Then open **Settings → Pages** and
select **GitHub Actions** as the source.

GitHub Pages is static hosting, so it uses the Netlify API URL. Netlify Functions
are suitable for this demo, but their local filesystem is ephemeral; use a
managed database before relying on bookings or emergency records in production.

## API

Base URL `/api`.

**Catalog**

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/hospitals` · `/hospitals/:id` | roster + department list per hospital |
| GET | `/departments` | with live doctor counts |
| GET | `/doctors?department=&hospitalId=&q=` | filtered roster |
| GET | `/doctors/:id` | 404 if unknown |
| GET | `/problems` | patient-facing problem list |
| GET | `/problems/:key/specialists` | problem → department → real doctors |
| GET | `/destinations?q=` | indoor-navigation destinations |

**Appointments & queue**

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/appointments/slots?doctorId=&date=` | availability derived from real bookings |
| GET | `/appointments?patientName=&date=&status=…` | filtered list |
| POST | `/appointments` | 409 on a double-booked slot, 400 listing missing fields |
| PATCH | `/appointments/:id` | status / date / time / paid |
| POST | `/appointments/:id/pay` | records a payment reference |
| GET | `/appointments/queue/live` | projection with per-token wait estimates |
| POST | `/appointments/queue/next` | closes the current consult, promotes the next |
| POST | `/appointments/queue/walkin` | front-desk check-in |

**Operations**

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET POST | `/emergency` | raising one also issues a priority token |
| POST | `/emergency/:id/acknowledge` · DELETE `/emergency/:id` | |
| GET | `/ambulances` · POST `/ambulances/:id/request` | 409 if already dispatched |
| GET | `/patients` · `/patients/:name/record` | 404 rather than an empty shell |
| GET POST | `/feedback` | rating validated 1–5 |
| GET | `/staff/tasks` · PATCH `/staff/tasks/:id` | |
| GET | `/analytics` | **computed** from stored records on every request |

**Notifications & safety**

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/notifications?patientName=` | derived alerts, each with the `basis` it was computed from |
| GET | `/facilities` · PATCH `/facilities/:id` | lift/ramp status; a change re-routes affected patients |
| GET | `/emergency/safety` | the limits of the emergency workflow, rendered verbatim in the UI |

**Assistant**

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/assistant` | grounded answer + the records it used |
| GET | `/assistant/topics` | what it can actually answer |

## How hallucination is prevented

1. **No client-side data.** `client/src/api/client.js` is the only network path.
   Nothing else holds a hardcoded doctor, fee or token.
2. **Four explicit states.** `useResource` + `<Resource>` force every view to
   branch on loading / error / empty / data. An unanswered request renders a
   spinner or an error — never a confident-looking placeholder.
3. **Errors surface verbatim.** Non-2xx responses become `ApiError`s carrying the
   server's own message, shown to the user.
4. **The assistant is not generative.** `server/src/routes/assistant.js` matches
   an intent, then assembles the reply from stored records and returns the record
   ids in `grounding` (shown under each reply in the UI). No intent match returns
   `answered: false` and a list of what it *can* answer.
5. **Derived numbers are computed server-side.** Slot availability, queue
   positions, wait estimates and analytics are calculated from records at request
   time. Patient satisfaction returns `null` — and the UI prints "—" — when no
   ratings exist, instead of inventing a score.

## Notifications

`GET /api/notifications` derives five kinds of alert from live records. None of
them are stored strings, and each carries a `basis` object listing the inputs it
was computed from — surfaced in the UI behind "Why am I seeing this?".

| Alert | Derived from |
| --- | --- |
| *Leave home in 12 minutes to arrive before your token* | hospital `distanceKm`, the configured travel speed and check-in buffer, queue position, scheduled slot |
| *Doctor is running 18 minutes late* | the in-progress appointment's scheduled time vs. now, against `lateThresholdMinutes` |
| *You are next in queue* | the patient's position in the live queue projection |
| *Route changed because Elevator A is unavailable* | `facilities` status, the destination floor, and which alternative is still in service |
| *Emergency team acknowledged your alert* | the emergency record's status transition |

If the inputs for an alert are missing, the alert is simply not produced. The
leave-time alert is also suppressed outside a three-hour window so it stays
actionable rather than announcing "leave in 11 hours".

Travel assumptions live in `settings.travel` (`assumedSpeedKmh`,
`checkInBufferMinutes`) and are shown to the patient alongside the estimate.

Take a lift out of service from **Admin Console → Facility status** to see the
route alert appear on the dashboard.

## The patient dashboard

The dashboard answers four questions before anything else, in this order:

1. **What needs my attention now?** — critical and warning alerts, or nothing at all
2. **What is my health status today?** — today's state plus blood group, allergies, last visit, active medication
3. **Do I have an upcoming appointment?** — doctor, department, date, time, live token and queue position
4. **When should I leave?** — the leave-by time with the distance and speed it was derived from

Browse-oriented sections (booking promo, services, insights) sit below those
answers.

## Emergency safety

The emergency shortcut is framed as what it is: **a hospital alert workflow, not
an emergency service**.

- Calling emergency services is the primary action — `112` (unified) and `108`
  (ambulance), plus the selected hospital's own line, all as real `tel:` links.
- The dialog states plainly that the app **cannot dispatch an ambulance or reach
  an emergency operator**, before the in-app alert can be sent.
- After sending, the confirmation repeats that the alert reaches the hospital's
  own team only, and to call `112` if nobody acknowledges.
- A "What this prototype does not do" disclosure lists what a production version
  would require: verified device location shared with the responding team,
  escalation rules with timeouts and on-call fallback, and automatic fallback to
  a voice call if no acknowledgement. These come from `settings.emergency` so the
  UI cannot drift from the stated policy.

## Design

White surfaces, **pure black ink**, and a single **logo blue** (`#1668E3`) as the
only accent. The dark theme inverts to true black (`#000000`) with the same blue
brightened for contrast; both are defined as tokens in
`client/src/styles/theme.css`.

**Mobile architecture** (≤900px): sticky app bar, off-canvas navigation drawer
with scrim, five-item bottom tab bar, bottom-sheet modals and assistant, 44px
minimum tap targets, `env(safe-area-inset-*)` handling for notch and home bar,
horizontally scrollable role chips, and tables that reflow into labelled cards at
≤720px. Hash routing (`#/queue`) keeps the browser and gesture Back button
working.
