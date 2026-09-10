import { useState } from 'react';
import api from '../api/client.js';
import { useResource, useAction } from '../hooks/useResource.js';
import {
  Card, Stat, Pill, Banner, Resource, Empty, Field,
  statusTone, titleCase,
} from '../components/ui.jsx';

export default function Staff({ ctx }) {
  const { queue, refreshQueue, toast, hospitalId } = ctx;
  const tasks = useResource(() => api.staffTasks(), []);
  const doctors = useResource(() => api.doctors({ hospitalId: hospitalId || undefined }), [hospitalId]);

  const [name, setName] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const departments = useResource(() => api.departments(), []);

  const checkIn = useAction(() => api.walkIn({ patientName: name.trim(), department }), {
    onSuccess: (created) => {
      toast(`${created.patientName} checked in · token #${created.token}`);
      setName('');
      refreshQueue();
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const serveNext = useAction(() => api.serveNext(), {
    onSuccess: (r) => {
      toast(r.nowServing ? `Now serving #${r.nowServing.token}` : 'Queue is now empty');
      refreshQueue();
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const available = (doctors.data || []).filter((d) => d.status === 'available').length;

  return (
    <>
      <div className="stats">
        <Stat tone="blue" value={queue.data ? queue.data.total : '—'} label="Patients in queue" />
        <Stat
          value={queue.data && queue.data.servingToken !== null ? `#${queue.data.servingToken}` : '—'}
          label="Now serving"
        />
        <Stat tone="success" value={doctors.data ? available : '—'} label="Doctors available" />
        <Stat
          tone="warn"
          value={queue.data ? `${queue.data.total * queue.data.averageConsultMinutes} min` : '—'}
          label="Projected clearance"
        />
      </div>

      <div className="grid-2">
        <Card title="Queue desk" eyebrow="Reception / nursing">
          <Resource
            state={queue}
            skeletonRows={5}
            isEmpty={(d) => !d.entries.length}
            empty={<Empty title="Queue is empty" hint="Register a walk-in to start a new queue." />}
          >
            {(d) =>
              d.entries.map((e) => (
                <div className="row" key={e.id}>
                  <span className={`token ${e.status === 'in-progress' ? 'now' : ''} ${e.priority ? 'priority' : ''}`.trim()}>
                    {e.token}
                  </span>
                  <span className="grow">
                    <span className="row-name">{e.patientName}</span>
                    <span className="muted">{e.department} · {e.room || 'Room TBC'}</span>
                  </span>
                  {e.priority && <Pill tone="danger">Priority</Pill>}
                  <Pill tone={statusTone(e.status)}>{titleCase(e.status)}</Pill>
                </div>
              ))
            }
          </Resource>

          <div className="btn-row">
            <button
              type="button"
              className="btn primary"
              onClick={serveNext.execute}
              disabled={serveNext.pending || !queue.data || !queue.data.total}
            >
              {serveNext.pending ? 'Updating…' : 'Call next patient'}
            </button>
            <button type="button" className="btn secondary" onClick={queue.reload}>
              Refresh
            </button>
          </div>
        </Card>

        <Card title="Patient check-in" eyebrow="Front desk">
          <Field label="Patient name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter patient name"
            />
          </Field>
          <Field label="Department">
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              {(departments.data || []).map((d) => (
                <option key={d.id} value={d.name} disabled={d.doctorCount === 0}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          {checkIn.error && <Banner tone="danger">{checkIn.error.message}</Banner>}

          <button
            type="button"
            className="btn primary full"
            disabled={!name.trim() || checkIn.pending}
            onClick={checkIn.execute}
          >
            {checkIn.pending ? 'Checking in…' : 'Check in & generate token'}
          </button>
        </Card>
      </div>

      <Card title="Today's operations" eyebrow="Staff tasks">
        <Resource state={tasks} skeletonRows={4} empty={<Empty title="No tasks assigned" />}>
          {(list) => (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Task</th><th>Details</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {list.map((t) => (
                    <tr key={t.id}>
                      <td data-label="Task">{t.task}</td>
                      <td data-label="Details">{t.detail}</td>
                      <td data-label="Status">
                        <Pill tone={t.status === 'done' ? 'success' : t.status === 'in-progress' ? 'blue' : 'warn'}>
                          {titleCase(t.status)}
                        </Pill>
                      </td>
                      <td data-label="Action">
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ minHeight: 34, padding: '6px 12px' }}
                          disabled={t.status === 'done'}
                          onClick={async () => {
                            try {
                              await api.updateTask(t.id, { status: 'done' });
                              tasks.refresh();
                              toast(`${t.task} marked done`);
                            } catch (err) {
                              toast(err.message, 'error');
                            }
                          }}
                        >
                          {t.status === 'done' ? 'Completed' : 'Mark done'}
                        </button>
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
