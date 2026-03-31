export type Section = 'home' | 'tracker' | 'diaries';

interface Props {
  section: Section;
  onSelect: (s: Section) => void;
}

const TABS: { id: Section; label: string; icon: string; activeColor: string }[] = [
  { id: 'home',    label: 'Главная',  icon: '⬡',  activeColor: '#a78bfa' },
  { id: 'tracker', label: 'Трекер',   icon: '◎',  activeColor: '#60a5fa' },
  { id: 'diaries', label: 'Дневники', icon: '◈',  activeColor: '#34d399' },
];

export function BottomNav({ section, onSelect }: Props) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 64,
      background: 'rgba(6,10,18,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
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
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 0 4px',
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
            }}
          >
            {active && (
              <div style={{
                position: 'absolute',
                top: 0, left: '25%', right: '25%', height: 2,
                background: tab.activeColor,
                borderRadius: '0 0 2px 2px',
                boxShadow: `0 0 8px ${tab.activeColor}88`,
              }} />
            )}
            <div style={{
              fontSize: 20,
              filter: active ? `drop-shadow(0 0 6px ${tab.activeColor}88)` : 'none',
              transition: 'filter 0.2s',
              color: active ? tab.activeColor : 'rgba(255,255,255,0.3)',
            }}>
              {tab.id === 'home' ? '⊙' : tab.id === 'tracker' ? '◎' : '◈'}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              color: active ? tab.activeColor : 'rgba(255,255,255,0.3)',
              letterSpacing: '0.03em',
              transition: 'color 0.2s',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
