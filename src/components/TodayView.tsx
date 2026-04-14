import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Need, YESTERDAY, COLORS } from '../types';
import { api, StreakData } from '../api';
import { NeedSlider } from './NeedSlider';
import { NeedTodaySheet } from './NeedTodaySheet';
import { PlanSheet } from './PlanSheet';
import { IndexInfoSheet } from './IndexInfoSheet';
import { SectionLabel } from './SectionLabel';
import { NEED_DATA } from '../needData';
import { shouldShowPracticesOnboarding, PRACTICES_ONBOARDING_KEY } from './PracticesOnboarding';
import { TaskCreateSheet } from './TaskCreateSheet';

interface Props {
  needs: Need[];
  ratings: Record<string, number>;
  saved: Record<string, boolean>;
  isOffline?: boolean;
  onChange: (needId: string, value: number) => void;
  onSaved: (needId: string, streak?: StreakData) => void;
  onNote: () => void;
  onOpenPractices?: () => void;
  onPlanCreated?: () => void;
  plannedNeedIds?: Set<string>;
  onClose?: () => void;
  onOpenHelp?: () => void;
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(var(--fg-rgb),0.07)" strokeWidth={5} />
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
      <SectionLabel purple>Как это работает</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>👆</span>
          <span style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.7)', lineHeight: 1.5 }}>
            Оценивай <b style={{ color: 'var(--text)' }}>конкретные действия</b>, не фоновое ощущение. Не «я вроде чувствую близость», а «кто-то обнял» или «я сказал, что думаю». Потяни ползунок от <b style={{ color: 'var(--text)' }}>1 до 10</b>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.7)', lineHeight: 1.5 }}>
            Нажми на <b style={{ color: 'var(--text)' }}>название потребности</b> — там объяснение и советы
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📊</span>
          <span style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.7)', lineHeight: 1.5 }}>
            Всё сохраняется автоматически. <b style={{ color: 'var(--text)' }}>Через 3–5 дней</b> паттерн начнёт проявляться во вкладке <b style={{ color: 'var(--text)' }}>История</b>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>ⓘ</span>
          <span style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.7)', lineHeight: 1.5 }}>
            Нажми на <b style={{ color: 'var(--text)' }}>«Трекер потребностей»</b> в заголовке — там про то, зачем это вообще
          </span>
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          width: '100%', padding: '10px 0', border: 'none', borderRadius: 10,
          background: 'rgba(167,139,250,0.2)', color: 'var(--accent)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Понятно, начнём
      </button>
    </div>
  );
}

