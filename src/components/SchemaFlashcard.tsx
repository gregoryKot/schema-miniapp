import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { TherapyNote } from './TherapyNote';

const STORAGE_KEY = 'schema_flashcards';

interface FlashcardEntry {
  id: string;
  date: string;
  mode: string;
  reflection: string;
  needId: string;
  action: string;
}

const MODES = [
  {
    id: 'vulnerable_child',
    emoji: '😢',
    label: 'Уязвимый Ребёнок',
    desc: 'Грустно, страшно, одиноко, беспомощно',
    response: 'Здоровый Взрослый слышит тебя: твоя боль настоящая, и ты не один. Позволь себе побыть в этом — без самокритики.',
  },
  {
    id: 'angry_child',
    emoji: '😡',
    label: 'Злой Ребёнок',
    desc: 'Злость, раздражение, хочется взорваться',
    response: 'Злость — сигнал, что нарушено что-то важное. Не нужно ни давить её, ни выплёскивать. Давай выясним, что за ней стоит.',
  },
  {
    id: 'detached',
    emoji: '🔇',
    label: 'Отстранённый Защитник',
    desc: 'Пусто, онемело, всё равно, хочется исчезнуть',
    response: 'Ты отключился, чтобы не было больно — это понятно. Но ты в безопасности прямо сейчас. Можно чуть-чуть вернуться.',
  },
  {
    id: 'critic',
    emoji: '🪓',
    label: 'Внутренний Критик',
    desc: 'Стыд, «я облажался», «я недостаточно хорош»',
    response: 'Критик думает, что защищает тебя, но причиняет боль. Здоровый Взрослый говорит: ты достаточно хорош — прямо сейчас.',
  },
];

const NEEDS = [
  { id: 'attachment', emoji: '💙', label: 'Привязанность' },
  { id: 'autonomy', emoji: '🔑', label: 'Автономия' },
  { id: 'expression', emoji: '🎨', label: 'Выражение' },
  { id: 'play', emoji: '🎉', label: 'Игра и радость' },
  { id: 'limits', emoji: '🛡️', label: 'Границы' },
];

type Step = 'mode' | 'response' | 'need' | 'action';
const STEPS: Step[] = ['mode', 'response', 'need', 'action'];

function loadCards(): FlashcardEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

interface Props { onClose: () => void; onOpenTracker?: () => void; onComplete?: () => void; }

