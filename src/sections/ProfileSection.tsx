import { useEffect, useState } from 'react';
import { api, UserSettings, StreakData, Achievement, PairsData } from '../api';
import { Section } from '../components/BottomNav';
import { getTelegramSafeTop } from '../utils/safezone';

export const DEFAULT_SECTION_KEY = 'default_section';

function pad(n: number) { return String(n).padStart(2, '0'); }

const ACHIEVEMENT_META: Record<string, { emoji: string; title: string }> = {
  first_day:  { emoji: '🌱', title: 'Первый шаг' },
  streak_3:   { emoji: '🔥', title: '3 дня подряд' },
  streak_7:   { emoji: '⭐', title: 'Неделя' },
  streak_14:  { emoji: '💫', title: 'Две недели' },
  streak_30:  { emoji: '🏆', title: 'Месяц' },
  streak_100: { emoji: '👑', title: 'Сотня' },
  total_10:   { emoji: '📅', title: '10 дней' },
  total_50:   { emoji: '📆', title: '50 дней' },
  high_day:   { emoji: '✨', title: 'Хороший день' },
  all_above7: { emoji: '🎯', title: 'Баланс' },
  comeback:   { emoji: '🔄', title: 'Возвращение' },
  growth:     { emoji: '📈', title: 'Рост' },
};

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

interface Props {
  onOpenAdvanced: () => void;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20,
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Row({ onClick, children, border = true }: { onClick?: () => void; children: React.ReactNode; border?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        borderBottom: border ? '1px solid rgba(255,255,255,0.05)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function ProfileSection({ onOpenAdvanced }: Props) {
  const firstName = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.first_name ?? '';
  const safeTop = getTelegramSafeTop();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [pairData, setPairData] = useState<PairsData | null>(null);
  const [pairLoading, setPairLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinView, setJoinView] = useState<'hidden' | 'input'>('hidden');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

  const [defaultSection, setDefaultSection] = useState<Exclude<Section, 'profile'>>(
    () => {
      const s = localStorage.getItem(DEFAULT_SECTION_KEY);
      if (s === 'tracker' || s === 'diaries') return s;
      return 'home';
    }
  );
  const [showTzPicker, setShowTzPicker] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(() => setSettings({ notifyEnabled: false, notifyLocalHour: 21, notifyTimezone: 'Europe/Moscow', notifyReminderEnabled: false, pairCardDismissed: false }));
    api.getStreak().then(setStreak).catch(() => {});
    api.getAchievements().then(setAchievements).catch(() => {});
    api.getPair().then(setPairData).catch(() => {});
  }, []);

  async function patch(update: Partial<UserSettings>) {
    if (!settings) return;
    setSettings(s => s ? { ...s, ...update } : s);
    await api.updateSettings(update).catch(() => {});
  }

