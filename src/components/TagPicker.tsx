import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

const TAGS = [
  { id: 'work',         label: 'Работа',      emoji: '💼' },
  { id: 'relations',    label: 'Отношения',   emoji: '🤝' },
  { id: 'health',       label: 'Здоровье',    emoji: '🏃' },
  { id: 'loneliness',   label: 'Одиночество', emoji: '🌙' },
  { id: 'rest',         label: 'Отдых',       emoji: '🛋️' },
  { id: 'family',       label: 'Семья',       emoji: '🏠' },
  { id: 'creativity',   label: 'Творчество',  emoji: '🎨' },
  { id: 'anxiety',      label: 'Тревога',     emoji: '😰' },
  { id: 'joy',          label: 'Радость',     emoji: '✨' },
  { id: 'body',         label: 'Тело',        emoji: '💆' },
];

interface Props {
  initialTags?: string[];
  onDone: (tags: string[]) => void;
  onSkip: () => void;
}

export function TagPicker({ initialTags = [], onDone, onSkip }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialTags));

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <BottomSheet onClose={onSkip}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
          Что повлияло на день?
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
          Необязательно — но через неделю это станет инсайтом
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {TAGS.map(t => {
            const on = selected.has(t.id);
            return (
              <div
                key={t.id}
                onClick={() => toggle(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
                  background: on ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${on ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: on ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                  fontSize: 13, fontWeight: on ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onSkip}
            style={{
              flex: 1, padding: '12px 0', border: 'none', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
              fontSize: 14, cursor: 'pointer',
            }}
          >Пропустить</button>
          <button
            onClick={() => onDone([...selected])}
            style={{
              flex: 2, padding: '12px 0', border: 'none', borderRadius: 12,
              background: selected.size > 0 ? '#a78bfa' : 'rgba(167,139,250,0.3)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >Готово</button>
        </div>
      </div>
    </BottomSheet>
  );
}
