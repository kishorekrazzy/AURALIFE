import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import {
  Card, Pill, Resource, Empty, Field, inr, statusTone, titleCase,
} from '../components/ui.jsx';

export default function Doctors({ ctx }) {
  const { navigate } = ctx;
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');

  // A term typed into the home search bar arrives here.
  useEffect(() => {
    try {
      const handoff = sessionStorage.getItem('auralife.doctorSearch');
      if (handoff) {
        setQuery(handoff);
        sessionStorage.removeItem('auralife.doctorSearch');
      }
    } catch {
      /* sessionStorage may be unavailable */
    }
  }, []);

  const departments = useResource(() => api.departments(), []);
  const doctors = useResource(
    () => api.doctors({ q: query || undefined, department: department || undefined }),
    [query, department],
  );

  return (
    <>
      <Card title="Find a doctor" eyebrow="Live roster">
        <div className="grid-2" style={{ gap: 12 }}>
          <Field label="Search by name or speciality">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Cardiology or Mehra"
            />
          </Field>
          <Field label="Department">
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All departments</option>
              {(departments.data || []).map((d) => (
                <option key={d.id} value={d.name}>{d.name} ({d.doctorCount})</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card
        title="Doctors"
        eyebrow={doctors.data ? `${doctors.data.length} listed` : 'Loading'}
      >
        <Resource
          state={doctors}
          skeletonRows={5}
          empty={<Empty title="No doctors match" hint="Try a different department or search term." />}
        >
          {(list) => (
            <div className="grid-auto">
              {list.map((d) => (
                <div className="select-card" key={d.id} style={{ cursor: 'default' }}>
                  <div className="spread">
                    <span className="inline">
                      <span className="avatar">{d.initials}</span>
                      <span>
                        <b>{d.name}</b>
                        <span className="meta-sub">{d.department}</span>
                      </span>
                    </span>
                    <Pill tone={statusTone(d.status)}>{titleCase(d.status)}</Pill>
                  </div>
                  <span className="meta-sub">
                    {d.room} · {d.experienceYears} yrs experience · {inr(d.fee)}
                  </span>
                  <button
                    type="button"
                    className="btn secondary full"
                    onClick={() => {
                      try { sessionStorage.setItem('auralife.preselect', d.id); } catch { /* optional */ }
                      navigate('appointments');
                    }}
                  >
                    Book with {d.name.replace('Dr. ', 'Dr ')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Resource>
      </Card>
    </>
  );
}
