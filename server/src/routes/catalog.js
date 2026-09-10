import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

/** Reference data: hospitals, departments, doctors, problem→specialist mapping. */

router.get('/hospitals', (req, res) => {
  const { hospitals, doctors } = db();
  res.json(
    hospitals.map((h) => {
      const roster = doctors.filter((d) => d.hospitalId === h.id);
      return {
        ...h,
        doctorCount: roster.length,
        departments: [...new Set(roster.map((d) => d.department))],
      };
    }),
  );
});

router.get('/hospitals/:id', (req, res) => {
  const { hospitals, doctors } = db();
  const hospital = hospitals.find((h) => h.id === req.params.id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found', id: req.params.id });
  res.json({ ...hospital, doctors: doctors.filter((d) => d.hospitalId === hospital.id) });
});

router.get('/departments', (req, res) => {
  const { departments, doctors } = db();
  res.json(
    departments.map((d) => ({
      ...d,
      doctorCount: doctors.filter((doc) => doc.departmentId === d.id).length,
    })),
  );
});

router.get('/doctors', (req, res) => {
  const { doctors } = db();
  const { department, hospitalId, q } = req.query;
  let list = doctors;
  if (department) list = list.filter((d) => d.department === department);
  if (hospitalId) list = list.filter((d) => d.hospitalId === hospitalId);
  if (q) {
    const needle = String(q).toLowerCase();
    list = list.filter(
      (d) => d.name.toLowerCase().includes(needle) || d.department.toLowerCase().includes(needle),
    );
  }
  res.json(list);
});

router.get('/doctors/:id', (req, res) => {
  const { doctors, hospitals } = db();
  const doctor = doctors.find((d) => d.id === req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found', id: req.params.id });
  const hospital = hospitals.find((h) => h.id === doctor.hospitalId) || null;
  res.json({ ...doctor, hospital });
});

/** Problem → department → doctors. Only doctors that exist are returned. */
router.get('/problems', (req, res) => {
  const { problems } = db();
  res.json(problems.map(({ key, label, department }) => ({ key, label, department })));
});

router.get('/problems/:key/specialists', (req, res) => {
  const { problems, doctors } = db();
  const problem = problems.find((p) => p.key === req.params.key);
  if (!problem) {
    return res.status(404).json({
      error: 'Unknown problem key',
      key: req.params.key,
      hint: 'Call GET /api/problems for the supported list.',
    });
  }
  const matches = doctors.filter((d) => d.departmentId === problem.departmentId);
  res.json({
    problem: problem.label,
    department: problem.department,
    recommendedDoctorId: problem.recommendedDoctorId,
    doctors: matches,
  });
});

router.get('/destinations', (req, res) => {
  const { destinations } = db();
  const { q } = req.query;
  if (!q) return res.json(destinations);
  const needle = String(q).toLowerCase();
  res.json(
    destinations.filter(
      (d) => d.keywords.includes(needle) || d.name.toLowerCase().includes(needle),
    ),
  );
});

/** Patient-education content. Served from the store so the UI never writes
 *  health copy of its own. */
router.get('/insights', (req, res) => {
  const { insights } = db();
  res.json(insights || []);
});

export default router;
