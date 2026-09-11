import { useEffect, useRef, useState } from 'react';
import { UI } from './HomeArt.jsx';
import { Icon } from './Icons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import FeedbackDialog from './FeedbackDialog.jsx';

/**
 * Two plain icon buttons — language and feedback — rendered as ordinary
 * members of whichever row they sit in (the desktop role-switch or the
 * mobile app bar), so they pick up that row's own button style and spacing
 * instead of introducing a shape of their own.
 */
export default function UtilityMenu({ patientName }) {
  const { lang, setLang, t, languages } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!langOpen) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setLangOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setLangOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [langOpen]);

  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <>
      <div className="util-lang" ref={wrapRef}>
        <button
          type="button"
          className="util-icon-btn"
          onClick={() => setLangOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={langOpen}
          aria-label={`${t('lang.change')} (${current.native})`}
          title={t('lang.change')}
        >
          <UI.globe />
        </button>

        {langOpen && (
          <div className="lang-menu" role="listbox" aria-label={t('lang.title')}>
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={l.code === lang}
                className={`lang-option ${l.code === lang ? 'active' : ''}`.trim()}
                onClick={() => {
                  setLang(l.code);
                  setLangOpen(false);
                }}
              >
                <span>{l.native}</span>
                {l.code === lang && <Icon.check style={{ width: 14, height: 14 }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="util-icon-btn"
        onClick={() => setFeedbackOpen(true)}
        aria-label={t('feedback.cta')}
        title={t('feedback.cta')}
      >
        <UI.feedback />
      </button>

      {feedbackOpen && (
        <FeedbackDialog patientName={patientName} onClose={() => setFeedbackOpen(false)} />
      )}
    </>
  );
}
