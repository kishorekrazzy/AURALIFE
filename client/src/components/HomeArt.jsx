/**
 * Visual Assets, Charts, and Iconography for AURALIFE
 * Faithfully matches the exact reference designs with clean, responsive vector graphics.
 */

/* ------------------------------------------------------------------ Doctor Illustration for Banner */
export function HeroDoctor() {
  return (
    <svg className="hero-art" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <clipPath id="heroDisc">
          <circle cx="100" cy="100" r="92" />
        </clipPath>
        <linearGradient id="coatG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eaf2fd" />
        </linearGradient>
        <linearGradient id="discG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dbe9fd" />
          <stop offset="1" stopColor="#c3dbfb" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="92" fill="url(#discG)" />
      <g clipPath="url(#heroDisc)">
        <path
          d="M38 200v-24c0-26 20-42 46-48l16-5 16 5c26 6 46 22 46 48v24Z"
          fill="url(#coatG)"
        />
        <path d="M84 123h32l10 77H74Z" fill="#7fb3f2" />
        <path d="M100 128 88 141l12 12 12-12Z" fill="#5b9bec" />
        <path d="M88 104h24v22a12 12 0 0 1-24 0Z" fill="#f0c4a6" />
        <ellipse cx="100" cy="80" rx="27" ry="31" fill="#f7d3b6" />
        <path
          d="M100 44c19 0 30 13 30 31 0 6-1 12-3 16l-4-20-9-6-24 3-9 7-4 16c-2-4-3-10-3-16 0-18 8-31 26-31Z"
          fill="#3b2c26"
        />
        <path d="M73 74c-6 12-8 34-2 50l8-10-3-40Z" fill="#3b2c26" />
        <path d="M127 74c6 12 8 34 2 50l-8-10 3-40Z" fill="#3b2c26" />
        <circle cx="90" cy="80" r="2.6" fill="#33221c" />
        <circle cx="110" cy="80" r="2.6" fill="#33221c" />
        <path
          d="M92 92c3 3 13 3 16 0"
          stroke="#c98a68"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M84 126c-2 20 6 32 16 32s18-12 16-32"
          stroke="#2e6fd4"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="116" cy="160" r="7" fill="#2e6fd4" />
        <circle cx="116" cy="160" r="3" fill="#dbe9fd" />
      </g>
    </svg>
  );
}

/** Realistic Cutout Banner Doctor (matching reference Image 1 banner) */
export function BannerDoctor() {
  return (
    <svg className="banner-doctor-art" viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="docShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f4c81" floodOpacity="0.18" />
        </filter>
        <linearGradient id="docCoat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2ecf9" />
        </linearGradient>
        <linearGradient id="docShirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbd3b6" />
          <stop offset="100%" stopColor="#eab595" />
        </linearGradient>
        <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#452a22" />
          <stop offset="100%" stopColor="#261713" />
        </linearGradient>
      </defs>

      <g filter="url(#docShadow)">
        {/* Hair back */}
        <path d="M48 60 C42 90 40 120 48 140 C56 120 60 90 60 70 Z" fill="url(#hairGrad)" />
        <path d="M112 60 C118 90 120 120 112 140 C104 120 100 90 100 70 Z" fill="url(#hairGrad)" />

        {/* Shoulders & White Coat */}
        <path d="M22 180 C24 140 38 124 64 116 L80 124 L96 116 C122 124 136 140 138 180 Z" fill="url(#docCoat)" />

        {/* Inner Medical Scrub / Shirt */}
        <path d="M64 120 L80 148 L96 120 L96 180 L64 180 Z" fill="url(#docShirt)" />
        <path d="M72 136 L80 148 L88 136" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

        {/* Coat Lapels */}
        <path d="M46 122 L66 180 L76 180 L64 120 Z" fill="#ffffff" />
        <path d="M114 122 L94 180 L84 180 L96 120 Z" fill="#f0f6fc" />

        {/* Neck */}
        <path d="M68 84 L68 116 C68 123 92 123 92 116 L92 84 Z" fill="url(#skinGrad)" />

        {/* Face */}
        <ellipse cx="80" cy="74" rx="25" ry="30" fill="url(#skinGrad)" />

        {/* Hair Top / Bun / Styling */}
        <path d="M54 62 C54 36 68 24 80 24 C92 24 106 36 106 62 C106 72 102 78 98 78 C94 62 90 52 80 52 C70 52 66 62 62 78 C58 78 54 72 54 62 Z" fill="url(#hairGrad)" />

        {/* Facial features */}
        {/* Eyebrows */}
        <path d="M66 62 Q72 60 76 63" stroke="#331c15" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M84 63 Q88 60 94 62" stroke="#331c15" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        {/* Eyes */}
        <ellipse cx="71" cy="69" rx="2.5" ry="2.2" fill="#2d1913" />
        <ellipse cx="89" cy="69" rx="2.5" ry="2.2" fill="#2d1913" />
        <circle cx="72" cy="68" r="0.8" fill="#ffffff" />
        <circle cx="90" cy="68" r="0.8" fill="#ffffff" />
        {/* Nose */}
        <path d="M80 70 L79 78 L83 79" stroke="#d69774" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Smile */}
        <path d="M72 87 Q80 94 88 87" stroke="#c04b5a" strokeWidth="2.2" strokeLinecap="round" fill="none" />

        {/* Stethoscope around neck */}
        <path d="M60 114 C58 135 64 162 72 165 C76 166 79 160 80 152" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M100 114 C102 135 96 162 88 165 C84 166 81 160 80 152" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* Bell / Diaphragm */}
        <circle cx="80" cy="154" r="6" fill="#0369a1" />
        <circle cx="80" cy="154" r="3" fill="#e0f2fe" />

        {/* Arms crossed pose details */}
        <path d="M34 160 C38 145 60 148 76 160 C90 148 122 145 126 160 L120 180 L40 180 Z" fill="#ffffff" opacity="0.9" />
      </g>
    </svg>
  );
}

