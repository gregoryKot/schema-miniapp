import { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { getModeById } from '../diaryData';

const STORAGE_KEY = (modeId: string) => `mode_intro_${modeId}`;

interface IntroData {
  triggers: string;
  feelings: string;
  thoughts: string;
  needs: string;
  behavior: string;
}

const EMPTY: IntroData = { triggers: '', feelings: '', thoughts: '', needs: '', behavior: '' };

const QUESTIONS: { key: keyof IntroData; label: string; hint: string; placeholder: string }[] = [
  {
    key: 'triggers',
    label: 'Когда активируется',
    hint: 'Ситуации, люди, слова — что запускает этот режим?',
    placeholder: 'Например: когда меня критикуют, когда нужно выступить...',
  },
  {
    key: 'feelings',
    label: 'Что чувствую',
    hint: 'Эмоции и ощущения в теле',
    placeholder: 'Например: тревога, комок в горле, напряжение в плечах...',
  },
  {
    key: 'thoughts',
    label: 'Что говорит внутри',
    hint: 'Убеждения, голос, монолог этого режима',
    placeholder: 'Например: «Я недостаточно хорош», «Лучше не рисковать»...',
  },
  {
    key: 'needs',
    label: 'Чего на самом деле хочет',
    hint: 'Глубинная потребность за этим режимом',
    placeholder: 'Например: безопасности, признания, контакта...',
  },
  {
    key: 'behavior',
    label: 'Как проявляется в поведении',
    hint: 'Что ты делаешь (или перестаёшь делать) в этом режиме',
    placeholder: 'Например: замолкаю, избегаю, злюсь, переусердствую...',
  },
];

interface Props {
  modeId: string;
  onClose: () => void;
}

export function ModeIntroSheet({ modeId, onClose }: Props) {
  const mode = getModeById(modeId);
  const [data, setData] = useState<IntroData>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(modeId));
    if (stored) {
      try { setData(JSON.parse(stored)); } catch {}
    }
  }, [modeId]);

  const set = (key: keyof IntroData, value: string) =>
    setData(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY(modeId), JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const hasAny = Object.values(data).some(v => v.trim().length > 0);

  if (!mode) return null;

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: `${mode.groupColor}18`,
            border: `1px solid ${mode.groupColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            {mode.emoji}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{mode.name}</div>
            <div style={{ fontSize: 12, color: mode.groupColor, fontWeight: 500, marginTop: 2 }}>
              Познакомиться с режимом
            </div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 20 }}>
          Ответь на вопросы — не торопись, это для себя. Чем честнее, тем точнее будет картина.
        </div>

        {QUESTIONS.map(q => (
          <div key={q.key} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{q.label}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{q.hint}</div>
            <textarea
              value={data[q.key]}
              onChange={e => set(q.key, e.target.value)}
              placeholder={q.placeholder}
              rows={2}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${data[q.key].trim() ? `${mode.groupColor}40` : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 12, padding: '10px 12px',
                color: '#fff', fontSize: 14, lineHeight: 1.5, outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={!hasAny}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: hasAny
              ? `linear-gradient(135deg, ${mode.groupColor}, ${mode.groupColor}bb)`
              : 'rgba(255,255,255,0.08)',
            color: hasAny ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: 16, fontWeight: 700,
            cursor: hasAny ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          {saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>
    </BottomSheet>
  );
}
