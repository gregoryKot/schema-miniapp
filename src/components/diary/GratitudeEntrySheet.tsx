import { useState, useEffect } from 'react';
import { BottomSheet } from '../BottomSheet';
import { saveDraft, loadDraft, clearDraft } from '../../utils/drafts';
import { fmtDateLong, todayStr } from '../../utils/format';

interface Props {
  onClose: () => void;
  date: string;
  existingItems?: string[];
  onSave: (date: string, items: string[]) => Promise<void>;
}

export function GratitudeEntrySheet({ onClose, date, existingItems, onSave }: Props) {
  const existing = !existingItems ? loadDraft<{ items: string[] }>('gratitude') : null;
  const initItems = existingItems ?? existing?.data?.items ?? ['', '', ''];

  const [items, setItems] = useState<string[]>(initItems);
  const [saving, setSaving] = useState(false);

  const update = (i: number, v: string) => setItems(prev => prev.map((it, idx) => idx === i ? v : it));

  useEffect(() => {
    if (!existingItems) saveDraft('gratitude', { items });
  }, [items, existingItems]);

  const canSave = items.filter(it => it.trim().length > 0).length >= 1;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave(date, items.filter(it => it.trim().length > 0));
      clearDraft('gratitude');
    } catch {
      // save failed — draft preserved for retry
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const dateLabel = date === todayStr() ? 'сегодня' : fmtDateLong(date);

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Дневник благодарности</div>
        <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 24 }}>
          {dateLabel}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 16, lineHeight: 1.5 }}>
          Три вещи, за которые ты благодарен. Даже маленькие — они тоже считаются.
        </div>

        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0, marginTop: 2,
              background: item.trim() ? '#34d39944' : 'rgba(var(--fg-rgb),0.06)',
              border: item.trim() ? '1px solid #34d399' : '1px solid rgba(var(--fg-rgb),0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'var(--accent-green)', fontWeight: 700,
            }}>
              {i + 1}
            </div>
            <textarea
              value={item}
              onChange={e => update(i, e.target.value)}
              placeholder={['Что-то хорошее, что случилось...', 'Кто-то или что-то, что помогло...', 'Момент, который запомнился...'][i]}
              rows={2}
              style={{
                flex: 1, background: 'rgba(var(--fg-rgb),0.05)', border: '1px solid rgba(var(--fg-rgb),0.1)',
                borderRadius: 12, padding: '10px 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.5,
                outline: 'none',
              }}
            />
          </div>
        ))}

        {items.length < 5 && (
          <button onClick={() => setItems(prev => [...prev, ''])} style={{
            background: 'rgba(var(--fg-rgb),0.05)', border: '1px dashed rgba(var(--fg-rgb),0.15)',
            borderRadius: 12, padding: '10px', width: '100%', color: 'var(--text-sub)',
            fontSize: 13, cursor: 'pointer', marginBottom: 4,
          }}>
            + ещё одна вещь
          </button>
        )}

        <button onClick={handleSave} disabled={!canSave || saving} style={{
          marginTop: 20, width: '100%', padding: '14px', borderRadius: 14,
          background: canSave ? 'var(--accent-green)' : 'rgba(var(--fg-rgb),0.1)',
          color: canSave ? 'var(--bg)' : 'rgba(var(--fg-rgb),0.3)',
          border: 'none', fontSize: 16, fontWeight: 700, cursor: canSave ? 'pointer' : 'default',
        }}>
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </button>
      </div>
    </BottomSheet>
  );
}
