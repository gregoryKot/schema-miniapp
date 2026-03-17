import { useState, useEffect } from 'react';
import { api, UserSettings, Achievement } from '../api';
import { BottomSheet } from './BottomSheet';
import { AchievementsSheet } from './AchievementsSheet';

type StreakData = { currentStreak: number; longestStreak: number; totalDays: number; todayDone: boolean; weekDots: boolean[] };
type InsightsData = { weeklyStats: Array<{ needId: string; avg: number | null; trend: '↑' | '↓' | '→' }>; bestDayOfWeek: string | null; worstDayOfWeek: string | null; totalDays: number };

const DOW = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

const TIMEZONES = [
  { label: 'UTC−8 (Лос-Анджелес)', offset: -8 },
  { label: 'UTC−5 (Нью-Йорк)',      offset: -5 },
  { label: 'UTC+0 (Лондон)',         offset:  0 },
  { label: 'UTC+1 (Берлин)',         offset:  1 },
  { label: 'UTC+2 (Киев, Израиль)', offset:  2 },
  { label: 'UTC+3 (Москва)',         offset:  3 },
  { label: 'UTC+4 (Дубай)',          offset:  4 },
  { label: 'UTC+5 (Ташкент)',        offset:  5 },
  { label: 'UTC+6 (Алматы)',         offset:  6 },
  { label: 'UTC+8 (Пекин)',          offset:  8 },
];

const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];

function toLocal(utcHour: number, tz: number) { return ((utcHour + tz) % 24 + 24) % 24; }
function toUtc(localHour: number, tz: number)  { return ((localHour - tz) % 24 + 24) % 24; }
function pad(n: number) { return String(n).padStart(2, '0'); }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

interface Props { onClose: () => void }

