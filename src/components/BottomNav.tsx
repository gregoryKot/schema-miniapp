export type Section = 'tracker' | 'diaries';

interface Props {
  section: Section;
  onSelect: (s: Section) => void;
}

const TABS: { id: Section; label: string; icon: string }[] = [
  { id: 'tracker',  label: 'Трекер',   icon: '📊' },
  { id: 'diaries',  label: 'Дневники', icon: '📔' },
];

export function BottomNav({ section, onSelect }: Props) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 64,
      background: 'rgba(15,17,23,0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      zIndex: 50,
    }}>
      {TABS.map(tab => {
        const active = section === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              color: active ? '#a78bfa' : 'rgba(255,255,255,0.35)',
              letterSpacing: '0.02em',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
