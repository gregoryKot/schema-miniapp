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

function RadarChart({ needs, ratings }: { needs: Need[]; ratings: Record<string, number> }) {
  const SIZE = 240;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 80;
  const n = needs.length;
  const angles = needs.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / n);

  function gridPoints(scale: number) {
    return angles
      .map(a => `${cx + R * scale * Math.cos(a)},${cy + R * scale * Math.sin(a)}`)
      .join(' ');
  }

  const dataPoints = needs.map((need, i) => {
    const v = Math.max((ratings[need.id] ?? 0) / 10, 0);
    return `${cx + R * v * Math.cos(angles[i])},${cy + R * v * Math.sin(angles[i])}`;
  }).join(' ');

  const dots = needs.map((need, i) => {
    const v = Math.max((ratings[need.id] ?? 0) / 10, 0.01);
    return {
      x: cx + R * v * Math.cos(angles[i]),
      y: cy + R * v * Math.sin(angles[i]),
      color: COLORS[need.id] ?? '#888',
    };
  });

  // Axis tip markers (dim, at full scale) so axes are identifiable by color
  const axisTips = needs.map((need, i) => ({
    x: cx + R * Math.cos(angles[i]),
    y: cy + R * Math.sin(angles[i]),
    color: COLORS[need.id] ?? '#888',
  }));

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* Grid pentagons */}
      {[0.25, 0.5, 0.75, 1.0].map((scale, i) => (
        <polygon
          key={i}
          points={gridPoints(scale)}
          fill="none"
          stroke={scale === 1.0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}
          strokeWidth={scale === 1.0 ? 1.5 : 1}
        />
      ))}

      {/* Axis lines */}
      {angles.map((a, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={cx + R * Math.cos(a)}
          y2={cy + R * Math.sin(a)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Axis tip color markers */}
      {axisTips.map((tip, i) => (
        <circle key={i} cx={tip.x} cy={tip.y} r={2.5} fill={tip.color} opacity={0.35} />
      ))}

      {/* Data fill area */}
      <polygon
        points={dataPoints}
        fill="rgba(110,130,255,0.13)"
        stroke="rgba(140,160,255,0.55)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Data vertex dots */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={3.5} fill={d.color} />
      ))}
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
    <div style={{ padding: '8px 0 120px' }}>
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
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              {formatDate(day.date)}
            </button>
          );
        })}
      </div>

      {/* Radar chart */}
      <div style={{ padding: '20px 16px 8px' }}>
        <RadarChart needs={needs} ratings={selected.ratings} />
      </div>

      {/* Need values legend */}
      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {needs.map((need) => {
          const value = selected.ratings[need.id] ?? 0;
          const color = COLORS[need.id] ?? '#888';
          const pct = value * 10;
          return (
            <div key={need.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', flex: 1, minWidth: 0 }}>
                {need.chartLabel}
              </span>
              <div style={{
                width: 80,
                height: 4,
                borderRadius: 4,
                background: '#2B3442',
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 4,
                  transition: 'width 0.35s ease',
                }} />
              </div>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color,
                minWidth: 28,
                textAlign: 'right',
              }}>
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
