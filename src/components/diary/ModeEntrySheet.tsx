import { useState, useEffect } from 'react';
import { BottomSheet } from '../BottomSheet';
import { MODE_GROUPS } from '../../schemaTherapyData';
import { saveDraft, loadDraft, clearDraft } from '../../utils/drafts';

interface Props {
  onClose: () => void;
  onSave: (data: {
    modeId: string;
    situation: string;
    thoughts?: string;
    feelings?: string;
    bodyFeelings?: string;
    actions?: string;
    actualNeed?: string;
    childhoodMemories?: string;
  }) => Promise<void>;
}

const COLOR = 'var(--accent-blue)';

function FieldLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginTop: 20, marginBottom: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.4)', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function Area({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{
      width: '100%', background: 'rgba(var(--fg-rgb),0.05)', border: '1px solid rgba(var(--fg-rgb),0.1)',
      borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14, lineHeight: 1.5, outline: 'none',
    }} />
  );
}

export function ModeEntrySheet({ onClose, onSave }: Props) {
  const existing = loadDraft<{ modeId: string; situation: string; thoughts: string; feelings: string; bodyFeelings: string; actions: string; actualNeed: string; childhoodMemories: string }>('mode');
  const d = existing?.data;

  const [modeId, setModeId] = useState(d?.modeId ?? '');
  const [situation, setSituation] = useState(d?.situation ?? '');
  const [thoughts, setThoughts] = useState(d?.thoughts ?? '');
  const [feelings, setFeelings] = useState(d?.feelings ?? '');
  const [bodyFeelings, setBodyFeelings] = useState(d?.bodyFeelings ?? '');
  const [actions, setActions] = useState(d?.actions ?? '');
  const [actualNeed, setActualNeed] = useState(d?.actualNeed ?? '');
  const [childhoodMemories, setChildhoodMemories] = useState(d?.childhoodMemories ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    saveDraft('mode', { modeId, situation, thoughts, feelings, bodyFeelings, actions, actualNeed, childhoodMemories });
  }, [modeId, situation, thoughts, feelings, bodyFeelings, actions, actualNeed, childhoodMemories]);

  const canSave = modeId.length > 0 && situation.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({
        modeId, situation,
        thoughts: thoughts || undefined,
        feelings: feelings || undefined,
        bodyFeelings: bodyFeelings || undefined,
        actions: actions || undefined,
        actualNeed: actualNeed || undefined,
        childhoodMemories: childhoodMemories || undefined,
      });
      clearDraft('mode');
    } catch {
      // save failed — draft preserved for retry
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Дневник режимов</div>
        <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.4)', marginBottom: 4 }}>
          {existing ? 'Черновик восстановлен' : 'Новая запись'}
        </div>

        <FieldLabel title="1. Режим" hint="кто включился" />
        {MODE_GROUPS.map(group => (
          <div key={group.id} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: group.color, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group.group}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {group.items.map(m => {
                const sel = modeId === m.id;
                return (
                  <button key={m.id} onClick={() => setModeId(sel ? '' : m.id)} style={{
                    background: sel ? `${group.color}33` : 'rgba(var(--fg-rgb),0.06)',
                    border: sel ? `1px solid ${group.color}` : '1px solid transparent',
                    borderRadius: 16, padding: '6px 11px',
                    color: sel ? 'var(--chip-sel-text)' : 'rgba(var(--fg-rgb),0.6)',
                    fontSize: 13, cursor: 'pointer',
                  }}>
                    {m.emoji} {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <FieldLabel title="2. Ситуация" hint="что произошло?" />
        <Area value={situation} onChange={setSituation} placeholder="Опиши что случилось, где, с кем, когда?" />

        <FieldLabel title="3. Мысли" />
        <Area value={thoughts} onChange={setThoughts} placeholder="Что думаешь в этом режиме?" rows={2} />

        <FieldLabel title="4. Чувства" />
        <Area value={feelings} onChange={setFeelings} placeholder="Что чувствуешь? Страх, злость, пустота..." rows={2} />

        <FieldLabel title="5. Тело" hint="что ощутили?" />
        <Area value={bodyFeelings} onChange={setBodyFeelings} placeholder="Напряжение, сжатие, онемение, тяжесть..." rows={2} />

        <FieldLabel title="6. Действия" hint="что конкретно делали" />
        <Area value={actions} onChange={setActions} placeholder="Что делаешь или сделал/а в этом режиме?" rows={2} />

        <FieldLabel title="7. Что на самом деле вам было нужно?" />
        <Area value={actualNeed} onChange={setActualNeed} placeholder="За этим режимом — какая настоящая потребность?" rows={2} />

        <FieldLabel title="8. Детские воспоминания" hint="связанные с ситуацией" />
        <Area value={childhoodMemories} onChange={setChildhoodMemories} placeholder="Напоминает ли что-то из детства? Похожие ситуации, ощущения..." rows={3} />

        <button onClick={handleSave} disabled={!canSave || saving} style={{
          marginTop: 24, width: '100%', padding: '14px', borderRadius: 14,
          background: canSave ? COLOR : 'rgba(var(--fg-rgb),0.1)',
          color: canSave ? '#fff' : 'rgba(var(--fg-rgb),0.3)',
          border: 'none', fontSize: 16, fontWeight: 600, cursor: canSave ? 'pointer' : 'default',
        }}>
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </button>
        {!canSave && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(var(--fg-rgb),0.3)', marginTop: 8 }}>
            Обязательно: выбери режим и опиши ситуацию
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
