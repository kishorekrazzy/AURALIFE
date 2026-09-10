import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { Pill, Empty, Segment } from '../components/ui.jsx';
import { UI } from '../components/HomeArt.jsx';

/** Landmark-based turn-by-turn steps */
function buildSteps(dest) {
  if (!dest) {
    return [
      { title: 'My current location', detail: 'Main entrance lobby & reception.', time: '0 min' },
      { title: 'Turn right into Central Junction', detail: 'Pass registration desk & pharmacy.', time: '2 min' },
      { title: 'Proceed along Bush St / Main Corridor', detail: 'Follow purple navigation line.', time: '5 min' },
      { title: 'Arrive at destination', detail: 'General OPD & Consultation Wing.', time: '8 min' },
    ];
  }
  const steps = [
    { title: 'Start at Main Entrance', detail: 'Walk through the reception lobby past registration.', time: '0 min' },
    { title: 'Continue along Main Hallway', detail: 'Landmark: Pharmacy and information desk on your right.', time: '3 min' },
  ];
  if (dest.floor > 1) {
    steps.push({
      title: `Take Elevator A to Floor ${dest.floor}`,
      detail: dest.stepFree ? 'Step-free route with ramp access.' : 'Elevator or stairs available.',
      time: '6 min',
    });
  } else {
    steps.push({
      title: 'Stay on Floor 1 Public Corridor',
      detail: 'Follow directional line to Clinic Wing.',
      time: '5 min',
    });
  }
  steps.push({
    title: `Arrive at ${dest.room || 'Destination'}`,
    detail: `${dest.name} · ${dest.category || 'Clinical Care'}`,
    time: `${dest.walkMinutes || 8} min`,
  });
  return steps;
}

