import { useState } from 'react';
import api from '../api/client.js';
import { useResource, useAction } from '../hooks/useResource.js';
import { Banner, Field, Modal, formatDate } from './ui.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';

/**
 * Feedback on the patient's last visit.
 *
 * The "last visit" shown here is a real, completed appointment fetched from
 * the API — never an invented example. If the patient has no completed visit
 * yet, the dialog says so plainly and still accepts general feedback, rather
 * than pretending a visit exists.
 */
export default function FeedbackDialog({ patientName, onClose }) {
  const { t } = useLanguage();

  const completed = useResource(
    () => api.appointments({ patientName, status: 'completed' }),
    [patientName],
  );
  const lastVisit = (completed.data || [])
    .slice()
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))[0] || null;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [type, setType] = useState('compliment');
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState(null);
  const [done, setDone] = useState(false);

  const submit = useAction(
    () =>
      api.sendFeedback({
        rating: rating || undefined,
        type,
        message,
        patientName,
        appointmentId: lastVisit ? lastVisit.id : undefined,
      }),
    {
      onSuccess: () => setDone(true),
    },
  );

  function handleSubmit() {
    if (!rating && !message.trim()) {
      setValidation(t('feedback.validation'));
      return;
    }
    setValidation(null);
    submit.execute();
  }

  return (
    <Modal title={t('feedback.title')} onClose={onClose}>
      {done ? (
        <>
          <Banner tone="success">
            <b>{t('feedback.thanksTitle')}</b>
          </Banner>
          <p className="muted" style={{ marginTop: 4 }}>
            {t('feedback.thanksBody')}
          </p>
          <button type="button" className="btn primary full" onClick={onClose}>
            {t('feedback.done')}
          </button>
        </>
      ) : (
        <>
          <p className="muted">{t('feedback.subtitle')}</p>

          <div className="feedback-visit">
            <span className="feedback-visit-label">{t('feedback.lastVisit')}</span>
            {completed.loading ? (
              <span className="muted">{t('feedback.loadingVisit')}</span>
            ) : lastVisit ? (
              <div className="feedback-visit-card">
                <b>{lastVisit.doctorName || lastVisit.department}</b>
                <span>
                  {lastVisit.department} · {formatDate(lastVisit.date)}
                </span>
              </div>
            ) : (
              <div className="feedback-visit-card is-empty">
                <b>{t('feedback.noVisit')}</b>
                <span>{t('feedback.noVisitHint')}</span>
              </div>
            )}
          </div>

          <Field label={t('feedback.ratingLabel')}>
            <div className="stars" role="radiogroup" aria-label={t('feedback.ratingLabel')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} / 5`}
                  className={`star ${n <= (hoverRating || rating) ? 'on' : ''}`.trim()}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </button>
              ))}
            </div>
          </Field>

          <Field label={t('feedback.typeLabel')}>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="compliment">{t('feedback.typeCompliment')}</option>
              <option value="suggestion">{t('feedback.typeSuggestion')}</option>
              <option value="complaint">{t('feedback.typeComplaint')}</option>
            </select>
          </Field>

          <Field label={t('feedback.messageLabel')}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('feedback.messagePlaceholder')}
              rows={3}
            />
          </Field>

          {(validation || submit.error) && (
            <Banner tone="danger">{validation || submit.error.message}</Banner>
          )}

          <button
            type="button"
            className="btn primary full"
            onClick={handleSubmit}
            disabled={submit.pending}
          >
            {submit.pending ? t('feedback.submitting') : t('feedback.submit')}
          </button>
        </>
      )}
    </Modal>
  );
}
