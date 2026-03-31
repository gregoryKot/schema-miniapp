export type Section = 'home' | 'tracker' | 'diaries' | 'profile';

interface Props {
  section: Section;
  onSelect: (s: Section) => void;
}

const TABS: { id: Section; label: string; activeColor: string }[] = [
  { id: 'home',    label: 'Главная',   activeColor: '#a78bfa' },
  { id: 'tracker', label: 'Потребности', activeColor: '#60a5fa' },
  { id: 'diaries', label: 'Дневники',  activeColor: '#34d399' },
  { id: 'profile', label: 'Я',         activeColor: '#f472b6' },
];

function TabIcon({ id, active, color }: { id: Section; active: boolean; color: string }) {
  const style = {
    width: 22, height: 22,
    color: active ? color : 'rgba(255,255,255,0.3)',
    transition: 'color 0.2s',
    filter: active ? `drop-shadow(0 0 5px ${color}88)` : 'none',
  };

  if (id === 'home') return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );

  if (id === 'tracker') return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="3" x2="12" y2="7" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="3" y1="12" x2="7" y2="12" />
      <line x1="17" y1="12" x2="21" y2="12" />
    </svg>
  );

  if (id === 'diaries') return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );

  // profile
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

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
                top: 0, left: '20%', right: '20%', height: 2,
                background: tab.activeColor,
                borderRadius: '0 0 2px 2px',
                boxShadow: `0 0 8px ${tab.activeColor}88`,
              }} />
            )}
            <TabIcon id={tab.id} active={active} color={tab.activeColor} />
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
