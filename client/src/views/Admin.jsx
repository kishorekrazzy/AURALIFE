import { useState } from 'react';
import api from '../api/client.js';
import { useResource, useAction } from '../hooks/useResource.js';
import {
  Card, Stat, Pill, Banner, Resource, Empty, Field,
  formatDate, statusTone, titleCase, inr,
} from '../components/ui.jsx';
import { todayLocal } from '../lib/date.js';

export default function Admin({ ctx }) {
  const { queue, emergencies, refreshQueue, refreshEmergencies, refreshNotifications, toast } = ctx;

  const analytics = useResource(() => api.analytics(), [], { pollMs: 30000 });
  const appointments = useResource(
    () => api.appointments({ date: todayLocal() }),
    [],
    { pollMs: 30000 },
  );
  const doctors = useResource(() => api.doctors(), []);
  const facilities = useResource(() => api.facilities(), []);

  const [lookup, setLookup] = useState('');
  const [record, setRecord] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  const search = useAction(
    async () => {
      setLookupError(null);
      setRecord(null);
      const r = await api.record(lookup.trim());
      setRecord(r);
      return r;
    },
    { onError: (err) => setLookupError(err) },
  );

  const open = (emergencies.data || []).filter((e) => e.status === 'new');

  return (
    <>
      {open.length > 0 && (
        <Card accent="danger" title="Emergency priority alerts" eyebrow={`${open.length} open`}>
          {open.map((e) => (
            <div key={e.id} style={{ marginBottom: 14 }}>
              <div className="mini-grid">
                <div className="mini"><b style={{ fontSize: 14 }}>{e.patientName}</b><span>Patient</span></div>
                <div className="mini"><b style={{ fontSize: 14 }}>{e.reason}</b><span>Reason</span></div>
                <div className="mini">
                  <b style={{ fontSize: 14 }}>{e.assignedDoctorName || 'Unassigned'}</b>
                  <span>Assigned doctor</span>
                </div>
                <div className="mini">
                  <b style={{ fontSize: 14 }}>{new Date(e.createdAt).toLocaleTimeString('en-IN')}</b>
                  <span>Received</span>
                </div>
              </div>
              {e.note && <p className="muted" style={{ marginTop: 10 }}>Note: {e.note}</p>}
              <div className="btn-row">
                <button
                  type="button"
                  className="btn primary"
                  onClick={async () => {
                    try {
                      await api.acknowledgeEmergency(e.id);
                      refreshEmergencies();
                      toast('Doctor notified');
                    } catch (err) { toast(err.message, 'error'); }
                  }}
                >
                  Acknowledge & notify doctor
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={async () => {
                    try {
                      await api.clearEmergency(e.id);
                      refreshEmergencies();
                      refreshQueue();
                      toast('Alert cleared');
                    } catch (err) { toast(err.message, 'error'); }
                  }}
                >
                  Clear alert
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <div className="stats">
        <Stat tone="blue" value={analytics.data ? analytics.data.patientsToday : '—'} label="Appointments today" />
        <Stat tone="warn" value={analytics.data ? `${analytics.data.averageWaitMinutes} min` : '—'} label="Average wait" />
        <Stat value={queue.data ? queue.data.total : '—'} label="Current queue" />
        <Stat tone={open.length ? 'danger' : undefined} value={open.length} label="Open emergencies" />
      </div>

      <div className="grid-2">
        <Card
          title="Queue control"
          eyebrow="Live"
          action={
            <button
              type="button"
              className="btn primary"
              onClick={async () => {
                try {
                  const r = await api.serveNext();
                  refreshQueue();
                  toast(r.nowServing ? `Now serving #${r.nowServing.token}` : 'Queue cleared');
                } catch (err) { toast(err.message, 'error'); }
              }}
            >
              Serve next
            </button>
          }
        >
          <Resource
            state={queue}
            skeletonRows={5}
            isEmpty={(d) => !d.entries.length}
            empty={<Empty title="Queue is empty" />}
          >
            {(d) =>
              d.entries.map((e) => (
                <div className="row" key={e.id}>
                  <span className={`token ${e.status === 'in-progress' ? 'now' : ''} ${e.priority ? 'priority' : ''}`.trim()}>
                    {e.token}
                  </span>
                  <span className="grow">
                    <span className="row-name">{e.patientName}</span>
                    <span className="muted">{e.department} · {e.doctorName || 'Unassigned'}</span>
                  </span>
                  <Pill tone={statusTone(e.status)}>{titleCase(e.status)}</Pill>
                </div>
              ))
            }
          </Resource>
        </Card>

        <Card title="Doctor availability" eyebrow="Roster">
          <Resource state={doctors} skeletonRows={5} empty={<Empty title="No doctors registered" />}>
            {(list) =>
              list.slice(0, 8).map((d) => (
                <div className="person" key={d.id}>
                  <span className="avatar">{d.initials}</span>
                  <span className="grow">
                    <span className="row-name">{d.name}</span>
                    <span className="muted">{d.department} · {d.room}</span>
                  </span>
                  <span className={`status-dot ${d.status === 'busy' ? 'busy' : ''}`.trim()} />
                </div>
              ))
            }
          </Resource>
        </Card>
      </div>

      <Card
        title="Facility status"
        eyebrow="Drives route alerts"
        description="Taking a lift or ramp out of service re-routes affected patients and notifies them."
      >
        <Resource state={facilities} skeletonRows={4} empty={<Empty title="No facilities registered" />}>
          {(list) => (
            <div className="grid-auto">
              {list.map((f) => (
                <div className="select-card" key={f.id} style={{ cursor: 'default' }}>
                  <div className="spread">
                    <b>{f.name}</b>
                    <Pill tone={f.status === 'in-service' ? 'success' : 'danger'}>
                      {titleCase(f.status)}
                    </Pill>
                  </div>
                  <span className="meta-sub">
                    {titleCase(f.type)} · serves floor{f.serves.length === 1 ? '' : 's'}{' '}
                    {f.serves.join(', ')}
                  </span>
                  {f.note && <span className="meta-sub">{f.note}</span>}
                  <button
                    type="button"
                    className={`btn ${f.status === 'in-service' ? 'secondary' : 'primary'} full`}
                    onClick={async () => {
                      const next = f.status === 'in-service' ? 'out-of-service' : 'in-service';
                      try {
                        await api.setFacilityStatus(f.id, {
                          status: next,
                          note: next === 'out-of-service' ? 'Taken out of service by staff' : '',
                        });
                        facilities.refresh();
                        refreshNotifications();
                        toast(`${f.name} is now ${next.replace('-', ' ')}`);
                      } catch (err) {
                        toast(err.message, 'error');
                      }
                    }}
                  >
                    {f.status === 'in-service' ? 'Take out of service' : 'Return to service'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Resource>
      </Card>

      <Card
        title="Patient record lookup"
        eyebrow="Consent-based"
        description="Authorised staff can review a patient's history before consultation. Access is logged."
      >
        <div className="grid-2" style={{ gap: 12 }}>
          <Field label="Patient name">
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="e.g. Demo Patient"
              onKeyDown={(e) => { if (e.key === 'Enter' && lookup.trim()) search.execute(); }}
            />
          </Field>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              className="btn primary full"
              style={{ marginTop: 0 }}
              disabled={!lookup.trim() || search.pending}
              onClick={search.execute}
            >
              {search.pending ? 'Searching…' : 'Search records'}
            </button>
          </div>
        </div>

        {lookupError && (
          <Banner tone="warn">
            {lookupError.message}
            {lookupError.body?.hint ? ` ${lookupError.body.hint}` : ''}
          </Banner>
        )}

        {record && (
          <>
            <Banner tone="success">Record released for <b>{record.name}</b>. Access logged.</Banner>
            <div className="mini-grid">
              <div className="mini"><b>{record.bloodGroup}</b><span>Blood group</span></div>
              <div className="mini">
                <b style={{ fontSize: 15 }}>{record.allergies.length ? record.allergies.join(', ') : 'None'}</b>
                <span>Allergies</span>
              </div>
              <div className="mini"><b>{record.visits.length}</b><span>Previous visits</span></div>
              <div className="mini"><b>{record.reports.length}</b><span>Reports on file</span></div>
            </div>
          </>
        )}
      </Card>

      <Card title="Today's appointments" eyebrow="All departments">
        <Resource
          state={appointments}
          skeletonRows={5}
          empty={<Empty title="No appointments booked today" />}
        >
          {(list) => (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Token</th><th>Time</th><th>Patient</th><th>Doctor</th>
                    <th>Department</th><th>Fee</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a) => (
                    <tr key={a.id}>
                      <td data-label="Token">#{a.token}</td>
                      <td data-label="Time">{a.time}</td>
                      <td data-label="Patient">{a.patientName}</td>
                      <td data-label="Doctor">{a.doctorName || '—'}</td>
                      <td data-label="Department">{a.department}</td>
                      <td data-label="Fee">{a.paid ? inr(a.fee) : `${inr(a.fee)} due`}</td>
                      <td data-label="Status">
                        <Pill tone={statusTone(a.status)}>{titleCase(a.status)}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Resource>
      </Card>
    </>
  );
}