export default function Navigation() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [floor, setFloor] = useState('all');
  const [progress, setProgress] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [travelMode, setTravelMode] = useState('walk'); // walk | drive | bike
  const [inverted, setInverted] = useState(false);
  const timer = useRef(null);

  const destinations = useResource(() => api.destinations(), []);

  useEffect(() => {
    if (!selected && destinations.data && destinations.data.length) {
      setSelected(destinations.data[0]);
    }
  }, [destinations.data, selected]);

  useEffect(() => () => clearInterval(timer.current), []);

  const filtered = useMemo(() => {
    const list = destinations.data || [];
    const needle = query.trim().toLowerCase();
    return list.filter(
      (d) =>
        (floor === 'all' || String(d.floor) === floor) &&
        (!needle || d.keywords.includes(needle) || d.name.toLowerCase().includes(needle)),
    );
  }, [destinations.data, query, floor]);

  const steps = buildSteps(selected);
  const currentStep = Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length));

  function startNavigation() {
    if (navigating) {
      clearInterval(timer.current);
      setNavigating(false);
      return;
    }
    clearInterval(timer.current);
    if (progress >= 100) setProgress(0);
    setNavigating(true);
    timer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer.current);
          setNavigating(false);
          return 100;
        }
        return p + 5;
      });
    }, 400);
  }

  function resetRoute() {
    clearInterval(timer.current);
    setProgress(0);
    setNavigating(false);
  }

  const startName = inverted ? (selected ? selected.name : 'Brush St') : 'My current location';
  const endName = inverted ? 'My current location' : (selected ? selected.name : 'Brush St');

  const walkMin = selected ? selected.walkMinutes : 10;
  const distMi = selected ? ((selected.distanceMetres || 350) / 1600).toFixed(1) : '0.8';

  return (
    <div className="ref-map-page-container">
      {/* ------------------------------------------------ Top Floating Route Search Card (Reference Image 4) */}
      <div className="ref-route-header-card">
        <div className="ref-route-inputs">
          <div className="ref-route-point">
            <span className="ref-start-dot" />
            <input
              className="ref-point-input"
              value={startName}
              readOnly
              aria-label="Start point"
            />
            <button
              type="button"
              className="ref-clear-btn"
              onClick={() => setSelected(null)}
              aria-label="Clear location"
            >
              ✕
            </button>
          </div>

          <div className="ref-route-connector" />

          <div className="ref-route-point">
            <span className="ref-dest-pin-icon" />
            <input
              className="ref-point-input"
              value={endName}
              placeholder="Search destination, doctor, room..."
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              aria-label="Destination"
            />
            <button
              type="button"
              className="ref-swap-btn"
              onClick={() => setInverted(!inverted)}
              aria-label="Swap origin and destination"
              title="Swap route direction"
            >
              <UI.swap />
            </button>
          </div>
        </div>

        {/* Quick destination preset chips */}
        <div className="ref-quick-dest-row">
          {(destinations.data || []).slice(0, 5).map((d) => (
            <button
              key={d.id}
              type="button"
              className={`ref-quick-chip ${selected?.id === d.id ? 'active' : ''}`}
              onClick={() => {
                setSelected(d);
                resetRoute();
              }}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------ Interactive Pastel Map View (Reference Image 4) */}
      <div className="ref-map-viewport">
        <svg
          viewBox="0 0 600 680"
          className="ref-map-svg"
          aria-label="GPS Indoor and Campus Navigation Map"
        >
          <defs>
            <filter id="purpleGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6c2cf4" floodOpacity="0.45" />
            </filter>
            <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0f1e36" floodOpacity="0.12" />
            </filter>
            <linearGradient id="purpleRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8a3ffc" />
              <stop offset="100%" stopColor="#6c2cf4" />
            </linearGradient>
          </defs>

          {/* Map Base Canvas & Blocks */}
          <rect width="600" height="680" fill="#eaf0fa" />

          {/* Building Blocks with soft pastel tones */}
          {/* Top Left Block */}
          <rect x="15" y="40" width="130" height="90" rx="8" fill="#d9e3f3" />
          <rect x="15" y="145" width="130" height="110" rx="8" fill="#dce6f5" />
          <rect x="15" y="270" width="115" height="135" rx="8" fill="#d8e3f2" />

          {/* Center Column Blocks */}
          <rect x="165" y="40" width="150" height="85" rx="8" fill="#dbe5f5" />
          <rect x="165" y="140" width="150" height="100" rx="8" fill="#d3dfef" />
          <rect x="150" y="255" width="135" height="150" rx="8" fill="#d8e4f4" />
          <rect x="150" y="420" width="160" height="140" rx="8" fill="#dce6f5" />

          {/* Diagonal & Right Blocks */}
          <rect x="335" y="30" width="245" height="110" rx="8" fill="#d9e4f5" />
          <rect x="335" y="155" width="245" height="135" rx="8" fill="#d5e1f2" />
          <rect x="305" y="305" width="275" height="120" rx="8" fill="#d9e5f5" />
          <rect x="330" y="440" width="250" height="125" rx="8" fill="#d4e0f1" />

          {/* Public Corridors & Streets */}
          {/* Diagonal Main Arterial (Market St / Bush St diagonal) */}
          <path
            d="M-20 400 L620 -80"
            stroke="#ffffff"
            strokeWidth="38"
            strokeLinecap="square"
          />
          <path
            d="M-20 540 L620 60"
            stroke="#ffffff"
            strokeWidth="38"
            strokeLinecap="square"
          />
          <path
            d="M-20 680 L620 200"
            stroke="#ffffff"
            strokeWidth="38"
            strokeLinecap="square"
          />

          {/* Grid cross streets */}
          <path d="M150 0 V680" stroke="#ffffff" strokeWidth="26" />
          <path d="M320 0 V680" stroke="#ffffff" strokeWidth="28" />
          <path d="M0 135 H600" stroke="#ffffff" strokeWidth="24" />
          <path d="M0 250 H600" stroke="#ffffff" strokeWidth="24" />
          <path d="M0 415 H600" stroke="#ffffff" strokeWidth="24" />
          <path d="M0 565 H600" stroke="#ffffff" strokeWidth="24" />

          {/* Street Name Typography (Matching reference Image 4) */}
          <text x="75" y="125" className="ref-street-name">Bush St</text>
          <text x="210" y="125" className="ref-street-name">Bush St</text>
          <text x="245" y="210" className="ref-street-name">Sutter St</text>
          <text x="90" y="235" className="ref-street-name">Sutter St</text>
          <text x="140" y="375" className="ref-street-name">Market St</text>
          <text x="365" y="200" className="ref-street-name">Market St</text>
          <text x="470" y="145" className="ref-street-name">1st St</text>
          <text x="495" y="230" className="ref-street-name">Stevenson St</text>
          <text x="390" y="275" className="ref-street-name">Stevenson St</text>
          <text x="495" y="325" className="ref-street-name">Jessie St</text>
          <text x="425" y="365" className="ref-street-name">Anthony St</text>
          <text x="260" y="360" className="ref-street-name">New Montgomery St</text>
          <text x="440" y="425" className="ref-street-name">2nd St</text>
          <text x="430" y="475" className="ref-street-name">Minna St</text>
          <text x="465" y="525" className="ref-street-name">Natoma St</text>
          <text x="310" y="575" className="ref-street-name">3rd St</text>
          <text x="195" y="575" className="ref-street-name">Mission St</text>
          <text x="480" y="605" className="ref-street-name">Hawthorne St</text>

          {/* Landmarks */}
          <text x="470" y="110" className="ref-landmark-name">Mechanics Monument Plaza</text>
          <text x="350" y="405" className="ref-landmark-name">Academy of Art University</text>
          <text x="180" y="630" className="ref-landmark-name">Yerba Buena Gardens</text>
          <text x="100" y="520" className="ref-landmark-name">Jessie Square</text>

          {/* Neon Purple Navigation Route Polyline (Reference Image 4) */}
          <path
            d="M 218 105 L 255 295 L 305 260 L 440 375 L 375 435 L 510 550 L 380 645"
            fill="none"
            stroke="url(#purpleRouteGrad)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#purpleGlow)"
            className="ref-purple-route"
          />

          {/* Car Graphic along Anthony St */}
          <g transform="translate(520, 275) rotate(-35)">
            <rect x="-10" y="-18" width="20" height="36" rx="6" fill="#1e293b" />
            <rect x="-8" y="-14" width="16" height="8" rx="2" fill="#94a3b8" />
            <rect x="-8" y="6" width="16" height="8" rx="2" fill="#94a3b8" />
            <circle cx="-10" cy="-8" r="2" fill="#0f172a" />
            <circle cx="10" cy="-8" r="2" fill="#0f172a" />
            <circle cx="-10" cy="8" r="2" fill="#0f172a" />
            <circle cx="10" cy="8" r="2" fill="#0f172a" />
          </g>

          {/* Start Waypoint Marker (Top purple pin with white inner dot) */}
          <circle cx="218" cy="105" r="16" fill="#ffffff" filter="url(#badgeShadow)" />
          <circle cx="218" cy="105" r="13" fill="#6c2cf4" />
          <circle cx="218" cy="105" r="5" fill="#ffffff" />

          {/* End Destination Pin (Bottom pulsing purple node) */}
          <circle cx="380" cy="645" r="20" fill="rgba(108, 44, 244, 0.25)" className="ref-pulse-halo" />
          <circle cx="380" cy="645" r="15" fill="#ffffff" filter="url(#badgeShadow)" />
          <circle cx="380" cy="645" r="12" fill="#6c2cf4" />
          <circle cx="380" cy="645" r="4" fill="#ffffff" />

          {/* Floating Route Badges (Matching Reference Image 4) */}
          {/* Black Badge: 2 min | $6-8 */}
          <g transform="translate(60, 410)" filter="url(#badgeShadow)">
            <circle cx="35" cy="35" r="34" fill="#1e242b" />
            <text x="35" y="28" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
              2 min
            </text>
            <text x="35" y="48" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
              $6-8
            </text>
          </g>

          {/* White Badge 1: 12 min (Car) */}
          <g transform="translate(135, 475)" filter="url(#badgeShadow)">
            <rect width="105" height="34" rx="17" fill="#ffffff" />
            <text x="52" y="22" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="700">
              12 min
            </text>
          </g>
          <g transform="translate(20, 465)" filter="url(#badgeShadow)">
            <circle cx="38" cy="38" r="28" fill="#ffffff" />
            <path
              d="M32 32h12l2 5h-16z M31 38h14v5h-14z"
              fill="#64748b"
            />
            <text x="38" y="58" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">
              4 min
            </text>
          </g>

          {/* White Badge 2: Bicycle 7 min */}
          <g transform="translate(20, 565)" filter="url(#badgeShadow)">
            <circle cx="38" cy="38" r="28" fill="#ffffff" />
            <circle cx="31" cy="40" r="4.5" stroke="#64748b" strokeWidth="1.8" fill="none" />
            <circle cx="45" cy="40" r="4.5" stroke="#64748b" strokeWidth="1.8" fill="none" />
            <text x="38" y="58" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">
              7 min
            </text>
          </g>
        </svg>

        {/* Floating GPS Re-center button (Bottom right) */}
        <button
          type="button"
          className="ref-gps-recenter-btn"
          onClick={() => resetRoute()}
          aria-label="Recenter Map"
          title="Recenter location"
        >
          <div className="ref-gps-outer-ring">
            <div className="ref-gps-inner-dot" />
          </div>
        </button>
      </div>

      {/* ------------------------------------------------ Floating Purple Navigation Bar (Reference Image 4) */}
      <div className="ref-nav-bottom-dock">
        <div className="ref-nav-dock-pill">
          {/* Walking ETA */}
          <div className="ref-dock-left">
            <span className="ref-dock-walk-icon">
              <UI.walker />
            </span>
            <span className="ref-dock-time">{walkMin} min</span>
          </div>

          {/* Distance */}
          <div className="ref-dock-center">
            <span className="ref-dock-distance">{distMi} mi</span>
          </div>

          {/* Navigation Action Arrow Button */}
          <button
            type="button"
            className={`ref-dock-action-btn ${navigating ? 'active' : ''}`}
            onClick={startNavigation}
            aria-label={navigating ? 'Pause live directions' : 'Start turn-by-turn navigation'}
            title="Start Navigation"
          >
            <UI.navArrow />
          </button>
        </div>

        {/* Live Navigation Progress Bar */}
        {navigating && (
          <div className="ref-nav-live-progress">
            <div
              className="ref-nav-live-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------ Turn-by-Turn Steps & Floor Details */}
      <div className="ref-nav-details-panel">
        <div className="ref-nav-panel-head">
          <div className="spread">
            <h3>Turn-by-turn directions</h3>
            {selected && (
              <Pill tone={selected.stepFree ? 'success' : 'neutral'}>
                {selected.stepFree ? 'Step-Free Route' : `Floor ${selected.floor}`}
              </Pill>
            )}
          </div>
        </div>

        <div className="ref-steps-timeline">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`ref-step-item ${currentStep === i && navigating ? 'current' : ''}`}
            >
              <div className="ref-step-marker">
                <span>{i + 1}</span>
              </div>
              <div className="ref-step-text">
                <div className="spread">
                  <b>{s.title}</b>
                  <span className="ref-step-time-tag">{s.time}</span>
                </div>
                <span className="ref-step-desc">{s.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
