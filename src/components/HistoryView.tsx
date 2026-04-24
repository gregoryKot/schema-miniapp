import { useState, useCallback, useEffect, useRef } from 'react';
import { Need, DayHistory, COLORS } from '../types';
import { NeedHistorySheet } from './NeedHistorySheet';
import { getTherapistContact } from '../utils/therapistContact';
import { IndexInfoSheet } from './IndexInfoSheet';
import { NoteSheet } from './NoteSheet';
import { WeeklyCardSheet } from './WeeklyCardSheet';
import { api } from '../api';

interface Props {
  needs: Need[];
  history: DayHistory[];
  currentRatings: Record<string, number>;
  childhoodRatings?: Partial<Record<string, number>>;
  onOpenSchemas?: () => void;
  onOpenChildhoodWheel?: () => void;
  days?: number;
  onChangeDays?: (days: number) => void;
  onGoToToday?: () => void;
  onBackfill?: (date: string) => void;
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

// ─── Wheel ────────────────────────────────────────────────────────────────────

function NeedsWheel({
  needs, ratings, prevRatings = {}, childhoodRatings = {}, onClickNeed, onClickCenter,
}: {
  needs: Need[];
  ratings: Record<string, number>;
  prevRatings?: Record<string, number>;
  childhoodRatings?: Partial<Record<string, number>>;
  onClickNeed?: (need: Need) => void;
  onClickCenter?: () => void;
}) {
  const W = 360, H = 280;
  const cx = W / 2;
  const cy = H / 2;
  const R = cy - 20;
  const SPREAD = (34 * Math.PI) / 180;
  const n = needs.length;
  const CENTER_R = 41;

  const avg = needs.length > 0
    ? needs.reduce((s, nd) => s + (ratings[nd.id] ?? 0), 0) / needs.length
    : 0;
  const hasPrev = Object.keys(prevRatings).length > 0;
  const prevAvg = hasPrev
    ? needs.reduce((s, nd) => s + (prevRatings[nd.id] ?? 0), 0) / needs.length
    : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 280 }}>
      <defs>
        <linearGradient id="center-score-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6b9d" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {[2, 5, 8, 10].map((ring) => (
        <circle key={ring} cx={cx} cy={cy} r={R * ring / 10}
          fill="none" stroke="rgba(var(--fg-rgb),0.04)"
          strokeWidth={ring === 10 ? 1.5 : 1} />
      ))}

      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const d = petalPath(cx, cy, R, angle, SPREAD);
        if (!d) return null;
        return <path key={`ghost-${need.id}`} d={d} fill="rgba(var(--fg-rgb),0.06)" />;
      })}

      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const value = ratings[need.id] ?? 0;
        const r = Math.sqrt(value / 10) * R;
        const color = COLORS[need.id] ?? '#888';
        const d = petalPath(cx, cy, r, angle, SPREAD);
        if (!d) return null;
        return (
          <path key={need.id} d={d} fill={color} fillOpacity={0.9}
            stroke={color} strokeWidth={1} strokeOpacity={0.4} strokeLinejoin="round"
            style={{ transformOrigin: `${cx}px ${cy}px`, animation: `sector-in 400ms ${SPRING} ${i * 80}ms both` }} />
        );
      })}

      {needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        return [0.25, 0.5, 0.75].map((frac) => (
          <path key={`arc-${need.id}-${frac}`}
            d={arcPath(cx, cy, R * frac, angle, SPREAD)}
            fill="none" stroke="rgba(var(--fg-rgb),0.12)" strokeWidth={1} />
        ));
      })}

      {Object.keys(childhoodRatings).length > 0 && needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const cValue = childhoodRatings[need.id] ?? 0;
        const r = Math.sqrt(cValue / 10) * R;
        const d = petalPath(cx, cy, r, angle, SPREAD);
        if (!d) return null;
        return (
          <path key={`childhood-${need.id}`} d={d}
            fill="none" stroke="rgba(var(--fg-rgb),0.45)"
            strokeWidth={2} strokeDasharray="4 3" strokeLinejoin="round" />
        );
      })}

      <circle cx={cx} cy={cy} r={CENTER_R} fill="var(--bg)" stroke="rgba(var(--fg-rgb),0.06)" strokeWidth={1} />
      <text x={cx} y={cy - 20} textAnchor="middle" fontSize={11} fill="rgba(var(--fg-rgb),0.45)">индекс</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize={32} fontWeight={700} fill="var(--text)">{avg.toFixed(1)}</text>
      {prevAvg !== null && prevAvg > 0 && (
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize={11} fill="rgba(var(--fg-rgb),0.35)">
          {avg >= prevAvg ? '↑' : '↓'} вчера {prevAvg.toFixed(1)}
        </text>
      )}

      {onClickNeed && needs.map((need, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const d = petalPath(cx, cy, R, angle, SPREAD);
        if (!d) return null;
        return <path key={`hit-${need.id}`} d={d} fill="transparent" onClick={() => onClickNeed(need)} style={{ cursor: 'pointer' }} />;
      })}

      {onClickCenter && (
        <circle cx={cx} cy={cy} r={CENTER_R} fill="transparent" onClick={onClickCenter} style={{ cursor: 'pointer' }} />
      )}
    </svg>
  );
}

