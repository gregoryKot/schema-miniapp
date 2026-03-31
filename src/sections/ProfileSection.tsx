import { useEffect, useState } from 'react';
import { api, UserSettings, StreakData, Achievement, PairsData } from '../api';
import { getTelegramSafeTop } from '../utils/safezone';
import { UserProfile } from '../types';

export const DEFAULT_SECTION_KEY = 'default_section';

function pad(n: number) { return String(n).padStart(2, '0'); }

const TIMEZONES = [
  { label: 'Лос-Анджелес (UTC−8)', iana: 'America/Los_Angeles' },
  { label: 'Нью-Йорк (UTC−5)',      iana: 'America/New_York' },
  { label: 'Лондон (UTC+0)',         iana: 'Europe/London' },
  { label: 'Берлин (UTC+1)',         iana: 'Europe/Berlin' },
  { label: 'Киев / Израиль (UTC+2)', iana: 'Europe/Kyiv' },
  { label: 'Москва (UTC+3)',         iana: 'Europe/Moscow' },
  { label: 'Дубай (UTC+4)',          iana: 'Asia/Dubai' },
  { label: 'Ташкент (UTC+5)',        iana: 'Asia/Tashkent' },
  { label: 'Алматы (UTC+6)',         iana: 'Asia/Almaty' },
  { label: 'Пекин (UTC+8)',          iana: 'Asia/Shanghai' },
];

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

type SectionId = 'home' | 'tracker' | 'diaries';
const SCREENS: { id: SectionId; label: string; emoji: string }[] = [
  { id: 'home',    label: 'Главная',     emoji: '🏠' },
  { id: 'tracker', label: 'Потребности', emoji: '🎯' },
  { id: 'diaries', label: 'Дневники',    emoji: '📔' },
];

// ── Roadmap ──────────────────────────────────────────────────────────────────

const ROADMAP = [
  { id: 'registered',   emoji: '🌱', title: 'Зарегистрировался',       hint: 'Первый шаг сделан',                xp: 10  },
  { id: 'ysq',          emoji: '🧪', title: 'Прошёл YSQ-тест',         hint: 'Узнал свои схемы',                 xp: 30  },
  { id: 'tracker_day1', emoji: '📅', title: 'Первый день трекера',      hint: 'Оценил потребности',               xp: 20  },
  { id: 'diary_entry',  emoji: '📔', title: 'Первая запись в дневнике', hint: 'Исследовал схему или режим',       xp: 20  },
  { id: 'streak_3',     emoji: '🔥', title: '3 дня подряд',             hint: 'Привычка начинает формироваться',  xp: 30  },
  { id: 'childhood',    emoji: '🌀', title: 'Колесо детства',           hint: 'Исследовал прошлое',               xp: 25  },
  { id: 'streak_7',     emoji: '⭐', title: 'Неделя подряд',            hint: 'Это уже не случайность',           xp: 50  },
  { id: 'partner',      emoji: '🤝', title: 'Партнёр подключён',        hint: 'Вы идёте вместе',                  xp: 40  },
  { id: 'streak_30',    emoji: '🏆', title: '30 дней подряд',           hint: 'Ты — мастер наблюдения',           xp: 100 },
] as const;

const TOTAL_XP = ROADMAP.reduce((s, r) => s + r.xp, 0);

function computeDone(id: string, profile: UserProfile | null, totalDays: number, achievements: Achievement[]): boolean {
  const earned = (aid: string) => achievements.some(a => a.id === aid && a.earned);
  const la = profile?.lastActivity;
  switch (id) {
    case 'registered':   return true;
    case 'ysq':          return !!(profile?.ysq.completedAt);
    case 'tracker_day1': return totalDays >= 1;
    case 'diary_entry':  return !!(la?.schemaDiary || la?.modeDiary || la?.gratitudeDiary);
    case 'streak_3':     return earned('streak_3');
    case 'childhood':    return !!localStorage.getItem('childhood_wheel_done');
    case 'streak_7':     return earned('streak_7');
    case 'partner':      return earned('pair_connected');
    case 'streak_30':    return earned('streak_30');
    default:             return false;
  }
}

// ── Achievement display ────────────────────────────────────────────────────

