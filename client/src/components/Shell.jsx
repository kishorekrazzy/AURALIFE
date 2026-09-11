import { useEffect } from 'react';
import { Icon, BrandMark } from './Icons.jsx';
import { UI } from './HomeArt.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import UtilityMenu from './UtilityMenu.jsx';

export const NAV_ITEMS = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: Icon.dashboard, groupKey: 'nav.group.patient' },
  { id: 'appointments', labelKey: 'nav.appointments', icon: Icon.calendar, groupKey: 'nav.group.patient' },
  { id: 'queue', labelKey: 'nav.queue', icon: Icon.queue, groupKey: 'nav.group.patient' },
  { id: 'records', labelKey: 'nav.records', icon: Icon.record, groupKey: 'nav.group.patient' },
  { id: 'doctors', labelKey: 'nav.doctors', icon: Icon.doctor, groupKey: 'nav.group.hospital' },
  { id: 'navigation', labelKey: 'nav.navigation', icon: Icon.map, groupKey: 'nav.group.hospital' },
  { id: 'analytics', labelKey: 'nav.analytics', icon: Icon.chart, groupKey: 'nav.group.hospital' },
  { id: 'staff', labelKey: 'nav.staff', icon: Icon.staff, groupKey: 'nav.group.workspace' },
  { id: 'admin', labelKey: 'nav.admin', icon: Icon.shield, groupKey: 'nav.group.workspace' },
];

const TABS = [
  { id: 'dashboard', labelKey: 'tabbar.home', icon: UI.home, activeIcon: UI.homeFill },
  { id: 'appointments', labelKey: 'tabbar.schedule', icon: UI.calendarSmall },
  { id: 'records', labelKey: 'tabbar.report', icon: UI.records },
  { id: 'navigation', labelKey: 'tabbar.navigation', icon: Icon.map },
  { id: 'doctors', labelKey: 'tabbar.profile', icon: UI.profile },
];

export function Rail({ view, onNavigate, counts = {}, online, drawerOpen }) {
  const { t } = useLanguage();
  const groups = NAV_ITEMS.reduce((acc, item) => {
    (acc[item.groupKey] = acc[item.groupKey] || []).push(item);
    return acc;
  }, {});

  return (
    <aside className="rail" aria-label="Main navigation" aria-hidden={false}>
      <div className="brand">
        <BrandMark />
        <span className="brand-text">
          <span className="brand-name">AURALIFE</span>
          <span className="brand-sub">{t('brand.tagline')}</span>
        </span>
      </div>

      <nav className="rail-nav">
        {Object.entries(groups).map(([groupKey, items]) => (
          <div key={groupKey}>
            <div className="nav-group">{t(groupKey)}</div>
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
                  <span className="nav-label">{t(item.labelKey)}</span>
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
          {online ? t('rail.connected') : t('rail.offline')}
        </div>
        Problem Statement 26199
        <br />
        AICTE · Ministry of Education
      </div>
    </aside>
  );
}

export function AppBar({ onMenu, onAssistant, alerts = 0, patientName }) {
  const { t } = useLanguage();
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
        aria-label={alerts ? `${t('notifications.title')}, ${alerts}` : t('notifications.title')}
      >
        <UI.bell />
        {alerts > 0 && <i className="appbar-dot" />}
      </button>
      <UtilityMenu patientName={patientName} />
    </header>
  );
}

export function TabBar({ view, onNavigate, onMore, alerts = 0 }) {
  const { t } = useLanguage();
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((tab) => {
        const active = view === tab.id;
        const Glyph = active && tab.activeIcon ? tab.activeIcon : tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            className={`tab-item ${active ? 'active' : ''}`.trim()}
            onClick={() => onNavigate(tab.id)}
            aria-current={active ? 'page' : undefined}
          >
            <Glyph />
            <span>{t(tab.labelKey)}</span>
            {tab.id === 'records' && alerts > 0 && <i className="tab-dot" aria-hidden="true" />}
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
