import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import { Icon } from './Icons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';

// Sent verbatim to the server's keyword-matching assistant, so these stay in
// English regardless of app language — translating them would stop the
// server from recognising the question.
const QUICK = [
  'What is my token?',
  'How long is the wait?',
  'Which departments are available?',
  'What are the consultation fees?',
];

/**
 * The assistant renders only what POST /api/assistant returns.
 *
 * The server answers from stored records and replies "I don't have data for
 * that" when no intent matches, so there is no path by which this component can
 * present an invented answer. Answers carry the records they were built from,
 * shown under each reply. The server's own answers are generated in English;
 * only this component's static chrome follows the app language.
 */
export default function Assistant({ open, onClose, patientName }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([{ role: 'bot', text: t('assistant.greeting') }]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  // Re-translate the opening greeting if the language changes before the
  // patient has actually asked anything.
  useEffect(() => {
    setMessages((m) => (m.length === 1 && m[0].role === 'bot' ? [{ role: 'bot', text: t('assistant.greeting') }] : m));
  }, [t]);

  async function send(text) {
    const question = (text ?? input).trim();
    if (!question || pending) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setPending(true);
    try {
      const reply = await api.ask(question, patientName);
      setMessages((m) => [
        ...m,
        {
          role: 'bot',
          text: reply.answer,
          grounding: reply.grounding,
          answered: reply.answered,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'bot',
          text: `${t('assistant.unreachable')} (${err.message})`,
          answered: false,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="chat" role="dialog" aria-label="AURALIFE assistant">
      <header className="chat-head">
        <div>
          <b>AURALIFE {t('assistant.name')}</b>
          <small>{t('assistant.subtitle')}</small>
        </div>
        <button type="button" className="chat-close" onClick={onClose} aria-label="Close assistant">
          <Icon.close style={{ width: 15, height: 15 }} />
        </button>
      </header>

      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`msg ${m.role} ${m.answered === false ? 'unanswered' : ''}`.trim()}
          >
            {m.text}
            {m.grounding && m.grounding.length > 0 && (
              <span className="msg-source">
                {t('assistant.source')}: {m.grounding.join(', ')}
              </span>
            )}
          </div>
        ))}
        {pending && (
          <div className="msg bot">
            <span className="spinner" style={{ width: 14, height: 14, display: 'inline-block' }} />
          </div>
        )}
      </div>

      <div className="chat-quick">
        {QUICK.map((q) => (
          <button key={q} type="button" onClick={() => send(q)} disabled={pending}>
            {q}
          </button>
        ))}
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('assistant.placeholder')}
          aria-label={t('assistant.placeholder')}
        />
        <button type="submit" disabled={pending || !input.trim()}>
          {t('assistant.send')}
        </button>
      </form>
    </div>
  );
}
