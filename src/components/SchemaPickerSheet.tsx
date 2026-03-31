import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { SCHEMA_DOMAINS } from '../diaryData';

interface Props {
  selected: string[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
}

export function SchemaPickerSheet({ selected, onSave, onClose }: Props) {
  const [ids, setIds] = useState<string[]>(selected);

  const toggle = (id: string) =>
    setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Мои схемы</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.5 }}>
          Выбери схемы, которые тебе близки. Можно без теста — если ты уже знаешь свои.
        </div>

        {SCHEMA_DOMAINS.map(domain => (
          <div key={domain.id} style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: domain.color, marginBottom: 8, opacity: 0.8,
            }}>
              {domain.domain}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {domain.schemas.map(s => {
                const active = ids.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    style={{
                      padding: '7px 13px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: active ? `${domain.color}22` : 'rgba(255,255,255,0.05)',
                      color: active ? domain.color : 'rgba(255,255,255,0.5)',
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      outline: active ? `1px solid ${domain.color}55` : '1px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() => { onSave(ids); onClose(); }}
          style={{
            marginTop: 8, width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Сохранить{ids.length > 0 ? ` (${ids.length})` : ''}
        </button>
      </div>
    </BottomSheet>
  );
}
