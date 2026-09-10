import { useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import { useResource, useAction } from '../hooks/useResource.js';
import {
  Card, Banner, Resource, Empty, Field, Modal, Pill, Segment,
  inr, formatDate, statusTone, titleCase,
} from '../components/ui.jsx';

// Local calendar date — toISOString() would hand back the UTC day, which is
// yesterday for timezones ahead of UTC late in the evening.
const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function Appointments({ ctx }) {
  const { patientName, toast, refreshQueue } = ctx;

  const departments = useResource(() => api.departments(), []);
  const [department, setDepartment] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [confirmed, setConfirmed] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const [tab, setTab] = useState('book');

  // A doctor chosen on the dashboard carries over into the booking form.
  useEffect(() => {
    let preset = null;
    try {
      preset = sessionStorage.getItem('auralife.preselect');
      sessionStorage.removeItem('auralife.preselect');
    } catch {
      /* sessionStorage may be unavailable */
    }
    if (!preset) return;
    api
      .doctors()
      .then((list) => {
        const doc = list.find((d) => d.id === preset);
        if (doc) {
          setDepartment(doc.department);
          setDoctorId(doc.id);
        }
      })
      .catch(() => {});
  }, []);

  const doctors = useResource(
    () => api.doctors(department ? { department } : undefined),
    [department],
  );

  const slots = useResource(
    () => (doctorId ? api.slots(doctorId, date) : Promise.resolve(null)),
    [doctorId, date],
    { enabled: Boolean(doctorId && date) },
  );

  const mine = useResource(() => api.appointments({ patientName }), [patientName]);

  const selectedDoctor = useMemo(
    () => (doctors.data || []).find((d) => d.id === doctorId) || null,
    [doctors.data, doctorId],
  );

  // Reset dependent selections when a parent selection changes.
  useEffect(() => {
    setTime('');
  }, [doctorId, date]);
  useEffect(() => {
    setDoctorId('');
  }, [department]);

  const book = useAction(
    () => api.book({ patientName, doctorId, date, time }),
    {
      onSuccess: (created) => {
        setConfirmed(created);
        setTime('');
        slots.refresh();
        mine.refresh();
        refreshQueue();
        toast(`Token #${created.token} confirmed`);
      },
      onError: (err) => {
        toast(err.message, 'error');
        slots.refresh();
      },
    },
  );

  const canBook = Boolean(doctorId && date && time) && !book.pending;

  return (
    <>
      <Segment
        ariaLabel="Appointment section"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'book', label: 'Book a visit' },
          { value: 'mine', label: `My appointments${mine.data ? ` (${mine.data.length})` : ''}` },
        ]}
      />

      {tab === 'book' ? (
        <div className="grid-2" style={{ marginTop: 16 }}>
          <Card title="Book an appointment" eyebrow="Live availability">
            <Resource state={departments} skeletonRows={3}>
              {(deps) => (
                <>
                  <Field label="Department">
                    <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                      <option value="">Select a department</option>
                      {deps.map((d) => (
                        <option key={d.id} value={d.name} disabled={d.doctorCount === 0}>
                          {d.name} ({d.doctorCount})
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Doctor"
                    hint={
                      department && doctors.data
                        ? `${doctors.data.length} doctor(s) listed in ${department}.`
                        : 'Choose a department first.'
                    }
                  >
                    <select
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      disabled={!department || doctors.loading}
                    >
                      <option value="">
                        {doctors.loading ? 'Loading doctors…' : 'Select a doctor'}
                      </option>
                      {(doctors.data || []).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {inr(d.fee)} · {d.experienceYears} yrs
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Preferred date">
                    <input
                      type="date"
                      value={date}
                      min={today()}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </Field>

                  <Field label="Available slots">
                    {!doctorId ? (
                      <p className="muted">Select a doctor to load their real availability.</p>
                    ) : slots.loading ? (
                      <p className="muted">Checking the schedule…</p>
                    ) : slots.error ? (
                      <Banner tone="danger">{slots.error.message}</Banner>
                    ) : slots.data ? (
                      <div className="slots">
                        {slots.data.slots.map((s) => (
                          <button
                            key={s.time}
                            type="button"
                            className={`slot ${time === s.time ? 'selected' : ''}`.trim()}
                            disabled={!s.available}
                            onClick={() => setTime(s.time)}
                            title={s.available ? 'Available' : 'Already booked'}
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </Field>

                  {book.error && <Banner tone="danger">{book.error.message}</Banner>}

                  <button
                    type="button"
                    className="btn primary full"
                    disabled={!canBook}
                    onClick={book.execute}
                  >
                    {book.pending ? 'Confirming…' : 'Confirm appointment & generate token'}
                  </button>
                </>
              )}
            </Resource>
          </Card>

          <Card title="Fee summary" eyebrow="Payable at booking">
            {selectedDoctor ? (
              <>
                <span className="eyebrow">Consultation fee</span>
                <div className="big-number">{inr(selectedDoctor.fee)}</div>
                <p className="muted">
                  {selectedDoctor.name} · {selectedDoctor.department}
                </p>
                <div className="divider" />
                <div className="mini-grid">
                  <div className="mini">
                    <b style={{ fontSize: 14 }}>{selectedDoctor.room}</b>
                    <span>Consulting room</span>
                  </div>
                  <div className="mini">
                    <b style={{ fontSize: 14 }}>{selectedDoctor.experienceYears} yrs</b>
                    <span>Experience</span>
                  </div>
                  <div className="mini">
                    <b style={{ fontSize: 14 }}>{time || '—'}</b>
                    <span>Selected slot</span>
                  </div>
                  <div className="mini">
                    <b style={{ fontSize: 14 }}>UPI / QR</b>
                    <span>Payment method</span>
                  </div>
                </div>
              </>
            ) : (
              <Empty
                title="No doctor selected"
                hint="Fees come from the doctor record, so nothing is shown until you pick one."
              />
            )}
          </Card>
        </div>
      ) : (
        <Card title="My appointments" eyebrow={patientName} style={{ marginTop: 16 }}>
          <Resource
            state={mine}
            skeletonRows={4}
            empty={<Empty title="No appointments yet" hint="Booked visits will appear here." />}
          >
            {(list) => (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Doctor</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Fee</th>
                      <th>Status</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((a) => (
                      <tr key={a.id}>
                        <td data-label="Token">#{a.token}</td>
                        <td data-label="Doctor">{a.doctorName || '—'}</td>
                        <td data-label="Department">{a.department}</td>
                        <td data-label="Date">{formatDate(a.date)}</td>
                        <td data-label="Time">{a.time}</td>
                        <td data-label="Fee">{inr(a.fee)}</td>
                        <td data-label="Status">
                          <Pill tone={statusTone(a.status)}>{titleCase(a.status)}</Pill>
                        </td>
                        <td data-label="Payment">
                          {a.paid ? (
                            <Pill tone="success">Paid</Pill>
                          ) : (
                            <button
                              type="button"
                              className="btn secondary"
                              style={{ minHeight: 34, padding: '6px 12px' }}
                              onClick={() => setPayFor(a)}
                            >
                              Pay {inr(a.fee)}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Resource>
        </Card>
      )}

      {confirmed && (
        <Modal title="Appointment confirmed" onClose={() => setConfirmed(null)}>
          <Banner tone="success">
            Token <b>#{confirmed.token}</b> issued for {confirmed.patientName}.
          </Banner>
          <div className="mini-grid">
            <div className="mini">
              <b style={{ fontSize: 14 }}>{confirmed.doctorName}</b>
              <span>Doctor</span>
            </div>
            <div className="mini">
              <b style={{ fontSize: 14 }}>{confirmed.room}</b>
              <span>Room</span>
            </div>
            <div className="mini">
              <b style={{ fontSize: 14 }}>
                {formatDate(confirmed.date)} · {confirmed.time}
              </b>
              <span>Scheduled</span>
            </div>
            <div className="mini">
              <b style={{ fontSize: 14 }}>{inr(confirmed.fee)}</b>
              <span>Consultation fee</span>
            </div>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setPayFor(confirmed);
                setConfirmed(null);
              }}
            >
              Pay now
            </button>
            <button type="button" className="btn secondary" onClick={() => setConfirmed(null)}>
              Pay at hospital
            </button>
          </div>
        </Modal>
      )}

      {payFor && (
        <PaymentDialog
          appointment={payFor}
          onClose={() => setPayFor(null)}
          onPaid={() => {
            mine.refresh();
            toast('Payment recorded');
          }}
        />
      )}
    </>
  );
}

/** Deterministic block pattern derived from the payment reference. */
function qrCells(seed) {
  const cells = [];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 441; i += 1) {
    const row = Math.floor(i / 21);
    const col = i % 21;
    const finder =
      (row < 7 && col < 7) || (row < 7 && col > 13) || (row > 13 && col < 7);
    const inner =
      finder &&
      !((row === 1 || row === 5 || col === 1 || col === 5) && !(row === 3 && col === 3));
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push(finder ? inner : (h >>> 16) % 100 < 46);
  }
  return cells;
}

function PaymentDialog({ appointment, onClose, onPaid }) {
  const [done, setDone] = useState(appointment.paid);
  const [error, setError] = useState(null);
  const reference = `AURA-${appointment.id}-${appointment.token}`;
  const cells = useMemo(() => qrCells(reference), [reference]);

  return (
    <Modal title="Pay consultation fee" onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <p className="muted">
          {appointment.doctorName} · {appointment.department}
        </p>
        <div className="big-number">{inr(appointment.fee)}</div>
        <div className="qr-wrap" style={{ margin: '16px auto' }}>
          <div className="qr" role="img" aria-label={`UPI QR code for ${reference}`}>
            {cells.map((on, i) => (
              <span key={i} style={{ background: on ? 'var(--blue-strong)' : 'var(--surface)' }} />
            ))}
          </div>
        </div>
        <p style={{ fontWeight: 600 }}>Scan with any UPI app</p>
        <p className="muted">Reference {reference}</p>

        {error && <Banner tone="danger">{error}</Banner>}
        {done ? (
          <Banner tone="success">Payment recorded against this appointment.</Banner>
        ) : (
          <button
            type="button"
            className="btn primary full"
            onClick={async () => {
              try {
                await api.pay(appointment.id);
                setDone(true);
                onPaid();
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            I have completed payment
          </button>
        )}
      </div>
    </Modal>
  );
}