export function BannerCalendar() {
  return (
    <svg className="promo-art" viewBox="0 0 120 110" aria-hidden="true">
      <defs>
        <linearGradient id="calG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe8fb" />
        </linearGradient>
      </defs>
      <rect x="14" y="20" width="82" height="76" rx="12" fill="rgba(255,255,255,.25)" />
      <rect x="8" y="12" width="82" height="76" rx="12" fill="url(#calG)" />
      <rect x="8" y="12" width="82" height="20" rx="12" fill="#8fc0f7" />
      <rect x="8" y="26" width="82" height="6" fill="#8fc0f7" />
      <rect x="24" y="4" width="8" height="16" rx="4" fill="#4a90ea" />
      <rect x="66" y="4" width="8" height="16" rx="4" fill="#4a90ea" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={19 + c * 16}
            y={42 + r * 15}
            width="11"
            height="9"
            rx="2.5"
            fill={r === 1 && c === 2 ? '#4a90ea' : '#c3d9f4'}
          />
        )),
      )}
      <circle cx="92" cy="78" r="19" fill="#ffffff" />
      <circle cx="92" cy="78" r="15" fill="#1a73e8" />
      <path
        d="m85 78 5 5 10-10"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function InsightHeart() {
  return (
    <svg className="insight-art" viewBox="0 0 90 80" aria-hidden="true">
      <defs>
        <linearGradient id="heartG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6b6b" />
          <stop offset="1" stopColor="#d92d3c" />
        </linearGradient>
      </defs>
      <path
        d="M45 72S8 50 8 27.5C8 15.6 17.4 7 28.5 7 35.6 7 41.6 10.7 45 16.3 48.4 10.7 54.4 7 61.5 7 72.6 7 82 15.6 82 27.5 82 50 45 72 45 72Z"
        fill="url(#heartG)"
      />
      <path
        d="M18 36h13l5-11 8 22 6-13 4 6h18"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity=".95"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ Health Vitals SVG Charts */

/** Heart Rate ECG waveform pulse chart (Reference Image 1) */
export function ECGPulseChart({ color = '#0284c7' }) {
  return (
    <svg viewBox="0 0 160 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="ecg-chart">
      <path
        d="M0 36 H40 L48 36 L54 10 L62 56 L70 20 L76 44 L82 36 H160"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Step Activity Wave / Area Chart (Reference Image 2) */
export function StepWaveChart({ color = '#8b5cf6' }) {
  return (
    <svg viewBox="0 0 140 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="step-wave-chart">
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d="M0 45 Q20 42 40 34 T80 32 T110 18 T140 24 L140 60 L0 60 Z"
        fill="url(#waveGrad)"
      />
      <path
        d="M0 45 Q20 42 40 34 T80 32 T110 18 T140 24"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Current point node */}
      <circle cx="95" cy="24" r="4.5" fill="#ffffff" stroke={color} strokeWidth="2.5" />
    </svg>
  );
}

/** Total Sleep Histogram Bar Chart (Reference Image 2) */
export function SleepHistogram({ activeIdx = 4 }) {
  const heights = [28, 38, 44, 40, 52, 42, 30, 24, 20];
  return (
    <svg viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="sleep-hist-chart">
      {heights.map((h, i) => {
        const isActive = i === activeIdx;
        const x = 10 + i * 18;
        const y = 56 - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="12"
            height={h}
            rx="5"
            fill={isActive ? '#1e293b' : 'rgba(16, 46, 92, 0.12)'}
          />
        );
      })}
    </svg>
  );
}

/** Circular Activity Gauge Arc (Reference Image 3) */
export function ActivityArc({ progress = 72, color = '#ffffff', trackColor = 'rgba(255,255,255,0.2)' }) {
  const radius = 28;
  const stroke = 6;
  const circum = 2 * Math.PI * radius;
  const strokeDashoffset = circum - (progress / 100) * circum;

  return (
    <svg width="70" height="70" viewBox="0 0 70 70" className="activity-arc">
      <circle
        cx="35"
        cy="35"
        r={radius}
        stroke={trackColor}
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx="35"
        cy="35"
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circum}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 35 35)"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ Icons */

const svg = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

/**
 * Service tile icons — realistic, minimal, duotone filled SVG.
 * Each icon is drawn at viewBox="0 0 32 32" for crisp rendering inside the 66×66 squircle.
 */
export const ServiceIcon = {

  // ── Doctor Consultation: realistic doctor bust with stethoscope ──
  consultation: (p) => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...p}>
      {/* Body / White Coat */}
      <path d="M5 29c0-5 3.5-8.5 7.5-9.5L16 21l3.5-1.5C23.5 20.5 27 24 27 29H5Z" fill="currentColor" opacity="0.18" />
      <path d="M10 19.5C10 19.5 7 21 7 26h18c0-5-3-6.5-3-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Coat collar */}
      <path d="M14 19.5 16 24l2-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Head */}
      <ellipse cx="16" cy="11" rx="5" ry="6" fill="currentColor" opacity="0.25" />
      <ellipse cx="16" cy="11" rx="5" ry="6" stroke="currentColor" strokeWidth="1.5" />
      {/* Stethoscope eartip & tube */}
      <path d="M13 17.5c0 2 .8 3.5 2 4s2.5 0 3-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Stethoscope bell */}
      <circle cx="18.5" cy="21" r="1.8" fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="1.3" />
      {/* Cross on coat – medical symbol */}
      <path d="M15.2 22.5h1.6M16 21.7v1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),

  // ── Medicine / Pharmacy: pill capsule + small scatter ──
  medication: (p) => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...p}>
      {/* Main capsule body */}
      <rect x="7" y="13" width="18" height="9" rx="4.5" fill="currentColor" opacity="0.18" />
      <rect x="7" y="13" width="18" height="9" rx="4.5" stroke="currentColor" strokeWidth="1.6" />
      {/* Capsule divider */}
      <line x1="16" y1="13" x2="16" y2="22" stroke="currentColor" strokeWidth="1.6" />
      {/* Left half tint */}
      <path d="M7 17.5A4.5 4.5 0 0 1 11.5 13H16v9h-4.5A4.5 4.5 0 0 1 7 17.5Z" fill="currentColor" opacity="0.30" />
      {/* Small pill top-right */}
      <ellipse cx="23.5" cy="9" rx="3.5" ry="2" fill="currentColor" opacity="0.22" stroke="currentColor" strokeWidth="1.3" />
      {/* Small pill top-left */}
      <ellipse cx="8.5" cy="9" rx="2.5" ry="1.6" transform="rotate(-30 8.5 9)" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),

  // ── Reports / Health Records: clipboard with chart lines ──
  lab: (p) => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...p}>
      {/* Clipboard body */}
      <rect x="6" y="7" width="20" height="22" rx="3.5" fill="currentColor" opacity="0.14" stroke="currentColor" strokeWidth="1.6" />
      {/* Clip tab at top */}
      <rect x="11" y="5" width="10" height="5" rx="2" fill="currentColor" opacity="0.28" stroke="currentColor" strokeWidth="1.4" />
      {/* Clip dot */}
      <circle cx="16" cy="7.5" r="1.1" fill="currentColor" />
      {/* Checkmark row 1 */}
      <path d="M11 14l1.5 1.5L15 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Line row 1 */}
      <line x1="17" y1="14" x2="22" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Checkmark row 2 */}
      <path d="M11 19l1.5 1.5L15 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Line row 2 */}
      <line x1="17" y1="19" x2="22" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Short line row 3 */}
      <line x1="11" y1="24" x2="19" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  // ── Lab Tests / Diagnostics: microscope / test tube ──
  checkup: (p) => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...p}>
      {/* Test tube body */}
      <path d="M12 6h8v13a4 4 0 0 1-8 0V6Z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Tube open rim */}
      <rect x="11" y="5" width="10" height="2.5" rx="1.2" fill="currentColor" opacity="0.35" />
      {/* Liquid fill inside tube */}
      <path d="M12 17c0 0 2 1.2 4 0s4 0 4 0v2a4 4 0 0 1-8 0v-2Z" fill="currentColor" opacity="0.55" />
      {/* Bubbles in liquid */}
      <circle cx="14.5" cy="20" r="0.9" fill="currentColor" opacity="0.7" />
      <circle cx="17.5" cy="19" r="0.7" fill="currentColor" opacity="0.6" />
      {/* Left sparkle / cross */}
      <path d="M7 10v4M5 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* Right sparkle */}
      <path d="M24 8v3M22.5 9.5H25.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};


