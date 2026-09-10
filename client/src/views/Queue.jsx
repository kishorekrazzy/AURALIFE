import { Card, Stat, Pill, Resource, Empty, statusTone } from '../components/ui.jsx';

export default function Queue({ ctx }) {
  const { queue, patientName } = ctx;

  const data = queue.data;
  const byDepartment = (data ? data.entries : []).reduce((acc, e) => {
    (acc[e.department] = acc[e.department] || []).push(e);
    return acc;
  }, {});

  return (
    <>
      <div className="stats">
        <Stat tone="blue" value={data ? data.total : '—'} label="Patients in queue" />
        <Stat
          value={data && data.servingToken !== null ? `#${data.servingToken}` : '—'}
          label="Now serving"
        />
        <Stat
          tone="warn"
          value={data ? `${data.averageConsultMinutes} min` : '—'}
          label="Average consultation"
        />
        <Stat value={Object.keys(byDepartment).length || '—'} label="Active departments" />
      </div>

      <Card
        title="Hospital-wide live queue"
        eyebrow="Auto-refresh 15s"
        action={
          <button type="button" className="btn secondary" onClick={queue.reload}>
            Refresh now
          </button>
        }
      >
        <Resource
          state={queue}
          skeletonRows={5}
          isEmpty={(d) => !d.entries.length}
          empty={<Empty title="No one is waiting" hint="Every token has been served." />}
          onRetry={queue.reload}
        >
          {(d) =>
            Object.entries(
              d.entries.reduce((acc, e) => {
                (acc[e.department] = acc[e.department] || []).push(e);
                return acc;
              }, {}),
            ).map(([dept, entries]) => (
              <div key={dept} style={{ marginBottom: 18 }}>
                <div className="spread" style={{ marginBottom: 6 }}>
                  <h3>{dept}</h3>
                  <span className="eyebrow">{entries.length} waiting</span>
                </div>
                {entries.map((e) => (
                  <div className="row" key={e.id}>
                    <span
                      className={`token ${e.status === 'in-progress' ? 'now' : ''} ${e.priority ? 'priority' : ''}`.trim()}
                    >
                      {e.token}
                    </span>
                    <span className="grow">
                      <span className="row-name">
                        {e.patientName === patientName ? `${e.patientName} (you)` : e.patientName}
                      </span>
                      <span className="muted">
                        {e.doctorName || 'Unassigned'} · {e.room || 'Room TBC'}
                      </span>
                    </span>
                    {e.priority && <Pill tone="danger">Priority</Pill>}
                    <Pill tone={statusTone(e.status)}>
                      {e.status === 'in-progress'
                        ? 'In consult'
                        : `~${e.estimatedWaitMinutes} min`}
                    </Pill>
                  </div>
                ))}
              </div>
            ))
          }
        </Resource>
      </Card>
    </>
  );
}
