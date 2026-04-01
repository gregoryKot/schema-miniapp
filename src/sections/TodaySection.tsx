import { useEffect, useState } from 'react';
import { Need, UserProfile, COLORS } from '../types';
import { api } from '../api';
import { Section } from '../components/BottomNav';
import { getTelegramSafeTop } from '../utils/safezone';
import { MY_SCHEMA_IDS_KEY, MY_MODE_IDS_KEY } from '../utils/storageKeys';

export { MY_SCHEMA_IDS_KEY, MY_MODE_IDS_KEY };

interface Props {
  needs: Need[];
  ratings: Record<string, number>;
  onNavigate: (s: Section) => void;
  onOpenSchema: (opts?: { startTest?: boolean; tab?: 'needs'|'schemas'|'modes'; highlight?: string }) => void;
  onOpenAdvanced: () => void;
  onOpenTracker: () => void;
  onOpenDiaries: () => void;
  onOpenChildhoodWheel: () => void;
  refreshKey?: number;
}

function formatGreetingDate(): string {
  const now = new Date();
  const dow = now.toLocaleDateString('ru-RU', { weekday: 'long' });
  const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${dow[0].toUpperCase()}${dow.slice(1)}, ${date}`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function readLocalIds(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

export function TodaySection({ needs, ratings, onNavigate, onOpenSchema, onOpenAdvanced, onOpenTracker, onOpenDiaries, onOpenChildhoodWheel, refreshKey }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [manualSchemaIds, setManualSchemaIds] = useState<string[]>(() => readLocalIds(MY_SCHEMA_IDS_KEY));
  const [recentDiaries, setRecentDiaries] = useState<Array<{ type: string; emoji: string; label: string; date: string }>>([]);
  const [diariesLoaded, setDiariesLoaded] = useState(false);

  useEffect(() => {
    setProfile(null);
    setDiariesLoaded(false);

    api.getProfile().then(p => {
      setProfile(p);
      if (p.mySchemaIds.length > 0) {
        setManualSchemaIds(p.mySchemaIds);
        localStorage.setItem(MY_SCHEMA_IDS_KEY, JSON.stringify(p.mySchemaIds));
      }
      if (p.myModeIds.length > 0) {
        localStorage.setItem(MY_MODE_IDS_KEY, JSON.stringify(p.myModeIds));
      }
    }).catch(() => {});

    // Load recent diary entries
    Promise.all([api.getSchemaDiary(), api.getModeDiary(), api.getGratitudeDiary()])
      .then(([schema, mode, gratitude]) => {
        const all: Array<{ type: string; emoji: string; label: string; date: string }> = [
          ...schema.slice(0, 3).map(e => ({ type: 'schema', emoji: '📓', label: e.trigger.slice(0, 40), date: e.createdAt })),
          ...mode.slice(0, 3).map(e => ({ type: 'mode', emoji: '🔄', label: e.situation.slice(0, 40), date: e.createdAt })),
          ...gratitude.slice(0, 3).map(e => ({ type: 'gratitude', emoji: '🌱', label: e.items[0]?.slice(0, 40) ?? 'Благодарность', date: e.date })),
        ];
        all.sort((a, b) => b.date.localeCompare(a.date));
        setRecentDiaries(all.slice(0, 4));
      }).catch(() => {}).finally(() => setDiariesLoaded(true));
  }, [refreshKey]);

  const firstName = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.first_name ?? '';
  const streak = profile?.streak ?? 0;
  const ratedCount = needs.filter(n => ratings[n.id] !== undefined).length;
  const allRated = needs.length > 0 && ratedCount === needs.length;
  const hasSchemas = [...new Set([...(profile?.ysq.activeSchemaIds ?? []), ...manualSchemaIds])].length > 0;
  const safeTop = getTelegramSafeTop();

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 140, paddingTop: safeTop, animation: 'fade-in 0.25s ease' }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: 6, letterSpacing: '0.02em' }}>
          {formatGreetingDate()}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
          {firstName ? `Привет, ${firstName}` : 'Добро пожаловать'}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── Онбординг ── */}
        <OnboardingWidget
          profile={profile}
          hasSchemas={hasSchemas}
          onOpenSchema={onOpenSchema}
          onNavigate={onNavigate}
          onOpenAdvanced={onOpenAdvanced}
          onOpenTracker={onOpenTracker}
          onOpenChildhoodWheel={onOpenChildhoodWheel}
          onOpenDiaries={onOpenDiaries}
        />

        {/* ── Streak + Tracker ── */}
        <div style={{ display: 'flex', gap: 10, animation: 'slide-up 0.3s ease 0.08s both' }}>
          {/* Streak badge */}
          <div
            style={{
              width: 110, flexShrink: 0,
              background: profile === null ? 'rgba(255,255,255,0.03)' : streak > 0 ? 'linear-gradient(145deg, rgba(251,146,60,0.15), rgba(251,146,60,0.06))' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${profile !== null && streak > 0 ? 'rgba(251,146,60,0.3)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 20, padding: '16px 14px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
            {profile === null ? (
              <>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)', backgroundSize: '200% auto', animation: 'shimmer 1.5s linear infinite' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ width: '70%', height: 28, borderRadius: 6, background: 'linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)', backgroundSize: '200% auto', animation: 'shimmer 1.5s linear infinite' }} />
                  <div style={{ width: '50%', height: 10, borderRadius: 4, background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)', backgroundSize: '200% auto', animation: 'shimmer 1.5s linear infinite' }} />
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 28 }}>{streak > 7 ? '🔥' : streak > 0 ? '✨' : '💤'}</div>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1, color: streak > 0 ? '#fb923c' : 'rgba(255,255,255,0.3)' }}>{streak}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: 500 }}>
                    {plural(streak, 'день', 'дня', 'дней')}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tracker button */}
          <div onClick={onOpenTracker} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '16px 14px', cursor: 'pointer' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
              {allRated ? 'Готово сегодня ✓' : `${ratedCount} из ${needs.length}`}
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {needs.map((need, idx) => {
                const val = ratings[need.id];
                const color = COLORS[need.id] ?? '#888';
                const filled = val !== undefined;
                return (
                  <div key={need.id} style={{ flex: 1, animation: `slide-up 0.3s ease ${0.08 + idx * 0.04}s both` }}>
                    <div style={{ width: '100%', height: 44, borderRadius: 8, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: `1px solid ${filled ? `${color}40` : 'rgba(255,255,255,0.08)'}` }}>
                      {filled && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(val / 10) * 100}%`, background: `linear-gradient(to top, ${color}66, ${color}22)`, transition: 'height 0.4s ease' }} />
                      )}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: filled ? 13 : 16, fontWeight: 700, color: filled ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                        {filled ? val : need.emoji}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Последние записи дневника ── */}
        <div
          onClick={onOpenDiaries}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '16px 18px',
            animation: 'pop-in 0.3s ease 0.12s both',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: recentDiaries.length > 0 || !diariesLoaded ? 12 : 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Дневник
            </div>
            {diariesLoaded && (
              <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 500 }}>
                {recentDiaries.length > 0 ? 'Все записи →' : 'Открыть →'}
              </div>
            )}
          </div>

          {!diariesLoaded ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[80, 65, 90].map((w, i) => (
                <div key={i} style={{ height: 12, borderRadius: 6, width: `${w}%`, background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)', backgroundSize: '200% auto', animation: 'shimmer 1.5s linear infinite' }} />
              ))}
            </div>
          ) : recentDiaries.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentDiaries.map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{entry.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              Фиксируй моменты когда схемы активируются — это главная практика
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Onboarding widget ─────────────────────────────────────────────────────────

const ONBOARDING_DONE_KEY    = 'onboarding_done';
const ONBOARDING_SKIPPED_KEY = 'onboarding_skipped';

interface StepContext { hasSchemas: boolean }
interface StepDef {
  id: string;
  emoji: string;
  title: string;
  description: string;
  actionLabel: string;
  canSkip: boolean;
  isDone: (profile: UserProfile | null, ctx?: StepContext) => boolean;
}

const STEPS: StepDef[] = [
  {
    id: 'ysq',
    emoji: '🧪',
    title: 'Пройди YSQ-тест',
    description: 'Узнай какие схемы активны именно у тебя — это основа всей работы в приложении',
    actionLabel: 'Начать тест',
    canSkip: false,
    isDone: (p, ctx) => !!(p?.ysq.completedAt) || !!(ctx?.hasSchemas),
  },
  {
    id: 'tracker',
    emoji: '📅',
    title: 'Оцени потребности сегодня',
    description: 'Посмотри на свой день через пять ключевых потребностей — займёт 2 минуты',
    actionLabel: 'Перейти в трекер',
    canSkip: false,
    isDone: (p) => !!(p?.lastActivity.needsTracker),
  },
  {
    id: 'diary',
    emoji: '📔',
    title: 'Сделай первую запись в дневнике',
    description: 'Зафикси момент когда схема сработала. Это главная практика схема-терапии',
    actionLabel: 'Открыть дневник',
    canSkip: false,
    isDone: (p) => !!(p?.lastActivity.schemaDiary || p?.lastActivity.modeDiary || p?.lastActivity.gratitudeDiary),
  },
  {
    id: 'notify',
    emoji: '🔔',
    title: 'Включи ежедневное напоминание',
    description: 'Без регулярности привычка не формируется. Одно уведомление в день — всё что нужно',
    actionLabel: 'Настроить',
    canSkip: true,
    isDone: (p) => !!(p?.notifications.enabled),
  },
  {
    id: 'childhood',
    emoji: '🌀',
    title: 'Исследуй колесо детства',
    description: 'Откуда пришли твои паттерны — оцени как удовлетворялись потребности в детстве',
    actionLabel: 'Открыть',
    canSkip: true,
    isDone: () => !!localStorage.getItem('childhood_wheel_done'),
  },
];

function OnboardingWidget({ profile, hasSchemas, onOpenSchema, onNavigate, onOpenAdvanced, onOpenTracker, onOpenDiaries, onOpenChildhoodWheel }: {
  profile: UserProfile | null;
  hasSchemas: boolean;
  onOpenSchema: Props['onOpenSchema'];
  onNavigate: Props['onNavigate'];
  onOpenAdvanced: Props['onOpenAdvanced'];
  onOpenTracker: Props['onOpenTracker'];
  onOpenDiaries: Props['onOpenDiaries'];
  onOpenChildhoodWheel: Props['onOpenChildhoodWheel'];
}) {
  const [skipped, setSkipped] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(ONBOARDING_SKIPPED_KEY) ?? '[]'); } catch { return []; }
  });
  const [done, setDone] = useState(() => !!localStorage.getItem(ONBOARDING_DONE_KEY));

  if (done) return null;

  const ctx: StepContext = { hasSchemas };
  const current = STEPS.find(s => !s.isDone(profile, ctx) && !skipped.includes(s.id));

  if (!current) {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1');
    setDone(true);
    return null;
  }

  const resolved = STEPS.filter(s => s.isDone(profile, ctx) || skipped.includes(s.id)).length;
  const total = STEPS.length;

  function handleSkip() {
    const next = [...skipped, current!.id];
    localStorage.setItem(ONBOARDING_SKIPPED_KEY, JSON.stringify(next));
    setSkipped(next);
  }

  function handleAction() {
    switch (current!.id) {
      case 'ysq':      onOpenSchema({ startTest: true }); break;
      case 'tracker':  onOpenTracker(); break;
      case 'diary':    onOpenDiaries(); break;
      case 'notify':   onOpenAdvanced(); break;
      case 'childhood': onOpenChildhoodWheel(); break;
    }
  }

  return (
    <div style={{
      borderRadius: 20, padding: '16px 18px',
      background: 'linear-gradient(135deg, rgba(167,139,250,0.09) 0%, rgba(96,165,250,0.05) 100%)',
      border: '1px solid rgba(167,139,250,0.22)',
      animation: 'pop-in 0.3s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.6)' }}>
          С ЧЕГО НАЧАТЬ
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {STEPS.map((s) => {
            const isResolved = s.isDone(profile, ctx) || skipped.includes(s.id);
            const isCurrent  = s.id === current.id;
            return (
              <div key={s.id} style={{
                width: isCurrent ? 18 : 8, height: 8, borderRadius: 4,
                background: isResolved ? 'rgba(52,211,153,0.6)' : isCurrent ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                transition: 'all 0.3s ease',
              }} />
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: 28, marginBottom: 6 }}>{current.emoji}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>
        {current.title}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, marginBottom: 16 }}>
        {current.description}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={handleAction}
          style={{
            flex: 1, padding: '11px 0', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {current.actionLabel} →
        </button>
        {current.canSkip && (
          <button
            onClick={handleSkip}
            style={{
              padding: '11px 14px', borderRadius: 12, border: 'none',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer',
            }}
          >
            Не сейчас
          </button>
        )}
      </div>
      {!current.canSkip && resolved > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
          {resolved} из {total} шагов выполнено
        </div>
      )}
    </div>
  );
}
