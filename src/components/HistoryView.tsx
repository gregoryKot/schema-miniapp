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

// Build SVG "d" for a petal sector: wedge from center to an arc
function petalPath(cx: number, cy: number, r: number, centerAngle: number, halfSpread: number): string {
  if (r < 1) return '';
  const a1 = centerAngle - halfSpread;
  const a2 = centerAngle + halfSpread;
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);
  // large-arc-flag = 0 since spread*2 = 72° < 180°
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

function NeedsWheel({ needs, ratings }: { needs: Need[]; ratings: Record<string, number> }) {
  const SIZE = 360;
  const cx = SIZE / 2;      // 180
  const cy = SIZE / 2;      // 180
  const R = 118;             // max petal radius
  const LABEL_R = R * 1.27; // label distance from center
  const SPREAD = Math.PI / 5; // 36° half-spread per sector

  const n = needs.length;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* 10 concentric scale rings */}
      {Array.from({ length: 10 }, (_, i) => (i + 1) / 10).map((scale, i) => (
        <circle
          key={i}
          cx={cx} cy={cy}
          r={R * scale}
          fill="none"
          stroke="rgba(255,255,255,0.045)"
          strokeWidth="1"
        />
      ))}

      {/* Sector divider axes (very subtle) */}
      {needs.map((_, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={(cx + R * Math.cos(angle)).toFixed(2)}
            y2={(cy + R * Math.sin(angle)).toFixed(2)}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
        );
      })}

      {/* Petals */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const value = ratings[need.id] ?? 0;
        const r = (value / 10) * R;
        const color = COLORS[need.id] ?? '#888';
        const d = petalPath(cx, cy, Math.max(r, 2), angle, SPREAD);
        return (
          <path
            key={need.id}
            d={d}
            fill={color}
            fillOpacity={0.35}
            stroke={color}
            strokeOpacity={0.7}
            strokeWidth="1.2"
            strokeLinejoin="round"
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

        // Split multi-word labels into 2 lines
        const words = need.chartLabel.split(' ');
        const lineH = 13;

        // Vertical shift so the text block is centered on ly
        const blockH = (words.length - 1) * lineH;
        // For top labels (sin < -0.4): block ends at ly → shift up by blockH
        // For bottom labels (sin > 0.4): block starts at ly → no shift
        // For middle labels: center → shift up by blockH/2
        const baseShift = sin < -0.4 ? -blockH : sin > 0.4 ? 0 : -blockH / 2;

        return (
          <text
            key={need.id}
            textAnchor="middle"
            fontSize="11"
            fontWeight="500"
            fill={color}
            opacity={0.82}
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
        color: 'rgba(255,255,255,0.35)',
        fontSize: 15,
        lineHeight: 1.6,
      }}>
        Пока нет данных.<br />Заполни дневник сегодня.
      </div>
    );
  }

  const selected = history[selectedIdx];

  return (
    <div style={{ padding: '8px 0 100px' }}>
      {/* Date strip */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '0 16px 12px',
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
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                background: active ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              {formatDate(day.date)}
            </button>
          );
        })}
      </div>

      {/* Wheel — ~65% screen width, centered */}
      <div style={{ padding: '12px 8px 0' }}>
        <NeedsWheel needs={needs} ratings={selected.ratings} />
      </div>
    </div>
  );
}
