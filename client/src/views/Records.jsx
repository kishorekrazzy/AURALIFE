import api from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import {
  Card, Banner, Empty, Loading, ErrorState, Pill, formatDate, statusTone, titleCase,
} from '../components/ui.jsx';

export default function Records({ ctx }) {
  const { patientName } = ctx;
  const record = useResource(() => api.record(patientName), [patientName]);

  if (record.loading) return <Card title="Health record"><Loading rows={5} /></Card>;
  if (record.error) {
    return (
      <Card title="Health record" eyebrow={patientName}>
        {record.error.status === 404 ? (
          <Empty
            title="No record registered"
            hint={record.error.body?.hint || `The server holds no record for ${patientName}.`}
          />
        ) : (
          <ErrorState error={record.error} onRetry={record.reload} />
        )}
      </Card>
    );
  }

  const r = record.data;

  return (
    <>
      <Banner tone="info">
        Consent-based access. This record was released by the server at{' '}
        {new Date(r.accessLoggedAt).toLocaleTimeString('en-IN')} and the access is logged.
      </Banner>

      <Card title={r.name} eyebrow="Patient record">
        <div className="mini-grid">
          <div className="mini"><b>{r.bloodGroup}</b><span>Blood group</span></div>
          <div className="mini"><b>{r.heightCm} cm</b><span>Height</span></div>
          <div className="mini"><b>{r.weightKg} kg</b><span>Weight</span></div>
          <div className="mini">
            <b style={{ fontSize: 15 }}>{r.allergies.length ? r.allergies.join(', ') : 'None'}</b>
            <span>Allergies</span>
          </div>
        </div>
        {r.familyHistory?.length > 0 && (
          <p className="muted" style={{ marginTop: 14 }}>
            Family history: {r.familyHistory.join(', ')} · Consent: {r.consent}
          </p>
        )}
      </Card>

      <div className="grid-2">
        <Card title="Visit history" eyebrow={`${r.visits.length} recorded`}>
          {r.visits.length === 0 ? (
            <Empty title="No previous visits" />
          ) : (
            r.visits.map((v, i) => (
              <div className="row" key={i}>
                <span className="grow">
                  <span className="row-name">{v.department}</span>
                  <span className="muted">{v.summary}</span>
                </span>
                <Pill>{formatDate(v.date)}</Pill>
              </div>
            ))
          )}
        </Card>

        <Card title="Reports & prescriptions" eyebrow={`${r.reports.length} files`}>
          {r.reports.length === 0 ? (
            <Empty title="No reports uploaded" />
          ) : (
            r.reports.map((f, i) => (
              <div className="row" key={i}>
                <span className="grow">
                  <span className="row-name">{f.name}</span>
                  <span className="muted">{f.type}</span>
                </span>
                <Pill>{formatDate(f.date)}</Pill>
              </div>
            ))
          )}
          {r.prescriptions?.length > 0 && (
            <>
              <div className="divider" />
              <h3>Active prescriptions</h3>
              {r.prescriptions.map((p, i) => (
                <div className="row" key={i}>
                  <span className="grow">
                    <span className="row-name">{p.drug}</span>
                    <span className="muted">{p.dosage} · since {formatDate(p.since)}</span>
                  </span>
                </div>
              ))}
            </>
          )}
        </Card>
      </div>

      <Card title="Appointments on file" eyebrow="From the booking system">
        {r.appointments.length === 0 ? (
          <Empty title="No appointments linked to this record" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Time</th><th>Department</th><th>Doctor</th><th>Status</th></tr>
              </thead>
              <tbody>
                {r.appointments.map((a, i) => (
                  <tr key={i}>
                    <td data-label="Date">{formatDate(a.date)}</td>
                    <td data-label="Time">{a.time}</td>
                    <td data-label="Department">{a.department}</td>
                    <td data-label="Doctor">{a.doctorName || '—'}</td>
                    <td data-label="Status">
                      <Pill tone={statusTone(a.status)}>{titleCase(a.status)}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
