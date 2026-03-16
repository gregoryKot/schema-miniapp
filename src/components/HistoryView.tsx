import { useState, useCallback } from 'react';
import { Need, DayHistory, COLORS } from '../types';
import { NeedHistorySheet } from './NeedHistorySheet';

interface Props {
  needs: Need[];
  history: DayHistory[];
  currentRatings: Record<string, number>;
}

const DOW_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const TODAY_STR = new Date().toISOString().split('T')[0];
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const HISTORY_HINT_KEY = 'history_hint_dismissed';

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

function arcPath(cx: number, cy: number, r: number, centerAngle: number, halfSpread: number): string {
  const a1 = centerAngle - halfSpread;
  const a2 = centerAngle + halfSpread;
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

// ─── Wheel (no labels) ─────────────────────────────────────────────────────────

function NeedsWheel({
  needs, ratings, prevRatings = {},
}: {
  needs: Need[];
  ratings: Record<string, number>;
  prevRatings?: Record<string, number>;
}) {
  const W = 360, H = 280;
  const cx = W / 2;       // 180
  const cy = H / 2;       // 140
  const R = cy - 20;      // 120 — fills height minus 20px padding each side
  const SPREAD = (34 * Math.PI) / 180; // 68° per sector, 4° gap between sectors
  const n = needs.length;
  const CENTER_R = 41; // 36 * 1.15

  const avg = needs.length > 0
    ? needs.reduce((s, nd) => s + (ratings[nd.id] ?? 0), 0) / needs.length
    : 0;
  const hasPrev = Object.keys(prevRatings).length > 0;
  const prevAvg = hasPrev
    ? needs.reduce((s, nd) => s + (prevRatings[nd.id] ?? 0), 0) / needs.length
    : null;
  const diff = prevAvg !== null ? avg - prevAvg : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', width: '100%', height: 280 }}
    >
      <defs>
        <linearGradient id="center-score-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6b9d" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* Scale rings */}
      {[2, 5, 8, 10].map((ring) => (
        <circle
          key={ring}
          cx={cx} cy={cy}
          r={R * ring / 10}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={ring === 10 ? 1.5 : 1}
        />
      ))}

      {/* Ghost sectors — same angle 72°, full radius, rgba white 8% */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const d = petalPath(cx, cy, R, angle, SPREAD);
        if (!d) return null;
        return (
          <path key={`ghost-${need.id}`} d={d}
            fill="rgba(255,255,255,0.08)"
          />
        );
      })}

      {/* Filled sectors — proportional radius, 90% opacity, animated */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const value = ratings[need.id] ?? 0;
        const r = Math.sqrt(value / 10) * R; // sqrt → area-proportional, score 5 = visually half full
        const color = COLORS[need.id] ?? '#888';
        const d = petalPath(cx, cy, r, angle, SPREAD);
        if (!d) return null;
        return (
          <path key={need.id} d={d}
            fill={color} fillOpacity={0.9}
            stroke={color} strokeWidth={1} strokeOpacity={0.4} strokeLinejoin="round"
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              animation: `sector-in 400ms ${SPRING} ${i * 80}ms both`,
            }}
          />
        );
      })}

      {/* Scale arcs — 3 concentric arcs per sector at 25/50/75% of R */}
      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        return [0.25, 0.5, 0.75].map((frac) => (
          <path
            key={`arc-${need.id}-${frac}`}
            d={arcPath(cx, cy, R * frac, angle, SPREAD)}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />
        ));
      })}

      {/* Center cutout */}
      <circle cx={cx} cy={cy} r={CENTER_R} fill="#1a1d27" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

      {/* Center text */}
      <text x={cx} y={cy - 20} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.5)">
        индекс
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize={32} fontWeight={700} fill="#ffffff">
        {avg.toFixed(1)}
      </text>
      {prevAvg !== null && prevAvg > 0 && (
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.4)">
          {avg >= prevAvg ? '↑' : '↓'} вчера {prevAvg.toFixed(1)}
        </text>
      )}
    </svg>
  );
}

