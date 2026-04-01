import { useState, useEffect } from 'react';
import { api, UserPractice } from '../api';
import { Loader } from './Loader';
import { getTelegramSafeTop } from '../utils/safezone';
import { COLORS } from '../types';
import { NEED_DATA } from '../needData';

const NEED_IDS = ['attachment', 'autonomy', 'expression', 'play', 'limits'];
const NEED_NAMES: Record<string, string> = {
  attachment: 'Привязанность', autonomy: 'Автономия',
  expression: 'Выражение чувств', play: 'Спонтанность', limits: 'Границы',
};

interface Props {
  onClose: () => void;
}

export function PracticesScreen({ onClose }: Props) {
  const safeTop = getTelegramSafeTop();
  const [needIdx, setNeedIdx] = useState(0);
  const [practices, setPractices] = useState<UserPractice[] | null>(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPractices(null);
    api.getPractices(NEED_IDS[needIdx]).then(setPractices).catch(() => setPractices([]));
  }, [needIdx]);

  async function handleAdd() {
    const text = input.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      await api.addPractice(NEED_IDS[needIdx], text);
      setInput('');
      api.getPractices(NEED_IDS[needIdx]).then(setPractices).catch(() => {});
    } catch {}
    setSaving(false);
  }

  function handleDelete(id: number) {
    setPractices(prev => prev?.filter(x => x.id !== id) ?? null);
    api.deletePractice(id).catch(() => {});
  }

  const needColor = COLORS[NEED_IDS[needIdx]] ?? '#a78bfa';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#060a12', overflowY: 'auto', paddingTop: safeTop }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 8px' }}>
        <span onClick={onClose} style={{ fontSize: 26, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: 1 }}>‹</span>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Мои практики</span>
      </div>

      <div style={{ padding: '12px 16px 140px' }}>
        {/* Need tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {NEED_IDS.map((id, i) => {
            const color = COLORS[id] ?? '#888';
            const emoji = NEED_DATA[id]?.emoji ?? '';
            const active = i === needIdx;
            return (
              <div key={id} onClick={() => { setNeedIdx(i); setInput(''); }}
                style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, background: active ? color + '28' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? color + '55' : 'transparent'}`, color: active ? color : 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: active ? 600 : 400 }}>
                {emoji} {NEED_NAMES[id]}
              </div>
            );
          })}
        </div>

        {/* Practices list */}
        {!practices ? (
          <Loader minHeight="20vh" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {practices.length === 0 && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '20px 0', textAlign: 'center' }}>
                Пока пусто — добавь первую практику ниже
              </div>
            )}
            {practices.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '13px 14px' }}>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', flex: 1, lineHeight: 1.5 }}>{p.text}</div>
                <div onClick={() => handleDelete(p.id as number)}
                  style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: 'rgba(255,100,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: 'rgba(255,100,100,0.5)' }}>×</div>
              </div>
            ))}
          </div>
        )}

        {/* Add input */}
        <div style={{ marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
          Небольшое конкретное действие, которое помогает — например «позвонить другу» или «прогулка 20 минут»
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Добавить практику..."
            maxLength={200}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim() || saving}
            style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: input.trim() ? needColor : 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0 }}
          >+</button>
        </div>
      </div>
    </div>
  );
}
