import { useState } from 'react';
import { Need, DayHistory, COLORS } from '../types';

interface Props {
  needs: Need[];
  history: DayHistory[];
  currentRatings: Record<string, number>;
}

const DOW_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const TODAY_STR = new Date().toISOString().split('T')[0];
const ORIGIN = '180px 180px';
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

function getDayAbbr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DOW_SHORT[new Date(y, m - 1, d).getDay()];
}

function getDayNum(dateStr: string): string {
  return String(parseInt(dateStr.split('-')[2]));
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

// ─── Wheel ────────────────────────────────────────────────────────────────────

function NeedsWheel({ needs, ratings }: { needs: Need[]; ratings: Record<string, number> }) {
  const SIZE = 360;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 100; // 85% of original 118 — tighter ring, labels closer to chart
  const GAP = 12;
  const SPREAD = Math.PI / 5;
  const n = needs.length;
  const LH = 17; // name 14px + 3px gap to score baseline

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

      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const color = COLORS[need.id] ?? '#888';
        const value = ratings[need.id] ?? 0;

        const textAnchor = 'middle';
        const lx = cx + (R + GAP) * cos;
        const ringEdgeY = cy + R * sin;

        let nameY: number;
        if (sin < -0.45) {
          nameY = ringEdgeY - GAP - LH;
        } else if (sin > 0.45) {
          nameY = ringEdgeY + GAP;
        } else {
          nameY = ringEdgeY - LH / 2;
        }
        const scoreY = nameY + LH;

        return (
          <g key={need.id}>
            <text
              x={lx.toFixed(2)} y={nameY.toFixed(2)}
              textAnchor={textAnchor} fontSize={14} fontWeight={500}
              style={{ fill: 'rgba(255,255,255,0.65)', letterSpacing: '-0.2px' }}
            >
              {need.chartLabel}
            </text>
            <text
              x={lx.toFixed(2)} y={scoreY.toFixed(2)}
              textAnchor={textAnchor} fontSize={20} fontWeight={700}
              fill={color}
              style={{ letterSpacing: '-0.2px' }}
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Sparkline row ─────────────────────────────────────────────────────────────

function SparklineRow({
  need, history, selectedIdx, selectedRatings,
}: {
  need: Need;
  history: DayHistory[];
  selectedIdx: number;
  selectedRatings: Record<string, number>;
}) {
  const color = COLORS[need.id] ?? '#888';
  const W = 120, H = 28;

  const reversed = [...history].reverse();
  const n = reversed.length;
  const xStep = n > 1 ? W / (n - 1) : W / 2;
  const yFor = (v: number) => v === 0 ? H - 1 : 25 - ((Math.min(v, 10) - 1) / 9) * 23;

  const pts = reversed.map((day, i) => ({
    x: i * xStep,
    y: yFor(day.ratings[need.id] ?? 0),
  }));

  const dotIdx = Math.max(0, Math.min(n - 1 - selectedIdx, n - 1));
  const dot = pts[dotIdx];

  const score = selectedRatings[need.id] ?? 0;
  const prevScore = history[selectedIdx + 1]?.ratings[need.id] ?? score;
  const trend = score > prevScore ? '↑' : score < prevScore ? '↓' : '—';
  const trendColor = score > prevScore ? '#06d6a0' : 'rgba(255,255,255,0.3)';

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[n - 1].x.toFixed(1)} ${H} L 0 ${H} Z`;
  const polyStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Icon */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: color + '26',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13,
      }}>
        {need.emoji}
      </div>

      {/* Name */}
      <div style={{
        fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)',
        width: 100, flexShrink: 0, lineHeight: 1.2,
      }}>
        {need.chartLabel}
      </div>

      {/* Sparkline */}
      <svg
        style={{ flex: 1, height: 28, display: 'block', overflow: 'visible' }}
        viewBox="0 0 120 28"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`area-${need.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#area-${need.id})`} />
        <polyline points={polyStr} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle
          cx={dot.x} cy={dot.y} r={3} fill={color}
          style={{ transition: 'cx 150ms ease, cy 150ms ease' }}
        />
      </svg>

      {/* Score + trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <span style={{
          fontSize: 15, fontWeight: 700, color,
          width: 20, textAlign: 'right', display: 'block',
        }}>
          {score}
        </span>
        <span style={{ fontSize: 11, color: trendColor }}>{trend}</span>
      </div>
    </div>
  );
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({ needs, ratings }: { needs: Need[]; ratings: Record<string, number> }) {
  if (needs.length === 0) return null;
  const lowest = needs.reduce((min, n) =>
    (ratings[n.id] ?? 0) < (ratings[min.id] ?? 0) ? n : min
  );
  const color = COLORS[lowest.id] ?? '#888';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 16,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
        Стоит уделить внимание
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
          {lowest.chartLabel}
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color }}>
          {ratings[lowest.id] ?? 0}/10
        </span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function HistoryView({ needs, history, currentRatings }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [subView, setSubView] = useState<'day' | 'week'>('day');

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
  const selectedRatings = selected.date === TODAY_STR ? currentRatings : selected.ratings;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0 80px' }}>

      {/* Date picker */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        width: '100%', padding: '0 24px 12px',
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
                padding: '8px 14px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                background: active ? '#fff' : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                transition: 'background 0.15s ease',
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: active ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
              }}>
                {getDayAbbr(day.date)}
              </span>
              <span style={{
                fontSize: 15, fontWeight: 600,
                color: active ? '#000' : '#fff',
                lineHeight: 1,
              }}>
                {getDayNum(day.date)}
              </span>
              <div style={{
                width: 4, height: 4, borderRadius: '50%',
                background: active ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
              }} />
            </button>
          );
        })}
      </div>

      {/* View toggle */}
      <div style={{ padding: '0 24px 8px' }}>
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: 3,
        }}>
          {(['day', 'week'] as const).map((v) => {
            const active = subView === v;
            return (
              <button
                key={v}
                onClick={() => setSubView(v)}
                style={{
                  flex: 1, padding: '5px 14px', border: 'none', borderRadius: 8,
                  background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontSize: 12, fontWeight: active ? 500 : 400,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                {v === 'day' ? 'День' : 'Неделя'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content — fade on view switch */}
      <div key={subView} style={{ animation: 'fade-in 200ms ease' }}>
        {subView === 'day' ? (
          /* ── День ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '85vw', maxWidth: 'calc(100% - 48px)', flexShrink: 0 }}>
              <div key={selected.date} style={{ width: '100%', aspectRatio: '1 / 1' }}>
                <NeedsWheel needs={needs} ratings={selectedRatings} />
              </div>
            </div>
          </div>
        ) : (
          /* ── Неделя ── */
          <div style={{ padding: '0 24px' }}>
            <div style={{
              fontSize: 11, fontWeight: 500,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 14,
            }}>
              За 7 дней
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {needs.map((need) => (
                <SparklineRow
                  key={need.id}
                  need={need}
                  history={history}
                  selectedIdx={selectedIdx}
                  selectedRatings={selectedRatings}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Insight card */}
      <div style={{ padding: '12px 24px 0' }}>
        <InsightCard needs={needs} ratings={selectedRatings} />
      </div>

    </div>
  );
}
