import { BottomSheet } from './BottomSheet';
import { Achievement } from '../api';

const ACHIEVEMENT_META: Record<string, { emoji: string; title: string; desc: string }> = {
  first_day:  { emoji: '🌱', title: 'Первый шаг',     desc: 'Заполнил дневник первый раз' },
  streak_3:   { emoji: '🔥', title: 'Начало серии',   desc: '3 дня подряд' },
  streak_7:   { emoji: '⭐', title: 'Неделя',          desc: '7 дней подряд' },
  streak_14:  { emoji: '💫', title: 'Две недели',      desc: '14 дней подряд' },
  streak_30:  { emoji: '🏆', title: 'Месяц',           desc: '30 дней подряд' },
  streak_100: { emoji: '👑', title: 'Сотня',           desc: '100 дней подряд' },
  total_10:   { emoji: '📅', title: '10 дней',         desc: '10 дней всего' },
  total_50:   { emoji: '📆', title: '50 дней',         desc: '50 дней всего' },
  high_day:   { emoji: '✨', title: 'Хороший день',    desc: 'Средний индекс выше 8' },
  all_above7: { emoji: '🎯', title: 'Баланс',          desc: 'Все потребности выше 7 в один день' },
  comeback:   { emoji: '🔄', title: 'Возвращение',     desc: 'Вернулся после перерыва в 3+ дня' },
  growth:     { emoji: '📈', title: 'Рост',            desc: 'Потребность выросла на 3+ за неделю' },
};

interface Props {
  achievements: Achievement[];
  onClose: () => void;
}

async function share(text: string) {
  try {
    if (navigator.share) { await navigator.share({ text }); }
    else { await navigator.clipboard.writeText(text); }
  } catch {}
}

export function AchievementsSheet({ achievements, onClose }: Props) {
  const earnedList = achievements.filter(a => a.earned);
  const earned = earnedList.length;

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Достижения</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{earned} / {achievements.length}</div>
            {earned > 0 && (
              <button
                onClick={() => {
                  const lines = earnedList.map(a => `${ACHIEVEMENT_META[a.id]?.emoji} ${ACHIEVEMENT_META[a.id]?.title}`).join('\n');
                  share(`🏆 Мои достижения в дневнике потребностей:\n\n${lines}\n\nt.me/Emotional_Needs_bot`);
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {achievements.map(a => {
            const meta = ACHIEVEMENT_META[a.id];
            if (!meta) return null;
            return (
              <div key={a.id} style={{
                background: a.earned ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${a.earned ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 16, padding: '14px 12px',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8, filter: a.earned ? 'none' : 'grayscale(1) opacity(0.3)' }}>
                  {meta.emoji}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: a.earned ? '#fff' : 'rgba(255,255,255,0.25)', marginBottom: 4 }}>
                  {meta.title}
                </div>
                <div style={{ fontSize: 11, color: a.earned ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)', lineHeight: 1.4, marginBottom: a.earned ? 8 : 0 }}>
                  {meta.desc}
                </div>
                {a.earned && (
                  <button
                    onClick={() => share(`${meta.emoji} Получил достижение «${meta.title}» в дневнике потребностей!\n\nt.me/Emotional_Needs_bot`)}
                    style={{
                      width: '100%', padding: '5px 0', border: 'none', borderRadius: 8,
                      background: 'rgba(167,139,250,0.15)', color: '#a78bfa',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Поделиться
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
