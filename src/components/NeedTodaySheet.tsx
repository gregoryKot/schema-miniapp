import { useRef, useCallback, useState } from 'react';
import { Need, COLORS } from '../types';
import { NEED_DATA } from '../needData';
import { BottomSheet } from './BottomSheet';
import { SectionLabel } from './SectionLabel';

interface Props {
  need: Need;
  value: number;
  onChange: (v: number) => void;
  onClose: () => void;
}

const DISCLAIMER_CONTENT = [
  'Дневник помогает видеть паттерны и чуть лучше понимать себя.',
  'Советы внутри — это приглашение к размышлению, не инструкция.',
  'Если чувствуешь, что что-то важное требует внимания — терапия это место, где можно разобраться по-настоящему. Безопасно, глубоко, рядом живой человек.',
];

export function NeedTodaySheet({ need, value, onChange, onClose }: Props) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const data = NEED_DATA[need.id];
  if (!data) return null;
  const color = COLORS[need.id] ?? '#888';

  const rangeIdx = value <= 3 ? 0 : value <= 6 ? 1 : 2;
  const RANGE_VALUES = [1, 4, 7];

  // Stable random index per tipKey — recomputed only when level changes
  const tipSeeds = useRef<Partial<Record<string, number>>>({});
  const tipKey = value <= 3 ? 'low' : value <= 6 ? 'medium' : 'high';
  const tipPool = data.tips[tipKey];
  if (tipSeeds.current[tipKey] === undefined) {
    tipSeeds.current[tipKey] = Math.floor(Math.random() * tipPool.length);
  }
  const tip = tipPool[tipSeeds.current[tipKey]!];

  // Inline slider
  const trackRef = useRef<HTMLDivElement>(null);
  const calcValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    onChange(Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 10));
  }, [onChange]);
  const onPtrDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    calcValue(e.clientX);
  }, [calcValue]);
  const onPtrMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    calcValue(e.clientX);
  }, [calcValue]);

  return (
    <BottomSheet onClose={onClose}>
      {/* Header — tap to close */}
      <div
        onClick={onClose}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24, cursor: 'pointer' }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: color + '26',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          {data.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
            {need.chartLabel}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.tags.map((tag) => (
              <span key={tag} style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 20,
                background: color + '1f', color,
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', flexShrink: 0, lineHeight: 1, paddingTop: 2 }}>✕</div>
      </div>

      {/* High score affirmation */}
      {rangeIdx === 2 && (
        <div style={{
          background: color + '18',
          border: `1px solid ${color}33`,
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 13,
          color,
          lineHeight: 1.5,
        }}>
          Сегодня ты позаботился об этой потребности — заметь это
        </div>
      )}

      {/* Section 1: Question */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>Спроси себя</SectionLabel>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
          {data.question}
        </div>
      </div>

      {/* Section 2: Range pills */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>Как понять оценку</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.ranges.map((range, i) => {
            const active = i === rangeIdx;
            return (
              <div
                key={range.label}
                onClick={() => onChange(RANGE_VALUES[i])}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: active ? color + '33' : 'rgba(255,255,255,0.04)',
                  borderRadius: 12, padding: '10px 12px',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: active ? color : 'rgba(255,255,255,0.2)',
                  flexShrink: 0, marginTop: 4,
                }} />
                <div>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: active ? color : 'rgba(255,255,255,0.35)',
                    marginRight: 6,
                  }}>
                    {range.label}
                  </span>
                  <span style={{
                    fontSize: 13,
                    color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                    lineHeight: 1.5,
                  }}>
                    {range.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Actions (low score only) */}
      {value <= 3 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <SectionLabel mb={0}>Сделай прямо сейчас</SectionLabel>
            <span
              onClick={(e) => { e.stopPropagation(); setShowDisclaimer(true); }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 14, height: 14, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)',
                fontSize: 9, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              }}
            >?</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.actions.map((action, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: color + '12',
                  border: `1px solid ${color}28`,
                  borderRadius: 12, padding: '12px 14px',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: color + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color, marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
                  {action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Tip (reflective) */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>Попробуй сегодня</SectionLabel>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
            {tip}
            <span
              onClick={(e) => { e.stopPropagation(); setShowDisclaimer(true); }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)',
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                marginLeft: 6, verticalAlign: 'middle', flexShrink: 0,
              }}
            >?</span>
          </div>
        </div>
      </div>

      {showDisclaimer && (
        <BottomSheet onClose={() => setShowDisclaimer(false)} zIndex={300}>
          <div style={{ paddingTop: 8 }}>
            <SectionLabel purple mb={16}>О советах</SectionLabel>
            {DISCLAIMER_CONTENT.map((p, i) => (
              <p key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>
                {p}
              </p>
            ))}
            <a
              href="https://t.me/kotlarewski"
              style={{ display: 'inline-block', fontSize: 14, color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}
            >
              → Написать автору
            </a>
          </div>
        </BottomSheet>
      )}

      {/* Section 5: Slider */}
      <div>
        <SectionLabel>Оценка сегодня</SectionLabel>
        <div style={{ fontSize: 24, fontWeight: 700, color, marginBottom: 12 }}>
          {value}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>/10</span>
        </div>
        <div
          ref={trackRef}
          onPointerDown={onPtrDown}
          onPointerMove={onPtrMove}
          style={{
            position: 'relative', padding: '12px 0',
            cursor: 'pointer', touchAction: 'none', userSelect: 'none',
          }}
        >
          <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              width: `${value * 10}%`, height: '100%', borderRadius: 6,
              background: `linear-gradient(to right, ${color}55, ${color})`,
            }} />
          </div>
          <div style={{
            position: 'absolute', left: `${value * 10}%`, top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20, height: 20, borderRadius: '50%',
            background: color, border: '2px solid #161821',
            pointerEvents: 'none',
          }} />
        </div>
      </div>
    </BottomSheet>
  );
}
