import { Need, DayHistory, COLORS } from '../types';
import { NEED_DATA } from '../needData';
import { BottomSheet } from './BottomSheet';

interface Props {
  need: Need;
  value: number;
  history: DayHistory[];
  onClose: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

export function NeedHistorySheet({ need, value, history, onClose }: Props) {
  const data = NEED_DATA[need.id];
  if (!data) return null;
  const color = COLORS[need.id] ?? '#888';

  // Trend
  const scores = history.map(d => d.ratings[need.id] ?? 0);
  const n = scores.length;
  const recentAvg = scores.slice(0, Math.min(3, n)).reduce((s, v) => s + v, 0) / Math.min(3, n);
  const olderAvg = scores.slice(-Math.min(3, n)).reduce((s, v) => s + v, 0) / Math.min(3, n);
  const trendDiff = recentAvg - olderAvg;
  const trendLabel = trendDiff > 0.5 ? 'Растёт' : trendDiff < -0.5 ? 'Падает' : 'Стабильно';
  const trendSign = trendDiff >= 0 ? '+' : '';

  // Action
  const actionKey = value <= 4 ? 'low' : value <= 7 ? 'medium' : 'high';
  const action = data.actions[actionKey];

  // Sparkline
  const reversed = [...history].reverse();
  const W = 200, H = 48;
  const xStep = reversed.length > 1 ? W / (reversed.length - 1) : W / 2;
  const yFor = (v: number) => v === 0 ? H - 2 : (H - 8) - ((v - 1) / 9) * (H - 12) + 4;
  const pts = reversed.map((d, i) => ({ x: i * xStep, y: yFor(d.ratings[need.id] ?? 0) }));
  const polyStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[reversed.length - 1].x.toFixed(1)} ${H} L 0 ${H} Z`;
  const lastPt = pts[pts.length - 1];

  return (
    <BottomSheet onClose={onClose}>
      {/* Header — tap to close */}
      <div
        onClick={onClose}
        style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, cursor: 'pointer' }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: color + '26',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          {data.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>
            {need.chartLabel}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            {data.hint}
          </div>
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', flexShrink: 0, lineHeight: 1 }}>✕</div>
      </div>

      {/* Section 1: 7-day sparkline */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>За 7 дней</SectionLabel>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <svg width={200} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
            style={{ flex: 1 }}>
            <defs>
              <linearGradient id={`sheet-area-${need.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#sheet-area-${need.id})`} />
            <polyline points={polyStr} fill="none" stroke={color} strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={lastPt.x} cy={lastPt.y} r={3} fill={color} />
          </svg>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color }}>{trendLabel}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {trendSign}{trendDiff.toFixed(1)} за неделю
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Action */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>Попробуй сегодня</SectionLabel>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 10 }}>
            {action.text}
          </div>
          <span style={{
            fontSize: 11, color: 'rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '3px 10px',
          }}>
            {action.tag}
          </span>
        </div>
      </div>

      {/* Section 3: Explanation */}
      <div>
        <SectionLabel>Об этой потребности</SectionLabel>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          {data.explanation}
        </div>
      </div>
    </BottomSheet>
  );
}
