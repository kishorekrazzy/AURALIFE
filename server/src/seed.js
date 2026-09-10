import { setState, load, paths } from './db.js';
import { todayLocal } from './util.js';

/**
 * Seed data for AURALIFE.
 *
 * Every value the UI can display originates here or is derived from it by an
 * endpoint. Nothing is generated in the browser, so the client cannot invent
 * doctors, fees, tokens or wait times that the server does not know about.
 */

const DEPARTMENTS = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Dermatology',
  'Gastroenterology', 'Gynecology', 'Obstetrics & Gynecology', 'Ophthalmology',
  'ENT', 'Neurology', 'Pulmonology', 'Urology', 'Dentistry', 'Psychiatry',
];

const HOSPITALS = [
  { name: 'AuraLife City Hospital', city: 'Visakhapatnam', area: 'MVP Colony', type: 'Multi-specialty', distanceKm: 1.2, phone: '0891-000-1100', beds: 320 },
  { name: 'CarePlus Multispeciality Hospital', city: 'Visakhapatnam', area: 'Dwaraka Nagar', type: 'Multi-specialty', distanceKm: 2.6, phone: '0891-000-2200', beds: 260 },
  { name: 'Harbor Health Hospital', city: 'Visakhapatnam', area: 'Siripuram', type: 'Advanced care', distanceKm: 3.4, phone: '0891-000-3300', beds: 180 },
  { name: 'Sunrise Medical Centre', city: 'Visakhapatnam', area: 'Gajuwaka', type: 'General & specialty', distanceKm: 5.1, phone: '0891-000-4400', beds: 140 },
];

// name, department, fee (₹), experience (years), consulting room
const DOCTORS = [
  ['Dr. Anjali Mehra', 'General Medicine', 500, 12, 'Room 4'],
  ['Dr. Kiran Rao', 'General Medicine', 450, 10, 'Room 5'],
  ['Dr. Ravi Kumar', 'General Medicine', 400, 10, 'Room 6'],
  ['Dr. Meera Shah', 'Psychiatry', 550, 8, 'Room 21'],
  ['Dr. Rahul Varma', 'Cardiology', 650, 15, 'Room 12'],
  ['Dr. Sneha Reddy', 'Cardiology', 700, 13, 'Room 13'],
  ['Dr. Aditya Rao', 'Cardiology', 750, 14, 'Room 14'],
  ['Dr. Arjun Kumar', 'Orthopedics', 600, 11, 'Room 8'],
  ['Dr. Ravi Teja', 'Orthopedics', 550, 11, 'Room 9'],
  ['Dr. Priya Nair', 'Pediatrics', 450, 9, 'Room 1'],
  ['Dr. Bindhu Lakshmi', 'Pediatrics', 400, 8, 'Room 2'],
  ['Dr. Neha Kapoor', 'Dermatology', 500, 7, 'Room 17'],
  ['Dr. Bindhu Reddy', 'Dermatology', 450, 9, 'Room 18'],
  ['Dr. Suresh Rao', 'Gastroenterology', 600, 12, 'Room 22'],
  ['Dr. Pooja Menon', 'Gynecology', 550, 10, 'Room 24'],
  ['Dr. Bindhu Priya', 'Gynecology', 500, 10, 'Room 25'],
  ['Dr. Lakshmi Devi', 'Obstetrics & Gynecology', 650, 11, 'Room 26'],
  ['Dr. Bindhu Rao', 'Ophthalmology', 500, 9, 'Room 30'],
  ['Dr. Ravi Sharma', 'ENT', 450, 10, 'Room 31'],
  ['Dr. Manoj Joshi', 'Neurology', 700, 13, 'Room 33'],
  ['Dr. Arjun Rao', 'Pulmonology', 600, 11, 'Room 35'],
  ['Dr. Vikram Singh', 'Urology', 600, 12, 'Room 37'],
  ['Dr. Kiran Varma', 'Dentistry', 400, 10, 'Room 39'],
];

