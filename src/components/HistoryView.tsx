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
  if (r < 1) return '';
  const a1 = centerAngle - halfSpread;
  const a2 = centerAngle + halfSpread;
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

const ORIGIN = '180px 180px';
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

function NeedsWheel({ needs, ratings }: { needs: Need[]; ratings: Record<string, number> }) {
  const SIZE = 360;
  const cx = SIZE / 2;   // 180
  const cy = SIZE / 2;   // 180
  const R = 118;
  const LABEL_R = R + 22; // 140 — labels sit 22px outside the ring
  const SPREAD = Math.PI / 5;
  const n = needs.length;
  const LH = 17; // vertical gap between name and score lines

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
              cx={cx} cy={cy} r={R} fx={cx} fy={cy}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%"   stopColor={color} stopOpacity={0.62} />
              <stop offset="100%" stopColor={color} stopOpacity={0.38} />
            </radialGradient>
          );
        })}
        <filter id="sector-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="blur" in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      {/* Scale rings */}
      {Array.from({ length: 10 }, (_, i) => i + 1).map((ring) => (
        <circle
          key={ring}
          cx={cx} cy={cy}
          r={R * ring / 10}
          fill="none"
          stroke={
            ring === 10 ? 'rgba(255,255,255,0.18)' :
            ring === 5  ? 'rgba(255,255,255,0.12)' :
                          'rgba(255,255,255,0.05)'
          }
          strokeWidth={ring === 10 ? 2 : 1}
        />
      ))}

      {/* Glow layer */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const value = ratings[need.id] ?? 0;
        const r = Math.max((value / 10) * R, value > 0 ? 2 : 0);
        const color = COLORS[need.id] ?? '#888';
        const d = petalPath(cx, cy, r, angle, SPREAD);
        if (!d) return null;
        return (
          <path key={need.id} d={d} fill={color} fillOpacity={0.22}
            filter="url(#sector-glow)"
            style={{ transformOrigin: ORIGIN, animation: `sector-in 400ms ${SPRING} ${i * 80}ms both` }}
          />
        );
      })}

      {/* Petals */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const value = ratings[need.id] ?? 0;
        const r = Math.max((value / 10) * R, value > 0 ? 2 : 0);
        const color = COLORS[need.id] ?? '#888';
        const d = petalPath(cx, cy, r, angle, SPREAD);
        if (!d) return null;
        return (
          <path key={need.id} d={d}
            fill={`url(#rg-${need.id})`}
            stroke={color} strokeWidth={2} strokeOpacity={0.9} strokeLinejoin="round"
            style={{ transformOrigin: ORIGIN, animation: `sector-in 400ms ${SPRING} ${i * 80}ms both` }}
          />
        );
      })}

      {/* Labels — radially positioned, hugging the ring */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const sin = Math.sin(angle);
        const color = COLORS[need.id] ?? '#888';
        const value = ratings[need.id] ?? 0;

        // X always on the radial axis at LABEL_R
        const lx = cx + LABEL_R * Math.cos(angle);

        // Y: anchor the label block just outside the ring,
        // oriented away from center so it doesn't overlap the chart
        const ringEdgeY = cy + R * sin; // y of ring edge at this angle

        let nameY: number;
        if (sin < -0.45) {
          // Top sectors: block sits above the ring
          // score (bottom line) clears ring by ~6px
          nameY = ringEdgeY - 6 - LH;
        } else if (sin > 0.45) {
          // Bottom sectors: block hangs below the ring
          nameY = ringEdgeY + 8;
        } else {
          // Side sectors (autonomy, limits): center block on ring-edge y
          nameY = ringEdgeY - LH / 2;
        }

        const scoreY = nameY + LH;

        return (
          <g key={need.id}>
            <text
              x={lx.toFixed(2)}
              y={nameY.toFixed(2)}
              textAnchor="middle"
              fontSize={13}
              fill="rgba(255,255,255,0.6)"
            >
              {need.chartLabel}
            </text>
            <text
              x={lx.toFixed(2)}
              y={scoreY.toFixed(2)}
              textAnchor="middle"
              fontSize={15}
              fontWeight={600}
              fill={color}
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function InsightCard({ needs, ratings }: { needs: Need[]; ratings: Record<string, number> }) {
  if (needs.length === 0) return null;
  const lowest = needs.reduce((min, n) =>
    (ratings[n.id] ?? 0) < (ratings[min.id] ?? 0) ? n : min
  );
  const color = COLORS[lowest.id] ?? '#888';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 14,
      padding: '14px 16px',
      marginTop: 20,
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginBottom: 6 }}>
        Стоит уделить внимание
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>
          {lowest.chartLabel}
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color }}>
          {ratings[lowest.id] ?? 0}/10
        </span>
      </div>
    </div>
  );
}

export function HistoryView({ needs, history }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (history.length === 0) {
    return (
      <div style={{
        padding: '60px 32px', textAlign: 'center',
        color: 'rgba(255,255,255,0.3)', fontSize: 15, lineHeight: 1.7,
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
        display: 'flex', gap: 6, overflowX: 'auto',
        width: '100%', padding: '0 16px 16px', scrollbarWidth: 'none',
      }}>
        {history.map((day, i) => {
          const active = i === selectedIdx;
          return (
            <button
              key={day.date}
              onClick={() => setSelectedIdx(i)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                border: 'none', cursor: 'pointer', fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? '#000' : 'rgba(255,255,255,0.38)',
                background: active ? '#ffffff' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {formatDate(day.date)}
            </button>
          );
        })}
      </div>

      {/* Wheel — re-keyed so animation replays on date switch */}
      <div
        key={selected.date}
        style={{ width: 'min(70vh, 88vw)', height: 'min(70vh, 88vw)', flexShrink: 0 }}
      >
        <NeedsWheel needs={needs} ratings={selected.ratings} />
      </div>

      {/* Insight card */}
      <div style={{ width: '100%', padding: '0 20px' }}>
        <InsightCard needs={needs} ratings={selected.ratings} />
      </div>
    </div>
  );
}