export function TodayView({ needs, ratings, saved, isOffline, onChange, onSaved, onNote, onOpenPractices, onPlanCreated, plannedNeedIds, onClose, onOpenHelp }: Props) {
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const unlockTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
      Object.values(unlockTimers.current).forEach(clearTimeout);
    };
  }, []);
  const [activeNeed, setActiveNeed] = useState<Need | null>(null);
  const [showIndexInfo, setShowIndexInfo] = useState(false);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [sessionPlannedNeeds, setSessionPlannedNeeds] = useState<Set<string>>(new Set());
  const plannedNeeds = useMemo(
    () => new Set([...(plannedNeedIds ?? []), ...sessionPlannedNeeds]),
    [plannedNeedIds, sessionPlannedNeeds],
  );
  const [activePlanNeed, setActivePlanNeed] = useState<Need | null>(null);
  const [onboardingVisible, setOnboardingVisible] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  );
  const [practicesCardVisible, setPracticesCardVisible] = useState(
    () => shouldShowPracticesOnboarding()
  );
  const [showTrackerTaskCreate, setShowTrackerTaskCreate] = useState(false);

  const dismissTooltip = useCallback(() => {
    if (onboardingVisible) {
      localStorage.setItem(ONBOARDING_KEY, '1');
      setOnboardingVisible(false);
    }
  }, [onboardingVisible]);

  const handleChange = useCallback((needId: string, value: number) => {
    onChange(needId, value);
    if (isOffline) return; // visual update only — no save while offline
    // Keep slider unlocked while user is actively dragging + 2.5s after last move
    setUnlocked(prev => new Set([...prev, needId]));
    clearTimeout(unlockTimers.current[needId]);
    unlockTimers.current[needId] = setTimeout(() => {
      setUnlocked(prev => { const next = new Set(prev); next.delete(needId); return next; });
    }, 2500);
    clearTimeout(timers.current[needId]);
    timers.current[needId] = setTimeout(async () => {
      if (value === 0) return; // 0 = not rated, don't save
      try {
        const res = await api.saveRating(needId, value);
        onSaved(needId, res.allDone ? res.streak : undefined);
        setLastSavedAt(new Date());
      } catch {
        setSaveError(true);
        setTimeout(() => setSaveError(false), 3000);
      }
    }, 500);
  }, [onChange, onSaved, isOffline]);

  // Summary calculations
  // index = sum of all needs (unrated = 0) / total needs — same formula as server getPair
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
  const diffColor = 'rgba(var(--fg-rgb),0.35)';

  return (
    <div style={{ padding: '20px 20px 40px' }}>
      {onboardingVisible && <OnboardingCard onDismiss={dismissTooltip} />}
      {!onboardingVisible && needs.length > 0 && needs.every(n => (ratings[n.id] ?? 0) === 0) && (
        <div style={{
          textAlign: 'center', fontSize: 12,
          color: 'rgba(var(--fg-rgb),0.25)',
          marginBottom: 16, lineHeight: 1.5,
        }}>
          Потяни ползунок → оценка сохранится автоматически
        </div>
      )}
      {needs.map((n) => {
        const locked = !!saved[n.id] && !unlocked.has(n.id);
        const isLow = locked && ratings[n.id]! <= 3;
        const showPlanCard = isLow && !plannedNeeds.has(n.id);
        const color = COLORS[n.id] ?? '#888';
        return (
          <div key={n.id}>
            <NeedSlider
              id={n.id}
              emoji={n.emoji}
              label={n.chartLabel}
              value={ratings[n.id]}
              saved={false}
              locked={locked}
              onUnlock={() => setUnlocked(prev => new Set([...prev, n.id]))}
              onChange={(v) => handleChange(n.id, v)}
              onTap={() => { dismissTooltip(); setActiveNeed(n); }}
              showTooltip={false}
            />
            {showPlanCard && (
              <div
                onClick={() => { dismissTooltip(); setActivePlanNeed(n); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: color + '12',
                  border: `1px solid ${color}28`,
                  borderRadius: 12, padding: '10px 14px',
                  marginTop: -8, marginBottom: 20,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>🎯</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color }}>Сделать завтра что-то для себя</div>
                  <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.35)', marginTop: 2, lineHeight: 1.4 }}>
                    Один маленький шаг — пока помнишь
                  </div>
                </div>
                <span style={{ fontSize: 16, color: color + '88', flexShrink: 0 }}>›</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Divider */}
      <div style={{
        height: 0.5,
        background: 'rgba(var(--fg-rgb),0.06)',
        margin: '24px 0',
      }} />

      {/* Summary card */}
      <div
        onClick={() => setShowIndexInfo(true)}
        style={{
          background: 'rgba(var(--fg-rgb),0.05)',
          borderRadius: 16,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.4)', marginBottom: 4 }}>
            Индекс дня
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1, marginBottom: 5 }}>
            {avg.toFixed(1)}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(var(--fg-rgb),0.35)' }}>/10</span>
          </div>
          <div style={{ fontSize: 12, color: diffColor }}>
            {diffText}
          </div>
        </div>

        <DonutRing percent={(avg / 10) * 100} />
      </div>

      {/* Note button + auto-save status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 18 }}>
        <div style={{ fontSize: 12, color: saveError ? 'var(--accent-red)' : 'rgba(var(--fg-rgb),0.3)' }}>
          {saveError ? 'Ошибка сохранения — потяни слайдер ещё раз' : lastSavedAt && `Сохранено ${lastSavedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onNote}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(var(--fg-rgb),0.06)', border: 'none',
              borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
              color: 'rgba(var(--fg-rgb),0.45)', fontSize: 12, fontWeight: 500,
            }}
          >
            ✏️ Заметка
          </button>
          <button
            onClick={() => setShowTrackerTaskCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(var(--fg-rgb),0.06)', border: 'none',
              borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
              color: 'rgba(167,139,250,0.6)', fontSize: 12, fontWeight: 500,
            }}
          >
            🎯 Поставить цель
          </button>
        </div>
      </div>

      {practicesCardVisible && onOpenPractices && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(167,139,250,0.08)',
          border: '1px solid rgba(167,139,250,0.18)',
          borderRadius: 14, padding: '12px 14px',
          marginTop: 16, cursor: 'pointer',
        }}
          onClick={() => { setPracticesCardVisible(false); onOpenPractices(); }}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>🗂</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Что тебе помогает?</div>
            <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.4)', marginTop: 2 }}>Добавь практики — будут под рукой в нужный момент</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); localStorage.setItem(PRACTICES_ONBOARDING_KEY, '1'); setPracticesCardVisible(false); }}
            style={{ background: 'none', border: 'none', color: 'rgba(var(--fg-rgb),0.25)', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {showIndexInfo && <IndexInfoSheet onClose={() => setShowIndexInfo(false)} />}
      {showTrackerTaskCreate && (
        <TaskCreateSheet
          defaultType="tracker_streak"
          onCreated={() => setShowTrackerTaskCreate(false)}
          onClose={() => setShowTrackerTaskCreate(false)}
        />
      )}

      {activeNeed && (
        <NeedTodaySheet
          need={activeNeed}
          value={ratings[activeNeed.id] ?? 0}
          onChange={(v) => handleChange(activeNeed.id, v)}
          onClose={() => setActiveNeed(null)}
          onPlanSaved={(needId) => setSessionPlannedNeeds(prev => new Set([...prev, needId]))}
          onOpenHelp={onOpenHelp}
        />
      )}

      {activePlanNeed && (
        <PlanSheet
          needId={activePlanNeed.id}
          needEmoji={NEED_DATA[activePlanNeed.id]?.emoji ?? ''}
          needLabel={activePlanNeed.chartLabel}
          color={COLORS[activePlanNeed.id] ?? '#888'}
          onClose={() => setActivePlanNeed(null)}
          onSaved={() => {
            setSessionPlannedNeeds(prev => new Set([...prev, activePlanNeed.id]));
            setActivePlanNeed(null);
            onPlanCreated?.();
          }}
        />
      )}
    </div>
  );
}
