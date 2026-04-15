import { useState, useEffect } from 'react';
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
    label: '1. Ситуация-триггер',
    hint: 'Что именно произошло? Что запустило схему?',
    placeholder: 'Например: мне не ответили на сообщение, попросили переделать работу...',
  },
  {
    key: 'feelings',
    label: '2. Эмоции и тело',
    hint: 'Что ты почувствовал(а)? Где это ощущалось физически?',
    placeholder: 'Например: тревога, комок в горле, напряжение в плечах, хотелось уйти...',
  },
  {
    key: 'thoughts',
    label: '3. Голос схемы',
    hint: 'Что схема говорит о тебе, о других, о будущем?',
    placeholder: 'Например: «я всегда один», «меня никто не ценит», «всё рухнет»...',
  },
  {
    key: 'origins',
    label: '4. Детские корни',
    hint: 'Когда это впервые появилось? Что происходило в семье?',
    placeholder: 'Например: мама часто критиковала, папа уходил когда злился...',
    optional: true,
  },
  {
    key: 'reality',
    label: '5. Реальность vs схема',
    hint: 'Какие факты противоречат голосу схемы? Что на самом деле правда?',
    placeholder: 'Например: есть люди которым я важен, я справлялся с трудным раньше...',
  },
  {
    key: 'healthyView',
    label: '6. Голос Здорового Взрослого',
    hint: 'Что бы сказал мудрый, заботливый внутренний голос?',
    placeholder: 'Например: «эта боль из прошлого, сейчас я в безопасности», «я достаточно хорош»...',
  },
  {
    key: 'behavior',
    label: '7. Здоровое действие',
    hint: 'Что можно сделать иначе прямо сейчас вместо привычной реакции?',
    placeholder: 'Например: сказать о своих чувствах, взять паузу, позвонить другу...',
  },
];

interface Props {
  schemaId: string;
  onClose: () => void;
}

export function SchemaIntroSheet({ schemaId, onClose }: Props) {
  const schema = getSchemaById(schemaId);
  const [data, setData] = useState<SchemaIntroData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
  const set = (key: keyof SchemaIntroData, value: string) =>
    setData(prev => ({ ...prev, [key]: value }));
  const hasAny = Object.values(data).some(v => v.trim().length > 0);

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem(LS_KEY(schemaId), JSON.stringify(data));
    try {
      await api.saveSchemaNote({ schemaId, ...data });
    } catch {}
    setSaving(false);
    setSaved(true);
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

        <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 20 }}>
          Заполни карточку в момент когда схема активировалась — или по свежим следам.
          Со временем ты научишься узнавать её раньше.
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
