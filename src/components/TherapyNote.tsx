import { getTherapistContact } from '../utils/therapistContact';

export function TherapyNote({ compact }: { compact?: boolean }) {
  const contact = getTherapistContact();

  const linkLabel = contact.isTherapist
    ? 'Ты специалист — клиенты могут обратиться'
    : contact.name === 'автору'
      ? 'Поговорить с психологом →'
      : `Написать ${contact.name} →`;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
        <span style={{ fontSize: 12 }}>💬</span>
        <span style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.2)', lineHeight: 1.4 }}>
          {contact.isTherapist
            ? 'Ты работаешь как терапевт — поддержка рядом.'
            : 'Инструмент самоисследования, не замена психологу.'
          }{' '}
          {!contact.isTherapist && (
            <a href={contact.url} target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(167,139,250,0.45)', textDecoration: 'none' }}>
              {contact.name === 'автору' ? 'Записаться →' : `Написать ${contact.name} →`}
            </a>
          )}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(167,139,250,0.05)',
      border: '1px solid rgba(167,139,250,0.12)',
      borderRadius: 14, padding: '12px 14px',
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💬</span>
      <div>
        <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.4)', lineHeight: 1.55 }}>
          {contact.isTherapist
            ? 'Ты работаешь как терапевт. Клиенты обращаются к тебе — ты уже рядом.'
            : 'Это инструмент самоисследования — не клиническая диагностика и не замена работе с психологом. Если чувствуешь, что нужно разобраться глубже — терапия это место где безопасно.'
          }
        </div>
        <a
          href={contact.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: 'rgba(167,139,250,0.6)', textDecoration: 'none', fontWeight: 500 }}
        >
          {linkLabel}
        </a>
      </div>
    </div>
  );
}
