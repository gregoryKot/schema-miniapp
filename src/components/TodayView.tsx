import { useCallback, useRef, useState } from 'react';
import { Need, YESTERDAY } from '../types';
import { api } from '../api';
import { NeedSlider } from './NeedSlider';
import { NeedTodaySheet } from './NeedTodaySheet';

interface Props {
  needs: Need[];
  ratings: Record<string, number>;
  saved: Record<string, boolean>;
  onChange: (needId: string, value: number) => void;
  onSaved: (needId: string) => void;
}

function DonutRing({ percent }: { percent: number }) {
  const size = 52;
  const r = 20;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(percent, 100) / 100);

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="donut-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ff6b9d" />
          <stop offset="50%"  stopColor="#ffd166" />
          <stop offset="100%" stopColor="#06d6a0" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="url(#donut-grad)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.35s ease' }}
      />
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={600}
        fill="white"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

const ONBOARDING_KEY = 'onboarding_v2_done';

function OnboardingCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(79,163,247,0.08))',
      border: '1px solid rgba(167,139,250,0.25)',
      borderRadius: 16,
      padding: '16px 18px',
      marginBottom: 24,
    }}>
      <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Как это работает
      </div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 14 }}>
        Раз в день, пять шкал — и через несколько дней паттерн становится различимым: что тебя питает, что истощает.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>👆</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            Потяни ползунок чтобы оценить каждую потребность от <b style={{ color: '#fff' }}>0 до 10</b>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            Нажми на <b style={{ color: '#fff' }}>название потребности</b> — там объяснение и советы
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📊</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            Всё сохраняется автоматически, паттерн виден во вкладке <b style={{ color: '#fff' }}>История</b>
          </span>
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          width: '100%', padding: '10px 0', border: 'none', borderRadius: 10,
          background: 'rgba(167,139,250,0.2)', color: '#a78bfa',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Понятно, начнём
      </button>
    </div>
  );
}

export function TodayView({ needs, ratings, onChange, onSaved }: Props) {
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [activeNeed, setActiveNeed] = useState<Need | null>(null);
  const [onboardingVisible, setOnboardingVisible] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  );

  const dismissTooltip = useCallback(() => {
    if (onboardingVisible) {
      localStorage.setItem(ONBOARDING_KEY, '1');
      setOnboardingVisible(false);
    }
  }, [onboardingVisible]);

  const handleChange = useCallback((needId: string, value: number) => {
    onChange(needId, value);
    clearTimeout(timers.current[needId]);
    timers.current[needId] = setTimeout(async () => {
      await api.saveRating(needId, value);
      onSaved(needId);
      setLastSavedAt(new Date());
    }, 500);
  }, [onChange, onSaved]);

  // Summary calculations
  const avg = needs.length > 0
    ? needs.reduce((s, n) => s + (ratings[n.id] ?? 0), 0) / needs.length
    : 0;
  const yesterdayAvg = needs.length > 0
    ? needs.reduce((s, n) => s + (YESTERDAY[n.id] ?? 0), 0) / needs.length
    : 0;
  const diff = avg - yesterdayAvg;
  const diffText = diff > 0
    ? `+${diff.toFixed(1)} к вчера`
    : diff < 0
      ? `${diff.toFixed(1)} к вчера`
      : 'как вчера';
  const diffColor = 'rgba(255,255,255,0.35)';

  return (
    <div style={{ padding: '20px 20px 40px' }}>
      {onboardingVisible && <OnboardingCard onDismiss={dismissTooltip} />}
      {needs.map((n) => (
        <NeedSlider
          key={n.id}
          id={n.id}
          emoji={n.emoji}
          label={n.chartLabel}
          value={ratings[n.id] ?? 0}
          saved={false}
          onChange={(v) => handleChange(n.id, v)}
          onTap={() => { dismissTooltip(); setActiveNeed(n); }}
          showTooltip={false}
        />
      ))}

      {/* Divider */}
      <div style={{
        height: 0.5,
        background: 'rgba(255,255,255,0.06)',
        margin: '24px 0',
      }} />

      {/* Summary card */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
            Индекс дня
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1, marginBottom: 5 }}>
            {avg.toFixed(1)}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>/10</span>
          </div>
          <div style={{ fontSize: 12, color: diffColor }}>
            {diffText}
          </div>
        </div>

        <DonutRing percent={(avg / 10) * 100} />
      </div>

      {/* Auto-save status */}
      <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', minHeight: 18 }}>
        {lastSavedAt && `Сохранено ${lastSavedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`}
      </div>

      {activeNeed && (
        <NeedTodaySheet
          need={activeNeed}
          value={ratings[activeNeed.id] ?? 0}
          onChange={(v) => handleChange(activeNeed.id, v)}
          onClose={() => setActiveNeed(null)}
        />
      )}
    </div>
  );
}
