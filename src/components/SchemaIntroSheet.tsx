import { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { TherapyNote } from './TherapyNote';
import { SCHEMA_DOMAINS } from '../schemaTherapyData';

const STORAGE_KEY = (id: string) => `schema_intro_${id}`;

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

interface IntroData {
  triggers: string;
  feelings: string;
  thoughts: string;
  behavior: string;
}

const EMPTY: IntroData = { triggers: '', feelings: '', thoughts: '', behavior: '' };

const QUESTIONS: { key: keyof IntroData; label: string; hint: string; placeholder: string }[] = [
  {
    key: 'triggers',
    label: 'Когда активируется',
    hint: 'Ситуации, люди, слова — что запускает эту схему?',
    placeholder: 'Например: когда меня критикуют, когда остаюсь один…',
  },
  {
    key: 'feelings',
    label: 'Что чувствую',
    hint: 'Эмоции и ощущения в теле',
    placeholder: 'Например: тревога, тяжесть в груди, хочется исчезнуть…',
  },
  {
    key: 'thoughts',
    label: 'Что говорит схема',
    hint: 'Убеждение, которое она внушает',
    placeholder: 'Например: «меня никто не любит», «я недостаточно хорош»…',
  },
  {
    key: 'behavior',
    label: 'Как я обычно реагирую',
    hint: 'Что делаю или перестаю делать в этом состоянии',
    placeholder: 'Например: ухожу в себя, цепляюсь, злюсь, стараюсь угодить…',
  },
];

interface Props {
  schemaId: string;
  onClose: () => void;
}

export function SchemaIntroSheet({ schemaId, onClose }: Props) {
  const schema = getSchemaById(schemaId);
  const [data, setData] = useState<IntroData>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(schemaId));
    if (stored) {
      try { setData(JSON.parse(stored)); } catch {}
    }
  }, [schemaId]);

  if (!schema) return null;

  const colorHex = VAR_HEX[schema.color] ?? '#a78bfa';
  const set = (key: keyof IntroData, value: string) =>
    setData(prev => ({ ...prev, [key]: value }));
  const hasAny = Object.values(data).some(v => v.trim().length > 0);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY(schemaId), JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
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
          Ответь честно — это личная карточка только для тебя. Чем точнее, тем яснее видна схема.
        </div>

        {QUESTIONS.map(q => (
          <div key={q.key} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{q.label}</div>
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
          disabled={!hasAny}
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
          {saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>
    </BottomSheet>
  );
}