export const UI = {
  menu: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" {...p}>
      <path d="M4 7h16M4 12h10M4 17h16" />
    </svg>
  ),

  bell: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M6 10a6 6 0 0 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6Z" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),

  search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  ),

  sliders: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="8" cy="6" r="2" fill="currentColor" />
      <circle cx="16" cy="12" r="2" fill="currentColor" />
      <circle cx="10" cy="18" r="2" fill="currentColor" />
    </svg>
  ),

  chevron: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),

  arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),

  calendarSmall: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),

  clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  ),

  home: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  ),

  homeFill: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 3.2a1 1 0 0 0-.64.23L3 10.38V20a2 2 0 0 0 2 2h4v-5h6v5h4a2 2 0 0 0 2-2v-9.62L12.64 3.43A1 1 0 0 0 12 3.2Z" />
    </svg>
  ),

  // ── Folder / Records icon: realistic open folder with document ──
  records: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      {/* Folder body */}
      <path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
      {/* Document inside */}
      <path d="M8 13h8M8 16h5" strokeWidth="1.5" />
    </svg>
  ),

  message: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),

  profile: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),

  dotsVertical: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true" {...p}>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  ),

  // ── Water Drop: realistic raindrop with inner highlight ──
  waterDrop: (p) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      {/* Drop body */}
      <path d="M12 3C12 3 5 10.5 5 15.5a7 7 0 0 0 14 0C19 10.5 12 3 12 3Z" fill="currentColor" opacity="0.75" />
      {/* Inner highlight */}
      <path d="M9.5 16a4 4 0 0 1 2.5-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),

  // ── Moon: crescent with subtle glow dots ──
  moon: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M20.35 13.73A9 9 0 0 1 10.27 3.65 7 7 0 1 0 20.35 13.73Z" fill="currentColor" opacity="0.2" />
      <path d="M20.35 13.73A9 9 0 0 1 10.27 3.65 7 7 0 1 0 20.35 13.73Z" />
    </svg>
  ),

  // ── Walker: realistic walking person figure ──
  walker: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      {/* Head */}
      <circle cx="13" cy="5" r="2" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1.6" />
      {/* Torso */}
      <path d="M10 10l3-3 4 2" />
      {/* Legs */}
      <path d="M13 7v5l-3 5" />
      <path d="M13 12l3 5" />
      {/* Arm swing */}
      <path d="M8 14l2-3" />
    </svg>
  ),

  car: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      {/* Car body */}
      <path d="M5 17H3v-5l2.5-5h13L21 12v5h-2" fill="currentColor" opacity="0.12" />
      <path d="M5 17H3v-5l2.5-5h13L21 12v5h-2" />
      {/* Windscreen */}
      <path d="M6 12h12M7.5 7l-1.5 5M16.5 7l1.5 5" strokeWidth="1.4" />
      {/* Wheels */}
      <circle cx="7" cy="17" r="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="17" r="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),

  bike: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <circle cx="5.5" cy="17" r="3.5" />
      <circle cx="18.5" cy="17" r="3.5" />
      {/* Frame */}
      <path d="M5.5 17l4.5-8h4l4.5 8" />
      <path d="M10 9l3.5 8" />
      {/* Seat + handle */}
      <path d="M14 7h3M15.5 7v2" strokeWidth="1.6" />
    </svg>
  ),

  navArrow: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 2 4 20.5l.8.5L12 17.5 19.2 21l.8-.5Z" />
    </svg>
  ),

  swap: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M7 16V4m0 0L4 7m3-3 3 3" />
      <path d="M17 8v12m0 0 3-3m-3 3-3-3" />
    </svg>
  ),

  // ── Globe: language / region switcher ──
  globe: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.6 12h16.8M12 3.6c2.4 2.3 3.7 5.2 3.7 8.4s-1.3 6.1-3.7 8.4c-2.4-2.3-3.7-5.2-3.7-8.4S9.6 5.9 12 3.6Z" />
    </svg>
  ),

  // ── Feedback: a speech bubble holding a star rating ──
  feedback: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M4 5.6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2H9.4L5.5 19v-3H6a2 2 0 0 1-2-2Z" />
      <path
        d="m12 6.8 1.1 2.28 2.5.37-1.8 1.77.42 2.48L12 12.5l-2.22 1.2.42-2.48-1.8-1.77 2.5-.37Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  ),
};

