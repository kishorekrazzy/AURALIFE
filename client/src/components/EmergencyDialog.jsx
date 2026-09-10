import { useState } from 'react';
import api from '../api/client.js';
import { useResource, useAction } from '../hooks/useResource.js';
import { Banner, Field, Modal } from './ui.jsx';
import { Icon } from './Icons.jsx';

/**
 * Emergency workflow.
 *
 * Deliberately framed so the primary action is calling emergency services. The
 * in-app alert notifies the hospital team and creates a priority token — it
 * does not dispatch an ambulance and does not reach a national emergency
 * operator. That limitation is stated before the alert can be sent, and again
 * after it is sent, because a patient in distress should never be left assuming
 * help is on the way when it is not.
 */
export default function EmergencyDialog({ ctx, onClose }) {
  const { hospitalId, hospital, patientName, toast, refreshEmergencies, refreshQueue } = ctx;
  const safety = useResource(() => api.emergencySafety(), []);
  const [reason, setReason] = useState('Chest pain');
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);

  const cfg = safety.data || { emergencyNumber: '112', ambulanceNumber: '108', productionRequirements: [] };

  const raise = useAction(() => api.raiseEmergency({ patientName, reason, note, hospitalId }), {
    onSuccess: (r) => {
      setResult(r);
      refreshEmergencies();
      refreshQueue();
      toast('Hospital team alerted');
    },
    onError: (e) => toast(e.message, 'error'),
  });

  return (
    <Modal title="Emergency" onClose={onClose}>
      {/* Life-safety path first, before anything about the app's own workflow. */}
      <div className="sos">
        <div className="sos-head">
          <span className="sos-glyph">
            <Icon.alert />
          </span>
          <div>
            <b>Life-threatening emergency?</b>
            <p>
              Call emergency services now. This app cannot dispatch an ambulance or reach an
              emergency operator.
            </p>
          </div>
        </div>
        <div className="sos-actions">
          <a className="btn danger" href={`tel:${cfg.emergencyNumber}`}>
            Call {cfg.emergencyNumber} — emergency
          </a>
          <a className="btn ghost" href={`tel:${cfg.ambulanceNumber}`}>
            Call {cfg.ambulanceNumber} — ambulance
          </a>
        </div>
        {hospital && hospital.phone && (
          <a className="sos-hospital" href={`tel:${hospital.phone}`}>
            Or call {hospital.name} directly: {hospital.phone}
          </a>
        )}
      </div>

      <div className="divider" />

      {result ? (
        <>
          <Banner tone="success">
            Hospital alert <b>{result.id}</b> received by {result.hospitalName}.
          </Banner>
          <p className="muted">
            {result.assignedDoctorName
              ? `${result.assignedDoctorName} has been notified`
              : 'The on-call team has been notified'}{' '}
            and a priority token was created ahead of the standard queue. You will see an update
            here when the team acknowledges it.
          </p>
          <Banner tone="warn">
            This alert reaches the hospital's own team only. If your condition worsens or nobody
            acknowledges within a few minutes, call {cfg.emergencyNumber}.
          </Banner>
          <button type="button" className="btn primary full" onClick={onClose}>
            Done
          </button>
        </>
      ) : (
        <>
          <h3 style={{ fontSize: 15 }}>Alert the hospital team</h3>
          <p className="muted">
            Sends a priority request to {hospital ? hospital.name : 'your selected hospital'} and
            moves you to the front of the queue. Use this when you are already on your way or on
            site — not as a replacement for the calls above.
          </p>

          <Field label="Reason">
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option>Chest pain</option>
              <option>Breathing difficulty</option>
              <option>Severe injury</option>
              <option>Sudden weakness or fainting</option>
              <option>Other urgent condition</option>
            </select>
          </Field>
          <Field label="Note for the team">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Briefly describe the situation"
            />
          </Field>

          {raise.error && <Banner tone="danger">{raise.error.message}</Banner>}

          <button
            type="button"
            className="btn primary full"
            onClick={raise.execute}
            disabled={raise.pending}
          >
            {raise.pending ? 'Alerting…' : 'Alert hospital team'}
          </button>

          <details className="sos-limits">
            <summary>What this prototype does not do</summary>
            <p>
              This is a demonstration build. Before it could be used for real care it would need:
            </p>
            <ul>
              {(cfg.productionRequirements || []).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p>
              Until then, treat the in-app alert as a courtesy notification to the hospital, not as
              a dispatched emergency response.
            </p>
          </details>
        </>
      )}
    </Modal>
  );
}
