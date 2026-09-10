import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { Empty, formatDate } from '../components/ui.jsx';
import { Icon } from '../components/Icons.jsx';
import EmergencyDialog from '../components/EmergencyDialog.jsx';
import {
  ServiceIcon,
  ECGPulseChart,
  StepWaveChart,
  SleepHistogram,
  UI,
} from '../components/HomeArt.jsx';

const doctorImage = '/doctor-transparent.png';

/* 4 Main Services matching Reference Image 1 */
const SERVICES = [
  {
    key: 'consultation',
    title: 'Doctor',
    sub: 'Consultation',
    icon: ServiceIcon.consultation,
    bg: 'var(--pastel-blue)',
    color: 'var(--pastel-blue-icon)',
    go: 'doctors',
  },
  {
    key: 'medication',
    title: 'Medicines',
    sub: 'Pharmacy',
    icon: ServiceIcon.medication,
    bg: 'var(--pastel-amber)',
    color: 'var(--pastel-amber-icon)',
    go: 'records',
  },
  {
    key: 'records',
    title: 'Reports',
    sub: 'Health files',
    icon: ServiceIcon.lab,
    bg: 'var(--pastel-mint)',
    color: 'var(--pastel-mint-icon)',
    go: 'records',
  },
  {
    key: 'checkup',
    title: 'Lab Tests',
    sub: 'Diagnostics',
    icon: ServiceIcon.checkup,
    bg: 'var(--pastel-rose)',
    color: 'var(--pastel-rose-icon)',
    go: 'appointments',
  },
];

const BANNERS = [
  {
    id: 'medical-services',
    headline: 'Get the Best Medical Services',
    subtitle: 'We provide best quality medical service without further cost.',
    cta: 'Book Appointment',
    target: 'appointments',
    theme: 'cyan',
  },
  {
    id: 'live-queue',
    headline: 'Smart Wait Time & Live Queue',
    subtitle: 'Track your token in real-time and arrive right on schedule.',
    cta: 'View Live Queue',
    target: 'queue',
    theme: 'blue',
  },
  {
    id: 'fast-track',
    headline: 'Instant 24/7 Emergency Care',
    subtitle: 'Immediate priority hospital routing and direct staff alert.',
    cta: 'Emergency Fast-Track',
    target: 'emergency',
    theme: 'rose',
  },
];

