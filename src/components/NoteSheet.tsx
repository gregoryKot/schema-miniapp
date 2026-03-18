import { useState, useEffect } from 'react';
import { api } from '../api';
import { BottomSheet } from './BottomSheet';
import { SectionLabel } from './SectionLabel';

interface Props {
  date: string;
  onClose: () => void;
}

export function NoteSheet({ date, onClose }: Props) {
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.getNote(date)
      .then(r => { setText(r.text ?? ''); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [date]);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    setError(false);
    try {
      await api.saveNote(date, text.trim());
      onClose();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 8 }}>
        <SectionLabel purple mb={16}>Заметка к дню</SectionLabel>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Что происходило сегодня? Любая мысль..."
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
        {error && (
          <div style={{ fontSize: 12, color: 'rgba(255,100,100,0.8)', marginBottom: 10 }}>
            Не удалось сохранить. Попробуй ещё раз.
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={!text.trim() || saving}
          style={{
            width: '100%', padding: '13px 0', border: 'none', borderRadius: 12,
            background: text.trim() ? '#a78bfa' : 'rgba(255,255,255,0.08)',
            color: text.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: 15, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'default',
          }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </BottomSheet>
  );
}
