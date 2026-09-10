import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import { Icon } from './Icons.jsx';

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
 * shown under each reply.
 */
export default function Assistant({ open, onClose, patientName }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text:
        'Hi, I am the AURALIFE assistant. I answer from this hospital’s live records — tokens, waiting time, departments, doctors, fees, health records, emergencies and navigation. If I do not have the data, I will say so rather than guess.',
    },
  ]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

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
          text: `I could not reach the server, so I have no answer for that. (${err.message})`,
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
          <b>AURALIFE Assistant</b>
          <small>Answers from live hospital records only</small>
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
              <span className="msg-source">Source: {m.grounding.join(', ')}</span>
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
          placeholder="Ask about your visit…"
          aria-label="Message"
        />
        <button type="submit" disabled={pending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