export default function Dashboard({ ctx }) {
  const { patientName, navigate, queue, emergencies, notifications } = ctx;

  const mine = useResource(() => api.appointments({ patientName }), [patientName], {
    pollMs: 20000,
  });
  const record = useResource(() => api.record(patientName).catch(() => null), [patientName]);
  const insights = useResource(() => api.insights(), []);

  const [search, setSearch] = useState('');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);

  // Auto-rotate hero banners every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const alerts = notifications.data ? notifications.data.items : [];
  const attention = alerts.filter((a) => a.severity !== 'info' && a.type !== 'leave-time');
  const leaveAlert = alerts.find((a) => a.type === 'leave-time');
  const openEmergency = (emergencies.data || []).find((e) => e.status !== 'resolved');

  const upcomingList = (mine.data || [])
    .filter((a) => ['waiting', 'in-progress', 'confirmed'].includes(a.status))
    .sort((a, b) => a.token - b.token);

  const upcoming = upcomingList[0] || null;

  const liveQueue = queue.data;
  const position = upcoming && liveQueue
    ? liveQueue.entries.findIndex((e) => e.id === upcoming.id)
    : -1;

  function submitSearch(e) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    try {
      sessionStorage.setItem('auralife.doctorSearch', q);
    } catch {
      /* ignore */
    }
    navigate('doctors');
  }

  const rec = record.data || {
    bloodGroup: 'A+',
    weightKg: 80,
    heightCm: 175,
    reports: [
      { name: 'General Health', type: 'Complete Body Checkup', count: 8 },
      { name: 'Diabetes', type: 'Glucose & HbA1c Panel', count: 4 },
    ],
  };

  const banner = BANNERS[activeBanner];

  return (
    <div className="home-container">
      {/* ------------------------------------------------ Top Greeting Header */}
      <header className="ref-home-header">
        <div className="ref-greeting-wrap">
          <div className="ref-greeting-sub">
            <span>👋</span> Hello!
          </div>
          <h1 className="ref-greeting-name">{patientName || 'Martin Shah'}</h1>
        </div>
        <div className="ref-header-actions">
          <button
            type="button"
            className="ref-avatar-btn"
            onClick={() => navigate('records')}
            aria-label="User Profile"
          >
            <div className="ref-avatar-img">
              <img src={doctorImage} alt="Care team member" />
            </div>
            <span className="ref-status-dot" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------ Search Bar with Filter Icon */}
      <form className="ref-search-form" onSubmit={submitSearch} role="search">
        <div className="ref-search-box">
          <UI.search className="ref-search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medical, doctors, records..."
            aria-label="Search medical"
          />
        </div>
        <button
          type="button"
          className="ref-filter-btn"
          onClick={() => navigate('doctors')}
          aria-label="Filter doctors"
        >
          <UI.sliders />
        </button>
      </form>

      {/* ------------------------------------------------ Services Grid (4 Pastel Squircles) */}
      <section className="ref-section ref-services-section">
        <div className="ref-section-head">
          <h2>Services</h2>
          <button type="button" className="ref-view-all" onClick={() => navigate('doctors')}>
            View all
          </button>
        </div>
        <div className="ref-services-grid">
          {SERVICES.map((s) => {
            const Glyph = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                className="ref-service-tile"
                onClick={() => navigate(s.go)}
              >
                <div
                  className="ref-service-squircle"
                  style={{ backgroundColor: s.bg, color: s.color }}
                >
                  <Glyph />
                </div>
                <span className="ref-service-title">{s.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------ Hero Promo Banner Card with Doctor Cutout */}
      <section className="ref-banner-section">
        <div className={`ref-hero-banner theme-${banner.theme}`}>
          <div className="ref-banner-content">
            <h3 className="ref-banner-title">{banner.headline}</h3>
            <p className="ref-banner-sub">{banner.subtitle}</p>
            <button
              type="button"
              className="ref-banner-btn"
              onClick={() => {
                if (banner.target === 'emergency') setEmergencyOpen(true);
                else navigate(banner.target);
              }}
            >
              {banner.cta}
            </button>
          </div>
          <div className="ref-banner-art-wrap">
            <img className="ref-banner-doctor-image" src={doctorImage} alt="Doctor" />
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="ref-banner-dots">
          {BANNERS.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              className={`ref-dot ${activeBanner === idx ? 'active' : ''}`}
              onClick={() => setActiveBanner(idx)}
              aria-label={`Show banner ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ Urgent Attention if active */}
      {attention.length > 0 && (
        <section className="ref-section attention-box ref-attention-section">
          <div className="ref-section-head">
            <h2>Needs Attention</h2>
            <span className="ref-attention-pill">{attention.length}</span>
          </div>
          <div className="ref-attention-stack">
            {attention.slice(0, 2).map((a) => (
              <div
                key={a.id}
                className={`ref-attention-card tone-${a.severity}`}
                onClick={() => (a.action ? navigate(a.action.view) : undefined)}
              >
                <div className="ref-attention-indicator" />
                <div className="ref-attention-body">
                  <b>{a.title}</b>
                  <span>{a.body}</span>
                </div>
                {a.action && <UI.chevron className="ref-chevron" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ Upcoming Appointments (Reference 1 Dual-Tone Cards) */}
      <section className="ref-section ref-appointments-section">
        <div className="ref-section-head">
          <h2>Upcoming Appointments</h2>
          <button type="button" className="ref-view-all" onClick={() => navigate('appointments')}>
            View all
          </button>
        </div>

        <div className="ref-appts-scroller">
          {upcoming ? (
            <>
              {/* Primary Teal Card */}
              <div
                className="ref-appt-card theme-teal"
                onClick={() => navigate('appointments')}
              >
                <div className="ref-appt-date-chip">
                  <span className="ref-date-day">
                    {upcoming.date ? new Date(upcoming.date).getDate() : '12'}
                  </span>
                  <span className="ref-date-weekday">
                    {upcoming.date
                      ? new Date(upcoming.date).toLocaleDateString('en-US', { weekday: 'short' })
                      : 'Tue'}
                  </span>
                </div>
                <div className="ref-appt-details">
                  <span className="ref-appt-time">{upcoming.time || '09:30 AM'}</span>
                  <h4 className="ref-appt-doctor">{upcoming.doctorName || 'Dr. Mim Akhter'}</h4>
                  <span className="ref-appt-spec">{upcoming.department || 'Depression / Consultation'}</span>
                  {position >= 0 && (
                    <span className="ref-appt-queue-tag">
                      Token #{upcoming.token} · {position === 0 ? 'You are next' : `${position} ahead`}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="ref-appt-menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('navigation');
                  }}
                  title="Directions to Clinic"
                >
                  <UI.dotsVertical />
                </button>
              </div>

              {/* Secondary Warm Orange Card */}
              <div
                className="ref-appt-card theme-orange"
                onClick={() => navigate('appointments')}
              >
                <div className="ref-appt-date-chip">
                  <span className="ref-date-day">13</span>
                  <span className="ref-date-weekday">Wed</span>
                </div>
                <div className="ref-appt-details">
                  <span className="ref-appt-time">11:00 AM</span>
                  <h4 className="ref-appt-doctor">Dr. Rajesh Varma</h4>
                  <span className="ref-appt-spec">Cardiology · Health Check</span>
                  <span className="ref-appt-queue-tag">Token #05 · On Schedule</span>
                </div>
                <button
                  type="button"
                  className="ref-appt-menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('appointments');
                  }}
                >
                  <UI.dotsVertical />
                </button>
              </div>
            </>
          ) : (
            <div className="ref-empty-appt-card">
              <div className="ref-empty-text">
                <b>No upcoming appointments</b>
                <span>Book a consultation with our verified doctors anytime.</span>
              </div>
              <button
                type="button"
                className="ref-book-now-btn"
                onClick={() => navigate('appointments')}
              >
                Book Now
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ Health at a Glance & Report Cards */}
      <section className="ref-section ref-health-section">
        <div className="ref-section-head">
          <h2>Here's your health at a glance</h2>
          <button type="button" className="ref-view-all" onClick={() => navigate('records')}>
            Full Report
          </button>
        </div>

        {/* Top Split Health Cards: Heart Rate & Steps */}
        <div className="ref-glance-grid">
          {/* Heart Rate Card (Reference Image 1 & 2) */}
          <div className="ref-glance-card theme-cyan">
            <div className="ref-glance-head">
              <div className="ref-glance-icon cyan">
                <UI.clock style={{ width: 16, height: 16 }} />
              </div>
              <span className="ref-glance-label">Heart Rate</span>
            </div>
            <div className="ref-glance-body">
              <div className="ref-val-unit">
                <span className="ref-big-val">96</span>
                <span className="ref-unit">bpm</span>
              </div>
              <div className="ref-chart-wrap">
                <ECGPulseChart color="#0284c7" />
              </div>
            </div>
          </div>

          {/* Steps Card (Reference Image 2) */}
          <div className="ref-glance-card theme-purple">
            <div className="ref-glance-head">
              <div className="ref-glance-icon purple">
                <UI.walker style={{ width: 16, height: 16 }} />
              </div>
              <span className="ref-glance-label">Daily Steps</span>
            </div>
            <div className="ref-glance-body">
              <div className="ref-val-unit">
                <span className="ref-big-val">2,200</span>
                <span className="ref-unit">Steps</span>
              </div>
              <div className="ref-chart-wrap">
                <StepWaveChart color="#8b5cf6" />
              </div>
            </div>
          </div>
        </div>

        {/* Middle Split Cards: Blood Group & Weight */}
        <div className="ref-mini-stats-grid">
          {/* Blood Group */}
          <div className="ref-mini-stat-card theme-rose">
            <div className="ref-mini-head">
              <span className="ref-mini-icon rose">
                <UI.waterDrop />
              </span>
              <button type="button" className="ref-mini-more" aria-label="More">
                <UI.dotsVertical />
              </button>
            </div>
            <span className="ref-mini-label">Blood Group</span>
            <span className="ref-mini-val">{rec.bloodGroup || 'A+'}</span>
          </div>

          {/* Weight */}
          <div className="ref-mini-stat-card theme-green">
            <div className="ref-mini-head">
              <span className="ref-mini-icon green">
                <UI.walker />
              </span>
              <button type="button" className="ref-mini-more" aria-label="More">
                <UI.dotsVertical />
              </button>
            </div>
            <span className="ref-mini-label">Weight</span>
            <span className="ref-mini-val">{rec.weightKg || 80} <small>kg</small></span>
          </div>
        </div>

        {/* Sleep Duration Card (Reference Image 2) */}
        <div className="ref-sleep-card">
          <div className="ref-sleep-left">
            <div className="ref-sleep-icon">
              <UI.moon />
            </div>
            <div>
              <div className="ref-sleep-val">9h 30m</div>
              <span className="ref-sleep-sub">Total sleep</span>
            </div>
          </div>
          <div className="ref-sleep-chart-wrap">
            <SleepHistogram activeIdx={4} />
            <div className="ref-sleep-timeline">
              <span>6am</span>
              <span>8am</span>
              <span>10am</span>
              <span>12am</span>
              <span>2pm</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Daily Recommendations */}
      <section className="ref-section ref-recommendations-section">
        <div className="ref-section-head">
          <h2>Daily recommendations</h2>
          <button type="button" className="ref-view-all" onClick={() => navigate('records')}>
            See all
          </button>
        </div>
        <div className="ref-recommend-card" onClick={() => navigate('records')}>
          <div className="ref-recommend-icon">
            <UI.waterDrop />
          </div>
          <div className="ref-recommend-text">
            <b>Stay Hydrated!</b>
            <span>Drink at least 2L of water today for optimal vitality.</span>
          </div>
          <UI.chevron className="ref-chevron" />
        </div>
      </section>

      {/* ------------------------------------------------ Latest Report Section (Reference Image 1 Right) */}
      <section className="ref-section ref-reports-section">
        <div className="ref-section-head">
          <h2>Latest Report</h2>
          <button type="button" className="ref-view-all" onClick={() => navigate('records')}>
            View all
          </button>
        </div>
        <div className="ref-reports-list">
          <div className="ref-report-card" onClick={() => navigate('records')}>
            <div className="ref-report-icon blue">
              <UI.records />
            </div>
            <div className="ref-report-info">
              <b>General Health</b>
              <span>8 files uploaded</span>
            </div>
            <button type="button" className="ref-report-more" aria-label="Report options">
              <UI.dotsVertical />
            </button>
          </div>

          <div className="ref-report-card" onClick={() => navigate('records')}>
            <div className="ref-report-icon purple">
              <UI.records />
            </div>
            <div className="ref-report-info">
              <b>Diabetes</b>
              <span>4 files uploaded</span>
            </div>
            <button type="button" className="ref-report-more" aria-label="Report options">
              <UI.dotsVertical />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Emergency Strip */}
      <section className="ref-section ref-emergency-section">
        <div className="ref-emergency-banner" onClick={() => setEmergencyOpen(true)}>
          <div className="ref-emergency-glyph">
            <Icon.alert />
          </div>
          <div className="ref-emergency-content">
            <b>24/7 Emergency Fast-Track</b>
            <span>Instant ambulance dispatch & hospital priority pass</span>
          </div>
          <button type="button" className="ref-emergency-action">
            Alert Team
          </button>
        </div>
      </section>

      {emergencyOpen && <EmergencyDialog ctx={ctx} onClose={() => setEmergencyOpen(false)} />}
    </div>
  );
}
