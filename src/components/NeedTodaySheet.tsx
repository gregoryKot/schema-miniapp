import { useRef, useCallback } from 'react';
import { Need, COLORS } from '../types';
import { NEED_DATA } from '../needData';
import { BottomSheet } from './BottomSheet';

interface Props {
  need: Need;
  value: number;
  onChange: (v: number) => void;
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

export function NeedTodaySheet({ need, value, onChange, onClose }: Props) {
  const data = NEED_DATA[need.id];
  if (!data) return null;
  const color = COLORS[need.id] ?? '#888';

  const rangeIdx = value <= 3 ? 0 : value <= 6 ? 1 : 2;

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
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: active ? color + '33' : 'rgba(255,255,255,0.04)',
                  borderRadius: 12, padding: '10px 12px',
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

      {/* Section 3: Slider */}
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