export function SchemaFlashcard({ onClose, onOpenTracker, onComplete }: Props) {
  const [grounded, setGrounded] = useState(false);
  const [step, setStep] = useState<Step>('mode');
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [done, setDone] = useState(false);
  const [allCards, setAllCards] = useState<FlashcardEntry[]>(() => loadCards());
  const [viewing, setViewing] = useState<FlashcardEntry | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const modeData = MODES.find(m => m.id === selectedMode);

  function save() {
    const entry: FlashcardEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      mode: selectedMode!,
      reflection,
      needId: selectedNeed!,
      action,
    };
    const cards = [entry, ...loadCards()].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    setAllCards(cards);
    setDone(true);
    onComplete?.();
  }

  function handleNew() {
    setStep('mode');
    setSelectedMode(null);
    setReflection('');
    setSelectedNeed(null);
    setAction('');
    setDone(false);
    setGrounded(false);
  }

  const progressBar = (
    <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIndex ? 'var(--accent)' : 'rgba(var(--fg-rgb),0.1)', transition: 'background 0.2s' }} />
      ))}
    </div>
  );

  // ── Viewing a past card ──
  if (viewing) {
    const modeInfo = MODES.find(m => m.id === viewing.mode);
    const needInfo = NEEDS.find(n => n.id === viewing.needId);
    return (
      <BottomSheet onClose={() => setViewing(null)} zIndex={300}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.25)', marginBottom: 14 }}>{viewing.date}</div>
          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 16, padding: '14px 16px' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Режим</div>
              <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.75)' }}>{modeInfo?.emoji ?? '🧩'} {modeInfo?.label ?? viewing.mode}</div>
            </div>
            {viewing.reflection ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Рефлексия</div>
                <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.75)', whiteSpace: 'pre-wrap' }}>{viewing.reflection}</div>
              </div>
            ) : null}
            {needInfo ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Потребность</div>
                <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.75)' }}>{needInfo.emoji} {needInfo.label}</div>
              </div>
            ) : null}
            {viewing.action ? (
              <div>
                <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Действие</div>
                <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.75)', whiteSpace: 'pre-wrap' }}>{viewing.action}</div>
              </div>
            ) : null}
          </div>
        </div>
      </BottomSheet>
    );
  }

  // ── History list ──
  if (showHistory) {
    return (
      <BottomSheet onClose={() => setShowHistory(false)} zIndex={300}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>История карточек</div>
          {allCards.length === 0 ? (
            <div style={{ fontSize: 14, color: 'rgba(var(--fg-rgb),0.3)', textAlign: 'center', paddingTop: 20 }}>Пока нет сохранённых карточек</div>
          ) : allCards.map(card => {
            const m = MODES.find(x => x.id === card.mode);
            const n = NEEDS.find(x => x.id === card.needId);
            return (
              <div key={card.id} onClick={() => setViewing(card)} style={{ padding: '11px 14px', background: 'rgba(var(--fg-rgb),0.03)', border: '1px solid rgba(var(--fg-rgb),0.06)', borderRadius: 12, marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.25)', marginBottom: 4 }}>{card.date}</div>
                <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.6)', lineHeight: 1.4 }}>
                  {m?.emoji ?? '🧩'} {m?.label ?? card.mode}
                  {n ? ` · ${n.emoji} ${n.label}` : ''}
                </div>
                {card.action ? (
                  <div style={{ fontSize: 12, color: 'rgba(52,211,153,0.5)', marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                    → {card.action}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </BottomSheet>
    );
  }

  // ── Done screen ──
  if (done) {
    const modeInfo = MODES.find(m => m.id === selectedMode);
    const needInfo = NEEDS.find(n => n.id === selectedNeed);
    return (
      <BottomSheet onClose={onClose}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Сохранено</div>
            <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.4)', lineHeight: 1.5 }}>
              Ты сделал шаг навстречу себе. Это уже немало.
            </div>
          </div>
          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.6)', lineHeight: 1.8 }}>
              <span style={{ color: 'rgba(var(--fg-rgb),0.3)' }}>Режим: </span>{modeInfo?.emoji} {modeInfo?.label}<br />
              {needInfo ? <><span style={{ color: 'rgba(var(--fg-rgb),0.3)' }}>Потребность: </span>{needInfo.emoji} {needInfo.label}<br /></> : null}
              {action ? <><span style={{ color: 'rgba(var(--fg-rgb),0.3)' }}>Шаг: </span>{action}</> : null}
            </div>
          </div>
          {onOpenTracker && (
            <button
              onClick={() => { onClose(); setTimeout(onOpenTracker!, 100); }}
              style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: '1px solid rgba(167,139,250,0.2)', background: 'transparent', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}
            >
              Открыть трекер потребностей →
            </button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleNew} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1px solid rgba(var(--fg-rgb),0.1)', background: 'transparent', color: 'rgba(var(--fg-rgb),0.4)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Ещё одну
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: 'rgba(167,139,250,0.15)', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Готово
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  // ── Grounding screen ──
  if (!grounded) {
    return (
      <BottomSheet onClose={onClose}>
        <div style={{ paddingTop: 4, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>💙</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
            Ты сделал правильно
          </div>
          <div style={{ fontSize: 14, color: 'rgba(var(--fg-rgb),0.55)', lineHeight: 1.8, marginBottom: 24 }}>
            То, что ты чувствуешь сейчас — это нормально.<br />
            Это пройдёт.
          </div>
          <div style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 16, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(96,165,250,0.8)', marginBottom: 12 }}>Три вдоха прямо сейчас:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Вдох через нос — 4 секунды', 'Задержи — 2 секунды', 'Медленный выдох — 6 секунд'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--accent-blue)', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.6)' }}>{t}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.3)', marginBottom: 20 }}>
            Почувствуй ноги на полу. Ты в безопасности.
          </div>
          <button
            onClick={() => setGrounded(true)}
            style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: 'rgba(96,165,250,0.15)', color: 'var(--accent-blue)', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}
          >
            Стало чуть лучше → разобраться
          </button>
          {allCards.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              style={{ width: '100%', padding: '11px 0', borderRadius: 14, border: '1px solid rgba(var(--fg-rgb),0.08)', background: 'transparent', color: 'rgba(var(--fg-rgb),0.35)', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}
            >
              История карточек ({allCards.length})
            </button>
          )}
          <button
            onClick={onClose}
            style={{ width: '100%', padding: '11px 0', borderRadius: 14, border: 'none', background: 'transparent', color: 'rgba(var(--fg-rgb),0.2)', fontSize: 13, cursor: 'pointer' }}
          >
            Просто закрыть
          </button>
        </div>
      </BottomSheet>
    );
  }

  // ── Step 1: Mode selection ──
  if (step === 'mode') {
    return (
      <BottomSheet onClose={onClose}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Что сейчас активно?</div>
              <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.35)', marginTop: 2 }}>Шаг 1 из 4</div>
            </div>
            {allCards.length > 0 && (
              <button onClick={() => setShowHistory(true)} style={{ background: 'none', border: 'none', fontSize: 11, color: 'rgba(var(--fg-rgb),0.25)', cursor: 'pointer', padding: 0 }}>
                История
              </button>
            )}
          </div>

          {progressBar}

          <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.4)', marginBottom: 16, lineHeight: 1.5 }}>
            Выбери режим, который ближе всего к тому, что происходит внутри
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedMode(m.id); setStep('response'); }}
                style={{
                  textAlign: 'left', padding: '13px 15px', borderRadius: 14,
                  border: '1px solid rgba(var(--fg-rgb),0.08)',
                  background: 'rgba(var(--fg-rgb),0.03)',
                  cursor: 'pointer', color: 'var(--text)',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{m.emoji} {m.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.4)' }}>{m.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 20 }}><TherapyNote compact /></div>
        </div>
      </BottomSheet>
    );
  }

  // ── Step 2: Healthy Adult response ──
  if (step === 'response') {
    return (
      <BottomSheet onClose={onClose}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Здоровый Взрослый</div>
              <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.35)', marginTop: 2 }}>Шаг 2 из 4</div>
            </div>
          </div>

          {progressBar}

          <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              🌿 Говорит тебе
            </div>
            <div style={{ fontSize: 14, color: 'rgba(var(--fg-rgb),0.85)', lineHeight: 1.7 }}>
              {modeData?.response}
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.35)', marginBottom: 8 }}>Что отзывается? Добавь своё (необязательно):</div>
          <textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="Что хочется сказать себе..."
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(var(--fg-rgb),0.05)', border: '1px solid rgba(var(--fg-rgb),0.1)', borderRadius: 14, padding: '12px 14px', color: 'var(--text)', fontSize: 14, lineHeight: 1.55, resize: 'none', outline: 'none', fontFamily: 'inherit', marginBottom: 16 }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('mode')} style={{ padding: '13px 20px', borderRadius: 14, border: '1px solid rgba(var(--fg-rgb),0.1)', background: 'transparent', color: 'rgba(var(--fg-rgb),0.45)', fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>
              ←
            </button>
            <button
              onClick={() => setStep('need')}
              style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: 'rgba(167,139,250,0.2)', color: 'var(--accent)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              Дальше →
            </button>
          </div>
          <div style={{ marginTop: 20 }}><TherapyNote compact /></div>
        </div>
      </BottomSheet>
    );
  }

  // ── Step 3: Need identification ──
  if (step === 'need') {
    return (
      <BottomSheet onClose={onClose}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Что за этим стоит?</div>
              <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.35)', marginTop: 2 }}>Шаг 3 из 4</div>
            </div>
          </div>

          {progressBar}

          <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.45)', marginBottom: 16, lineHeight: 1.5 }}>
            Какая потребность сейчас не удовлетворена?
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {NEEDS.map(n => (
              <button
                key={n.id}
                onClick={() => { setSelectedNeed(n.id); setStep('action'); }}
                style={{
                  textAlign: 'left', padding: '13px 15px', borderRadius: 14,
                  border: `1px solid ${selectedNeed === n.id ? 'rgba(167,139,250,0.4)' : 'rgba(var(--fg-rgb),0.08)'}`,
                  background: selectedNeed === n.id ? 'rgba(167,139,250,0.12)' : 'rgba(var(--fg-rgb),0.03)',
                  cursor: 'pointer', color: 'var(--text)', fontSize: 14, fontWeight: 500,
                }}
              >
                {n.emoji} {n.label}
              </button>
            ))}
          </div>

          <button onClick={() => setStep('response')} style={{ padding: '13px 20px', borderRadius: 14, border: '1px solid rgba(var(--fg-rgb),0.1)', background: 'transparent', color: 'rgba(var(--fg-rgb),0.45)', fontSize: 15, cursor: 'pointer' }}>
            ← Назад
          </button>
          <div style={{ marginTop: 20 }}><TherapyNote compact /></div>
        </div>
      </BottomSheet>
    );
  }

  // ── Step 4: One action ──
  const needInfo = NEEDS.find(n => n.id === selectedNeed);
  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Один маленький шаг</div>
            <div style={{ fontSize: 12, color: 'rgba(var(--fg-rgb),0.35)', marginTop: 2 }}>Шаг 4 из 4</div>
          </div>
        </div>

        {progressBar}

        {needInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>{needInfo.emoji}</span>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(var(--fg-rgb),0.3)', marginBottom: 2 }}>Потребность</div>
              <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.7)', fontWeight: 500 }}>{needInfo.label}</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 13, color: 'rgba(var(--fg-rgb),0.45)', marginBottom: 8, lineHeight: 1.5 }}>
          Что одно маленькое действие ты можешь сделать прямо сейчас?
        </div>
        <textarea
          value={action}
          onChange={e => setAction(e.target.value)}
          placeholder="Например: написать другу, выйти подышать, обнять подушку..."
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(var(--fg-rgb),0.05)', border: `1px solid ${action.trim() ? 'rgba(167,139,250,0.3)' : 'rgba(var(--fg-rgb),0.1)'}`, borderRadius: 14, padding: '12px 14px', color: 'var(--text)', fontSize: 14, lineHeight: 1.55, resize: 'none', outline: 'none', fontFamily: 'inherit', marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setStep('need')} style={{ padding: '13px 20px', borderRadius: 14, border: '1px solid rgba(var(--fg-rgb),0.1)', background: 'transparent', color: 'rgba(var(--fg-rgb),0.45)', fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>
            ←
          </button>
          <button
            onClick={save}
            disabled={!action.trim()}
            style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: action.trim() ? 'rgba(52,211,153,0.2)' : 'rgba(var(--fg-rgb),0.07)', color: action.trim() ? 'var(--accent-green)' : 'rgba(var(--fg-rgb),0.25)', fontSize: 15, fontWeight: 600, cursor: action.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}
          >
            Сохранить
          </button>
        </div>

        <div style={{ marginTop: 20 }}><TherapyNote compact /></div>
      </div>
    </BottomSheet>
  );
}
