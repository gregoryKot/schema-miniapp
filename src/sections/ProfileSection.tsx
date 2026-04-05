import { useEffect, useState } from 'react';
import { api, Achievement } from '../api';
import { getTelegramSafeTop } from '../utils/safezone';
import { BottomSheet } from '../components/BottomSheet';

export const DEFAULT_SECTION_KEY = 'default_section';

const DOW = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

const NEED_NAMES: Record<string, string> = {
  attachment: 'Привязанность', autonomy: 'Автономия',
  expression: 'Выражение чувств', play: 'Спонтанность', limits: 'Границы',
};

const ACHIEVEMENT_META: Record<string, { emoji: string; title: string; desc: string }> = {
  first_day:      { emoji: '🌱', title: 'Первый шаг',   desc: 'Заполнил дневник первый раз' },
  streak_3:       { emoji: '🔥', title: 'Начало серии', desc: '3 дня подряд' },
  streak_7:       { emoji: '⭐', title: 'Неделя',        desc: '7 дней подряд' },
  streak_14:      { emoji: '💫', title: 'Две недели',    desc: '14 дней подряд' },
  streak_30:      { emoji: '🏆', title: 'Месяц',         desc: '30 дней подряд' },
  streak_100:     { emoji: '👑', title: 'Сотня',         desc: '100 дней подряд' },
  total_10:       { emoji: '📅', title: '10 дней',       desc: '10 дней всего' },
  total_50:       { emoji: '📆', title: '50 дней',       desc: '50 дней всего' },
  high_day:       { emoji: '✨', title: 'Хороший день',  desc: 'Средний индекс выше 8' },
  all_above7:     { emoji: '🎯', title: 'Баланс',        desc: 'Все потребности выше 7 в один день' },
  comeback:       { emoji: '🔄', title: 'Возвращение',   desc: 'Вернулся после перерыва в 3+ дня' },
  growth:         { emoji: '📈', title: 'Рост',          desc: 'Потребность выросла на 3+ за неделю' },
  pair_connected: { emoji: '🤝', title: 'Партнёр',       desc: 'Связался с партнёром' },
};

type StreakData = { currentStreak: number; longestStreak: number; totalDays: number; todayDone: boolean; weekDots: boolean[] };
type InsightsData = { weeklyStats: Array<{ needId: string; avg: number | null; trend: '↑' | '↓' | '→' }>; bestDayOfWeek: string | null; worstDayOfWeek: string | null; totalDays: number };

const TODAY_DOW_IDX = (new Date().getDay() + 6) % 7; // 0=пн ... 6=вс

interface Props {
  onOpenSettings: () => void;
  onOpenTracker?: () => void;
  refreshKey?: number;
}

