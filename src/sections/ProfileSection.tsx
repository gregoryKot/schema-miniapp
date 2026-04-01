import { useEffect, useState } from 'react';
import { api, Achievement, PracticePlan, UserPractice } from '../api';
import { COLORS } from '../types';
import { NEED_DATA } from '../needData';
import { Section } from '../components/BottomNav';
import { getTelegramSafeTop } from '../utils/safezone';
import { BottomSheet } from '../components/BottomSheet';
import { Loader } from '../components/Loader';
import { CHILDHOOD_DONE_KEY } from '../components/ChildhoodWheelSheet';

export const DEFAULT_SECTION_KEY = 'default_section';

const DOW = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

const NEED_IDS = ['attachment', 'autonomy', 'expression', 'play', 'limits'];

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

interface Props {
  onOpenSettings: () => void;
  onOpenChildhoodWheel: () => void;
  onNavigate: (s: Section) => void;
}

export function ProfileSection({ onOpenSettings, onOpenChildhoodWheel }: Props) {
  const safeTop = getTelegramSafeTop();
  const firstName = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.first_name ?? '';

  const [streak, setStreak]             = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [insights, setInsights]         = useState<InsightsData | null>(null);

  // Tool sheets
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [showPractices, setShowPractices]   = useState(false);
  const [showPlans, setShowPlans]           = useState(false);

  // Practices state
  const [practicesNeedIdx, setPracticesNeedIdx] = useState(0);
  const [practices, setPractices]     = useState<UserPractice[] | null>(null);
  const [practicesInput, setPracticesInput] = useState('');
  const [practicesSaving, setPracticesSaving] = useState(false);

  // Plans state
  const [planHistory, setPlanHistory] = useState<PracticePlan[] | null>(null);

  // Insights expand
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [showBestDayInfo, setShowBestDayInfo] = useState(false);

  // Childhood wheel preview data
  const [childhoodRatings, setChildhoodRatings] = useState<Record<string, number>>({});
  const childhoodDone = Object.keys(childhoodRatings).length > 0 || !!localStorage.getItem(CHILDHOOD_DONE_KEY);

  // Preview data for cards
  const [practicesPreview, setPracticesPreview] = useState<UserPractice[]>([]);
  const [plansPreview, setPlansPreview]         = useState<PracticePlan[]>([]);

  useEffect(() => {
    api.getStreak().then(setStreak).catch(() => {});
    api.getAchievements().then(setAchievements).catch(() => {});
    api.getInsights().then(setInsights).catch(() => {});
    api.getChildhoodRatings?.().then(r => { if (r && Object.keys(r).length > 0) setChildhoodRatings(r); }).catch(() => {});
    // Load preview data (first 3 items)
    api.getPractices(NEED_IDS[0]).then(p => setPracticesPreview(p.slice(0, 3))).catch(() => {});
    api.getPlanHistory(10).then(p => setPlansPreview(p.slice(0, 3))).catch(() => {});
  }, []);

  function loadPractices(idx: number) {
    setPractices(null);
    api.getPractices(NEED_IDS[idx]).then(setPractices).catch(() => setPractices([]));
  }

  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const totalDays     = streak?.totalDays ?? 0;
  const todayDone     = streak?.todayDone ?? false;
  const weekDots      = streak?.weekDots ?? [];
  const earnedList    = achievements?.filter(a => a.earned) ?? [];
  const hasInsights   = insights && insights.weeklyStats.some(s => s.avg !== null);
  const insightSummary = insights?.bestDayOfWeek && (insights?.totalDays ?? 0) >= 7
    ? `Лучший день — ${insights.bestDayOfWeek}`
    : insights?.weeklyStats.find(s => s.trend === '↑')
      ? `${NEED_NAMES[insights.weeklyStats.find(s => s.trend === '↑')!.needId]} растёт`
      : 'Заполняй дневник каждый день';

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

        {/* ── Стрик герой ── */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px' }}>
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
                    {totalDays === 0 ? 'Первая запись — самая важная' : 'Заполни дневник — и серия начнётся'}
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              {longestStreak > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Рекорд: <span style={{ color: '#ffd166', fontWeight: 600 }}>{longestStreak}</span></div>}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Всего: <span style={{ color: '#a78bfa', fontWeight: 600 }}>{totalDays}</span></div>
            </div>
          </div>

          {weekDots.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              {weekDots.map((done, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? (i === 6 ? '#ffd166' : '#a78bfa') : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? 13 : 0 }}>
                    {done && '✓'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{DOW[i]}</div>
                </div>
              ))}
            </div>
          )}

          {currentStreak > 0 && (
            <button onClick={async () => {
              const n = currentStreak;
              const d = n === 1 ? 'день' : n < 5 ? 'дня' : 'дней';
              const text = `🔥 ${n} ${d} подряд в дневнике потребностей!\n\nОтслеживаю своё состояние каждый день. t.me/Emotional_Needs_bot`;
              try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard.writeText(text); } catch { try { await navigator.clipboard.writeText(text); } catch {} }
            }} style={{ width: '100%', padding: '9px 0', border: 'none', borderRadius: 12, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Поделиться
            </button>
          )}
        </div>

        {/* ── Достижения ── */}
        {achievements && (
          <div onClick={() => setShowAchievements(true)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <CardLabel>ДОСТИЖЕНИЯ</CardLabel>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {achievements.slice(0, 10).map(a => (
                  <span key={a.id} style={{ fontSize: 22, filter: a.earned ? 'none' : 'grayscale(1) opacity(0.2)' }}>
                    {(ACHIEVEMENT_META[a.id] ?? {}).emoji}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{earnedList.length}/{achievements.length}</span>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
            </div>
          </div>
        )}

        {/* ── Паттерны ── */}
        {hasInsights && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
            <div onClick={() => setInsightsOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}>
              <div>
                <CardLabel>ПАТТЕРНЫ</CardLabel>
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
                          Лучше всего — <span style={{ color: '#ffd166', fontWeight: 600 }}>{insights?.bestDayOfWeek}</span>
                        </span>
                        <span onClick={e => { e.stopPropagation(); setShowBestDayInfo(true); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 600, cursor: 'pointer' }}>?</span>
                      </div>
                    )}
                    {insights?.worstDayOfWeek && (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        Тяжелее — <span style={{ color: '#f87171', fontWeight: 600 }}>{insights?.worstDayOfWeek}</span>
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

        {/* ── МОИ ИНСТРУМЕНТЫ ── */}
        <CardLabel style={{ marginTop: 4 }}>МОИ ИНСТРУМЕНТЫ</CardLabel>

        {/* Колесо детства */}
        <div onClick={onOpenChildhoodWheel} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '16px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: childhoodDone ? 12 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🌱</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Колесо детства</div>
                <div style={{ fontSize: 11, color: childhoodDone ? 'rgba(255,255,255,0.35)' : '#a78bfa', marginTop: 1 }}>
                  {childhoodDone ? 'Оценки потребностей в детстве' : 'Не заполнено — займёт 2 минуты'}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 16, color: childhoodDone ? 'rgba(255,255,255,0.2)' : '#a78bfa' }}>›</span>
          </div>
          {childhoodDone && Object.keys(childhoodRatings).length > 0 && (
            <MiniWheel ratings={childhoodRatings} />
          )}
        </div>

        {/* Мои практики */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '16px', cursor: 'pointer' }}
          onClick={() => { setShowPractices(true); setPracticesNeedIdx(0); loadPractices(0); }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: practicesPreview.length > 0 ? 10 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🗂</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Мои практики</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Что помогает в трудный день</div>
              </div>
            </div>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
          </div>
          {practicesPreview.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {practicesPreview.map(p => (
                <div key={p.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.04)', lineHeight: 1.4 }}>
                  {p.text}
                </div>
              ))}
            </div>
          )}
          {practicesPreview.length === 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Добавь — они появятся здесь</div>
          )}
        </div>

        {/* История планов */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '16px', cursor: 'pointer' }}
          onClick={() => { setShowPlans(true); if (!planHistory) api.getPlanHistory(30).then(setPlanHistory).catch(() => setPlanHistory([])); }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: plansPreview.length > 0 ? 10 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>📋</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>История планов</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Что планировал, что сделал</div>
              </div>
            </div>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
          </div>
          {plansPreview.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {plansPreview.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)', padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ flexShrink: 0 }}>{p.done === true ? '✅' : p.done === false ? '❌' : '⏳'}</span>
                  <span style={{ lineHeight: 1.4 }}>{p.practiceText}</span>
                </div>
              ))}
            </div>
          )}
          {plansPreview.length === 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Создай первый из дневника</div>
          )}
        </div>

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
                return (
                  <div key={a.id} onClick={() => a.earned && setSelectedAchievement(a.id)}
                    style={{ background: a.earned ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${a.earned ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: '14px 12px', cursor: a.earned ? 'pointer' : 'default' }}>
                    <div style={{ fontSize: 28, marginBottom: 8, filter: a.earned ? 'none' : 'grayscale(1) opacity(0.3)' }}>{m.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: a.earned ? '#fff' : 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: a.earned ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)', lineHeight: 1.4 }}>{m.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Achievement overlay */}
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
                const text = `${m.emoji} Получил достижение «${m.title}» в дневнике потребностей!\n\nt.me/Emotional_Needs_bot`;
                try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard.writeText(text); } catch {}
              }} style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: '#a78bfa', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Поделиться
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── BottomSheet: Мои практики ── */}
      {showPractices && (
        <BottomSheet onClose={() => { setShowPractices(false); setPracticesPreview(practices?.slice(0, 3) ?? practicesPreview); }}>
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Мои практики</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
              {NEED_IDS.map((id, i) => {
                const color = COLORS[id] ?? '#888';
                const emoji = NEED_DATA[id]?.emoji ?? '';
                const active = i === practicesNeedIdx;
                return (
                  <div key={id} onClick={() => { setPracticesNeedIdx(i); setPracticesInput(''); loadPractices(i); }}
                    style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, background: active ? color + '28' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? color + '55' : 'transparent'}`, color: active ? color : 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {emoji} {NEED_NAMES[id]}
                  </div>
                );
              })}
            </div>
            {!practices ? <Loader minHeight="20vh" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {practices.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '12px 0' }}>Пока пусто — добавь ниже</div>}
                {practices.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '11px 14px' }}>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 1.45 }}>{p.text}</div>
                    <div onClick={() => { setPractices(prev => prev?.filter(x => x.id !== p.id) ?? null); api.deletePractice(p.id).catch(() => {}); }}
                      style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'rgba(255,100,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, color: 'rgba(255,100,100,0.5)' }}>×</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={practicesInput} onChange={e => setPracticesInput(e.target.value)}
                onKeyDown={async e => {
                  if (e.key !== 'Enter') return;
                  const text = practicesInput.trim();
                  if (!text || practicesSaving) return;
                  setPracticesSaving(true);
                  try { await api.addPractice(NEED_IDS[practicesNeedIdx], text); setPracticesInput(''); loadPractices(practicesNeedIdx); } catch {}
                  setPracticesSaving(false);
                }}
                placeholder="Добавить практику..." maxLength={200}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
              <button onClick={async () => {
                const text = practicesInput.trim();
                if (!text || practicesSaving) return;
                setPracticesSaving(true);
                try { await api.addPractice(NEED_IDS[practicesNeedIdx], text); setPracticesInput(''); loadPractices(practicesNeedIdx); } catch {}
                setPracticesSaving(false);
              }} disabled={!practicesInput.trim() || practicesSaving}
                style={{ padding: '11px 16px', borderRadius: 12, border: 'none', background: practicesInput.trim() ? (COLORS[NEED_IDS[practicesNeedIdx]] ?? '#a78bfa') : 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>+</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* ── BottomSheet: История планов ── */}
      {showPlans && (
        <BottomSheet onClose={() => setShowPlans(false)}>
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 16 }}>История планов</div>
            {!planHistory ? <Loader minHeight="30vh" /> : planHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                Планов пока нет.<br />Создай первый из дневника.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {planHistory.map(plan => (
                  <div key={plan.id} style={{ background: plan.done === true ? 'rgba(6,214,160,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${plan.done === true ? 'rgba(6,214,160,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{plan.scheduledDate}</div>
                      <div style={{ fontSize: 13 }}>{plan.done === true ? '✅' : plan.done === false ? '❌' : '⏳'}</div>
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>{plan.practiceText}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </BottomSheet>
      )}

      {/* Best day info tooltip */}
      {showBestDayInfo && (
        <BottomSheet onClose={() => setShowBestDayInfo(false)} zIndex={300}>
          <div style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)', marginBottom: 16 }}>Лучший день</div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 14 }}>Это день недели, в который твои оценки в среднем выше всего — по всем потребностям сразу.</p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>Становится точнее с каждой неделей.</p>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function CardLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 6, ...style }}>
      {children}
    </div>
  );
}

function MiniWheel({ ratings }: { ratings: Record<string, number> }) {
  const NEED_IDS_ORDER = ['attachment', 'autonomy', 'expression', 'play', 'limits'];
  const size = 80;
  const cx = size / 2, cy = size / 2, r = 30;
  const points = NEED_IDS_ORDER.map((id, i) => {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const val = (ratings[id] ?? 0) / 10;
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle) };
  });
  const poly = points.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map(f => {
        const gpts = NEED_IDS_ORDER.map((_, i) => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; return `${cx + r * f * Math.cos(a)},${cy + r * f * Math.sin(a)}`; }).join(' ');
        return <polygon key={f} points={gpts} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
      })}
      <polygon points={poly} fill="rgba(167,139,250,0.25)" stroke="#a78bfa" strokeWidth="1.5" />
    </svg>
  );
}
