import api from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { Card, Stat, Resource, Empty, Banner } from '../components/ui.jsx';

export default function Analytics() {
  const analytics = useResource(() => api.analytics(), [], { pollMs: 30000 });

  return (
    <Resource state={analytics} skeletonRows={6}>
      {(a) => (
        <>
          <div className="stats">
            <Stat tone="blue" value={a.patientsToday} label="Appointments today" />
            <Stat tone="warn" value={`${a.averageWaitMinutes} min`} label="Average wait" />
            <Stat value={a.activeQueue} label="Active queue" />
            <Stat
              tone={a.openEmergencies ? 'danger' : undefined}
              value={a.openEmergencies}
              label="Open emergencies"
            />
          </div>

          <Card title="Operational summary" eyebrow={`Computed ${a.date}`}>
            <div className="mini-grid">
              <div className="mini"><b>{a.completedToday}</b><span>Completed consultations</span></div>
              <div className="mini"><b>{a.utilisationPercent}%</b><span>Slot utilisation</span></div>
              <div className="mini"><b>{a.cancelledToday}</b><span>Cancelled today</span></div>
              <div className="mini">
                <b>{a.doctorsAvailable}/{a.doctorsTotal}</b>
                <span>Doctors available</span>
              </div>
              <div className="mini">
                <b>{a.satisfaction === null ? '—' : `${a.satisfaction}/5`}</b>
                <span>
                  {a.satisfactionSampleSize === 0
                    ? 'No ratings submitted yet'
                    : `From ${a.satisfactionSampleSize} rating(s)`}
                </span>
              </div>
            </div>
            {a.satisfaction === null && (
              <Banner tone="info">
                Satisfaction is left blank rather than estimated — no patient has rated a visit yet.
              </Banner>
            )}
          </Card>

          <Card title="Load by department" eyebrow="Today">
            {a.byDepartment.length === 0 ? (
              <Empty title="No appointments recorded today" />
            ) : (
              a.byDepartment.map((d) => {
                const max = a.byDepartment[0].count || 1;
                return (
                  <div key={d.department} style={{ marginBottom: 14 }}>
                    <div className="spread" style={{ marginBottom: 6 }}>
                      <span className="row-name">{d.department}</span>
                      <span className="eyebrow">{d.count}</span>
                    </div>
                    <div className="progress-track">
                      <div style={{ width: `${(d.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </>
      )}
    </Resource>
  );
}
