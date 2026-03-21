interface Props {
  partnerIndex: number | null;
  partnerTodayDone: boolean;
  onInvite: () => void;
  showInvite: boolean;
  pendingCode: boolean;
  onDismiss?: () => void;
}

export function PairCard({ partnerIndex, partnerTodayDone, onInvite, showInvite, pendingCode, onDismiss }: Props) {
  const cardStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.04)', borderRadius: 14,
    padding: '12px 16px', marginBottom: 16,
    border: '1px solid rgba(255,255,255,0.07)',
  };

  if (showInvite && pendingCode) {
    return (
      <div style={cardStyle}>
        <span style={{ fontSize: 22 }}>⏳</span>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={onInvite}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Ждём партнёра</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Ссылка отправлена — напомнить?</div>
        </div>
        <span onClick={onInvite} style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>›</span>
        {onDismiss && (
          <button
            onClick={e => { e.stopPropagation(); onDismiss(); }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 18, cursor: 'pointer', padding: '0 0 0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>
    );
  }

  if (showInvite) {
    return (
      <div style={cardStyle}>
        <span style={{ fontSize: 22 }}>🤝</span>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={onInvite}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Отслеживать вместе</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Пригласи друга или партнёра</div>
        </div>
        <span onClick={onInvite} style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>›</span>
        {onDismiss && (
          <button
            onClick={e => { e.stopPropagation(); onDismiss(); }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 18, cursor: 'pointer', padding: '0 0 0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <span style={{ fontSize: 22 }}>🤝</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Партнёр сегодня</div>
        {partnerTodayDone && partnerIndex !== null ? (
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            {partnerIndex.toFixed(1)}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>/10</span>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>ещё не заполнил</div>
        )}
      </div>
    </div>
  );
}
