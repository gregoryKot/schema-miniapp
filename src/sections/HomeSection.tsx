import { useEffect, useState } from 'react';
import { Need, UserProfile, COLORS } from '../types';
import { api } from '../api';
import { Section } from '../components/BottomNav';
import { SCHEMA_DOMAINS, MODE_GROUPS, ALL_MODES } from '../diaryData';
import { getTelegramSafeTop } from '../utils/safezone';
import { YSQ_PROGRESS_KEY, YSQ_RESULT_KEY } from '../components/YSQTestSheet';
import { SchemaPickerSheet } from '../components/SchemaPickerSheet';
import { ModeIntroSheet } from '../components/ModeIntroSheet';

export const MY_SCHEMA_IDS_KEY = 'my_schema_ids';
export const MY_MODE_IDS_KEY = 'my_mode_ids';

interface Props {
  needs: Need[];
  ratings: Record<string, number>;
  onNavigate: (s: Section) => void;
  onOpenSchema: (opts?: { startTest?: boolean; tab?: 'needs'|'schemas'|'modes'; highlight?: string }) => void;
  onOpenAdvanced: () => void;
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

const ALL_SCHEMAS = SCHEMA_DOMAINS.flatMap(d => d.schemas.map(s => ({ ...s, domainColor: d.color })));

function readLocalIds(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

export function HomeSection({ needs, ratings, onNavigate, onOpenSchema, onOpenAdvanced }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [manualSchemaIds, setManualSchemaIds] = useState<string[]>(() => readLocalIds(MY_SCHEMA_IDS_KEY));
  const [myModeIds, setMyModeIds] = useState<string[]>(() => readLocalIds(MY_MODE_IDS_KEY));
  const [showSchemaPicker, setShowSchemaPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [introModeId, setIntroModeId] = useState<string | null>(null);

  useEffect(() => {
    api.getProfile().then(p => {
      setProfile(p);
      // Sync server → local (server is source of truth cross-device)
      if (p.mySchemaIds.length > 0) {
        setManualSchemaIds(p.mySchemaIds);
        localStorage.setItem(MY_SCHEMA_IDS_KEY, JSON.stringify(p.mySchemaIds));
      }
      if (p.myModeIds.length > 0) {
        setMyModeIds(p.myModeIds);
        localStorage.setItem(MY_MODE_IDS_KEY, JSON.stringify(p.myModeIds));
      }
    }).catch(() => {});
  }, []);

  const firstName = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.first_name ?? '';
  const streak = profile?.streak ?? 0;
  const ratedCount = needs.filter(n => ratings[n.id] !== undefined).length;
  const allRated = needs.length > 0 && ratedCount === needs.length;

  const ysqDone = !!(profile?.ysq.completedAt ?? localStorage.getItem(YSQ_RESULT_KEY));
  const ysqInProgress = !ysqDone && !!localStorage.getItem(YSQ_PROGRESS_KEY);

  // Merge YSQ + manual schemas, deduplicated
  const ysqSchemaIds = profile?.ysq.activeSchemaIds ?? [];
  const allSchemaIds = [...new Set([...ysqSchemaIds, ...manualSchemaIds])];
  const activeSchemas = allSchemaIds
    .map(id => ALL_SCHEMAS.find(s => s.id === id))
    .filter(Boolean) as { id: string; name: string; domainColor: string }[];

  const myModes = myModeIds
    .map(id => ALL_MODES.find(m => m.id === id))
    .filter(Boolean) as typeof ALL_MODES;

  function saveSchemas(ids: string[]) {
    localStorage.setItem(MY_SCHEMA_IDS_KEY, JSON.stringify(ids));
    setManualSchemaIds(ids);
    api.updateSettings({ mySchemaIds: ids }).catch(() => {});
  }

  function toggleMode(id: string) {
    const next = myModeIds.includes(id)
      ? myModeIds.filter(x => x !== id)
      : [...myModeIds, id];
    localStorage.setItem(MY_MODE_IDS_KEY, JSON.stringify(next));
    setMyModeIds(next);
    api.updateSettings({ myModeIds: next }).catch(() => {});
  }

  const hasSchemas = activeSchemas.length > 0;
  const hasModes = myModes.length > 0;
  const safeTop = getTelegramSafeTop();

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 80, paddingTop: safeTop, animation: 'fade-in 0.25s ease' }}>

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
          onOpenSchema={onOpenSchema}
          onNavigate={onNavigate}
          onOpenAdvanced={onOpenAdvanced}
        />

        {/* ── МОИ СХЕМЫ ── */}
        <div style={{
          background: hasSchemas ? 'rgba(167,139,250,0.05)' : 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(96,165,250,0.06))',
          border: `1px solid ${hasSchemas ? 'rgba(167,139,250,0.12)' : 'rgba(167,139,250,0.22)'}`,
          borderRadius: 20, padding: '16px 18px',
          animation: 'pop-in 0.3s ease both',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasSchemas ? 12 : 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(167,139,250,0.7)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Мои схемы
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div onClick={() => setShowSchemaPicker(true)} style={{ fontSize: 12, color: '#a78bfa', cursor: 'pointer', fontWeight: 500 }}>
                {hasSchemas ? 'Изменить' : 'Выбрать'}
              </div>
              {ysqDone && (
                <div onClick={() => onOpenSchema({ tab: 'schemas' })} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                  Тест →
                </div>
              )}
            </div>
          </div>

          {hasSchemas ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {activeSchemas.map(s => (
                <span key={s.id} onClick={() => onOpenSchema({ tab: 'schemas', highlight: s.name })} style={{
                  fontSize: 12, borderRadius: 10, padding: '5px 11px',
                  background: `${s.domainColor}15`, border: `1px solid ${s.domainColor}30`,
                  color: s.domainColor, fontWeight: 500, cursor: 'pointer',
                }}>{s.name}</span>
              ))}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>
                Узнай свои схемы
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 16 }}>
                Схемы — устойчивые паттерны мышления и поведения из детства. Они влияют на то, как ты реагируешь сегодня.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onOpenSchema({ startTest: true })} style={{
                  flex: 1, padding: '12px 0', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>
                  {ysqInProgress ? 'Продолжить тест' : 'Пройти YSQ-тест'}
                </button>
                <button onClick={() => onOpenSchema({ tab: 'schemas' })} style={{
                  padding: '12px 16px', borderRadius: 14,
                  border: '1px solid rgba(167,139,250,0.25)',
                  background: 'rgba(167,139,250,0.08)',
                  color: '#a78bfa', fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  Читать
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── МОИ РЕЖИМЫ ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '16px 18px',
          animation: 'pop-in 0.3s ease 0.04s both',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasModes ? 12 : 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Мои режимы
            </div>
            <div onClick={() => setShowModePicker(true)} style={{ fontSize: 12, color: '#a78bfa', cursor: 'pointer', fontWeight: 500 }}>
              {hasModes ? 'Изменить' : 'Добавить'}
            </div>
          </div>

          {hasModes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myModes.map(m => {
                const introSaved = !!localStorage.getItem(`mode_intro_${m.id}`);
                return (
                  <div
                    key={m.id}
                    onClick={() => setIntroModeId(m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 14, cursor: 'pointer',
                      background: `${m.groupColor}0d`, border: `1px solid ${m.groupColor}20`,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{m.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: introSaved ? m.groupColor : 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                        {introSaved ? 'Заполнено' : 'Познакомиться →'}
                      </div>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>›</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 8, lineHeight: 1.5 }}>
              Добавь режимы, которые тебе близки — и познакомься с каждым
            </div>
          )}
        </div>

        {/* ── Streak + Today's needs ── */}
        <div style={{ display: 'flex', gap: 10, animation: 'slide-up 0.3s ease 0.08s both' }}>
          <div
            onClick={() => onNavigate('profile')}
            style={{
              width: 110, flexShrink: 0,
              background: streak > 0 ? 'linear-gradient(145deg, rgba(251,146,60,0.15), rgba(251,146,60,0.06))' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${streak > 0 ? 'rgba(251,146,60,0.3)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 20, padding: '16px 14px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
            <div style={{ fontSize: 28 }}>{streak > 7 ? '🔥' : streak > 0 ? '✨' : '💤'}</div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1, color: streak > 0 ? '#fb923c' : 'rgba(255,255,255,0.3)' }}>{streak}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: 500 }}>
                {plural(streak, 'день', 'дня', 'дней')}
              </div>
            </div>
          </div>

          <div onClick={() => onNavigate('tracker')} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '16px 14px', cursor: 'pointer' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
              {allRated ? 'Готово сегодня' : `${ratedCount} из ${needs.length}`}
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

      </div>

      {/* ── Mode picker sheet ── */}
      {showModePicker && (
        <ModePickerSheet
          selected={myModeIds}
          onSave={ids => { localStorage.setItem(MY_MODE_IDS_KEY, JSON.stringify(ids)); setMyModeIds(ids); api.updateSettings({ myModeIds: ids }).catch(() => {}); }}
          onClose={() => setShowModePicker(false)}
        />
      )}

      {/* ── Schema picker sheet ── */}
      {showSchemaPicker && (
        <SchemaPickerSheet
          selected={manualSchemaIds}
          onSave={saveSchemas}
          onClose={() => setShowSchemaPicker(false)}
        />
      )}

      {/* ── Mode intro exercise ── */}
      {introModeId && (
        <ModeIntroSheet modeId={introModeId} onClose={() => setIntroModeId(null)} />
      )}
    </div>
  );
}

// ── Onboarding widget ─────────────────────────────────────────────────────────

const ONBOARDING_DONE_KEY    = 'onboarding_done';
const ONBOARDING_SKIPPED_KEY = 'onboarding_skipped';

interface StepDef {
  id: string;
  emoji: string;
  title: string;
  description: string;
  actionLabel: string;
  canSkip: boolean;
  isDone: (profile: ReturnType<typeof useState<import('../types').UserProfile | null>>[0]) => boolean;
}

const STEPS: StepDef[] = [
  {
    id: 'ysq',
    emoji: '🧪',
    title: 'Пройди YSQ-тест',
    description: 'Узнай какие схемы активны именно у тебя — это основа всей работы в приложении',
    actionLabel: 'Начать тест',
    canSkip: false,
    isDone: (p) => !!(p?.ysq.completedAt),
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

function OnboardingWidget({ profile, onOpenSchema, onNavigate, onOpenAdvanced }: {
  profile: import('../types').UserProfile | null;
  onOpenSchema: Props['onOpenSchema'];
  onNavigate: Props['onNavigate'];
  onOpenAdvanced: Props['onOpenAdvanced'];
}) {
  const [skipped, setSkipped] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(ONBOARDING_SKIPPED_KEY) ?? '[]'); } catch { return []; }
  });
  const [done, setDone] = useState(() => !!localStorage.getItem(ONBOARDING_DONE_KEY));

  if (done) return null;

  // Find the current step: first step that is not done and not skipped
  const current = STEPS.find(s => !s.isDone(profile) && !skipped.includes(s.id));

  // If no pending step — all done/skipped
  if (!current) {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1');
    setDone(true);
    return null;
  }

  // Progress: how many steps are resolved (done OR skipped)
  const resolved = STEPS.filter(s => s.isDone(profile) || skipped.includes(s.id)).length;
  const total = STEPS.length;

  function handleSkip() {
    const next = [...skipped, current!.id];
    localStorage.setItem(ONBOARDING_SKIPPED_KEY, JSON.stringify(next));
    setSkipped(next);
  }

  function handleAction() {
    switch (current!.id) {
      case 'ysq':      onOpenSchema({ startTest: true }); break;
      case 'tracker':  onNavigate('tracker'); break;
      case 'diary':    onNavigate('diaries'); break;
      case 'notify':   onOpenAdvanced(); break;
      case 'childhood': onOpenAdvanced(); break;
    }
  }

  return (
    <div style={{
      borderRadius: 20, padding: '16px 18px',
      background: 'linear-gradient(135deg, rgba(167,139,250,0.09) 0%, rgba(96,165,250,0.05) 100%)',
      border: '1px solid rgba(167,139,250,0.22)',
      animation: 'pop-in 0.3s ease both',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.6)' }}>
          С ЧЕГО НАЧАТЬ
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5 }}>
          {STEPS.map((s, i) => {
            const isResolved = s.isDone(profile) || skipped.includes(s.id);
            const isCurrent  = s.id === current.id;
            return (
              <div key={s.id} style={{
                width: isCurrent ? 18 : 8, height: 8, borderRadius: 4,
                background: isResolved
                  ? 'rgba(52,211,153,0.6)'
                  : isCurrent ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                transition: 'all 0.3s ease',
              }} />
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div style={{ fontSize: 28, marginBottom: 6 }}>{current.emoji}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>
        {current.title}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, marginBottom: 16 }}>
        {current.description}
      </div>

      {/* Buttons */}
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

// ── Mode picker (inline, only used here) ──────────────────────────────────────
import { BottomSheet } from '../components/BottomSheet';

function ModePickerSheet({ selected, onSave, onClose }: { selected: string[]; onSave: (ids: string[]) => void; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>(selected);
  const toggle = (id: string) => setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Мои режимы</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.5 }}>
          Выбери режимы, которые ты замечаешь у себя. Потом можно познакомиться с каждым.
        </div>

        {MODE_GROUPS.map(group => (
          <div key={group.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: group.color, marginBottom: 8, opacity: 0.8 }}>
              {group.group}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {group.items.map(m => {
                const active = ids.includes(m.id);
                return (
                  <div key={m.id} onClick={() => toggle(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, cursor: 'pointer', background: active ? `${group.color}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? `${group.color}30` : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 18 }}>{m.emoji}</span>
                    <span style={{ fontSize: 14, color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: active ? 500 : 400, flex: 1 }}>{m.name}</span>
                    {active && <span style={{ color: group.color, fontSize: 14 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button onClick={() => { onSave(ids); onClose(); }} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
          Сохранить{ids.length > 0 ? ` (${ids.length})` : ''}
        </button>
      </div>
    </BottomSheet>
  );
}