export function ProfileSheet({ onClose }: Props) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showBestDayInfo, setShowBestDayInfo] = useState(false);
  const [showNotifyInfo, setShowNotifyInfo] = useState(false);
  const [view, setView] = useState<'main' | 'time' | 'tz'>('main');

  useEffect(() => {
    api.getSettings().then(setSettings);
    api.getStreak().then(setStreak);
    api.getAchievements().then(setAchievements);
    api.getInsights().then(setInsights);
  }, []);

  async function patch(update: Partial<UserSettings>) {
    if (!settings) return;
    const next = { ...settings, ...update };
    setSettings(next);
    await api.updateSettings(update);
  }

  if (!settings) {
    return (
      <BottomSheet onClose={onClose}>
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          Загрузка...
        </div>
      </BottomSheet>
    );
  }

  const localHour = toLocal(settings.notifyUtcHour, settings.notifyTzOffset);
  const tzLabel = TIMEZONES.find(t => t.offset === settings.notifyTzOffset)?.label
    ?? `UTC+${settings.notifyTzOffset}`;

  return (
    <>
    <BottomSheet onClose={() => { setView('main'); onClose(); }}>
      {view === 'main' && (
        <div style={{ paddingTop: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 24 }}>
            Профиль
          </div>

          {/* Streak block */}
          {streak && (
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Серия</SectionLabel>

              {/* Main streak number */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 16,
                padding: '20px 20px 16px', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 44, lineHeight: 1 }}>{streak.todayDone ? '🔥' : '🫥'}</div>
                  <div>
                    <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                      {streak.currentStreak}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {streak.currentStreak === 1 ? 'день подряд' : streak.currentStreak >= 5 ? 'дней подряд' : 'дня подряд'}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                      Рекорд: <span style={{ color: '#ffd166', fontWeight: 600 }}>{streak.longestStreak}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                      Всего: <span style={{ color: '#a78bfa', fontWeight: 600 }}>{streak.totalDays}</span>
                    </div>
                  </div>
                </div>

                {/* Week dots */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {streak.weekDots.map((done, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: done ? (i === 6 ? '#ffd166' : '#a78bfa') : 'rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: done ? 14 : 0,
                      }}>
                        {done && '✓'}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{DOW[i]}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                {!streak.todayDone ? (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                    Заполни дневник сегодня, чтобы не потерять серию
                  </div>
                ) : <div />}
                {streak.currentStreak > 0 && (
                  <button
                    onClick={() => {
                      const n = streak.currentStreak;
                      const days = n === 1 ? 'день' : n < 5 ? 'дня' : 'дней';
                      const text = `🔥 ${n} ${days} подряд в дневнике потребностей!\n\nОтслеживаю своё состояние каждый день. t.me/SchemaDiaryBot`;
                      try {
                        if (navigator.share) { navigator.share({ text }); }
                        else { navigator.clipboard.writeText(text); }
                      } catch {}
                    }}
                    style={{
                      background: 'rgba(167,139,250,0.15)', border: 'none', borderRadius: 20,
                      padding: '5px 12px', color: '#a78bfa', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Поделиться
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Insights block */}
          {insights && insights.weeklyStats.some(s => s.avg !== null) && (
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Insights · неделя</SectionLabel>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '14px 16px' }}>
                {insights.bestDayOfWeek && insights.totalDays >= 7 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                      Лучший день — <span style={{ color: '#ffd166', fontWeight: 600 }}>{insights.bestDayOfWeek}</span> 🌟
                    </span>
                    <span
                      onClick={() => setShowBestDayInfo(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 15, height: 15, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)',
                        fontSize: 9, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                      }}
                    >?</span>
                  </div>
                )}
                {insights.worstDayOfWeek && insights.totalDays >= 7 && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                    Тяжелее всего — <span style={{ color: '#f87171', fontWeight: 600 }}>{insights.worstDayOfWeek}</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {insights.weeklyStats.filter(s => s.avg !== null).map(s => {
                    const trendColor = s.trend === '↑' ? '#4ade80' : s.trend === '↓' ? '#f87171' : 'rgba(255,255,255,0.3)';
                    const barW = Math.round(((s.avg ?? 0) / 10) * 100);
                    return (
                      <div key={s.needId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                            {({ attachment: 'Привязанность', autonomy: 'Автономия', expression: 'Выражение чувств', play: 'Спонтанность', limits: 'Границы' } as Record<string,string>)[s.needId]}
                          </span>
                          <span style={{ fontSize: 12, color: trendColor, fontWeight: 600 }}>
                            {(s.avg ?? 0).toFixed(1)} {s.trend}
                          </span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${barW}%`, background: 'rgba(167,139,250,0.6)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Achievements block */}
          {achievements && (
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Достижения</SectionLabel>
              <div
                onClick={() => setShowAchievements(true)}
                style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 16,
                  padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                  {achievements.slice(0, 8).map(a => (
                    <span key={a.id} style={{ fontSize: 20, filter: a.earned ? 'none' : 'grayscale(1) opacity(0.25)' }}>
                      {({ first_day:'🌱',streak_3:'🔥',streak_7:'⭐',streak_14:'💫',streak_30:'🏆',streak_100:'👑',total_10:'📅',total_50:'📆',high_day:'✨',all_above7:'🎯',comeback:'🔄',growth:'📈' } as Record<string,string>)[a.id]}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                    {achievements.filter(a => a.earned).length}/{achievements.length}
                  </span>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }}>›</span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <SectionLabel>Уведомления</SectionLabel>
            <span
              onClick={() => setShowNotifyInfo(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 15, height: 15, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)',
                fontSize: 9, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                marginBottom: 10,
              }}
            >?</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>

            {/* Toggle */}
            <div
              onClick={() => patch({ notifyEnabled: !settings.notifyEnabled })}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ fontSize: 15, color: '#fff' }}>Итоги дня</span>
              <div style={{
                width: 44, height: 26, borderRadius: 13,
                background: settings.notifyEnabled ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 3,
                  left: settings.notifyEnabled ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
            </div>

            {/* Time */}
            <div
              onClick={() => settings.notifyEnabled && setView('time')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', cursor: settings.notifyEnabled ? 'pointer' : 'default',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                opacity: settings.notifyEnabled ? 1 : 0.35,
              }}
            >
              <span style={{ fontSize: 15, color: '#fff' }}>Время</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>{pad(localHour)}:00</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>›</span>
              </div>
            </div>

            {/* Timezone */}
            <div
              onClick={() => settings.notifyEnabled && setView('tz')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', cursor: settings.notifyEnabled ? 'pointer' : 'default',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                opacity: settings.notifyEnabled ? 1 : 0.35,
              }}
            >
              <span style={{ fontSize: 15, color: '#fff' }}>Часовой пояс</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'right', maxWidth: 160 }}>{tzLabel}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>›</span>
              </div>
            </div>

            {/* Reminder toggle */}
            <div
              onClick={() => settings.notifyEnabled && patch({ notifyReminderEnabled: !settings.notifyReminderEnabled })}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px',
                cursor: settings.notifyEnabled ? 'pointer' : 'default',
                opacity: settings.notifyEnabled ? 1 : 0.35,
              }}
            >
              <div>
                <div style={{ fontSize: 15, color: '#fff' }}>Напоминание за час</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  За час до дневника, если не заполнен
                </div>
              </div>
              <div style={{
                width: 44, height: 26, borderRadius: 13, flexShrink: 0,
                background: settings.notifyReminderEnabled && settings.notifyEnabled ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 3,
                  left: settings.notifyReminderEnabled ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
            </div>
          </div>

          {/* Share & Export */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={async () => {
                const text = 'Дневник потребностей — отслеживай своё состояние каждый день. t.me/SchemaDiaryBot';
                try {
                  if (navigator.share) { await navigator.share({ text }); }
                  else { await navigator.clipboard.writeText(text); }
                } catch {}
              }}
              style={{
                flex: 1, padding: '12px 0', border: 'none', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Пригласить друга
            </button>
            <button
              onClick={async () => {
                const { text } = await api.getExport();
                try {
                  if (navigator.share) { await navigator.share({ text }); }
                  else { await navigator.clipboard.writeText(text); }
                } catch {}
              }}
              style={{
                flex: 1, padding: '12px 0', border: 'none', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Экспорт
            </button>
          </div>
        </div>
      )}

      {view === 'time' && (
        <div style={{ paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span onClick={() => setView('main')} style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>‹</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Время уведомления</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {HOURS.map(h => {
              const active = h === localHour;
              return (
                <div
                  key={h}
                  onClick={async () => {
                    await patch({ notifyUtcHour: toUtc(h, settings.notifyTzOffset) });
                    setView('main');
                  }}
                  style={{
                    padding: '12px 0', borderRadius: 12, textAlign: 'center',
                    background: active ? '#a78bfa' : 'rgba(255,255,255,0.06)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontSize: 15, fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {pad(h)}:00
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'tz' && (
        <div style={{ paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span onClick={() => setView('main')} style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>‹</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Часовой пояс</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TIMEZONES.map(tz => {
              const active = tz.offset === settings.notifyTzOffset;
              return (
                <div
                  key={tz.offset}
                  onClick={async () => {
                    await patch({ notifyTzOffset: tz.offset, notifyUtcHour: toUtc(localHour, tz.offset) });
                    setView('main');
                  }}
                  style={{
                    padding: '13px 16px', borderRadius: 12,
                    background: active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                    color: active ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                    fontSize: 14, fontWeight: active ? 600 : 400,
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  }}
                >
                  {tz.label}
                  {active && <span>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </BottomSheet>

    {showAchievements && achievements && (
      <AchievementsSheet
        achievements={achievements}
        onClose={() => setShowAchievements(false)}
      />
    )}
    {showNotifyInfo && (
      <BottomSheet onClose={() => setShowNotifyInfo(false)} zIndex={300}>
        <div style={{ paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Зачем уведомления
          </div>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>
            Регулярность — это всё. Один раз в день, в одно и то же время, формирует привычку наблюдать за собой. Без неё паттерн не складывается.
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>
            <b style={{ color: '#fff' }}>Итоги дня</b> — приходят после того, как заполнишь дневник: твои оценки в виде сводки. Приятно видеть день в цифрах.
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
            <b style={{ color: '#fff' }}>Напоминание за час</b> — лёгкий толчок, если день был насыщенным и дневник ещё не заполнен.
          </p>
        </div>
      </BottomSheet>
    )}
    {showBestDayInfo && (
      <BottomSheet onClose={() => setShowBestDayInfo(false)} zIndex={300}>
        <div style={{ paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Лучший день
          </div>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>
            Это день недели, в который твои оценки в среднем выше всего — по всем потребностям сразу.
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>
            Не значит, что он всегда хороший. Но чаще всего в этот день что-то складывается: отдых, общение, ритм. Полезно замечать — и беречь.
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
            Считается по всей истории наблюдений, поэтому становится точнее с каждой неделей.
          </p>
        </div>
      </BottomSheet>
    )}
    </>
  );
}
