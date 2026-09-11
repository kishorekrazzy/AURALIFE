import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from './api/client.js';
import { useResource } from './hooks/useResource.js';
import { Rail, AppBar, TabBar, useDrawer, NAV_ITEMS } from './components/Shell.jsx';
import Assistant from './components/Assistant.jsx';
import Notifications, { readIds } from './components/Notifications.jsx';
import UtilityMenu from './components/UtilityMenu.jsx';
import { Icon } from './components/Icons.jsx';
import { ToastStack, Banner } from './components/ui.jsx';
import { useLanguage } from './i18n/LanguageContext.jsx';

import Dashboard from './views/Dashboard.jsx';
import Appointments from './views/Appointments.jsx';
import Queue from './views/Queue.jsx';
import Records from './views/Records.jsx';
import Doctors from './views/Doctors.jsx';
import Analytics from './views/Analytics.jsx';
import Navigation from './views/Navigation.jsx';
import Staff from './views/Staff.jsx';
import Admin from './views/Admin.jsx';

const VIEWS = {
  dashboard: Dashboard,
  appointments: Appointments,
  queue: Queue,
  records: Records,
  doctors: Doctors,
  analytics: Analytics,
  navigation: Navigation,
  staff: Staff,
  admin: Admin,
};

const ROLES = [
  { id: 'dashboard', labelKey: 'roles.patient' },
  { id: 'navigation', labelKey: 'roles.maps' },
  { id: 'staff', labelKey: 'roles.staff' },
  { id: 'admin', labelKey: 'roles.admin' },
];

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const validView = (id) => (Object.prototype.hasOwnProperty.call(VIEWS, id) ? id : 'dashboard');

const viewFromHash = () => validView((window.location.hash || '').replace(/^#\/?/, ''));

export default function App() {
  const { t } = useLanguage();
  const [view, setView] = useState(viewFromHash);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seen, setSeen] = useState(readIds);
  const [hospitalId, setHospitalIdState] = useState(() => read('auralife.hospital', ''));
  const [patientName] = useState(() => read('auralife.patient', 'Demo Patient'));
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  useDrawer(drawerOpen, closeDrawer);

  const toast = useCallback((message, tone) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const setHospitalId = useCallback((id) => {
    setHospitalIdState(id);
    try {
      localStorage.setItem('auralife.hospital', id);
    } catch {
      /* storage may be unavailable; selection still works for this session */
    }
  }, []);

  // Connection status drives the sidebar indicator and the offline banner.
  const health = useResource(() => api.health(), [], { pollMs: 20000 });
  const hospitals = useResource(() => api.hospitals(), []);
  const queue = useResource(() => api.queue({ hospitalId: hospitalId || undefined }), [hospitalId], {
    pollMs: 15000,
  });
  const emergencies = useResource(() => api.emergencies(), [], { pollMs: 15000 });
  // One poll feeds both the bell badge and the notification panel.
  const notifications = useResource(() => api.notifications(patientName), [patientName], {
    pollMs: 30000,
  });

  // Default to the first hospital the server reports, never to a hardcoded name.
  useEffect(() => {
    if (!hospitalId && hospitals.data && hospitals.data.length) {
      setHospitalId(hospitals.data[0].id);
    }
  }, [hospitalId, hospitals.data, setHospitalId]);

  const navigate = useCallback((next) => {
    const target = validView(next);
    setView(target);
    setDrawerOpen(false);
    if (viewFromHash() !== target) window.location.hash = `#/${target}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Keep the view in sync with the address bar so Back works, including the
  // hardware/gesture back button on mobile.
  useEffect(() => {
    const onHashChange = () => {
      setView(viewFromHash());
      setDrawerOpen(false);
    };
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) window.location.replace(`#/${view}`);
    return () => window.removeEventListener('hashchange', onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const online = Boolean(health.data) && !health.error;
  const openAlerts = (emergencies.data || []).filter((e) => e.status === 'new').length;
  const notifItems = notifications.data ? notifications.data.items : [];
  const unread = notifItems.filter((n) => !seen.has(n.id)).length;

  const counts = useMemo(
    () => ({
      queue: queue.data ? queue.data.total : 0,
      admin: openAlerts,
    }),
    [queue.data, openAlerts],
  );

  const hospital = (hospitals.data || []).find((h) => h.id === hospitalId) || null;

  const ctx = {
    hospitalId,
    hospital,
    hospitals: hospitals.data || [],
    setHospitalId,
    patientName,
    toast,
    navigate,
    refreshQueue: queue.refresh,
    refreshEmergencies: emergencies.refresh,
    notifications,
    refreshNotifications: notifications.refresh,
    queue,
    emergencies,
    online,
  };

  const Current = VIEWS[view] || Dashboard;
  const now = new Date();

  return (
    <>
      <AppBar
        onMenu={() => setDrawerOpen(true)}
        onAssistant={() => setNotifOpen(true)}
        alerts={unread}
        patientName={patientName}
      />
      {drawerOpen && (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={closeDrawer}
        />
      )}

      <div className="app">
        <Rail
          view={view}
          onNavigate={navigate}
          counts={counts}
          online={online}
          drawerOpen={drawerOpen}
        />

        <main data-view={view}>
          <header className="topbar">
            <div>
              <h1>{t(`titles.${view}`)}</h1>
              <p className="sub">
                {hospital ? `${hospital.name} · ` : ''}
                {now.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="role-switch">
              <button
                type="button"
                className={`role bell ${unread ? 'has-unread' : ''}`.trim()}
                onClick={() => setNotifOpen(true)}
                aria-label={unread ? `${t('notifications.title')}, ${unread}` : t('notifications.title')}
              >
                <Icon.alert style={{ width: 15, height: 15 }} />
                {unread > 0 && <i className="role-badge">{unread}</i>}
              </button>
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`role ${view === r.id ? 'active' : ''}`.trim()}
                  onClick={() => navigate(r.id)}
                >
                  {t(r.labelKey)}
                </button>
              ))}
              <UtilityMenu patientName={patientName} />
            </div>
          </header>

          {!online && !health.loading && (
            <Banner tone="danger">
              <strong>{t('offline.title')}</strong> {t('offline.body')}{' '}
              <code>{t('offline.cmd')}</code> {t('offline.in')} <code>/server</code>.
            </Banner>
          )}

          <div className="view" key={view}>
            <Current ctx={ctx} />
          </div>
        </main>
      </div>

      <TabBar
        view={view}
        onNavigate={navigate}
        onMore={() => setDrawerOpen(true)}
        alerts={unread}
      />

      <Notifications
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        feed={notifications}
        onAction={navigate}
        onSeen={setSeen}
      />

      {!assistantOpen && (
        <button
          type="button"
          className="fab"
          onClick={() => setAssistantOpen(true)}
          aria-label="Open assistant"
        >
          <Icon.chat style={{ width: 22, height: 22 }} />
        </button>
      )}
      <Assistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        patientName={patientName}
      />

      <ToastStack toasts={toasts} />
    </>
  );
}

export { NAV_ITEMS };
