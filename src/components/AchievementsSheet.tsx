import { useState } from 'react';
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

export function AchievementsSheet({ achievements, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const earned = achievements.filter(a => a.earned).length;

  async function shareOne(id: string) {
    const meta = ACHIEVEMENT_META[id];
    if (!meta) return;
    const text = `${meta.emoji} Получил достижение «${meta.title}» в дневнике потребностей!\n\nt.me/Emotional_Needs_bot`;
    try {
      if (navigator.share) { await navigator.share({ text }); }
      else { await navigator.clipboard.writeText(text); }
    } catch {}
  }

  const selectedMeta = selected ? ACHIEVEMENT_META[selected] : null;

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Достижения</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{earned} / {achievements.length}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {achievements.map(a => {
            const meta = ACHIEVEMENT_META[a.id];
            if (!meta) return null;
            const isSelected = selected === a.id;
            return (
              <div
                key={a.id}
                onClick={() => a.earned && setSelected(isSelected ? null : a.id)}
                style={{
                  background: isSelected
                    ? 'rgba(167,139,250,0.18)'
                    : a.earned ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? 'rgba(167,139,250,0.5)' : a.earned ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 16, padding: '14px 12px',
                  cursor: a.earned ? 'pointer' : 'default',
                  transition: 'transform 0.15s, background 0.15s',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                <div style={{ fontSize: isSelected ? 36 : 28, marginBottom: 8, transition: 'font-size 0.15s', filter: a.earned ? 'none' : 'grayscale(1) opacity(0.3)' }}>
                  {meta.emoji}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: a.earned ? '#fff' : 'rgba(255,255,255,0.25)', marginBottom: 4 }}>
                  {meta.title}
                </div>
                <div style={{ fontSize: 11, color: a.earned ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)', lineHeight: 1.4 }}>
                  {meta.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Share popup for selected */}
        {selected && selectedMeta && (
          <div style={{
            position: 'sticky', bottom: 0,
            marginTop: 16,
            background: 'rgba(20,15,35,0.95)',
            borderTop: '1px solid rgba(167,139,250,0.2)',
            padding: '14px 0 4px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 28 }}>{selectedMeta.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{selectedMeta.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{selectedMeta.desc}</div>
            </div>
            <button
              onClick={() => shareOne(selected)}
              style={{
                padding: '9px 18px', border: 'none', borderRadius: 20,
                background: '#a78bfa', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              }}
            >
              Поделиться
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