// problem key, patient-facing label, department, preferred doctor
const PROBLEMS = [
  ['fever', 'Fever, cold or general weakness', 'General Medicine', 'Dr. Ravi Kumar'],
  ['skin', 'Skin rash, itching or skin problem', 'Dermatology', 'Dr. Bindhu Reddy'],
  ['bone', 'Bone, joint or muscle pain', 'Orthopedics', 'Dr. Ravi Teja'],
  ['heart', 'Chest discomfort or heart-related concern', 'Cardiology', 'Dr. Rahul Varma'],
  ['child', 'Child health problem', 'Pediatrics', 'Dr. Bindhu Lakshmi'],
  ['stomach', 'Stomach or digestive problem', 'Gastroenterology', 'Dr. Suresh Rao'],
  ['women', "Women's health concern", 'Gynecology', 'Dr. Bindhu Priya'],
  ['eye', 'Eye-related problem', 'Ophthalmology', 'Dr. Bindhu Rao'],
  ['ear', 'Ear, nose or throat problem', 'ENT', 'Dr. Ravi Sharma'],
  ['neuro', 'Headache, dizziness or nerve-related problem', 'Neurology', 'Dr. Manoj Joshi'],
  ['breathing', 'Cough, asthma or breathing problem', 'Pulmonology', 'Dr. Arjun Rao'],
  ['kidney', 'Kidney, urinary or bladder problem', 'Urology', 'Dr. Vikram Singh'],
  ['dental', 'Tooth or gum problem', 'Dentistry', 'Dr. Kiran Varma'],
  ['mental', 'Stress, sleep or mental-wellness concern', 'Psychiatry', 'Dr. Meera Shah'],
  ['maternity', 'Pregnancy or maternity care', 'Obstetrics & Gynecology', 'Dr. Lakshmi Devi'],
];

const SLOT_TIMES = [
  '09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20',
  '11:40', '12:00', '12:20', '14:00', '14:20', '14:40', '15:00', '15:20',
  '15:40', '16:00', '16:20', '16:40',
];

const INSIGHTS = [
  {
    title: 'How to maintain a healthy heart',
    readMinutes: 5,
    category: 'Cardiology',
    summary:
      'Blood pressure, activity and sleep are the three levers with the strongest evidence behind them. Reviewed by the cardiology department.',
  },
  {
    title: 'Managing seasonal fever at home',
    readMinutes: 3,
    category: 'General Medicine',
    summary:
      'When rest and fluids are enough, and the specific signs that mean you should come in.',
  },
  {
    title: 'Preparing for a lab test',
    readMinutes: 4,
    category: 'Pathology',
    summary:
      'Fasting windows, medication timing and what to bring to the sample collection desk.',
  },
];

const DESTINATIONS = [
  { name: 'General Medicine · Dr. Anjali Mehra', room: 'Room 204', floor: 2, distanceMetres: 120, walkMinutes: 2, category: 'Consulting', stepFree: true, keywords: 'general medicine anjali mehra room 204 clinic' },
  { name: 'Cardiology', room: 'Room 12', floor: 2, distanceMetres: 142, walkMinutes: 4, category: 'Consulting', stepFree: true, keywords: 'cardiology heart clinic room 12' },
  { name: 'X-Ray & Imaging', room: 'Imaging 2', floor: 2, distanceMetres: 118, walkMinutes: 3, category: 'Diagnostics', stepFree: true, keywords: 'x ray radiology imaging scan' },
  { name: 'Laboratory', room: 'Lab Reception', floor: 2, distanceMetres: 96, walkMinutes: 3, category: 'Diagnostics', stepFree: true, keywords: 'laboratory lab blood test sample' },
  { name: 'Pharmacy', room: 'Pharmacy Counter', floor: 1, distanceMetres: 54, walkMinutes: 1, category: 'Services', stepFree: true, keywords: 'pharmacy medicines chemist' },
  { name: 'Emergency Department', room: 'Emergency Entrance', floor: 1, distanceMetres: 72, walkMinutes: 2, category: 'Emergency', stepFree: true, keywords: 'emergency casualty trauma 24/7' },
  { name: 'Registration & Reception', room: 'Main Reception', floor: 1, distanceMetres: 34, walkMinutes: 1, category: 'Services', stepFree: true, keywords: 'registration reception help desk admission' },
  { name: 'Cafeteria', room: 'Visitor Cafeteria', floor: 3, distanceMetres: 210, walkMinutes: 6, category: 'Services', stepFree: true, keywords: 'cafeteria food canteen coffee' },
  { name: 'Accessible Restroom', room: 'Restroom A', floor: 1, distanceMetres: 48, walkMinutes: 1, category: 'Facilities', stepFree: true, keywords: 'toilet restroom washroom accessible' },
  { name: 'Elevator Bank', room: 'Lift A', floor: 1, distanceMetres: 42, walkMinutes: 1, category: 'Facilities', stepFree: true, keywords: 'elevator lift stairs core' },
];

