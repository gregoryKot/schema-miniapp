import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { SectionLabel } from './SectionLabel';
import { api } from '../api';

interface Props {
  defaultType?: 'diary_streak' | 'tracker_streak' | 'custom';
  clientId?: number; // for therapist assigning to client
  clientName?: string;
  onCreated: () => void;
  onClose: () => void;
}

const STREAK_OPTIONS = [3, 7, 14, 30];

export function TaskCreateSheet({ defaultType = 'custom', clientId, clientName, onCreated, onClose }: Props) {
  const [type, setType] = useState<'diary_streak' | 'tracker_streak' | 'custom'>(defaultType);
  const [targetDays, setTargetDays] = useState(7);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [needId, setNeedId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const NEED_LABELS: Record<string, string> = {
    attachment: 'Привязанность', autonomy: 'Автономия',
    expression: 'Выражение', play: 'Спонтанность', limits: 'Границы',
  };
  const NEED_IDS = ['attachment', 'autonomy', 'expression', 'play', 'limits'];

  const getAutoText = () => {
    if (type === 'diary_streak') return `Заполнять дневник ${targetDays} дней`;
    if (type === 'tracker_streak') return `Отмечать потребности ${targetDays} дней подряд`;
    return text;
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
        targetDays: type !== 'custom' ? targetDays : undefined,
        needId: needId || undefined,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {(['diary_streak', 'tracker_streak', 'custom'] as const).map(t => {
          const labels: Record<string, string> = {
            diary_streak: '📔 Дневник — N дней подряд',
            tracker_streak: '📊 Трекер потребностей — N дней',
            custom: '✏️ Своё задание',
          };
          return (
            <div
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                background: type === t ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${type === t ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                fontSize: 14, color: type === t ? '#a78bfa' : 'rgba(255,255,255,0.7)',
              }}
            >
              {labels[t]}
            </div>
          );
        })}
      </div>

      {/* Streak day picker */}
      {type !== 'custom' && (
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

      {/* Need tag (optional) */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel mb={8}>Потребность (необязательно)</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <div
            onClick={() => setNeedId('')}
            style={{
              padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
              background: !needId ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${!needId ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: !needId ? '#fff' : 'rgba(255,255,255,0.4)',
            }}
          >
            Любая
          </div>
          {NEED_IDS.map(nid => (
            <div
              key={nid}
              onClick={() => setNeedId(nid === needId ? '' : nid)}
              style={{
                padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                background: needId === nid ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${needId === nid ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: needId === nid ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              }}
            >
              {NEED_LABELS[nid]}
            </div>
          ))}
        </div>
      </div>

      {/* Due date (optional, for custom only or therapist) */}
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
