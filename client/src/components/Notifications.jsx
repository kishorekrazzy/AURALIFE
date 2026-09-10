import { useEffect, useState } from 'react';
import { Empty, ErrorState, Loading } from './ui.jsx';
import { Icon } from './Icons.jsx';
import { UI } from './HomeArt.jsx';

const READ_KEY = 'auralife.readNotifications';

function readIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function persistIds(set) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...set]));
  } catch {
    /* storage may be unavailable; badge state is a per-device convenience */
  }
}

const GLYPH = {
  'leave-time': UI.clock,
  'doctor-late': UI.clock,
  'queue-position': Icon.queue,
  'route-change': Icon.map,
  emergency: Icon.alert,
};

const relativeTime = (iso) => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
};

/**
 * Notification centre.
 *
 * Items come from GET /api/notifications, where each one is derived from live
 * records. The `basis` the server returns is shown behind "Why am I seeing
 * this?" so a patient can check any number we put in front of them.
 */
export default function Notifications({ open, onClose, feed, onAction, onSeen }) {
  const [read, setRead] = useState(readIds);
  const [expanded, setExpanded] = useState(null);

  const items = feed.data ? feed.data.items : [];

  // Opening the panel marks everything currently listed as seen.
  useEffect(() => {
    if (!open || !items.length) return;
    const next = new Set(read);
    items.forEach((i) => next.add(i.id));
    setRead(next);
    persistIds(next);
    if (onSeen) onSeen(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, feed.data]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button type="button" className="notif-scrim" aria-label="Close notifications" onClick={onClose} />
      <aside className="notif-panel" role="dialog" aria-label="Notifications">
        <header className="notif-head">
          <div>
            <b>Notifications</b>
            <small>{items.length ? `${items.length} active` : 'Nothing needs attention'}</small>
          </div>
          <button type="button" className="chat-close" onClick={onClose} aria-label="Close">
            <Icon.close style={{ width: 15, height: 15 }} />
          </button>
        </header>

        <div className="notif-body">
          {feed.loading && !feed.data ? (
            <Loading rows={3} />
          ) : feed.error ? (
            <ErrorState error={feed.error} onRetry={feed.reload} />
          ) : items.length === 0 ? (
            <Empty
              title="You're all set"
              hint="Alerts about your token, travel time and routes will appear here."
            />
          ) : (
            items.map((n) => {
              const Glyph = GLYPH[n.type] || Icon.info;
              return (
                <article key={n.id} className={`notif notif-${n.severity}`}>
                  <span className="notif-glyph">
                    <Glyph />
                  </span>
                  <div className="notif-main">
                    <b>{n.title}</b>
                    <p>{n.body}</p>
                    <div className="notif-foot">
                      <span className="notif-time">{relativeTime(n.at)}</span>
                      {n.action && (
                        <button
                          type="button"
                          className="view-all"
                          onClick={() => {
                            onAction(n.action.view);
                            onClose();
                          }}
                        >
                          {n.action.label} <UI.chevron />
                        </button>
                      )}
                      <button
                        type="button"
                        className="notif-why"
                        onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                        aria-expanded={expanded === n.id}
                      >
                        {expanded === n.id ? 'Hide basis' : 'Why am I seeing this?'}
                      </button>
                    </div>
                    {expanded === n.id && (
                      <dl className="notif-basis">
                        {Object.entries(n.basis || {}).map(([k, v]) => (
                          <div key={k}>
                            <dt>{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt>
                            <dd>{v === null ? '—' : String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}

export { readIds };