/* Physical assets whose status can change a route. Route notifications are
   derived from these records, never guessed. */
const FACILITIES = [
  { name: 'Elevator A', type: 'elevator', serves: [1, 2, 3], status: 'in-service', note: '' },
  { name: 'Elevator B', type: 'elevator', serves: [1, 2, 3], status: 'in-service', note: '' },
  { name: 'Accessible Ramp', type: 'ramp', serves: [1, 2], status: 'in-service', note: '' },
  { name: 'North Stairwell', type: 'stairs', serves: [1, 2, 3], status: 'in-service', note: '' },
];

function id(prefix, n) {
  return `${prefix}${String(n).padStart(3, '0')}`;
}

function todayISO() {
  return todayLocal();
}

export function buildSeed() {
  const departments = DEPARTMENTS.map((name, i) => ({ id: id('dep', i + 1), name }));
  const depByName = Object.fromEntries(departments.map((d) => [d.name, d.id]));

  const hospitals = HOSPITALS.map((h, i) => ({
    id: id('hos', i + 1),
    name: h.name,
    city: h.city,
    area: h.area,
    type: h.type,
    distanceKm: h.distanceKm,
    phone: h.phone,
    beds: h.beds,
  }));

  // Spread doctors across hospitals so every hospital has a real roster.
  const doctors = DOCTORS.map(([name, dept, fee, experienceYears, room], i) => ({
    id: id('doc', i + 1),
    name,
    departmentId: depByName[dept],
    department: dept,
    hospitalId: hospitals[i % hospitals.length].id,
    fee,
    experienceYears,
    room,
    status: i % 4 === 0 ? 'busy' : 'available',
    initials: name.replace('Dr. ', '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
  }));

  const docByName = Object.fromEntries(doctors.map((d) => [d.name, d]));

  const problems = PROBLEMS.map(([key, label, dept, preferred]) => ({
    key,
    label,
    department: dept,
    departmentId: depByName[dept],
    recommendedDoctorId: docByName[preferred] ? docByName[preferred].id : null,
  }));

  const today = todayISO();
  const primary = hospitals[0];
  const anjali = docByName['Dr. Anjali Mehra'];

  // A realistic in-progress OPD queue for the primary hospital.
  const queueSeed = [
    ['Vikram Nair', 'serving', '10:00', 'follow-up'],
    ['Ramesh Iyer', 'waiting', '11:00', 'new'],
    ['Fatima Sheikh', 'waiting', '11:20', 'follow-up'],
    ['Demo Patient', 'waiting', '11:40', 'new'],
    ['Karan Patel', 'waiting', '12:00', 'follow-up'],
    ['Neha Verma', 'waiting', '12:20', 'new'],
  ];

  let tokenCounter = 38;
  const appointments = queueSeed.map(([patientName, status, time, type], i) => {
    tokenCounter += 1;
    return {
      id: id('apt', i + 1),
      token: tokenCounter,
      patientName,
      doctorId: anjali.id,
      hospitalId: primary.id,
      department: anjali.department,
      date: today,
      time,
      type,
      fee: anjali.fee,
      paid: i < 2,
      status: status === 'serving' ? 'in-progress' : 'waiting',
      source: 'appointment',
      createdAt: new Date(Date.now() - (queueSeed.length - i) * 9 * 60000).toISOString(),
    };
  });

  const ambulances = [
    { id: id('amb', 1), hospitalId: primary.id, name: 'AuraLife Ambulance 01', contact: '108 / 24x7 desk', type: 'Advanced Life Support', status: 'available', etaMinutes: 6 },
    { id: id('amb', 2), hospitalId: primary.id, name: 'AuraLife Ambulance 02', contact: 'Hospital Desk · 0891-000-1122', type: 'Basic Life Support', status: 'available', etaMinutes: 9 },
    { id: id('amb', 3), hospitalId: primary.id, name: 'AuraLife Ambulance 03', contact: 'Hospital Desk · 0891-000-1133', type: 'Patient Transport', status: 'on-trip', etaMinutes: 18 },
  ];

  const patients = [
    {
      id: id('pat', 1),
      name: 'Demo Patient',
      bloodGroup: 'B+',
      heightCm: 168,
      weightKg: 62,
      allergies: ['Penicillin'],
      familyHistory: ['Hypertension'],
      consent: 'Shared with consulting doctor only',
      visits: [
        { date: '2026-07-14', department: 'Dermatology', summary: 'Follow-up consultation · Prescription recorded' },
        { date: '2026-06-12', department: 'General Medicine', summary: 'Blood group, allergy and baseline history updated' },
        { date: '2026-03-22', department: 'Cardiology', summary: 'ECG report uploaded · Follow-up advised' },
      ],
      reports: [
        { name: 'ECG Report', date: '2026-03-22', type: 'Cardiology' },
        { name: 'Blood Test', date: '2026-06-12', type: 'Pathology' },
        { name: 'Dermatology Prescription', date: '2026-07-14', type: 'Prescription' },
      ],
      prescriptions: [{ drug: 'Cetirizine 10mg', dosage: 'Once daily', since: '2026-07-14' }],
    },
    {
      id: id('pat', 2),
      name: 'Ramesh Iyer',
      bloodGroup: 'O+',
      heightCm: 174,
      weightKg: 78,
      allergies: [],
      familyHistory: ['Diabetes'],
      consent: 'Shared with consulting doctor only',
      visits: [{ date: '2026-05-02', department: 'General Medicine', summary: 'Routine check-up · Blood sugar monitoring advised' }],
      reports: [{ name: 'HbA1c Panel', date: '2026-05-02', type: 'Pathology' }],
      prescriptions: [],
    },
  ];

  const staffTasks = [
    { id: id('tsk', 1), task: 'Verify appointments', detail: 'Morning OPD appointments', status: 'done' },
    { id: id('tsk', 2), task: 'Check patient arrivals', detail: 'General Medicine', status: 'in-progress' },
    { id: id('tsk', 3), task: 'Notify next patients', detail: 'Queue notifications', status: 'active' },
    { id: id('tsk', 4), task: 'Update doctor status', detail: 'Room availability', status: 'pending' },
  ];

  return {
    meta: { version: 1, seededAt: new Date().toISOString(), currency: 'INR' },
    departments,
    hospitals,
    doctors,
    problems,
    slotTimes: SLOT_TIMES,
    appointments,
    ambulances,
    patients,
    staffTasks,
    destinations: DESTINATIONS.map((d, i) => ({ id: id('dst', i + 1), ...d })),
    insights: INSIGHTS.map((x, i) => ({ id: id('ins', i + 1), ...x })),
    facilities: FACILITIES.map((f, i) => ({ id: id('fac', i + 1), ...f })),
    emergencies: [],
    feedback: [],
    ambulanceRequests: [],
    counters: { token: tokenCounter, appointment: appointments.length },
    stats: { patientsToday: 184, noShows: 6, satisfaction: 4.7 },
    settings: {
      // Every travel estimate the app shows is computed from these, and the
      // numbers are returned alongside the estimate so it can be checked.
      travel: { assumedSpeedKmh: 18, checkInBufferMinutes: 10 },
      queue: { averageConsultMinutes: 6, lateThresholdMinutes: 10 },
      emergency: {
        // Surfaced in the UI: this workflow alerts the hospital, it does not
        // dispatch a national emergency response.
        isHospitalAlertOnly: true,
        emergencyNumber: '112',
        ambulanceNumber: '108',
        productionRequirements: [
          'Verified device location shared with the responding team',
          'Escalation rules with timeouts and on-call fallback',
          'Automatic fallback to a voice call if no acknowledgement',
        ],
      },
    },
  };
}

const isDirect = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isDirect) {
  const force = process.argv.includes('--reset');
  if (!force && load()) {
    console.log(`Datastore already exists at ${paths.DATA_FILE}. Use --reset to overwrite.`);
    process.exit(0);
  }
  setState(buildSeed());
  console.log(`Seeded AURALIFE datastore → ${paths.DATA_FILE}`);
}
