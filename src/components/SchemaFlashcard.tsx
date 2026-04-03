import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { TherapyNote } from './TherapyNote';

const STORAGE_KEY = 'schema_flashcards';

interface FlashcardEntry {
  id: string;
  date: string;
  trigger: string;
  feeling: string;
  schemaMode: string;
  usualReaction: string;
  healthyResponse: string;
}

const STEPS = [
  {
    key: 'trigger' as const,
    emoji: '⚡',
    label: 'Что произошло?',
    hint: 'Конкретная ситуация, слово, взгляд — что запустило это состояние',
    placeholder: 'Например: на совещании меня перебили, и я замолчал...',
  },
  {
    key: 'feeling' as const,
    emoji: '💛',
    label: 'Что я чувствую?',
    hint: 'Эмоции и ощущения в теле прямо сейчас или тогда',
    placeholder: 'Например: стыд, сжатость в груди, хочется исчезнуть...',
  },
  {
    key: 'schemaMode' as const,
    emoji: '🧩',
    label: 'Какой режим или схема?',
    hint: 'Что в тебе сейчас говорит — Критик, Уязвимый ребёнок, Защитник?',
    placeholder: 'Например: Требовательный критик — «ты облажался»...',
  },
  {
    key: 'usualReaction' as const,
    emoji: '🔄',
    label: 'Как я обычно реагирую?',
    hint: 'Что ты делаешь (или НЕ делаешь) в этом состоянии — копинг',
    placeholder: 'Например: замолкаю, избегаю, переедаю, злюсь на себя...',
  },
  {
    key: 'healthyResponse' as const,
    emoji: '🌿',
    label: 'Что сказал бы Здоровый взрослый?',
    hint: 'Что было бы мудро и заботливо по отношению к себе в этой ситуации',
    placeholder: 'Например: это нормально ошибаться, я могу высказаться в следующий раз...',
  },
];

type StepKey = 'trigger' | 'feeling' | 'schemaMode' | 'usualReaction' | 'healthyResponse';
type Draft = Record<StepKey, string>;

const EMPTY_DRAFT: Draft = { trigger: '', feeling: '', schemaMode: '', usualReaction: '', healthyResponse: '' };

function loadCards(): FlashcardEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

interface Props { onClose: () => void }

export function SchemaFlashcard({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState<FlashcardEntry[]>(() => loadCards().slice(0, 3));

  const cur = STEPS[step];
  const val = draft[cur.key];
  const canNext = val.trim().length > 0;
  const isLast = step === STEPS.length - 1;

  function handleNext() {
    if (!canNext) return;
    if (isLast) {
      const entry: FlashcardEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        ...draft,
      };
      const cards = [entry, ...loadCards()].slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      setHistory(cards.slice(0, 3));
      setDone(true);
    } else {
      setStep(s => s + 1);
    }
  }

  function handleNew() {
    setDraft(EMPTY_DRAFT);
    setStep(0);
    setDone(false);
  }

  if (done) {
    return (
      <BottomSheet onClose={onClose}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Сохранено</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Флэшкарта помогает увидеть паттерн — и найти путь к себе
            </div>
          </div>

          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
            {STEPS.map(s => (
              <div key={s.key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  {s.emoji} {s.label}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{draft[s.key]}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleNew} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1px solid rgba(167,139,250,0.2)', background: 'transparent', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Ещё одну
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Готово
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Схема-флэшкарта</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Что сейчас происходит?</div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{step + 1} / {STEPS.length}</div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? '#a78bfa' : 'rgba(255,255,255,0.1)', transition: 'background 0.2s' }} />
          ))}
        </div>

        {/* Step */}
        <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>{cur.emoji}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{cur.label}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{cur.hint}</div>
        </div>

        <textarea
          autoFocus
          value={val}
          onChange={e => setDraft(d => ({ ...d, [cur.key]: e.target.value }))}
          placeholder={cur.placeholder}
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: `1px solid ${val.trim() ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '12px 14px', color: '#fff', fontSize: 14, lineHeight: 1.55, resize: 'none', outline: 'none', fontFamily: 'inherit', marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: '13px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>
              ←
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext}
            style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: canNext ? (isLast ? 'rgba(52,211,153,0.2)' : 'rgba(167,139,250,0.2)') : 'rgba(255,255,255,0.07)', color: canNext ? (isLast ? '#34d399' : '#a78bfa') : 'rgba(255,255,255,0.25)', fontSize: 15, fontWeight: 600, cursor: canNext ? 'pointer' : 'default', transition: 'all 0.2s' }}
          >
            {isLast ? 'Сохранить' : 'Дальше →'}
          </button>
        </div>

        {history.length > 0 && step === 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 10 }}>Предыдущие</div>
            {history.map(h => (
              <div key={h.id} style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>{h.date}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }} >{h.trigger}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20 }}><TherapyNote compact /></div>
      </div>
    </BottomSheet>
  );
}
