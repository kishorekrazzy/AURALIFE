import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icons.jsx';

/* ------------------------------------------------------------------ cards */

export function Card({ title, eyebrow, description, action, accent, children, className = '' }) {
  return (
    <section className={`card ${accent ? `accent-${accent}` : ''} ${className}`.trim()}>
      {(title || eyebrow || action) && (
        <header className="card-head">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p className="muted">{description}</p>}
          </div>
          {action || (eyebrow && <span className="eyebrow">{eyebrow}</span>)}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ value, label, tone }) {
  return (
    <div className={`stat ${tone ? `tone-${tone}` : ''}`.trim()}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function Pill({ tone, children }) {
  return <span className={`pill ${tone || ''}`.trim()}>{children}</span>;
}

export function Banner({ tone = 'info', icon = true, children }) {
  const Glyph = tone === 'danger' ? Icon.alert : tone === 'success' ? Icon.check : Icon.info;
  return (
    <div className={`banner ${tone}`}>
      {icon && <Glyph />}
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------- request states */

export function Loading({ label = 'Loading from server…', rows = 0 }) {
  if (rows) {
    return (
      <div className="skeleton-rows" aria-busy="true" aria-label={label}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton" style={{ width: `${100 - i * 7}%` }} />
        ))}
      </div>
    );
  }
  return (
    <div className="state" role="status">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const offline = error?.status === 0;
  return (
    <div className="state" role="alert">
      <Icon.alert style={{ width: 24, height: 24, color: 'var(--danger)' }} />
      <strong>{offline ? 'Server unreachable' : 'Request failed'}</strong>
      <span>{error?.message || 'Unknown error'}</span>
      {onRetry && (
        <button type="button" className="btn secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title = 'Nothing here yet', hint }) {
  return (
    <div className="state">
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
    </div>
  );
}

/**
 * Renders exactly one of loading / error / empty / content.
 * Views use this instead of `data || fallbackExample` so an unanswered request
 * can never be mistaken for real data.
 */
export function Resource({ state, children, empty, isEmpty, skeletonRows, onRetry }) {
  if (state.loading && !state.data) return <Loading rows={skeletonRows} />;
  if (state.error) return <ErrorState error={state.error} onRetry={onRetry || state.reload} />;
  if (!state.data) return <Empty title="No data returned" />;
  const emptyNow = isEmpty ? isEmpty(state.data) : Array.isArray(state.data) && !state.data.length;
  if (emptyNow) return empty || <Empty />;
  return children(state.data);
}

/* ----------------------------------------------------------------- forms */

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="muted">{hint}</span>}
    </label>
  );
}

export function Segment({ options, value, onChange, ariaLabel }) {
  return (
    <div className="segment" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- modal */

export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [onClose]);

  // Rendered into <body> on purpose: any ancestor with a transform (including
  // the identity matrix a finished animation leaves behind) becomes the
  // containing block for position:fixed, which would drag the sheet off-screen.
  return createPortal(
    <div
      className="modal-scrim"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <header className="card-head">
          <h2>{title}</h2>
          <button type="button" className="btn secondary" onClick={onClose}>
            Close
          </button>
        </header>
        {children}
        {footer}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------- toasts */

export function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone === 'error' ? 'error' : ''}`.trim()}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- helpers */

export const inr = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—';

export const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const titleCase = (s) =>
  typeof s === 'string' ? s.replace(/(^|[-\s])(\w)/g, (m) => m.toUpperCase()).replace(/-/g, ' ') : s;

export const statusTone = (status) =>
  ({
    'in-progress': 'success',
    waiting: 'warn',
    completed: 'blue',
    cancelled: 'danger',
    available: 'success',
    busy: 'warn',
    dispatched: 'blue',
    'on-trip': 'warn',
    new: 'danger',
    acknowledged: 'success',
  }[status] || '');