export function ProfileSection({ onOpenSettings, onOpenTracker, refreshKey }: Props) {
  const safeTop = getTelegramSafeTop();
  const firstName = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.first_name ?? '';

  const [streak, setStreak]             = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [insights, setInsights]         = useState<InsightsData | null>(null);
  const [ready, setReady]               = useState(false);

  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [showBestDayInfo, setShowBestDayInfo] = useState(false);

  useEffect(() => {
    setReady(false);
    setStreak(null);
    setAchievements(null);
    setInsights(null);
    Promise.all([
      api.getStreak().then(setStreak).catch(() => {}),
      api.getAchievements().then(setAchievements).catch(() => {}),
      api.getInsights().then(setInsights).catch(() => {}),
    ]).finally(() => setReady(true));
  }, [refreshKey]);

  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const totalDays     = streak?.totalDays ?? 0;
  const todayDone     = streak?.todayDone ?? false;
  const weekDots      = streak?.weekDots ?? [];
  const earnedList    = achievements?.filter(a => a.earned) ?? [];
  const hasInsights   = insights && insights.weeklyStats.some(s => s.avg !== null);

  const insightSummary = (() => {
    if (!insights) return null;
    if (insights.bestDayOfWeek && insights.totalDays >= 7) return `Лучший день — ${insights.bestDayOfWeek}`;
    const rising = insights.weeklyStats.find(s => s.trend === '↑');
    if (rising) return `${NEED_NAMES[rising.needId]} растёт`;
    return 'Заполняй дневник каждый день';
  })();

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 140, paddingTop: safeTop, animation: 'fade-in 0.25s ease', overflowX: 'hidden' }}>

      {/* ── Хедер ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          {firstName || 'Я'}
        </div>
        <button onClick={onOpenSettings} style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ⚙️
        </button>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── Скелетон всего раздела ── */}
        {!ready && (
          <>
            {[120, 72, 80, 90].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: 20, background: 'linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)', backgroundSize: '200% auto', animation: 'shimmer 1.5s linear infinite' }} />
            ))}
          </>
        )}

        {/* ── Стрик ── */}
        {ready && <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px' }}>
          {streak === null ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)', backgroundSize: '200% auto', animation: 'shimmer 1.5s linear infinite' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ width: '40%', height: 36, borderRadius: 8, background: 'linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)', backgroundSize: '200% auto', animation: 'shimmer 1.5s linear infinite' }} />
                  <div style={{ width: '55%', height: 12, borderRadius: 4, background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)', backgroundSize: '200% auto', animation: 'shimmer 1.5s linear infinite' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {[0,1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ width: 14, height: 8, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 44, lineHeight: 1 }}>
                  {todayDone ? '🔥' : currentStreak > 0 ? '🫥' : '🌱'}
                </div>
                <div style={{ flex: 1 }}>
                  {currentStreak > 0 ? (
                    <>
                      <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{currentStreak}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {currentStreak === 1 ? 'день подряд' : currentStreak < 5 ? 'дня подряд' : 'дней подряд'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>
                        {totalDays === 0 ? 'Начни сегодня' : 'Серия прервалась'}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                        {totalDays === 0
                          ? 'Первая запись — самая важная'
                          : 'Заполни сегодня — серия начнётся снова'}
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                  {longestStreak > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Рекорд: <span style={{ color: '#ffd166', fontWeight: 600 }}>{longestStreak}</span></div>}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Всего: <span style={{ color: '#a78bfa', fontWeight: 600 }}>{totalDays}</span></div>
                </div>
              </div>

              {weekDots.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: currentStreak > 0 ? 12 : 0 }}>
                  {weekDots.map((done, i) => {
                    const isToday = i === TODAY_DOW_IDX;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: done ? (i === 6 ? '#ffd166' : '#a78bfa') : 'rgba(255,255,255,0.07)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: done ? 13 : 0,
                          outline: isToday ? '2px solid rgba(167,139,250,0.5)' : 'none',
                          outlineOffset: 2,
                        }}>
                          {done && '✓'}
                        </div>
                        <div style={{ fontSize: 10, color: isToday ? '#a78bfa' : 'rgba(255,255,255,0.25)', fontWeight: isToday ? 600 : 400 }}>{DOW[i]}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentStreak === 0 && totalDays > 0 && onOpenTracker && (
                <button onClick={onOpenTracker} style={{ width: '100%', padding: '9px 0', border: 'none', borderRadius: 12, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Заполнить сегодня →
                </button>
              )}
              {currentStreak >= 3 && (
                <button onClick={async () => {
                  const n = currentStreak;
                  const d = n === 1 ? 'день' : n < 5 ? 'дня' : 'дней';
                  const text = `🔥 ${n} ${d} подряд в дневнике потребностей!\n\nОтслеживаю своё состояние каждый день. t.me/Emotional_Needs_bot`;
                  try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard.writeText(text); } catch { try { await navigator.clipboard.writeText(text); } catch {} }
                }} style={{ width: '100%', padding: '9px 0', border: 'none', borderRadius: 12, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Поделиться серией
                </button>
              )}
            </>
          )}
        </div>}

        {/* ── Паттерны (инсайты) ── */}
        {ready && hasInsights && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
            <div onClick={() => setInsightsOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}>
              <div>
                <SectionLabel style={{ marginBottom: 2 }}>ПАТТЕРНЫ</SectionLabel>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{insightSummary}</span>
              </div>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', display: 'inline-block', transform: insightsOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>›</span>
            </div>
            {insightsOpen && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {(insights?.bestDayOfWeek || insights?.worstDayOfWeek) && (insights?.totalDays ?? 0) >= 7 && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    {insights?.bestDayOfWeek && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                          Лучше всего — <span style={{ color: '#ffd166', fontWeight: 600 }}>{insights.bestDayOfWeek}</span>
                        </span>
                        <span onClick={e => { e.stopPropagation(); setShowBestDayInfo(true); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 600, cursor: 'pointer' }}>?</span>
                      </div>
                    )}
                    {insights?.worstDayOfWeek && (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        Тяжелее — <span style={{ color: '#f87171', fontWeight: 600 }}>{insights.worstDayOfWeek}</span>
                      </span>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  {insights?.weeklyStats.filter(s => s.avg !== null).map(s => {
                    const trendColor = s.trend === '↑' ? '#4ade80' : s.trend === '↓' ? '#f87171' : 'rgba(255,255,255,0.25)';
                    const barW = Math.round(((s.avg ?? 0) / 10) * 100);
                    return (
                      <div key={s.needId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{NEED_NAMES[s.needId]}</span>
                          <span style={{ fontSize: 12, color: trendColor, fontWeight: 600 }}>{(s.avg ?? 0).toFixed(1)} {s.trend}</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${barW}%`, background: 'rgba(167,139,250,0.5)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Достижения ── */}
        {ready && achievements && (
          <div onClick={() => setShowAchievements(true)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <SectionLabel>ДОСТИЖЕНИЯ</SectionLabel>
              {achievements.length > 0 ? (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                  {achievements.slice(0, 8).map(a => (
                    <span key={a.id} style={{ fontSize: 22, filter: a.earned ? 'none' : 'grayscale(1) opacity(0.25)' }}>
                      {(ACHIEVEMENT_META[a.id] ?? {}).emoji}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                  Первое — за первую запись в дневник
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{earnedList.length}/{achievements.length}</span>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
            </div>
          </div>
        )}


      </div>

      {/* ── BottomSheet: Достижения ── */}
      {showAchievements && achievements && (
        <BottomSheet onClose={() => { setShowAchievements(false); setSelectedAchievement(null); }}>
          <div style={{ paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>Достижения</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{earnedList.length}/{achievements.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {achievements.map(a => {
                const m = ACHIEVEMENT_META[a.id];
                if (!m) return null;
                const progress = !a.earned ? (() => {
                  switch (a.id) {
                    case 'streak_3':   return currentStreak > 0 ? `${currentStreak}/3` : null;
                    case 'streak_7':   return currentStreak > 0 ? `${currentStreak}/7` : null;
                    case 'streak_14':  return currentStreak > 0 ? `${currentStreak}/14` : null;
                    case 'streak_30':  return currentStreak > 0 ? `${currentStreak}/30` : null;
                    case 'streak_100': return currentStreak > 0 ? `${currentStreak}/100` : null;
                    case 'total_10':   return totalDays > 0 ? `${totalDays}/10` : null;
                    case 'total_50':   return totalDays > 0 ? `${totalDays}/50` : null;
                    default: return null;
                  }
                })() : null;
                return (
                  <div key={a.id} onClick={() => a.earned && setSelectedAchievement(a.id)}
                    style={{ background: a.earned ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${a.earned ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: '14px 12px', cursor: a.earned ? 'pointer' : 'default' }}>
                    <div style={{ fontSize: 28, marginBottom: 8, filter: a.earned ? 'none' : 'grayscale(1) opacity(0.3)' }}>{m.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: a.earned ? '#fff' : 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: a.earned ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)', lineHeight: 1.4 }}>{m.desc}</div>
                    {progress && <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.5)', marginTop: 6, fontWeight: 600 }}>{progress} дней</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Achievement detail overlay */}
      {selectedAchievement && (() => {
        const m = ACHIEVEMENT_META[selectedAchievement];
        if (!m) return null;
        return (
          <div onClick={() => setSelectedAchievement(null)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'fade-in 0.18s ease' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, rgba(167,139,250,0.2), rgba(79,163,247,0.1))', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 24, padding: '36px 28px 24px', width: '100%', maxWidth: 320, textAlign: 'center', animation: 'sheet-up 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>{m.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{m.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 28 }}>{m.desc}</div>
              <button onClick={async () => {
                const text = `${m.emoji} Получил достижение «${m.title}»!\n\nt.me/Emotional_Needs_bot`;
                try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard.writeText(text); } catch {}
              }} style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: '#a78bfa', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Поделиться
              </button>
            </div>
          </div>
        );
      })()}

      {/* Best day tooltip */}
      {showBestDayInfo && (
        <BottomSheet onClose={() => setShowBestDayInfo(false)} zIndex={300}>
          <div style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)', marginBottom: 16 }}>Лучший день</div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>День недели, в который твои оценки в среднем выше всего.</p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>Становится точнее с каждой неделей.</p>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 8, ...style }}>
      {children}
    </div>
  );
}

