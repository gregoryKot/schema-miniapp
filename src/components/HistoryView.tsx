import { useState } from 'react';
import { Need, DayHistory, COLORS } from '../types';

interface Props {
  needs: Need[];
  history: DayHistory[];
}

const SHORT_MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${SHORT_MONTHS[parseInt(m) - 1]}`;
}

function petalPath(cx: number, cy: number, r: number, centerAngle: number, halfSpread: number): string {
  if (r < 1) return `M ${cx} ${cy} Z`;
  const a1 = centerAngle - halfSpread;
  const a2 = centerAngle + halfSpread;
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

function NeedsWheel({ needs, ratings }: { needs: Need[]; ratings: Record<string, number> }) {
  const SIZE = 360;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 118;
  const LABEL_R = R * 1.30;
  const DOT_R = R * 1.14;   // colored accent dot between wheel and label
  const SPREAD = Math.PI / 5;
  const n = needs.length;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* Radial gradient fills */}
        {needs.map((need) => {
          const color = COLORS[need.id] ?? '#888';
          return (
            <radialGradient
              key={need.id}
              id={`rg-${need.id}`}
              cx={cx} cy={cy} r={R} fx={cx} fy={cy}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%"   stopColor={color} stopOpacity={0.62} />
              <stop offset="100%" stopColor={color} stopOpacity={0.38} />
            </radialGradient>
          );
        })}

        {/* Sector glow filter */}
        <filter id="sector-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="blur" in2="SourceGraphic" operator="over" />
        </filter>

        {/* Dot glow filter */}
        <filter id="dot-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="blur" in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      {/* Scale rings — every 5th brighter */}
      {Array.from({ length: 10 }, (_, i) => i + 1).map((ring) => {
        const isMajor = ring % 5 === 0;
        const isOuter = ring === 10;
        return (
          <circle
            key={ring}
            cx={cx} cy={cy}
            r={R * ring / 10}
            fill="none"
            stroke={
              isOuter
                ? 'rgba(255,255,255,0.18)'
                : isMajor
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.05)'
            }
            strokeWidth={isOuter ? 2 : 1}
          />
        );
      })}

      {/* Sector glow layer (drawn behind main petals) */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const value = ratings[need.id] ?? 0;
        const r = Math.max((value / 10) * R, value > 0 ? 2 : 0);
        const color = COLORS[need.id] ?? '#888';
        const d = petalPath(cx, cy, r, angle, SPREAD);
        return (
          <path
            key={need.id}
            d={d}
            fill={color}
            fillOpacity={0.22}
            filter="url(#sector-glow)"
          />
        );
      })}

      {/* Petals — gradient fill + visible stroke */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const value = ratings[need.id] ?? 0;
        const r = Math.max((value / 10) * R, value > 0 ? 2 : 0);
        const color = COLORS[need.id] ?? '#888';
        const d = petalPath(cx, cy, r, angle, SPREAD);
        return (
          <path
            key={need.id}
            d={d}
            fill={`url(#rg-${need.id})`}
            stroke={color}
            strokeWidth={2}
            strokeOpacity={0.9}
            strokeLinejoin="round"
          />
        );
      })}

      {/* Endpoint dots at sector arc tip */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const value = ratings[need.id] ?? 0;
        if (value === 0) return null;
        const r = (value / 10) * R;
        const dotX = (cx + r * Math.cos(angle)).toFixed(2);
        const dotY = (cy + r * Math.sin(angle)).toFixed(2);
        const color = COLORS[need.id] ?? '#888';
        return (
          <g key={need.id}>
            {/* Glow halo */}
            <circle cx={dotX} cy={dotY} r={8} fill={color} fillOpacity={0.2} filter="url(#dot-glow)" />
            {/* Main dot */}
            <circle cx={dotX} cy={dotY} r={4} fill={color} />
          </g>
        );
      })}

      {/* Labels — white text + colored accent dot */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const lx = cx + LABEL_R * Math.cos(angle);
        const ly = cy + LABEL_R * Math.sin(angle);
        const dx = cx + DOT_R * Math.cos(angle);
        const dy_dot = cy + DOT_R * Math.sin(angle);
        const color = COLORS[need.id] ?? '#888';
        const sin = Math.sin(angle);

        const words = need.chartLabel.split(' ');
        const lineH = 13;
        const blockH = (words.length - 1) * lineH;
        const baseShift = sin < -0.4 ? -blockH : sin > 0.4 ? 0 : -blockH / 2;

        return (
          <g key={need.id}>
            {/* Accent dot between wheel edge and label */}
            <circle cx={dx.toFixed(2)} cy={dy_dot.toFixed(2)} r={3} fill={color} opacity={0.9} />

            {/* White label text */}
            <text
              x={lx.toFixed(2)}
              y={ly.toFixed(2)}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#ffffff"
              opacity={0.9}
            >
              {words.map((word, j) => (
                <tspan key={j} x={lx.toFixed(2)} dy={j === 0 ? baseShift : lineH}>
                  {word}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function HistoryView({ needs, history }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (history.length === 0) {
    return (
      <div style={{
        padding: '60px 32px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 15,
        lineHeight: 1.7,
      }}>
        Пока нет данных.<br />Заполни дневник сегодня.
      </div>
    );
  }

  const selected = history[selectedIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 80px' }}>
      {/* Date strip */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        width: '100%',
        padding: '0 16px 16px',
        scrollbarWidth: 'none',
      }}>
        {history.map((day, i) => {
          const active = i === selectedIdx;
          return (
            <button
              key={day.date}
              onClick={() => setSelectedIdx(i)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.38)',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {formatDate(day.date)}
            </button>
          );
        })}
      </div>

      {/* Wheel — 70% of viewport height, square, centered */}
      <div style={{
        width: 'min(70vh, 88vw)',
        height: 'min(70vh, 88vw)',
        flexShrink: 0,
      }}>
        <NeedsWheel needs={needs} ratings={selected.ratings} />
      </div>
    </div>
  );
}