// ─── Legend grid ───────────────────────────────────────────────────────────────

function LegendGrid({ needs, ratings, onTapNeed }: { needs: Need[]; ratings: Record<string, number>; onTapNeed?: (need: Need) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {needs.map((need) => {
        const color = COLORS[need.id] ?? '#888';
        const value = ratings[need.id] ?? 0;
        return (
          <div
            key={need.id}
            onClick={() => onTapNeed?.(need)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: onTapNeed ? 'pointer' : 'default',
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: color, flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 400, lineHeight: 1.2 }}>
                {need.chartLabel}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1.2 }}>
                {value}
              </div>
            </div>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>›</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sparkline row ─────────────────────────────────────────────────────────────

function SparklineRow({
  need, history, selectedIdx, selectedRatings, onClick,
}: {
  need: Need;
  history: DayHistory[];
  selectedIdx: number;
  selectedRatings: Record<string, number>;
  onClick?: () => void;
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
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: color + '26',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13,
      }}>
        {need.emoji}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)',
        width: 100, flexShrink: 0, lineHeight: 1.2,
      }}>
        {need.chartLabel}
      </div>
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
        <circle cx={dot.x} cy={dot.y} r={3} fill={color}
          style={{ transition: 'cx 150ms ease, cy 150ms ease' }} />
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color, width: 20, textAlign: 'right', display: 'block' }}>
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
      padding: '12px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>
          Стоит уделить внимание
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
          {lowest.chartLabel}
        </div>
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, color }}>
        {ratings[lowest.id] ?? 0}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function HistoryView({ needs, history, currentRatings }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [subView, setSubView] = useState<'day' | 'week'>('day');
  const [activeNeed, setActiveNeed] = useState<Need | null>(null);
  const [showHint, setShowHint] = useState(
    () => !localStorage.getItem(HISTORY_HINT_KEY)
  );

  const handleTapNeed = useCallback((n: Need) => {
    if (showHint) {
      localStorage.setItem(HISTORY_HINT_KEY, '1');
      setShowHint(false);
    }
    setActiveNeed(n);
  }, [showHint]);

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
  const prevRatings = history[selectedIdx + 1]?.ratings ?? {};

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
      <div style={{ padding: '0 24px 4px' }}>
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
          <>
            {/* Chart */}
            <div style={{ width: '100%', marginTop: 12, marginBottom: showHint ? 4 : 12 }}>
              <div key={selected.date}>
                <NeedsWheel needs={needs} ratings={selectedRatings} prevRatings={prevRatings} />
              </div>
            </div>

            {/* Hint text — only before first legend tap */}
            {showHint && (
              <div style={{
                textAlign: 'center',
                fontSize: 11,
                color: 'rgba(255,255,255,0.25)',
                marginBottom: 10,
              }}>
                Нажми на категорию чтобы узнать что делать
              </div>
            )}

            {/* Legend */}
            <div style={{ padding: '0 20px', marginBottom: 16 }}>
              <LegendGrid needs={needs} ratings={selectedRatings} onTapNeed={handleTapNeed} />
            </div>

            {/* Insight card */}
            <div style={{ padding: '0 20px' }}>
              <InsightCard needs={needs} ratings={selectedRatings} />
            </div>
          </>
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
                  onClick={() => handleTapNeed(need)}
                />
              ))}
            </div>
            <div style={{ marginTop: 28 }}>
              <InsightCard needs={needs} ratings={selectedRatings} />
            </div>
          </div>
        )}
      </div>

      {activeNeed && (
        <NeedHistorySheet
          need={activeNeed}
          value={selectedRatings[activeNeed.id] ?? 0}
          history={history}
          onClose={() => setActiveNeed(null)}
        />
      )}
    </div>
  );
}
