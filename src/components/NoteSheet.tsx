import { useState, useEffect } from 'react';
import { api } from '../api';
import { BottomSheet } from './BottomSheet';

interface Props {
  date: string;
  onClose: () => void;
}

export function NoteSheet({ date, onClose }: Props) {
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getNote(date).then(r => { setText(r.text ?? ''); setLoaded(true); });
  }, [date]);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    await api.saveNote(date, text.trim());
    setSaving(false);
    onClose();
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Заметка к дню
        </div>
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
