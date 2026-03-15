import { COLORS } from '../types';

interface Props {
  id: string;
  emoji: string;
  label: string;
  value: number;
  saved: boolean;
  onChange: (value: number) => void;
}

export function NeedSlider({ id, emoji, label, value, saved, onChange }: Props) {
  const color = COLORS[id] ?? '#888';
  const pct = value * 10;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--tg-theme-text-color, #000)' }}>
          {emoji} {label}
        </span>
        <span style={{
          minWidth: 40, textAlign: 'center',
          fontWeight: 700, fontSize: 18, color,
        }}>
          {value}<span style={{ fontSize: 12, color: 'var(--tg-theme-hint-color, #999)' }}>/10</span>
          {saved && <span style={{ fontSize: 12, marginLeft: 4 }}>✓</span>}
        </span>
      </div>

      <input
        type="range"
        min={0} max={10} step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          outline: 'none',
          border: 'none',
          cursor: 'pointer',
          appearance: 'none' as const,
          background: `linear-gradient(to right, ${color} ${pct}%, rgba(128,128,128,0.2) ${pct}%)`,
        }}
      />

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 26px; height: 26px;
          border-radius: 50%;
          background: ${color};
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        input[type=range]::-moz-range-thumb {
          width: 26px; height: 26px;
          border-radius: 50%;
          border: none;
          background: ${color};
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
      `}</style>
    </div>
  );
}
