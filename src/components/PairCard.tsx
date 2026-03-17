interface Props {
  partnerIndex: number | null;
  partnerTodayDone: boolean;
  onInvite: () => void;
  showInvite: boolean;
}

export function PairCard({ partnerIndex, partnerTodayDone, onInvite, showInvite }: Props) {
  if (showInvite) {
    return (
      <div
        onClick={onInvite}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.04)', borderRadius: 14,
          padding: '12px 16px', marginBottom: 16, cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <span style={{ fontSize: 22 }}>🤝</span>
        <div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Отслеживать вместе</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Пригласи друга или партнёра</div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.04)', borderRadius: 14,
      padding: '12px 16px', marginBottom: 16,
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
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
