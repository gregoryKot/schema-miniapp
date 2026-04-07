export type Section = 'today' | 'help' | 'schemas' | 'profile';

interface Props {
  section: Section;
  onSelect: (s: Section) => void;
  userRole?: 'CLIENT' | 'THERAPIST';
}

const TABS: { id: Section; label: string; activeColor: string }[] = [
  { id: 'today',   label: 'Сегодня', activeColor: '#a78bfa' },
  { id: 'help',    label: 'Помощь',  activeColor: '#f87171' },
  { id: 'schemas', label: 'Схемы',   activeColor: '#60a5fa' },
  { id: 'profile', label: 'Я',       activeColor: '#f472b6' },
];

function TabIcon({ id, active, color, isTherapist }: { id: Section; active: boolean; color: string; isTherapist?: boolean }) {
  const style = {
    width: 22, height: 22,
    color: active ? color : 'rgba(255,255,255,0.3)',
    transition: 'color 0.2s',
    filter: active ? `drop-shadow(0 0 5px ${color}88)` : 'none',
  };

  if (id === 'today') return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );

  if (id === 'help') return isTherapist
    ? (
      <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
    : (
      <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );

  if (id === 'schemas') return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
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

export function BottomNav({ section, onSelect, userRole }: Props) {
  const tabs = TABS.map(t =>
    t.id === 'help' && userRole === 'THERAPIST'
      ? { ...t, label: 'Кабинет' }
      : t,
  );
  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: 'rgba(6,10,18,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      zIndex: 50,
    }}>
      {/* Beta badge */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 5, paddingBottom: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
          β бета
        </div>
      </div>
      <div style={{ height: 60, display: 'flex' }}>
      {tabs.map(tab => {
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
            <TabIcon id={tab.id} active={active} color={tab.activeColor} isTherapist={userRole === 'THERAPIST'} />
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
    </div>
  );
}