// ─── Need row (replaces old 2-col grid) ───────────────────────────────────────

function NeedRow({ need, value, onTap }: { need: Need; value: number; onTap?: () => void }) {
  const color = COLORS[need.id] ?? '#888';
  const pct = (value / 10) * 100;
  const levelLabel = value === 0 ? '—' : value <= 3 ? 'низко' : value <= 6 ? 'средне' : 'хорошо';
  const levelColor = value === 0 ? 'var(--text-faint)' : value <= 3 ? 'var(--accent-red)' : value <= 6 ? 'var(--accent-yellow)' : 'var(--accent-green)';

  return (
    <div onClick={onTap} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'var(--surface)', border: '1px solid var(--border-color)',
      borderRadius: 14, padding: '12px 14px', cursor: onTap ? 'pointer' : 'default',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>
        {need.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{need.chartLabel}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: levelColor, fontWeight: 600 }}>{levelLabel}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color, minWidth: 20, textAlign: 'right' }}>{value}</span>
          </div>
        </div>
        <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s ease' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Sparkline row ─────────────────────────────────────────────────────────────

function SparklineRow({ need, history, selectedIdx, selectedRatings, onClick }: {
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
  const delta = score - prevScore;
  const trendColor = delta > 0 ? 'var(--accent-green)' : delta < 0 ? 'var(--accent-red)' : 'var(--text-faint)';
  const trendArrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '—';

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[n - 1].x.toFixed(1)} ${H} L 0 ${H} Z`;
  const polyStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'var(--surface)', border: '1px solid var(--border-color)',
      borderRadius: 14, padding: '12px 14px', cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>
        {need.emoji}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', width: 88, flexShrink: 0, lineHeight: 1.2 }}>
        {need.chartLabel}
      </div>
      <svg style={{ flex: 1, height: 28, display: 'block', overflow: 'visible' }}
        viewBox="0 0 120 28" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`area-${need.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#area-${need.id})`} />
        <polyline points={polyStr} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={dot.x} cy={dot.y} r={3.5} fill={color} style={{ transition: 'cx 150ms ease, cy 150ms ease' }} />
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color, minWidth: 18, textAlign: 'right' }}>{score}</span>
        <span style={{ fontSize: 11, color: trendColor, fontWeight: 600 }}>{trendArrow}</span>
      </div>
    </div>
  );
}

