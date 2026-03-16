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
  const LABEL_R = R * 1.28;
  const SPREAD = Math.PI / 5; // 36° per sector half
  const n = needs.length;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {needs.map((need) => {
          const color = COLORS[need.id] ?? '#888';
          return (
            <radialGradient
              key={need.id}
              id={`rg-${need.id}`}
              cx={cx}
              cy={cy}
              r={R}
              fx={cx}
              fy={cy}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0.28} />
            </radialGradient>
          );
        })}
      </defs>

      {/* 10 concentric scale rings */}
      {Array.from({ length: 10 }, (_, i) => (i + 1) / 10).map((scale, i) => (
        <circle
          key={i}
          cx={cx} cy={cy}
          r={R * scale}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Petals — no stroke, radial gradient fill */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const value = ratings[need.id] ?? 0;
        const r = Math.max((value / 10) * R, value > 0 ? 2 : 0);
        const d = petalPath(cx, cy, r, angle, SPREAD);
        return (
          <path
            key={need.id}
            d={d}
            fill={`url(#rg-${need.id})`}
          />
        );
      })}

      {/* Labels around the wheel */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const lx = cx + LABEL_R * Math.cos(angle);
        const ly = cy + LABEL_R * Math.sin(angle);
        const color = COLORS[need.id] ?? '#888';
        const sin = Math.sin(angle);

        const words = need.chartLabel.split(' ');
        const lineH = 13;
        const blockH = (words.length - 1) * lineH;
        const baseShift = sin < -0.4 ? -blockH : sin > 0.4 ? 0 : -blockH / 2;

        return (
          <text
            key={need.id}
            x={lx.toFixed(2)}
            y={ly.toFixed(2)}
            textAnchor="middle"
            fontSize="11"
            fontWeight="500"
            fill={color}
            opacity={0.85}
          >
            {words.map((word, j) => (
              <tspan key={j} x={lx.toFixed(2)} dy={j === 0 ? baseShift : lineH}>
                {word}
              </tspan>
            ))}
          </text>
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
