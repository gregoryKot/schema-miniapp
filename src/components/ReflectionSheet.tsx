import { useState, useEffect } from 'react';
import { Need } from '../types';
import { NEED_DATA } from '../needData';
import { COLORS } from '../types';
import { api } from '../api';
import { BottomSheet } from './BottomSheet';
import { SectionLabel } from './SectionLabel';

interface Props {
  date: string;
  needs: Need[];
  ratings: Record<string, number>;
  onClose: () => void;
}

export function ReflectionSheet({ date, needs, ratings, onClose }: Props) {
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Find lowest-rated need
  const ratedNeeds = needs.filter(n => ratings[n.id] !== undefined);
  const lowestNeed = ratedNeeds.length > 0
    ? ratedNeeds.reduce((min, n) => (ratings[n.id] ?? 10) < (ratings[min.id] ?? 10) ? n : min)
    : null;

  const question = lowestNeed ? NEED_DATA[lowestNeed.id]?.question : null;
  const color = lowestNeed ? (COLORS[lowestNeed.id] ?? '#a78bfa') : '#a78bfa';

  useEffect(() => {
    api.getNote(date).then(r => { setText(r.text ?? ''); setLoaded(true); });
  }, [date]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.saveNote(date, text.trim());
      onClose();
    } catch {
      // save failed — still close, note typed locally
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 8 }}>
        <SectionLabel purple mb={16}>Рефлексия</SectionLabel>

        {question && (
          <div style={{
            background: color + '14',
            borderLeft: `3px solid ${color}`,
            borderRadius: '0 10px 10px 0',
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: 15,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.6,
          }}>
            {question}
          </div>
        )}

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Напиши, что приходит в голову..."
          maxLength={500}
          autoFocus={loaded}
          style={{
            width: '100%', minHeight: 120,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '12px 14px',
            color: '#fff', fontSize: 15, lineHeight: 1.6,
            resize: 'none', outline: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'right', marginTop: 4, marginBottom: 16 }}>
          {text.length}/500
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px 0', border: 'none', borderRadius: 12,
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Пропустить
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2, padding: '13px 0', border: 'none', borderRadius: 12,
              background: text.trim() ? '#a78bfa' : 'rgba(167,139,250,0.4)',
              color: '#fff',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
