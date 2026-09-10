import { useEffect } from 'react';
import { Icon, BrandMark } from './Icons.jsx';
import { UI } from './HomeArt.jsx';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Icon.dashboard, group: 'Patient' },
  { id: 'appointments', label: 'Appointments', icon: Icon.calendar, group: 'Patient' },
  { id: 'queue', label: 'Live Queue', icon: Icon.queue, group: 'Patient' },
  { id: 'records', label: 'Health Records', icon: Icon.record, group: 'Patient' },
  { id: 'doctors', label: 'Doctors', icon: Icon.doctor, group: 'Hospital' },
  { id: 'navigation', label: 'Navigation', icon: Icon.map, group: 'Hospital' },
  { id: 'analytics', label: 'Analytics', icon: Icon.chart, group: 'Hospital' },
  { id: 'staff', label: 'Staff Workspace', icon: Icon.staff, group: 'Workspace' },
  { id: 'admin', label: 'Admin Console', icon: Icon.shield, group: 'Workspace' },
];

const TABS = [
  { id: 'dashboard', label: 'Home', icon: UI.home, activeIcon: UI.homeFill },
  { id: 'appointments', label: 'Schedule', icon: UI.calendarSmall },
  { id: 'records', label: 'Report', icon: UI.records },
  { id: 'navigation', label: 'Navigation', icon: Icon.map },
  { id: 'doctors', label: 'Profile', icon: UI.profile },
];

export function Rail({ view, onNavigate, counts = {}, online, drawerOpen }) {
  const groups = NAV_ITEMS.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {});

  return (
    <aside className="rail" aria-label="Main navigation" aria-hidden={false}>
      <div className="brand">
        <BrandMark />
        <span className="brand-text">
          <span className="brand-name">AURALIFE</span>
          <span className="brand-sub">Connected Hospital Care</span>
        </span>
      </div>

      <nav className="rail-nav">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="nav-group">{group}</div>
            {items.map((item) => {
              const Glyph = item.icon;
              const count = counts[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${view === item.id ? 'active' : ''}`.trim()}
                  onClick={() => onNavigate(item.id)}
                  aria-current={view === item.id ? 'page' : undefined}
                  tabIndex={drawerOpen === false ? undefined : 0}
                >
                  <Glyph />
                  <span className="nav-label">{item.label}</span>
                  {count ? <span className="nav-count">{count}</span> : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="rail-foot">
        <div className={`conn ${online ? '' : 'down'}`.trim()}>
          <i />
          {online ? 'API connected' : 'API offline'}
        </div>
        Problem Statement 26199
        <br />
        AICTE · Ministry of Education
      </div>
    </aside>
  );
}

export function AppBar({ onMenu, onAssistant, alerts = 0 }) {
  return (
    <header className="appbar">
      <button type="button" className="appbar-btn ghost" onClick={onMenu} aria-label="Open navigation">
        <UI.menu />
      </button>
      <div className="appbar-title">
        <BrandMark />
        <span className="appbar-name">AURALIFE</span>
      </div>
      <button
        type="button"
        className="appbar-btn ghost"
        onClick={onAssistant}
        aria-label={alerts ? `Notifications, ${alerts} unread` : 'Notifications'}
      >
        <UI.bell />
        {alerts > 0 && <i className="appbar-dot" />}
      </button>
    </header>
  );
}

export function TabBar({ view, onNavigate, onMore, alerts = 0 }) {
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((t) => {
        const active = view === t.id;
        const Glyph = active && t.activeIcon ? t.activeIcon : t.icon;
        return (
          <button
            key={t.id}
            type="button"
            className={`tab-item ${active ? 'active' : ''}`.trim()}
            onClick={() => onNavigate(t.id)}
            aria-current={active ? 'page' : undefined}
          >
            <Glyph />
            <span>{t.label}</span>
            {t.id === 'records' && alerts > 0 && <i className="tab-dot" aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}

/** Locks body scroll and wires Escape/resize while the drawer is open. */
export function useDrawer(open, close) {
  useEffect(() => {
    document.body.classList.toggle('drawer-open', open);
    document.body.classList.toggle('no-scroll', open);
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    const onResize = () => {
      if (window.innerWidth > 900) close();
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  useEffect(
    () => () => {
      document.body.classList.remove('drawer-open', 'no-scroll');
    },
    [],
  );
}
