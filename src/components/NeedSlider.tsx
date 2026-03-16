import { COLORS } from '../types';

function NeedIcon({ id, color }: { id: string; color: string }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (id) {
    case 'attachment':
      return (
        <svg {...props}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'autonomy':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'expression':
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'play':
      return (
        <svg {...props}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'limits':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return null;
  }
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

  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NeedIcon id={id} color={color} />
          <span style={{ fontSize: 17, fontWeight: 500, color: '#eef0f4', letterSpacing: -0.2 }}>
            {label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', fontWeight: 400 }}>/10</span>
        </div>
      </div>

      <input
        type="range"
        min={0} max={10} step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
          '--thumb-color': color,
        } as React.CSSProperties}
      />
    </div>
  );
}
