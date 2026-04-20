// TodaySection.tsx — Redesigned Today screen
// Place at: src/sections/TodaySection.tsx
// Replaces the existing TodaySection.
//
// Key differences from original:
//  – NeedMini grid with fill-bar indicators (tap opens tracker at that need)
//  – Average score card when all needs rated
//  – Diary preview with left-rail type indicator
//  – Onboarding step card with dot progress
//  – All colors via CSS tokens (light/dark theme ready)

import { useEffect, useState } from 'react';
import { Need, UserProfile, COLORS } from '../types';
import { api, StreakData } from '../api';
import { Section } from '../components/BottomNav';
import { useSafeTop } from '../utils/safezone';
import { MY_SCHEMA_IDS_KEY, MY_MODE_IDS_KEY } from '../utils/storageKeys';
import { TaskCreateSheet } from '../components/TaskCreateSheet';

export { MY_SCHEMA_IDS_KEY, MY_MODE_IDS_KEY };

// ── Shared helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 19) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

function formatGreetingDate(): string {
  const now = new Date();
  const dow  = now.toLocaleDateString('ru-RU', { weekday: 'long' });
  const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${dow[0].toUpperCase()}${dow.slice(1)}, ${date}`;
}

function readLocalIds(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

// ── NeedMini ──────────────────────────────────────────────────────────────────

function NeedMini({ need, value, yesterday, onTap }: {
  need: Need;
  value: number | undefined;
  yesterday?: number;
  onTap: () => void;
}) {
  const color  = COLORS[need.id] ?? '#888';
  const rgb    = hexToRgb(color);
  const filled = value !== undefined && value !== null;
  const delta  = (filled && yesterday !== undefined) ? (value! - yesterday) : null;

  return (
    <div onClick={e => { e.stopPropagation(); onTap(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        position: 'relative', overflow: 'hidden',
        background: filled ? `rgba(${rgb},0.14)` : 'var(--surface)',
        border: `1.5px solid ${filled ? color + '44' : 'var(--border-color)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.2s',
      }}>
        {filled && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${(value! / 10) * 100}%`,
            background: `linear-gradient(to top, ${color}55, ${color}14)`,
            transition: 'height 0.4s ease',
          }}/>
        )}
        <span style={{
          position: 'relative',
          fontSize: filled ? 14 : 18, fontWeight: 700,
          color: filled ? color : 'var(--text-faint)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {filled ? value : need.emoji}
        </span>
        {/* Yesterday delta badge */}
        {delta !== null && delta !== 0 && (
          <div style={{
            position: 'absolute', top: 2, right: 2,
            fontSize: 7, fontWeight: 700, lineHeight: 1,
            color: delta > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            background: delta > 0 ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.18)',
            borderRadius: 4, padding: '1px 3px',
          }}>
            {delta > 0 ? '+' : ''}{delta}
          </div>
        )}
      </div>
      <span style={{
        fontSize: 9, color: 'var(--text-faint)', fontWeight: 600,
        textAlign: 'center', letterSpacing: '0.02em', lineHeight: 1.2,
        maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {need.chartLabel}
      </span>
    </div>
  );
}

// ── Diary type badge ──────────────────────────────────────────────────────────

function DiaryTypeBadge({ type }: { type: string }) {
  const MAP: Record<string, { label: string; color: string }> = {
    schema:    { label: 'Схема',         color: '#818cf8' },
    mode:      { label: 'Режим',         color: '#f472b6' },
    gratitude: { label: 'Благодарность', color: '#4ade80' },
  };
  const { label, color } = MAP[type] ?? { label: type, color: '#aaa' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', color,
      background: color + '18', borderRadius: 6, padding: '2px 7px',
    }}>
      {label}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  needs: Need[];
  ratings: Record<string, number>;
  yesterdayRatings?: Record<string, number>;
  onNavigate: (s: Section) => void;
  onOpenSchema: (opts?: { startTest?: boolean; tab?: 'needs'|'schemas'|'modes'; highlight?: string }) => void;
  onOpenAdvanced: () => void;
  onOpenTracker: () => void;
  onOpenTrackerAt?: (needId: string) => void;
  onOpenDiaries: () => void;
  onOpenChildhoodWheel: () => void;
  refreshKey?: number;
  userRole?: 'CLIENT' | 'THERAPIST';
  onOpenTherapistCabinet?: () => void;
}

// ── TodaySection ──────────────────────────────────────────────────────────────

export function TodaySection({
  needs, ratings, yesterdayRatings = {},
  onOpenSchema, onOpenAdvanced, onOpenTracker, onOpenTrackerAt,
  onOpenDiaries, onOpenChildhoodWheel,
  refreshKey, userRole, onOpenTherapistCabinet,
}: Props) {
  const [profile,       setProfile]       = useState<UserProfile | null>(null);
  const [manualSchemaIds, setManualSchemaIds] = useState<string[]>(() => readLocalIds(MY_SCHEMA_IDS_KEY));
  const [recentDiaries, setRecentDiaries] = useState<Array<{ type: string; label: string; time: string; dateStr: string }>>([]);
  const [diariesLoaded, setDiariesLoaded] = useState(false);
  const [showDiaryTask, setShowDiaryTask] = useState(false);
  const safeTop = useSafeTop();

  const firstName = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.first_name ?? '';

  useEffect(() => {
    let ignore = false;
    setProfile(null);
    setDiariesLoaded(false);

    api.getProfile().then(p => {
      if (ignore) return;
      setProfile(p);
      if (p.mySchemaIds.length > 0) {
        setManualSchemaIds(p.mySchemaIds);
        localStorage.setItem(MY_SCHEMA_IDS_KEY, JSON.stringify(p.mySchemaIds));
      }
    }).catch(() => {});

    Promise.all([api.getSchemaDiary(), api.getModeDiary(), api.getGratitudeDiary()])
      .then(([schema, mode, gratitude]) => {
        if (ignore) return;
        const all = [
          ...schema.slice(0, 2).map(e => ({ type: 'schema', label: e.trigger.slice(0, 46), time: e.createdAt.slice(11, 16), dateStr: 'Сегодня' })),
          ...mode.slice(0, 2).map(e => ({ type: 'mode', label: e.situation.slice(0, 46), time: e.createdAt.slice(11, 16), dateStr: 'Сегодня' })),
          ...gratitude.slice(0, 2).map(e => ({ type: 'gratitude', label: e.items[0]?.slice(0, 46) ?? 'Благодарность', time: '', dateStr: e.date })),
        ];
        all.sort((a, b) => b.time.localeCompare(a.time));
        setRecentDiaries(all.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setDiariesLoaded(true); });

    return () => { ignore = true; };
  }, [refreshKey]);

  const streak       = profile?.streak ?? 0;
  const ratedCount   = needs.filter(n => ratings[n.id] !== undefined).length;
  const allRated     = needs.length > 0 && ratedCount === needs.length;
  const avgScore     = allRated
    ? (needs.reduce((s, n) => s + ratings[n.id], 0) / needs.length).toFixed(1)
    : null;
  const hasSchemas   = [...new Set([...(profile?.ysq.activeSchemaIds ?? []), ...manualSchemaIds])].length > 0;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 120, paddingTop: safeTop }}>

      {/* ── Header ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 500, marginBottom: 5, letterSpacing: '0.03em' }}>
          {formatGreetingDate()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {firstName ? `Привет, ${firstName}` : 'Добро пожаловать'}
          </div>
          {/* Streak */}
          {profile !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              background: streak > 0 ? 'rgba(251,146,60,0.12)' : 'var(--surface)',
              border: `1px solid ${streak > 0 ? 'rgba(251,146,60,0.22)' : 'var(--border-color)'}`,
              borderRadius: 20, padding: '5px 10px',
            }}>
              <span style={{ fontSize: 13 }}>{streak > 7 ? '🔥' : streak > 0 ? '✨' : '💤'}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: streak > 0 ? '#fb923c' : 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                {streak}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Therapist cabinet banner ── */}
        {userRole === 'THERAPIST' && onOpenTherapistCabinet && (
          <div onClick={onOpenTherapistCabinet} style={{
            background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.25)',
            borderRadius: 18, padding: '14px 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
                Кабинет терапевта
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                Клиенты · Задания · Концептуализация
              </div>
            </div>
            <span style={{ fontSize: 20, color: 'var(--accent)', fontWeight: 300 }}>›</span>
          </div>
        )}

        {/* ── Onboarding widget ── */}
        <OnboardingWidget
          profile={profile}
          hasSchemas={hasSchemas}
          onOpenSchema={onOpenSchema}
          onOpenAdvanced={onOpenAdvanced}
          onOpenTracker={onOpenTracker}
          onOpenDiaries={onOpenDiaries}
          onOpenChildhoodWheel={onOpenChildhoodWheel}
        />

        {/* ── Needs card ── */}
        <div onClick={onOpenTracker} className="card" style={{
          padding: '18px 18px', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
              Потребности
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {allRated ? 'Готово ✓' : `${ratedCount} / ${needs.length}`}
            </span>
          </div>

          {/* 5 mini indicators */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            {needs.map(n => (
              <NeedMini key={n.id} need={n} value={ratings[n.id]} yesterday={yesterdayRatings[n.id]}
                onTap={() => onOpenTrackerAt ? onOpenTrackerAt(n.id) : onOpenTracker()}
              />
            ))}
          </div>

          {allRated && avgScore ? (
            <div style={{
              background: 'var(--surface-2)', borderRadius: 14, padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                  Средний индекс
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1.5px',
                  color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {avgScore}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>Все оценено</div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(var(--fg-rgb),0.04)',
              borderRadius: 14, padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: '1px solid var(--border-color)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                  Оценить потребности
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Займёт 2 минуты</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          )}
        </div>

        {/* ── Diary card ── */}
        <div onClick={onOpenDiaries} className="card" style={{
          padding: '18px 18px 14px', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
              Дневник
            </div>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>Все →</span>
          </div>

          {!diariesLoaded ? (
            <SkeletonLines />
          ) : recentDiaries.length > 0 ? (
            recentDiaries.map((entry, i) => {
              const typeColor = ({ schema: '#818cf8', mode: '#f472b6', gratitude: '#4ade80' } as any)[entry.type] ?? '#aaa';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                  borderTop: i > 0 ? '1px solid var(--border-color)' : undefined,
                }}>
                  <div style={{ width: 3, height: 30, borderRadius: 2, flexShrink: 0, background: typeColor }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 1 }}>
                      {entry.dateStr}{entry.time ? ` · ${entry.time}` : ''}
                    </div>
                  </div>
                  <DiaryTypeBadge type={entry.type}/>
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.55 }}>
              Фиксируй моменты когда схемы активируются — это главная практика
            </div>
          )}

          <div style={{ paddingTop: 10, marginTop: 2, borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowDiaryTask(true); }}
              style={{ background: 'none', border: 'none', padding: 0,
                fontSize: 12, color: 'var(--accent)', cursor: 'pointer',
                fontWeight: 500, fontFamily: 'inherit' }}>
              + Поставить цель на дневник
            </button>
          </div>
        </div>

      </div>

      {showDiaryTask && (
        <TaskCreateSheet
          defaultType="diary_streak"
          onCreated={() => setShowDiaryTask(false)}
          onClose={() => setShowDiaryTask(false)}
        />
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonLines() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[80, 65, 90].map((w, i) => (
        <div key={i} style={{
          height: 12, borderRadius: 6, width: `${w}%`,
          background: 'linear-gradient(90deg, var(--surface) 25%, var(--surface-2) 50%, var(--surface) 75%)',
          backgroundSize: '200% auto',
          animation: 'shimmer 1.5s linear infinite',
        }}/>
      ))}
    </div>
  );
}

// ── Onboarding widget (unchanged logic, new visual) ───────────────────────────

const ONBOARDING_DONE_KEY    = 'onboarding_done';
const ONBOARDING_SKIPPED_KEY = 'onboarding_skipped';

interface StepDef {
  id: string;
  emoji: string;
  title: string;
  description: string;
  actionLabel: string;
  isDone: (profile: UserProfile | null, ctx?: { hasSchemas: boolean }) => boolean;
}

const STEPS: StepDef[] = [
  { id: 'ysq',      emoji: '🧪', title: 'Пройди YSQ-тест',           actionLabel: 'Начать тест',
    description: 'Узнай какие схемы активны именно у тебя — это основа всей работы в приложении',
    isDone: (p, ctx) => !!(p?.ysq.completedAt) || !!(ctx?.hasSchemas) },
  { id: 'tracker',  emoji: '📅', title: 'Оцени потребности сегодня', actionLabel: 'Перейти в трекер',
    description: 'Посмотри на свой день через пять ключевых потребностей — займёт 2 минуты',
    isDone: p => !!(p?.lastActivity.needsTracker) },
  { id: 'diary',    emoji: '📔', title: 'Сделай первую запись',       actionLabel: 'Открыть дневник',
    description: 'Зафикси момент когда схема сработала. Это главная практика схема-терапии',
    isDone: p => !!(p?.lastActivity.schemaDiary || p?.lastActivity.modeDiary || p?.lastActivity.gratitudeDiary) },
  { id: 'notify',   emoji: '🔔', title: 'Включи напоминание',         actionLabel: 'Настроить',
    description: 'Без регулярности привычка не формируется. Одно уведомление в день — всё что нужно',
    isDone: p => !!(p?.notifications.enabled) },
  { id: 'childhood',emoji: '🌀', title: 'Исследуй колесо детства',    actionLabel: 'Открыть',
    description: 'Оцени как удовлетворялись потребности в детстве — откуда пришли твои паттерны',
    isDone: () => !!localStorage.getItem('childhood_wheel_done') },
];

function OnboardingWidget({ profile, hasSchemas, onOpenSchema, onOpenAdvanced, onOpenTracker, onOpenDiaries, onOpenChildhoodWheel }: {
  profile: UserProfile | null;
  hasSchemas: boolean;
  onOpenSchema: Props['onOpenSchema'];
  onOpenAdvanced: Props['onOpenAdvanced'];
  onOpenTracker: Props['onOpenTracker'];
  onOpenDiaries: Props['onOpenDiaries'];
  onOpenChildhoodWheel: Props['onOpenChildhoodWheel'];
}) {
  const [skipped, setSkipped] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(ONBOARDING_SKIPPED_KEY) ?? '[]'); } catch { return []; }
  });
  const [done, setDone] = useState(() => !!localStorage.getItem(ONBOARDING_DONE_KEY));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (done || profile === null) return null;

  const ctx = { hasSchemas };
  const autoStep = STEPS.find(s => !s.isDone(profile, ctx) && !skipped.includes(s.id));
  if (!autoStep) {
    if (!localStorage.getItem(ONBOARDING_DONE_KEY)) {
      localStorage.setItem(ONBOARDING_DONE_KEY, '1');
      setDone(true);
    }
    return null;
  }

  const current = (selectedId ? STEPS.find(s => s.id === selectedId) : null) ?? autoStep;
  const isCurrentDone    = current.isDone(profile, ctx);
  const isCurrentSkipped = skipped.includes(current.id) && !isCurrentDone;

  function handleAction() {
    switch (current.id) {
      case 'ysq':       onOpenSchema({ startTest: true }); break;
      case 'tracker':   onOpenTracker(); break;
      case 'diary':     onOpenDiaries(); break;
      case 'notify':    onOpenAdvanced(); break;
      case 'childhood': onOpenChildhoodWheel(); break;
    }
    setSelectedId(null);
  }

  function handleSkip() {
    const next = [...skipped, current.id];
    localStorage.setItem(ONBOARDING_SKIPPED_KEY, JSON.stringify(next));
    setSkipped(next);
    setSelectedId(null);
  }

  return (
    <div style={{
      background: 'rgba(var(--fg-rgb),0.04)',
      border: '1px solid rgba(var(--fg-rgb),0.08)',
      borderRadius: 20, padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
          С чего начать
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {STEPS.map(s => {
            const d = s.isDone(profile, ctx);
            const sk = skipped.includes(s.id) && !d;
            const cur = s.id === current.id;
            return (
              <div key={s.id} onClick={() => setSelectedId(s.id === current.id ? null : s.id)} style={{
                width: cur ? 18 : 8, height: 8, borderRadius: 4, cursor: 'pointer',
                background: d ? 'rgba(74,222,128,0.6)' : sk ? 'rgba(255,180,0,0.35)' : cur ? 'var(--accent)' : 'var(--surface-2)',
                transition: 'all 0.3s ease',
              }}/>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: 26, marginBottom: 6 }}>{current.emoji}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: 6 }}>
        {current.title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.55, marginBottom: 14 }}>
        {current.description}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {isCurrentDone ? (
          <div style={{ flex: 1, padding: '11px 0', borderRadius: 12, textAlign: 'center',
            background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)',
            fontSize: 13, fontWeight: 600, color: 'rgba(74,222,128,0.9)' }}>
            ✓ Выполнено
          </div>
        ) : (
          <button onClick={handleAction} style={{
            flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', fontFamily: 'inherit',
            background: 'linear-gradient(135deg, var(--accent), #60a5fa)',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            {current.actionLabel} →
          </button>
        )}
        {!isCurrentDone && (
          <button onClick={handleSkip} style={{
            padding: '11px 14px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
            background: 'var(--surface-2)',
            color: isCurrentSkipped ? 'var(--accent)' : 'var(--text-faint)',
            fontSize: 13, cursor: 'pointer',
          }}>
            {isCurrentSkipped ? 'Вернуть' : 'Позже'}
          </button>
        )}
      </div>
    </div>
  );
}
