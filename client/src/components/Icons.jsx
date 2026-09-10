/** Compact, precise line icons. All inherit `currentColor` so they follow the theme. */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.55,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const Icon = {
  dashboard: (p) => (
    <svg {...base} {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.7" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.7" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.7" />
      <path d="M15.5 18h3M17 16.5v3" />
    </svg>
  ),
  calendar: (p) => (
    <svg {...base} {...p}>
      <rect x="3.6" y="5.2" width="16.8" height="15" rx="3" />
      <path d="M3.6 9.8h16.8M8.2 3.2v3.8M15.8 3.2v3.8" />
    </svg>
  ),
  queue: (p) => (
    <svg {...base} {...p}>
      <path d="M8.2 7.2H19M8.2 12H19M8.2 16.8h7.4" />
      <circle cx="5" cy="7.2" r=".7" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r=".7" fill="currentColor" stroke="none" />
      <circle cx="5" cy="16.8" r=".7" fill="currentColor" stroke="none" />
    </svg>
  ),
  record: (p) => (
    <svg {...base} {...p}>
      <path d="M6.5 3.6h6.6l4.4 4.4v12H6.5z" />
      <path d="M13 3.6V8h4.5M9.4 13h5.2M9.4 16h3.2" />
    </svg>
  ),
  doctor: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="8.4" r="3.4" />
      <path d="M5.4 19.8c0-3.2 3-5.6 6.6-5.6s6.6 2.4 6.6 5.6" />
      <path d="M9.1 15.3v2.2c0 1.1 1.3 1.8 2.9 1.8s2.9-.7 2.9-1.8v-2.2M12 19.3v1.1" />
    </svg>
  ),
  chart: (p) => (
    <svg {...base} {...p}>
      <path d="M4 19.6h16" />
      <path d="M7.4 16.6v-5.2M12 16.6V6.4M16.6 16.6v-7" />
      <path d="m6.2 10.5 4-3.4 4.1 2.2 3.6-4" />
    </svg>
  ),
  map: (p) => (
    <svg {...base} {...p}>
      <path d="M12 21s6.4-5.8 6.4-10.6a6.4 6.4 0 1 0-12.8 0C5.6 15.2 12 21 12 21Z" />
      <circle cx="12" cy="10.2" r="2.4" />
      <path d="M12 7.8v4.8M9.6 10.2h4.8" opacity=".55" />
    </svg>
  ),
  staff: (p) => (
    <svg {...base} {...p}>
      <circle cx="9" cy="8.6" r="3.2" />
      <path d="M3.4 19.6c0-3 2.5-5.2 5.6-5.2s5.6 2.2 5.6 5.2" />
      <path d="M16.2 6a3.2 3.2 0 0 1 0 6.2M17.4 14.6c2 .6 3.2 2.2 3.2 5" />
    </svg>
  ),
  shield: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3 5.6 5.6v5.8c0 4.2 2.7 7.6 6.4 8.6 3.7-1 6.4-4.4 6.4-8.6V5.6L12 3Z" />
      <path d="m9.3 11.8 2 2 3.7-4" />
    </svg>
  ),
  menu: (p) => (
    <svg {...base} {...p}>
      <path d="M4.4 7h15.2M4.4 12h15.2M4.4 17h15.2" />
    </svg>
  ),
  chat: (p) => (
    <svg {...base} {...p}>
      <path d="M20.4 12.2c0 4-3.8 7.2-8.4 7.2-1 0-2-.15-2.9-.42L4.2 20.5l1.3-3.5C4.3 15.6 3.6 14 3.6 12.2c0-4 3.8-7.2 8.4-7.2s8.4 3.2 8.4 7.2Z" />
      <path d="M8.8 12h.01M12 12h.01M15.2 12h.01" />
    </svg>
  ),
  home: (p) => (
    <svg {...base} {...p}>
      <path d="M3.6 10.4 12 3.8l8.4 6.6" />
      <path d="M5.8 9.2v9.4a1 1 0 0 0 1 1h3.4v-5.2h3.6v5.2h3.4a1 1 0 0 0 1-1V9.2" />
    </svg>
  ),
  check: (p) => (
    <svg {...base} {...p}>
      <path d="m5 12.6 4.4 4.4L19 7.4" />
    </svg>
  ),
  alert: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3.8 21 19.6H3L12 3.8Z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  ),
  info: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.4M12 7.8h.01" />
    </svg>
  ),
  close: (p) => (
    <svg {...base} {...p}>
      <path d="m6.6 6.6 10.8 10.8M17.4 6.6 6.6 17.4" />
    </svg>
  ),
  search: (p) => (
    <svg {...base} {...p}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.6 15.6 4 4" />
    </svg>
  ),
  pin: (p) => (
    <svg {...base} {...p}>
      <path d="M12 21s6.4-5.8 6.4-10.6a6.4 6.4 0 1 0-12.8 0C5.6 15.2 12 21 12 21Z" />
      <circle cx="12" cy="10.2" r="2.2" />
    </svg>
  ),
  ambulance: (p) => (
    <svg {...base} {...p}>
      <path d="M2.8 16.4V8.6a1 1 0 0 1 1-1h9.4v8.8" />
      <path d="M13.2 10.6h3.4l3.6 3.4v2.4h-2" />
      <circle cx="7.4" cy="17.4" r="1.9" />
      <circle cx="16.6" cy="17.4" r="1.9" />
      <path d="M6.6 11.4h3.4M8.3 9.7v3.4" />
    </svg>
  ),
  pulse: (p) => (
    <svg {...base} {...p}>
      <path d="M3 12.5h3.6l2-4.6 3.2 9 2.4-6.2 1.5 1.8H21" />
    </svg>
  ),
};

/** The AURALIFE mark: white pulse line on the logo-blue gradient. */
export function BrandMark({ className = 'brand-mark' }) {
  return (
    <span className={className}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3.4 12.6h3.3l1.9-4.5 2.9 8.4 2.3-6 1.4 2.1h5.4"
          stroke="#fff"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default Icon;