// ─── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({ needs, ratings, onTap }: { needs: Need[]; ratings: Record<string, number>; onTap?: (n: Need) => void }) {
  if (needs.length === 0) return null;
  const rated = needs.filter(n => (ratings[n.id] ?? 0) > 0);
  if (rated.length === 0) return null;
  const lowest = rated.reduce((min, n) => (ratings[n.id] ?? 0) < (ratings[min.id] ?? 0) ? n : min);
  const color = COLORS[lowest.id] ?? '#888';
  const value = ratings[lowest.id] ?? 0;

  return (
    <div onClick={() => onTap?.(lowest)} style={{
      background: `color-mix(in srgb, ${color} 8%, var(--surface))`,
      border: `1px solid color-mix(in srgb, ${color} 25%, var(--border-color))`,
      borderRadius: 16, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      cursor: onTap ? 'pointer' : 'default',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `color-mix(in srgb, ${color} 20%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {lowest.emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 2 }}>Стоит уделить внимание</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{lowest.chartLabel}</div>
        <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 1 }}>оценка {value} из 10</div>
      </div>
      {onTap && <span style={{ fontSize: 16, color: 'var(--text-faint)' }}>›</span>}
    </div>
  );
}

// ─── Day summary dot for date picker ──────────────────────────────────────────

function dayAvg(day: DayHistory, needs: Need[]): number {
  if (needs.length === 0) return 0;
  const vals = needs.map(n => day.ratings[n.id] ?? 0).filter(v => v > 0);
  if (vals.length === 0) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const DAYS_OPTIONS = [7, 14, 30];

export function HistoryView({ needs, history, currentRatings, childhoodRatings = {}, onOpenSchemas, onOpenChildhoodWheel, days = 7, onChangeDays, onGoToToday, onBackfill }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [subView, setSubView] = useState<'day' | 'week'>('day');
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const dateBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeNeed, setActiveNeed] = useState<Need | null>(null);
  const [showIndexInfo, setShowIndexInfo] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState<string | null>(null);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [showWeekCard, setShowWeekCard] = useState(false);
  const [showHint, setShowHint] = useState(() => !localStorage.getItem(HISTORY_HINT_KEY));

  useEffect(() => {
    if (history.length > 0 && selectedIdx >= history.length) setSelectedIdx(history.length - 1);
  }, [history.length, selectedIdx]);

  useEffect(() => {
    dateBtnRefs.current[selectedIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedIdx]);

  useEffect(() => {
    if (history.length === 0) return;
    const date = history[selectedIdx]?.date;
    if (date) api.getNote(date).then(r => { setNoteText(r.text); setNoteTags(r.tags ?? []); });
  }, [selectedIdx, history]);

  const handleTapNeed = useCallback((n: Need) => {
    if (showHint) { localStorage.setItem(HISTORY_HINT_KEY, '1'); setShowHint(false); }
    setActiveNeed(n);
  }, [showHint]);

  // Empty state
  if (history.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
          История пока пуста
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: 28 }}>
          Заполни трекер сегодня — через 3–5 дней здесь начнёт проявляться паттерн: что тебя питает, что истощает
        </div>
        {onGoToToday && (
          <button onClick={onGoToToday} className="btn-primary" style={{ width: '100%' }}>
            Заполнить сегодня
          </button>
        )}
      </div>
    );
  }

  const selected = history[selectedIdx] ?? history[0];
  const selectedRatings = selected.date === TODAY_STR ? currentRatings : selected.ratings;
  const prevRatings = history[selectedIdx + 1]?.ratings ?? {};

  // Low-need therapist insight
  const needsLow = history.length >= 3
    ? needs.filter(n => history.slice(0, 3).every(d => (d.ratings[n.id] ?? 10) <= 4))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0 80px' }}>

      {/* ── Date picker ── */}
      <div ref={dateScrollRef} style={{
        display: 'flex', gap: 6, overflowX: 'auto',
        padding: '0 20px 16px', scrollbarWidth: 'none',
      }}>
        {history.map((day, i) => {
          const active = i === selectedIdx;
          const avg = dayAvg(day, needs);
          const hasData = avg > 0;
          const dotColor = hasData
            ? avg >= 7 ? 'var(--accent-green)' : avg >= 4 ? 'var(--accent-yellow)' : 'var(--accent-red)'
            : 'var(--surface-2)';

          return (
            <button key={day.date}
              ref={el => { dateBtnRefs.current[i] = el; }}
              onClick={() => setSelectedIdx(i)}
              style={{
                flexShrink: 0, padding: '8px 12px', borderRadius: 14, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
                background: active ? 'var(--surface)' : 'transparent',
                boxShadow: active ? '0 0 0 1.5px var(--accent)' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'all 0.15s ease',
              }}>
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: active ? 'var(--accent)' : 'var(--text-faint)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {getDayAbbr(day.date)}
              </span>
              <span style={{
                fontSize: 16, fontWeight: 700, lineHeight: 1,
                color: active ? 'var(--text)' : 'var(--text-sub)',
              }}>
                {getDayNum(day.date)}
              </span>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor }} />
            </button>
          );
        })}
      </div>

      {/* ── Controls row ── */}
      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* View toggle */}
        <div style={{
          display: 'flex', flex: 1,
          background: 'var(--surface-2)', borderRadius: 12, padding: 3,
        }}>
          {(['day', 'week'] as const).map((v) => {
            const active = subView === v;
            return (
              <button key={v} onClick={() => setSubView(v)} style={{
                flex: 1, padding: '7px 0', border: 'none', borderRadius: 10,
                fontFamily: 'inherit',
                background: active ? 'var(--surface)' : 'transparent',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                color: active ? 'var(--text)' : 'var(--text-faint)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}>
                {v === 'day' ? 'День' : 'Неделя'}
              </button>
            );
          })}
        </div>

        {/* Depth selector */}
        {onChangeDays && (
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 12, padding: 3 }}>
            {DAYS_OPTIONS.map(d => {
              const active = days === d;
              return (
                <button key={d} onClick={() => onChangeDays(d)} style={{
                  padding: '7px 10px', border: 'none', borderRadius: 10,
                  fontFamily: 'inherit',
                  background: active ? 'var(--surface)' : 'transparent',
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  color: active ? 'var(--text)' : 'var(--text-faint)',
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
                  {d}д
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Early-days nudge ── */}
      {history.length < 3 && (
        <div style={{ margin: '0 20px 12px' }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border-color)',
            borderRadius: 14, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>📈</span>
            <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>
              Ещё {3 - history.length} {3 - history.length === 1 ? 'день' : 'дня'} — и паттерн начнёт проявляться
            </span>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div key={subView} style={{ animation: 'fade-in 200ms ease' }}>

        {subView === 'day' ? (
          <>
            {/* Wheel */}
            <div style={{ width: '100%', marginBottom: 4 }}>
              <div key={selected.date}>
                <NeedsWheel
                  needs={needs} ratings={selectedRatings} prevRatings={prevRatings}
                  childhoodRatings={childhoodRatings}
                  onClickNeed={handleTapNeed}
                  onClickCenter={() => setShowIndexInfo(true)}
                />
              </div>
            </div>

            {/* Childhood / schemas links */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
              {Object.keys(childhoodRatings).length > 0 ? (
                <div onClick={onOpenChildhoodWheel} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: onOpenChildhoodWheel ? 'pointer' : 'default' }}>
                  <svg width={16} height={6}><line x1={0} y1={3} x2={16} y2={3} stroke="rgba(var(--fg-rgb),0.3)" strokeWidth={1.5} strokeDasharray="3 3" /></svg>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>детство</span>
                  {onOpenChildhoodWheel && <span style={{ fontSize: 12, color: 'var(--accent)' }}>→</span>}
                </div>
              ) : onOpenChildhoodWheel ? (
                <div onClick={onOpenChildhoodWheel} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <span style={{ fontSize: 12, color: 'var(--accent)' }}>🌱 Оценить детство →</span>
                </div>
              ) : null}

              {onOpenSchemas && (
                <div onClick={onOpenSchemas} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <span style={{ fontSize: 12, color: 'var(--accent)' }}>Что за этим стоит →</span>
                </div>
              )}
            </div>

            {/* Backfill CTA */}
            {onBackfill && selected.date !== TODAY_STR && Object.keys(selected.ratings).length === 0 && (
              <div style={{ padding: '0 20px', marginBottom: 12 }}>
                <div onClick={() => onBackfill(selected.date)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'color-mix(in srgb, var(--accent-blue) 8%, var(--surface))',
                  border: '1px solid color-mix(in srgb, var(--accent-blue) 20%, var(--border-color))',
                  borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>📅</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-blue)' }}>Заполнить этот день</div>
                    <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>Оценки за {selected.date} не заполнены</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--text-faint)' }}>›</span>
                </div>
              </div>
            )}

            {/* Hint */}
            {showHint && (
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>
                Нажми на потребность чтобы узнать что делать
              </div>
            )}

            {/* Need rows */}
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {needs.map(n => (
                <NeedRow key={n.id} need={n} value={selectedRatings[n.id] ?? 0} onTap={() => handleTapNeed(n)} />
              ))}
            </div>

            {/* Insight */}
            <div style={{ padding: '0 20px', marginBottom: 12 }}>
              <InsightCard needs={needs} ratings={selectedRatings} onTap={handleTapNeed} />
            </div>

            {/* Therapist CTA */}
            {needsLow.length > 0 && (
              <div style={{ padding: '0 20px', marginBottom: 12 }}>
                <div style={{
                  background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
                  border: '1px solid color-mix(in srgb, var(--accent) 18%, var(--border-color))',
                  borderRadius: 16, padding: '16px',
                }}>
                  <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.65, marginBottom: 12 }}>
                    <strong style={{ color: 'var(--text)' }}>{needsLow[0].chartLabel}</strong> остаётся низкой несколько дней. Иногда за этим стоит что-то важное — терапевт поможет разобраться.
                  </div>
                  <a href={getTherapistContact().bookingUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                    Записаться и взять сводку →
                  </a>
                </div>
              </div>
            )}

            {/* Note */}
            <div style={{ padding: '0 20px' }}>
              <div onClick={() => setShowNote(true)} style={{
                padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                background: noteText ? 'var(--surface)' : 'transparent',
                border: `1px ${noteText ? 'solid' : 'dashed'} ${noteText ? 'var(--border-color)' : 'rgba(var(--fg-rgb),0.12)'}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>📝</span>
                <span style={{ fontSize: 13, color: noteText ? 'var(--text-sub)' : 'var(--text-faint)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {noteText || 'Добавить заметку к этому дню'}
                </span>
                {noteText && <span style={{ fontSize: 14, color: 'var(--text-faint)' }}>›</span>}
              </div>
              {noteTags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {noteTags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20,
                      background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                      color: 'var(--accent)', fontWeight: 500,
                    }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── Неделя ── */
          <div style={{ padding: '0 20px' }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-faint)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
            }}>
              За {days} дней
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {needs.map((need) => (
                <SparklineRow key={need.id} need={need} history={history}
                  selectedIdx={selectedIdx} selectedRatings={selectedRatings}
                  onClick={() => handleTapNeed(need)} />
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <InsightCard needs={needs} ratings={selectedRatings} onTap={handleTapNeed} />
            </div>

            {needsLow.length > 0 && (
              <div style={{
                marginTop: 12,
                background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
                border: '1px solid color-mix(in srgb, var(--accent) 18%, var(--border-color))',
                borderRadius: 16, padding: '16px',
              }}>
                <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.65, marginBottom: 12 }}>
                  <strong style={{ color: 'var(--text)' }}>{needsLow[0].chartLabel}</strong> остаётся низкой несколько дней — разобраться с живым человеком рядом бывает легче.
                </div>
                <a href={getTherapistContact().bookingUrl} target="_blank" rel="noreferrer"
                  style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                  Записаться на сессию →
                </a>
              </div>
            )}

            <button onClick={() => setShowWeekCard(true)} style={{
              width: '100%', marginTop: 16, padding: '14px 0',
              border: '1px solid var(--border-color)', borderRadius: 14, fontFamily: 'inherit',
              background: 'var(--surface)', color: 'var(--text-sub)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>🪄</span>
              Карточка недели
            </button>
          </div>
        )}
      </div>

      {/* ── Sheets ── */}
      {showNote && history[selectedIdx] && (
        <NoteSheet date={history[selectedIdx].date} onClose={() => {
          api.getNote(history[selectedIdx].date).then(r => { setNoteText(r.text); setNoteTags(r.tags ?? []); });
          setShowNote(false);
        }} />
      )}

      {showIndexInfo && <IndexInfoSheet onClose={() => setShowIndexInfo(false)} />}

      {showWeekCard && (
        <WeeklyCardSheet needs={needs} history={history.slice(0, 7)} onClose={() => setShowWeekCard(false)} />
      )}

      {activeNeed && (
        <NeedHistorySheet
          need={activeNeed} value={selectedRatings[activeNeed.id] ?? 0}
          history={history} childhoodValue={childhoodRatings[activeNeed.id]}
          onClose={() => setActiveNeed(null)} />
      )}
    </div>
  );
}
