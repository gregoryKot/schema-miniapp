import { useState, useEffect, useRef } from 'react';
import { BottomSheet } from './BottomSheet';
import { TherapyNote } from './TherapyNote';
import { SCHEMA_DOMAINS } from '../schemaTherapyData';
import { api } from '../api';

const LS_KEY = (id: string) => `schema_intro_${id}`;

const VAR_HEX: Record<string, string> = {
  'var(--accent-red)':    '#f87171',
  'var(--accent-orange)': '#fb923c',
  'var(--accent-yellow)': '#facc15',
  'var(--accent-green)':  '#34d399',
  'var(--accent-indigo)': '#818cf8',
  'var(--accent-blue)':   '#60a5fa',
  'var(--accent)':        '#a78bfa',
};

function getSchemaById(id: string) {
  for (const domain of SCHEMA_DOMAINS) {
    const schema = domain.schemas.find(s => s.id === id);
    if (schema) return { ...schema, domainName: domain.domain, color: domain.color };
  }
  return null;
}

export interface SchemaIntroData {
  triggers: string;    // ситуация-триггер
  feelings: string;    // эмоции и тело
  thoughts: string;    // голос схемы
  origins: string;     // детские корни
  reality: string;     // реальность vs схема
  healthyView: string; // голос Здорового Взрослого
  behavior: string;    // здоровое действие
}

const EMPTY: SchemaIntroData = {
  triggers: '', feelings: '', thoughts: '',
  origins: '', reality: '', healthyView: '', behavior: '',
};

const QUESTIONS: {
  key: keyof SchemaIntroData;
  label: string;
  hint: string;
  placeholder: string;
  optional?: boolean;
}[] = [
  {
    key: 'triggers',
    label: '1. Что обычно запускает эту схему?',
    hint: 'Ситуации, слова, интонации, обстановка — типичные триггеры',
    placeholder: 'Например: когда не отвечают на сообщения; когда критикуют при других; когда чувствую, что меня игнорируют...',
  },
  {
    key: 'feelings',
    label: '2. Как она проявляется в теле и чувствах?',
    hint: 'Типичные эмоции и телесные ощущения когда схема активна',
    placeholder: 'Например: тревога и ком в горле; злость и напряжение в груди; ощущение пустоты...',
  },
  {
    key: 'thoughts',
    label: '3. Что говорит голос схемы?',
    hint: 'Устойчивые убеждения и мысли — про себя, про других, про будущее',
    placeholder: 'Например: «меня никто не ценит», «я всегда облажаюсь», «люди уйдут если узнают меня»...',
  },
  {
    key: 'origins',
    label: '4. Откуда эта схема пришла?',
    hint: 'Опыт из детства или юности — что сформировало этот паттерн',
    placeholder: 'Например: папа часто говорил что я недостаточно стараюсь; в школе я чувствовал себя чужим...',
    optional: true,
  },
  {
    key: 'reality',
    label: '5. Что реально vs что говорит схема?',
    hint: 'Факты и доказательства которые противоречат голосу схемы',
    placeholder: 'Например: есть люди которые ценят меня; я справлялся с трудным раньше; большинство прогнозов схемы не сбылись...',
  },
  {
    key: 'healthyView',
    label: '6. Слова Здорового Взрослого',
    hint: 'Что зрелая, сострадательная часть тебя говорит про эту схему',
    placeholder: 'Например: «эта боль из прошлого, сейчас я в безопасности», «я достаточно хорош», «я могу справиться»...',
  },
  {
    key: 'behavior',
    label: '7. Что помогает когда схема активна?',
    hint: 'Действия, практики, слова которые работают вместо привычных реакций',
    placeholder: 'Например: написать что чувствую; позвонить другу; короткая медитация; напомнить себе здоровый взгляд...',
  },
];

interface Props {
  schemaId: string;
  onClose: () => void;
  onComplete?: () => void;
}