  function pickDefault(s: Exclude<Section, 'profile'>) {
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
    } catch { } finally { setPairLoading(false); }
  }

  const notifyOn = settings?.notifyEnabled ?? false;
  const localHour = settings?.notifyLocalHour ?? 21;
  const tzIana = settings?.notifyTimezone ?? 'Europe/Moscow';
  const tzLabel = TIMEZONES.find(t => t.iana === tzIana)?.label ?? tzIana;
  const currentStreak = streak?.currentStreak ?? 0;
  const totalDays = streak?.totalDays ?? 0;
  const earnedAchievements = (achievements ?? []).filter(a => a.earned);
  const partner = pairData?.partners?.[0];

  const SCREENS: { id: Exclude<Section, 'profile'>; label: string; emoji: string }[] = [
    { id: 'home', label: 'Главная', emoji: '🏠' },
    { id: 'tracker', label: 'Потребности', emoji: '🎯' },
    { id: 'diaries', label: 'Дневники', emoji: '📔' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 100, paddingTop: safeTop + 16, animation: 'fade-in 0.25s ease', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          {firstName || 'Профиль'}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Настройки и прогресс</div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 14px' }}>
        <div style={{
          flex: 1, borderRadius: 18, padding: '16px 14px',
          background: currentStreak > 0 ? 'linear-gradient(145deg, rgba(251,146,60,0.15), rgba(251,146,60,0.06))' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${currentStreak > 0 ? 'rgba(251,146,60,0.25)' : 'rgba(255,255,255,0.07)'}`,
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: 6 }}>🔥 Подряд</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: currentStreak > 0 ? '#fb923c' : 'rgba(255,255,255,0.25)', lineHeight: 1, letterSpacing: '-1px' }}>{currentStreak}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>дней</div>
        </div>
        <div style={{
          flex: 1, borderRadius: 18, padding: '16px 14px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: 6 }}>📅 Всего</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: totalDays > 0 ? '#60a5fa' : 'rgba(255,255,255,0.25)', lineHeight: 1, letterSpacing: '-1px' }}>{totalDays}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>дней</div>
        </div>
        {earnedAchievements.length > 0 && (
          <div style={{
            flex: 1, borderRadius: 18, padding: '16px 14px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: 6 }}>🏅 Знаки</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#a78bfa', lineHeight: 1, letterSpacing: '-1px' }}>{earnedAchievements.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>получено</div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── Уведомления ── */}
        <Card>
          <Row border={notifyOn}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Ежедневное напоминание</div>
            <div
              onClick={() => patch({ notifyEnabled: !notifyOn })}
              style={{
                width: 44, height: 26, borderRadius: 13, position: 'relative', flexShrink: 0,
                background: notifyOn ? '#a78bfa' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.2s', cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: notifyOn ? 21 : 3,
                width: 20, height: 20, borderRadius: 10, background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </div>
          </Row>
          {notifyOn && settings && (
            <>
              {/* Hour picker */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Время уведомления</div>
                <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                  {HOURS.map(h => (
                    <button
                      key={h}
                      onClick={() => patch({ notifyLocalHour: h })}
                      style={{
                        flexShrink: 0,
                        width: 44, height: 34, borderRadius: 10, border: 'none',
                        background: localHour === h ? '#a78bfa' : 'rgba(255,255,255,0.06)',
                        color: localHour === h ? '#fff' : 'rgba(255,255,255,0.4)',
                        fontSize: 12, fontWeight: localHour === h ? 700 : 400,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {pad(h)}
                    </button>
                  ))}
                </div>
              </div>
              {/* TZ picker */}
              <div style={{ padding: '12px 18px' }}>
                <div
                  onClick={() => setShowTzPicker(v => !v)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Часовой пояс</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{tzLabel}</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', transform: showTzPicker ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                  </div>
                </div>
                {showTzPicker && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {TIMEZONES.map(tz => (
                      <div
                        key={tz.iana}
                        onClick={() => { patch({ notifyTimezone: tz.iana }); setShowTzPicker(false); }}
                        style={{
                          padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                          background: tzIana === tz.iana ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                          color: tzIana === tz.iana ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                          fontSize: 13, fontWeight: tzIana === tz.iana ? 600 : 400,
                          border: `1px solid ${tzIana === tz.iana ? 'rgba(167,139,250,0.3)' : 'transparent'}`,
                        }}
                      >
                        {tz.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>

        {/* ── Открывать сначала ── */}
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Открывать сначала</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {SCREENS.map(s => {
              const active = defaultSection === s.id;
              return (
                <button key={s.id} onClick={() => pickDefault(s.id)} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 14, border: 'none',
                  background: active ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                  fontSize: 11, fontWeight: active ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                  outline: active ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── Достижения ── */}
        {earnedAchievements.length > 0 && (
          <Card style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Достижения</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {earnedAchievements.map(a => {
                const meta = ACHIEVEMENT_META[a.id];
                if (!meta) return null;
                return (
                  <div key={a.id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '8px 10px', borderRadius: 12,
                    background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)',
                    minWidth: 64,
                  }}>
                    <span style={{ fontSize: 20 }}>{meta.emoji}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.3 }}>{meta.title}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Партнёр ── */}
        <Card>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Партнёр</div>
            {partner ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  🤝
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{partner.partnerName ?? 'Партнёр'}</div>
                  <div style={{ fontSize: 11, color: partner.partnerTodayDone ? '#4ade80' : 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {partner.partnerTodayDone ? 'Заполнил сегодня' : 'Ещё не заполнял сегодня'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={handleCreateInvite}
                  disabled={pairLoading}
                  style={{
                    padding: '12px', borderRadius: 12, border: '1px solid rgba(96,165,250,0.2)',
                    background: 'rgba(96,165,250,0.12)',
                    color: '#60a5fa', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  } as React.CSSProperties}
                >
                  {pairLoading ? 'Создаю...' : '🔗 Пригласить партнёра'}
                </button>
                {joinView === 'hidden' ? (
                  <button
                    onClick={() => setJoinView('input')}
                    style={{
                      padding: '10px', borderRadius: 12, border: 'none',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    У меня есть код
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value)}
                      placeholder="Введи код партнёра"
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleJoin}
                      disabled={pairLoading || !joinCode.trim()}
                      style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#60a5fa', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>
            )}
            {inviteUrl && (
              <div
                onClick={async () => { await navigator.clipboard.writeText(inviteUrl).catch(() => {}); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000); }}
                style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: 12, color: inviteCopied ? '#4ade80' : 'rgba(255,255,255,0.5)' }}
              >
                {inviteCopied ? '✓ Ссылка скопирована' : '📋 Скопировать ссылку-приглашение'}
              </div>
            )}
          </div>
        </Card>

        {/* ── Дополнительно ── */}
        <Card>
          <Row onClick={onOpenAdvanced} border={false}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Инсайты, практики, данные</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Аналитика, колесо детства, экспорт</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</div>
          </Row>
        </Card>

      </div>
    </div>
  );
}