const ACHIEVEMENT_META: Record<string, { emoji: string; title: string }> = {
  first_day:      { emoji: '🌱', title: 'Первый шаг' },
  streak_3:       { emoji: '🔥', title: '3 дня' },
  streak_7:       { emoji: '⭐', title: 'Неделя' },
  streak_14:      { emoji: '💫', title: 'Две недели' },
  streak_30:      { emoji: '🏆', title: 'Месяц' },
  streak_100:     { emoji: '👑', title: 'Сотня' },
  total_10:       { emoji: '📅', title: '10 дней' },
  total_50:       { emoji: '📆', title: '50 дней' },
  high_day:       { emoji: '✨', title: 'Хороший день' },
  all_above7:     { emoji: '🎯', title: 'Баланс' },
  comeback:       { emoji: '🔄', title: 'Возвращение' },
  growth:         { emoji: '📈', title: 'Рост' },
  pair_connected: { emoji: '🤝', title: 'Партнёр' },
};

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  onOpenAdvanced: () => void;
}

export function ProfileSection({ onOpenAdvanced }: Props) {
  const firstName = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.first_name ?? '';
  const safeTop = getTelegramSafeTop();

  const [settings, setSettings]       = useState<UserSettings | null>(null);
  const [streak, setStreak]           = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pairData, setPairData]       = useState<PairsData | null>(null);
  const [profile, setProfile]         = useState<UserProfile | null>(null);

  const [pairLoading, setPairLoading] = useState(false);
  const [joinCode, setJoinCode]       = useState('');
  const [joinView, setJoinView]       = useState<'hidden' | 'input'>('hidden');
  const [inviteUrl, setInviteUrl]     = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showTzPicker, setShowTzPicker] = useState(false);

  const [defaultSection, setDefaultSection] = useState<SectionId>(() => {
    const s = localStorage.getItem(DEFAULT_SECTION_KEY);
    if (s === 'tracker' || s === 'diaries') return s;
    return 'home';
  });

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() =>
      setSettings({ notifyEnabled: false, notifyLocalHour: 21, notifyTimezone: 'Europe/Moscow', notifyReminderEnabled: false, pairCardDismissed: false, mySchemaIds: [], myModeIds: [] })
    );
    api.getStreak().then(setStreak).catch(() => {});
    api.getAchievements().then(setAchievements).catch(() => {});
    api.getPair().then(setPairData).catch(() => {});
    api.getProfile().then(setProfile).catch(() => {});
  }, []);

  async function patch(update: Partial<UserSettings>) {
    if (!settings) return;
    setSettings(s => s ? { ...s, ...update } : s);
    await api.updateSettings(update).catch(() => {});
  }

  function pickDefault(s: SectionId) {
    setDefaultSection(s);
    localStorage.setItem(DEFAULT_SECTION_KEY, s);
  }

  async function handleCreateInvite() {
    setPairLoading(true);
    try {
      const { url } = await api.createPairInvite();
      await api.getPair().then(setPairData);
      setInviteUrl(url);
      try { if (navigator.share) await navigator.share({ text: `Давай отслеживать состояние вместе! ${url}` }); } catch {}
    } finally { setPairLoading(false); }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setPairLoading(true);
    try {
      await api.joinPair(joinCode.trim());
      await api.getPair().then(setPairData);
      setJoinView('hidden');
      setJoinCode('');
    } catch {} finally { setPairLoading(false); }
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const notifyOn   = settings?.notifyEnabled ?? false;
  const localHour  = settings?.notifyLocalHour ?? 21;
  const tzIana     = settings?.notifyTimezone ?? 'Europe/Moscow';
  const tzLabel    = TIMEZONES.find(t => t.iana === tzIana)?.label ?? tzIana;
  const currentStreak = streak?.currentStreak ?? 0;
  const totalDays     = streak?.totalDays ?? 0;
  const weekDots      = streak?.weekDots ?? [];
  const earnedList    = achievements.filter(a => a.earned);
  const partner       = pairData?.partners?.[0];

  // Roadmap
  const steps = ROADMAP.map(step => ({ ...step, done: computeDone(step.id, profile, totalDays, achievements) }));
  const earnedXP = steps.filter(s => s.done).reduce((sum, s) => sum + s.xp, 0);
  const currentIdx = steps.findIndex(s => !s.done);

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 100, paddingTop: safeTop, animation: 'fade-in 0.25s ease', overflowX: 'hidden' }}>

      {/* ── Hero ── */}
      <div style={{ margin: '16px 16px 0', borderRadius: 24, padding: '20px', background: 'linear-gradient(135deg, rgba(167,139,250,0.1) 0%, rgba(96,165,250,0.06) 100%)', border: '1px solid rgba(167,139,250,0.18)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circle */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(167,139,250,0.06)', pointerEvents: 'none' }} />

        <div style={{ fontSize: 13, color: 'rgba(167,139,250,0.7)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
          {firstName ? `${firstName}` : 'Профиль'}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 16 }}>
          {currentStreak > 7 ? 'Ты в потоке 🔥' : currentStreak > 0 ? 'Отличная работа ✨' : 'Начнём сначала 🌱'}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1, color: currentStreak > 0 ? '#fb923c' : 'rgba(255,255,255,0.25)' }}>
              {currentStreak}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>дней подряд</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1, color: totalDays > 0 ? '#60a5fa' : 'rgba(255,255,255,0.25)' }}>
              {totalDays}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>всего дней</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1, color: earnedXP > 0 ? '#a78bfa' : 'rgba(255,255,255,0.25)' }}>
              {earnedXP}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>XP</div>
          </div>
        </div>

        {/* 7-day dots */}
        {weekDots.length > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {weekDots.map((done, i) => (
              <div key={i} style={{
                width: done ? 28 : 24, height: done ? 10 : 8,
                borderRadius: 5, flexShrink: 0,
                background: done
                  ? 'linear-gradient(90deg, #a78bfa, #60a5fa)'
                  : 'rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
              }} />
            ))}
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>7 дней</span>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── МОЙ ПУТЬ ── */}
        <div>
          <SectionLabel right={
            <span style={{ fontSize: 12, color: 'rgba(167,139,250,0.7)', fontWeight: 600 }}>
              {earnedXP} / {TOTAL_XP} XP
            </span>
          }>МОЙ ПУТЬ</SectionLabel>

          {/* XP bar */}
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginBottom: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${Math.round(earnedXP / TOTAL_XP * 100)}%`,
              background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
              transition: 'width 0.5s ease',
            }} />
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {steps.map((step, i) => {
              const isCurrent = i === currentIdx;
              const isLocked  = !step.done && i > currentIdx;
              return (
                <div key={step.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 14,
                  background: isCurrent
                    ? 'rgba(167,139,250,0.1)'
                    : step.done ? 'rgba(255,255,255,0.03)' : 'transparent',
                  border: isCurrent
                    ? '1px solid rgba(167,139,250,0.3)'
                    : step.done ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                  opacity: isLocked ? 0.45 : 1,
                }}>
                  {/* State icon */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                    background: step.done
                      ? 'rgba(52,211,153,0.15)'
                      : isCurrent ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                    border: step.done
                      ? '1px solid rgba(52,211,153,0.3)'
                      : isCurrent ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                    {step.done ? '✓' : isCurrent ? step.emoji : '○'}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 500, color: step.done ? 'rgba(255,255,255,0.7)' : isCurrent ? '#fff' : 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>
                      {step.done ? '' : ''}{step.emoji} {step.title}
                    </div>
                    {(step.done || isCurrent) && (
                      <div style={{ fontSize: 11, color: step.done ? 'rgba(52,211,153,0.7)' : 'rgba(167,139,250,0.6)', marginTop: 2 }}>
                        {step.hint}
                      </div>
                    )}
                  </div>

                  {/* XP badge */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, paddingLeft: 7, paddingRight: 7, paddingTop: 3, paddingBottom: 3,
                    borderRadius: 8, flexShrink: 0,
                    background: step.done
                      ? 'rgba(52,211,153,0.12)'
                      : isCurrent ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
                    color: step.done
                      ? '#34d399'
                      : isCurrent ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                  }}>
                    +{step.xp}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Достижения ── */}
        {earnedList.length > 0 && (
          <div>
            <SectionLabel>ДОСТИЖЕНИЯ</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {earnedList.map(a => {
                const meta = ACHIEVEMENT_META[a.id];
                if (!meta) return null;
                return (
                  <div key={a.id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 12px', borderRadius: 14,
                    background: 'rgba(167,139,250,0.07)',
                    border: '1px solid rgba(167,139,250,0.15)',
                    minWidth: 60,
                  }}>
                    <span style={{ fontSize: 22 }}>{meta.emoji}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.3 }}>{meta.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Настройки ── */}
        <div>
          <SectionLabel>НАСТРОЙКИ</SectionLabel>

          {/* Уведомления */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: notifyOn ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Ежедневное напоминание</div>
                {!notifyOn && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Включи, чтобы не забыть</div>}
              </div>
              <Toggle on={notifyOn} onToggle={() => patch({ notifyEnabled: !notifyOn })} />
            </div>
            {notifyOn && settings && (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, fontWeight: 500 }}>Время</div>
                  <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
                    {HOURS.map(h => (
                      <button key={h} onClick={() => patch({ notifyLocalHour: h })} style={{
                        flexShrink: 0, width: 44, height: 34, borderRadius: 10, border: 'none',
                        background: localHour === h ? '#a78bfa' : 'rgba(255,255,255,0.06)',
                        color: localHour === h ? '#fff' : 'rgba(255,255,255,0.4)',
                        fontSize: 12, fontWeight: localHour === h ? 700 : 400, cursor: 'pointer',
                      }}>{pad(h)}</button>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div onClick={() => setShowTzPicker(v => !v)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Часовой пояс</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{tzLabel}</span>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', transform: showTzPicker ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>›</span>
                    </div>
                  </div>
                  {showTzPicker && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {TIMEZONES.map(tz => (
                        <div key={tz.iana} onClick={() => { patch({ notifyTimezone: tz.iana }); setShowTzPicker(false); }} style={{
                          padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                          background: tzIana === tz.iana ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                          color: tzIana === tz.iana ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                          fontSize: 13, fontWeight: tzIana === tz.iana ? 600 : 400,
                          border: `1px solid ${tzIana === tz.iana ? 'rgba(167,139,250,0.3)' : 'transparent'}`,
                        }}>{tz.label}</div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Открывать сначала */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontWeight: 500 }}>Открывать сначала</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {SCREENS.map(s => {
                const active = defaultSection === s.id;
                return (
                  <button key={s.id} onClick={() => pickDefault(s.id)} style={{
                    flex: 1, padding: '10px 4px', borderRadius: 12, border: 'none',
                    background: active ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)',
                    color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                    fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer',
                    outline: active ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ fontSize: 16 }}>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Партнёр ── */}
        <div>
          <SectionLabel>ПАРТНЁР</SectionLabel>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '16px' }}>
            {partner ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤝</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{partner.partnerName ?? 'Партнёр'}</div>
                  <div style={{ fontSize: 12, color: partner.partnerTodayDone ? '#4ade80' : 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {partner.partnerTodayDone ? '✓ Заполнил сегодня' : 'Ещё не заполнял сегодня'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4, lineHeight: 1.5 }}>
                  Отслеживайте состояние вместе — это помогает не бросать
                </div>
                <button onClick={handleCreateInvite} disabled={pairLoading} style={{
                  padding: '12px', borderRadius: 12, border: '1px solid rgba(96,165,250,0.2)',
                  background: 'rgba(96,165,250,0.12)', color: '#60a5fa',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>
                  {pairLoading ? 'Создаю...' : '🔗 Пригласить партнёра'}
                </button>
                {joinView === 'hidden' ? (
                  <button onClick={() => setJoinView('input')} style={{
                    padding: '10px', borderRadius: 12, border: 'none',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer',
                  }}>У меня есть код</button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Введи код партнёра" style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, outline: 'none',
                    }} />
                    <button onClick={handleJoin} disabled={pairLoading || !joinCode.trim()} style={{
                      padding: '10px 16px', borderRadius: 10, border: 'none',
                      background: '#60a5fa', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>OK</button>
                  </div>
                )}
              </div>
            )}
            {inviteUrl && (
              <div onClick={async () => { await navigator.clipboard.writeText(inviteUrl).catch(() => {}); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000); }} style={{
                marginTop: 10, padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
                fontSize: 12, color: inviteCopied ? '#4ade80' : 'rgba(255,255,255,0.5)',
              }}>
                {inviteCopied ? '✓ Ссылка скопирована' : '📋 Скопировать ссылку-приглашение'}
              </div>
            )}
          </div>
        </div>

        {/* ── Дополнительно ── */}
        <div onClick={onOpenAdvanced} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderRadius: 18,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          cursor: 'pointer',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Инсайты, практики, данные</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Аналитика, колесо детства, экспорт</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>›</div>
        </div>

      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingTop: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
        {children}
      </div>
      {right}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 44, height: 26, borderRadius: 13, position: 'relative', flexShrink: 0,
      background: on ? '#a78bfa' : 'rgba(255,255,255,0.1)',
      transition: 'background 0.2s', cursor: 'pointer',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: 10, background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
}
