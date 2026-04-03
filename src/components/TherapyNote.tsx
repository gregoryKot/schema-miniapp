export function TherapyNote({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
        <span style={{ fontSize: 12 }}>💬</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.4 }}>
          Инструмент самоисследования, не замена психологу.{' '}
          <a href="https://t.me/kotlarewski" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(167,139,250,0.45)', textDecoration: 'none' }}>
            Записаться →
          </a>
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
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>
          Это инструмент самоисследования — не клиническая диагностика и не замена работе с психологом.
          Если чувствуешь, что нужно разобраться глубже — терапия это место где безопасно.
        </div>
        <a
          href="https://t.me/kotlarewski"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: 'rgba(167,139,250,0.6)', textDecoration: 'none', fontWeight: 500 }}
        >
          Поговорить с психологом →
        </a>
      </div>
    </div>
  );
}