export function SchemaIntroSheet({ schemaId, onClose, onComplete }: Props) {
  const schema = getSchemaById(schemaId);
  const [data, setData] = useState<SchemaIntroData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, []);

  useEffect(() => {
    // Load from server first, fallback to localStorage
    api.getSchemaNotes().then(notes => {
      const note = notes.find(n => n.schemaId === schemaId);
      if (note) {
        setData({
          triggers:    note.triggers,
          feelings:    note.feelings,
          thoughts:    note.thoughts,
          origins:     note.origins,
          reality:     note.reality,
          healthyView: note.healthyView,
          behavior:    note.behavior,
        });
      } else {
        const stored = localStorage.getItem(LS_KEY(schemaId));
        if (stored) {
          try { setData(JSON.parse(stored)); } catch {}
        }
      }
    }).catch(() => {
      const stored = localStorage.getItem(LS_KEY(schemaId));
      if (stored) {
        try { setData(JSON.parse(stored)); } catch {}
      }
    });
  }, [schemaId]);

  if (!schema) return null;

  const colorHex = VAR_HEX[schema.color] ?? '#a78bfa';
  const set = (key: keyof SchemaIntroData, value: string) => {
    const newData = { ...data, [key]: value };
    setData(newData);
    localStorage.setItem(LS_KEY(schemaId), JSON.stringify(newData));
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      api.saveSchemaNote({ schemaId, ...newData }).catch(() => {});
    }, 1500);
  };
  const hasAny = Object.values(data).some(v => v.trim().length > 0);

  const handleSave = async () => {
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null; }
    setSaving(true);
    localStorage.setItem(LS_KEY(schemaId), JSON.stringify(data));
    try { await api.saveSchemaNote({ schemaId, ...data }); } catch {}
    setSaving(false);
    setSaved(true);
    onComplete?.();
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: `${colorHex}18`, border: `1px solid ${colorHex}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            {(schema as any).emoji ?? '●'}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{schema.name}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: schema.color, marginTop: 2 }}>
              {schema.domainName}
            </div>
          </div>
        </div>

        <div style={{
          background: `${colorHex}12`, border: `1px solid ${colorHex}25`,
          borderRadius: 12, padding: '10px 14px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.55 }}>
            {schema.desc}
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 12 }}>
          Это твоя личная карточка схемы — опиши как она работает именно у тебя. Заполняй постепенно, обновляй по мере понимания.
        </div>
        <div style={{ background: 'rgba(var(--fg-rgb),0.04)', border: '1px solid rgba(var(--fg-rgb),0.08)', borderRadius: 10, padding: '8px 12px', marginBottom: 20, fontSize: 12, color: 'var(--text-faint)' }}>
          💡 Для записи конкретного эпизода используй Дневник схем
        </div>

        {QUESTIONS.map(q => (
          <div key={q.key} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{q.label}</div>
              {q.optional && (
                <span style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>необязательно</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 8 }}>{q.hint}</div>
            <textarea
              value={data[q.key]}
              onChange={e => set(q.key, e.target.value)}
              placeholder={q.placeholder}
              rows={2}
              style={{
                width: '100%', background: 'rgba(var(--fg-rgb),0.05)',
                border: `1px solid ${data[q.key].trim() ? `${colorHex}40` : 'rgba(var(--fg-rgb),0.1)'}`,
                borderRadius: 12, padding: '10px 12px',
                color: 'var(--text)', fontSize: 14, lineHeight: 1.5, outline: 'none',
                transition: 'border-color 0.2s', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 16 }}>
          <TherapyNote compact />
        </div>

        <button
          onClick={handleSave}
          disabled={!hasAny || saving}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: hasAny
              ? `linear-gradient(135deg, ${colorHex}dd, ${colorHex}88)`
              : 'rgba(var(--fg-rgb),0.06)',
            color: hasAny ? '#ffffff' : 'var(--text-faint)',
            fontSize: 15, fontWeight: 600,
            cursor: hasAny ? 'pointer' : 'default', transition: 'all 0.2s',
          }}
        >
          {saving ? 'Сохраняем…' : saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>
    </BottomSheet>
  );
}
