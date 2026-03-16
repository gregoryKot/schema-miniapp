import { COLORS, YESTERDAY } from '../types';

const HINTS: Record<string, string> = {
  attachment: 'близость · связь',
  autonomy:   'свобода · выбор',
  expression: 'честность · голос',
  play:       'игра · лёгкость',
  limits:     'уважение · защита',
};

function NeedIcon({ id, color }: { id: string; color: string }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'attachment':
      return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case 'autonomy':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>;
    case 'expression':
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'play':
      return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case 'limits':
      return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    default:
      return null;
  }
}

const BADGE_NEUTRAL: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 20,
  background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)',
};
const BADGE_POSITIVE: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 20,
  background: 'rgba(6,214,160,0.15)', color: '#06d6a0',
};

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) return <span style={BADGE_POSITIVE}>+{delta}</span>;
  if (delta < 0) return <span style={BADGE_NEUTRAL}>{delta}</span>;
  return <span style={BADGE_NEUTRAL}>—</span>;
}

interface Props {
  id: string;
  emoji: string;
  label: string;
  value: number;
  saved: boolean;
  onChange: (value: number) => void;
}

export function NeedSlider({ id, label, value, onChange }: Props) {
  const color = COLORS[id] ?? '#888';
  const pct = value * 10;
  const delta = value - (YESTERDAY[id] ?? 0);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Top row: icon block + label/hint + score/delta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {/* Colored icon box */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: color + '1f',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <NeedIcon id={id} color={color} />
        </div>

        {/* Name + hint */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#fff', lineHeight: 1.2 }}>{label}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
            {HINTS[id] ?? ''}
          </div>
        </div>

        {/* Score + delta */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <span style={{ fontSize: 17, fontWeight: 600, color }}>{value}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>/10</span>
          </div>
          <DeltaBadge delta={delta} />
        </div>
      </div>

      {/* Custom slider */}
      <div style={{ position: 'relative', padding: '9px 0' }}>
        {/* Track */}
        <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 6,
            background: `linear-gradient(to right, ${color}55, ${color})`,
          }} />
        </div>

        {/* Thumb — centered on track via top:50% / translate */}
        <div style={{
          position: 'absolute',
          left: `${pct}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: color,
          border: '2px solid #0f1117',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Invisible native input for drag interaction */}
        <input
          type="range"
          min={0} max={10} step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
            WebkitAppearance: 'none',
            touchAction: 'none', // on the input directly, not wrapper
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
