import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { SectionLabel } from './SectionLabel';
import { api } from '../api';

type TaskType = 'diary_streak' | 'tracker_streak' | 'belief_check' | 'letter_to_self' | 'safe_place' | 'flashcard' | 'custom';

interface Props {
  clientId?: number;
  clientName?: string;
  defaultType?: TaskType;
  onCreated: () => void;
  onClose: () => void;
}

const STREAK_OPTIONS = [3, 7, 14, 30];

const TASK_OPTIONS: { type: TaskType; emoji: string; label: string; sub: string; hasStreak?: boolean }[] = [
  { type: 'diary_streak',   emoji: '📔', label: 'Дневник',              sub: 'Заполнять N дней подряд',      hasStreak: true },
  { type: 'tracker_streak', emoji: '📊', label: 'Трекер потребностей',  sub: 'Отмечать N дней подряд',       hasStreak: true },
  { type: 'belief_check',   emoji: '🔍', label: 'Проверить убеждение',   sub: 'Собрать доказательства за и против' },
  { type: 'letter_to_self', emoji: '✉️', label: 'Письмо себе',           sub: 'Написать Уязвимому Ребёнку' },
  { type: 'safe_place',     emoji: '🏡', label: 'Безопасное место',      sub: 'Описать и перечитывать' },
  { type: 'flashcard',      emoji: '🆘', label: 'Мне сейчас плохо',      sub: 'Разобрать ситуацию — 5 шагов' },
  { type: 'custom',         emoji: '✏️', label: 'Своё задание',          sub: 'Любой текст' },
];

export function TaskCreateSheet({ clientId, clientName, defaultType, onCreated, onClose }: Props) {
  const [type, setType] = useState<TaskType>(defaultType ?? 'diary_streak');
  const [targetDays, setTargetDays] = useState(7);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selected = TASK_OPTIONS.find(o => o.type === type)!;

  const getAutoText = (): string => {
    switch (type) {
      case 'diary_streak':    return `Заполнять дневник ${targetDays} дней подряд`;
      case 'tracker_streak':  return `Отмечать потребности ${targetDays} дней подряд`;
      case 'belief_check':    return 'Проверить убеждение';
      case 'letter_to_self':  return 'Написать письмо Уязвимому Ребёнку';
      case 'safe_place':      return 'Описать Безопасное место';
      case 'flashcard':       return 'Разобрать сложную ситуацию по шагам';
      default:                return text;
    }
  };

  async function handleCreate() {
    const finalText = getAutoText().trim();
    if (type === 'custom' && !finalText) { setError('Введи описание задания'); return; }
    setSaving(true);
    setError('');
    try {
      await api.createTask({
        type,
        text: finalText,
        targetDays: selected.hasStreak ? targetDays : undefined,
        dueDate: dueDate || undefined,
        clientId,
      });
      onCreated();
    } catch {
      setError('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet onClose={onClose} zIndex={200}>
      <SectionLabel purple mb={16}>
        {clientName ? `Задание для ${clientName}` : 'Новое задание'}
      </SectionLabel>

      {/* Type selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        {TASK_OPTIONS.map(opt => (
          <div
            key={opt.type}
            onClick={() => setType(opt.type)}
            style={{
              padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
              background: type === opt.type ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${type === opt.type ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)'}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{opt.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: type === opt.type ? '#a78bfa' : 'rgba(255,255,255,0.8)' }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{opt.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Streak day picker */}
      {selected.hasStreak && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel mb={8}>Цель в днях</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {STREAK_OPTIONS.map(d => (
              <div
                key={d}
                onClick={() => setTargetDays(d)}
                style={{
                  flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 10, cursor: 'pointer',
                  background: targetDays === d ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${targetDays === d ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
                  fontSize: 14, fontWeight: 600, color: targetDays === d ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom text */}
      {type === 'custom' && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel mb={8}>Описание задания</SectionLabel>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Например: позвонить другу раз в неделю"
            style={{
              width: '100%', minHeight: 72, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
              padding: '10px 12px', color: '#fff', fontSize: 14, resize: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Due date */}
      {(type === 'custom' || clientId) && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel mb={8}>Срок (необязательно)</SectionLabel>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
              padding: '10px 12px', color: '#fff', fontSize: 14, boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {error && <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>{error}</div>}

      <button
        onClick={handleCreate}
        disabled={saving}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
          background: saving ? 'rgba(167,139,250,0.3)' : '#a78bfa',
          color: '#fff', fontSize: 15, fontWeight: 600, cursor: saving ? 'default' : 'pointer',
        }}
      >
        {saving ? 'Сохраняю...' : 'Создать задание'}
      </button>
    </BottomSheet>
  );
}
