import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { SectionLabel } from './SectionLabel';
import { YSQTestSheet, YSQ_RESULT_KEY, YSQ_PROGRESS_KEY } from './YSQTestSheet';
import { TherapyNote } from './TherapyNote';
import { SCHEMA_DOMAINS } from '../schemaTherapyData';
export { SCHEMA_DOMAINS };

type Tab = 'needs' | 'schemas' | 'modes';

/* ─── 5 Core Needs ─── */
const NEEDS_DATA = [
  {
    emoji: '🤝',
    title: 'Привязанность',
    subtitle: 'Безопасность и связь',
    desc: 'Потребность в стабильных, надёжных отношениях — чтобы тебя принимали, слышали и не бросали. Когда она не удовлетворена, появляются тревога, страх одиночества и сложности с доверием.',
  },
  {
    emoji: '🚀',
    title: 'Автономия',
    subtitle: 'Контроль и компетентность',
    desc: 'Потребность чувствовать себя способным справляться самостоятельно, делать выборы и отвечать за свою жизнь. Дефицит проявляется как беспомощность, зависимость от чужого мнения или страх ошибиться.',
  },
  {
    emoji: '💬',
    title: 'Выражение чувств',
    subtitle: 'Свобода самовыражения',
    desc: 'Потребность в том, чтобы чувства и мысли были услышаны и приняты — без осуждения. Когда эта потребность хронически не удовлетворяется, эмоции подавляются или взрываются.',
  },
  {
    emoji: '🎉',
    title: 'Спонтанность',
    subtitle: 'Игра и радость',
    desc: 'Потребность в лёгкости, веселье и отдыхе без чувства вины. Жёсткие стандарты и самокритика блокируют её, создавая ощущение серьёзности и долга вместо радости.',
  },
  {
    emoji: '⚖️',
    title: 'Границы',
    subtitle: 'Самодисциплина и уважение',
    desc: 'Потребность устанавливать разумные пределы — для себя и с другими. Без неё трудно сдерживать импульсы, говорить «нет» и уважать чужие границы.',
  },
];

// SCHEMA_DOMAINS — единый источник в diaryData.ts, импортирован и реэкспортирован выше

/* ─── Schema Modes (терминология МИСТ — schema-therapy.ru/modes) ─── */
const MODES = [
  {
    group: 'Детские режимы',
    color: 'var(--accent-blue)',
    items: [
      {
        name: 'Уязвимый Ребёнок',
        emoji: '🥺',
        feel: 'одиноко, страшно, грустно, покинуто',
        desc: 'Базовый режим боли — ранние чувства брошенности, стыда или беспомощности. Активируется, когда что-то задевает схему. Нуждается в безопасности, тепле и присутствии.',
      },
      {
        name: 'Сердитый / Разъярённый Ребёнок',
        emoji: '😤',
        feel: 'злость, ярость, «это несправедливо»',
        desc: 'Незрелая злость в ответ на нарушение потребностей. Сердитый ребёнок — реагирует, Разъярённый — вспыхивает. Возникает, когда потребности игнорировались или воспринята несправедливость.',
      },
      {
        name: 'Импульсивный / Недисциплинированный Ребёнок',
        emoji: '⚡',
        feel: 'хочу сейчас, скучно, не могу терпеть',
        desc: 'Действует импульсивно, требует немедленного удовлетворения. В умеренной форме — нежелание прилагать усилия ради долгосрочных целей, сложность терпеть дискомфорт.',
      },
    ],
  },
  {
    group: 'Дисфункциональные копинги',
    color: 'var(--accent-orange)',
    items: [
      {
        name: 'Послушный Капитулянт',
        emoji: '😶',
        feel: 'соглашаюсь, лишь бы не конфликтовать',
        desc: 'Подчиняется ожиданиям других («замри» — капитуляция перед схемой). Подавляет собственные потребности ради сохранения отношений или избегания наказания. Копинг через сдачу.',
      },
      {
        name: 'Отстранённый Защитник',
        emoji: '🌫️',
        feel: 'онемение, отстранённость, «не трогайте меня»',
        desc: 'Уходит от боли через эмоциональную изоляцию, прокрастинацию, отвлечение («беги» — избегание). Временно снижает страдание, но блокирует контакт с собой и другими.',
      },
      {
        name: 'Самовозвеличиватель / Гиперкомпенсатор',
        emoji: '🔥',
        feel: 'контроль, превосходство, «я лучше знаю»',
        desc: 'Борьба со схемой через противоположное — сверхдостижения, контроль, грандиозность, агрессия («бей» — гиперкомпенсация). Внешне сильный, внутри — тот же страх или стыд.',
      },
    ],
  },
  {
    group: 'Критикующие режимы',
    color: 'var(--accent-red)',
    items: [
      {
        name: 'Карающий Критик',
        emoji: '😠',
        feel: 'стыд, «я плохой», самонаказание',
        desc: 'Голос, который жёстко атакует и наказывает за ошибки. Усвоенный голос значимого взрослого, который критиковал, стыдил или наказывал. Главная мишень схема-терапии.',
      },
      {
        name: 'Требовательный Критик',
        emoji: '😬',
        feel: 'давление, «недостаточно стараюсь», тревога',
        desc: 'Постоянное давление высоких стандартов — пока всё не идеально, нельзя отдыхать. Не атакует напрямую, но не даёт расслабиться. Нередко маскируется под «продуктивность».',
      },
      {
        name: 'Внушающий Вину Критик',
        emoji: '😔',
        feel: 'вина, «я подвёл», долг',
        desc: 'Постоянно напоминает об обязательствах перед другими, формирует чувство вины. Часто стоит за самопожертвованием и трудностью говорить «нет».',
      },
    ],
  },
  {
    group: 'Здоровые режимы',
    color: 'var(--accent-green)',
    items: [
      {
        name: 'Счастливый Ребёнок',
        emoji: '😄',
        feel: 'лёгкость, радость, игривость',
        desc: 'Спонтанность, любопытство, радость без тревоги. Признак того, что базовые потребности сейчас удовлетворены. Цель терапии — расширить доступ к этому режиму.',
      },
      {
        name: 'Здоровый Взрослый',
        emoji: '🌿',
        feel: 'спокойно, ясно, устойчиво',
        desc: 'Главная цель схема-терапии. В этом режиме ты можешь заботиться о своих потребностях, ставить границы, успокаивать Уязвимого Ребёнка и не поддаваться Критикующим режимам. Растёт с практикой.',
      },
    ],
  },
];

/* ─── Mode Check-in ─── */
const MODE_CHECKIN = [
  { emoji: '🥺', label: 'Одиноко / страшно', mode: 'Уязвимый Ребёнок', tip: 'Найди что-то тёплое — разговор, объятие, уют. Уязвимый Ребёнок нуждается в безопасности и присутствии, а не в советах.' },
  { emoji: '😤', label: 'Злюсь / несправедливо', mode: 'Сердитый / Разъярённый Ребёнок', tip: 'Сначала — тело. Выдох, пауза, движение. Потом можно разбираться с ситуацией. Злость — сигнал о нарушенной потребности.' },
  { emoji: '⚡', label: 'Не могу терпеть / скучно', mode: 'Импульсивный Ребёнок', tip: 'Часть нас не умеет ждать — это нормально. Попробуй назвать, чего именно хочешь прямо сейчас. Иногда достаточно просто признать потребность.' },
  { emoji: '😬', label: 'Давление / «надо больше»', mode: 'Требовательный Критик', tip: 'Это не твой голос — это усвоенное. Спроси: что бы я сказал другу в такой же ситуации? Требовательный Критик ошибается насчёт твоих пределов.' },
  { emoji: '😠', label: 'Стыдно / я плохой', mode: 'Карающий Критик', tip: 'Карающий Критик врёт. Ошибки — часть человеческого опыта, не приговор. Попробуй сострадание к себе — как к другу, совершившему ту же ошибку.' },
  { emoji: '😔', label: 'Виноват / должен всем', mode: 'Внушающий Вину Критик', tip: 'Чувство вины — не факт. Попробуй отделить: это реальная ответственность или усвоенный голос о долге? Твои потребности тоже имеют право быть.' },
  { emoji: '🌫️', label: 'Хочу отключиться / исчезнуть', mode: 'Отстранённый Защитник', tip: 'За отстранённостью — боль. Попробуй назвать, что именно больно, хотя бы для себя. Защита справилась — теперь можно чуть ближе подойти к чувству.' },
  { emoji: '😶', label: 'Соглашаюсь, хотя не хочу', mode: 'Послушный Капитулянт', tip: 'Твои потребности тоже важны. Даже маленький «нет» — шаг к себе. Что тебе на самом деле хочется в этой ситуации?' },
  { emoji: '🔥', label: 'Контролирую / лучше знаю', mode: 'Самовозвеличиватель / Гиперкомпенсатор', tip: 'Под контролем — страх или стыд. Что произойдёт, если немного ослабить хватку? Гиперкомпенсация защищает, но и изолирует.' },
  { emoji: '😄', label: 'Легко и радостно', mode: 'Счастливый Ребёнок', tip: 'Запомни это ощущение — к нему можно возвращаться. Лёгкость и радость без тревоги — это ты, когда тебе хорошо. Просто побудь в этом.' },
  { emoji: '🌿', label: 'Спокойно и устойчиво', mode: 'Здоровый Взрослый', tip: 'Хорошее время для рефлексии и сложных решений. Можно спросить себя: что сейчас нужно Уязвимому Ребёнку внутри меня?' },
];

/* ─── Sub-components ─── */
function NeedsTab() {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 20 }}>
        Схема-терапия строится на идее, что у каждого есть пять базовых эмоциональных потребностей. Когда они систематически не удовлетворялись в детстве — формируются схемы: устойчивые паттерны мышления и поведения.
      </p>
      {NEEDS_DATA.map((n) => (
        <div key={n.title} style={{ background: 'rgba(var(--fg-rgb),0.04)', borderRadius: 16, padding: '14px 16px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{n.emoji}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{n.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{n.subtitle}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6 }}>{n.desc}</div>
        </div>
      ))}
    </div>
  );
}

function SchemasTab({ highlight }: { highlight?: string }) {
  const initialDomain = highlight
    ? SCHEMA_DOMAINS.find(d => d.schemas.some(s => s.name === highlight))?.domain ?? null
    : null;
  const [open, setOpen] = useState<string | null>(initialDomain);

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 20 }}>
        18 ранних дезадаптивных схем (Young, 1990) сгруппированы в 5 доменов. Схема — не диагноз, а паттерн, который когда-то помогал выжить и приспособиться.
      </p>
      {SCHEMA_DOMAINS.map((d) => (
        <div key={d.domain} style={{ marginBottom: 12 }}>
          <div
            onClick={() => setOpen(open === d.domain ? null : d.domain)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              background: 'rgba(var(--fg-rgb),0.05)', borderRadius: open === d.domain ? '14px 14px 0 0' : 14,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{d.domain}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {d.schemas.length}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ transform: open === d.domain ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
          {open === d.domain && (
            <div style={{ background: 'rgba(var(--fg-rgb),0.03)', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
              {d.schemas.map((s, i) => {
                const isHighlighted = s.name === highlight;
                return (
                  <div key={s.name} style={{ padding: '11px 16px', borderTop: i > 0 ? '1px solid rgba(var(--fg-rgb),0.05)' : 'none', background: isHighlighted ? `rgba(${hexToRgbStr(d.color)},0.12)` : 'transparent' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: d.color, marginBottom: 3 }}>{s.name}{isHighlighted && ' ◀'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.5 }}>{(s as { libraryDesc?: string; desc: string }).libraryDesc ?? s.desc}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function hexToRgbStr(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function ModesTab() {
  const [checkinMode, setCheckinMode] = useState<typeof MODE_CHECKIN[0] | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);

  return (
    <div>
      {/* Check-in widget */}
      <div
        onClick={() => setShowCheckin(true)}
        style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(79,163,247,0.1))',
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 16, padding: '14px 16px', marginBottom: 20, cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Режим прямо сейчас
        </div>
        <div style={{ fontSize: 14, color: 'rgba(var(--fg-rgb),0.7)' }}>Как ты себя чувствуешь? →</div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 20 }}>
        Режим — это актуальное состояние психики прямо сейчас. В отличие от схем (устойчивых паттернов), режимы меняются в течение дня. Цель — расширить доступ к Здоровому взрослому.
      </p>

      {MODES.map((g) => (
        <div key={g.group} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: g.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{g.group}</div>
          {g.items.map((m) => (
            <div key={m.name} style={{ background: 'rgba(var(--fg-rgb),0.04)', borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{m.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 1 }}>Чувствуется как: {m.feel}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.6 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      ))}

      {/* Check-in selector */}
      {showCheckin && !checkinMode && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'fade-in 150ms ease' }}
          onClick={() => setShowCheckin(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--sheet-bg)', borderRadius: '24px 24px 0 0', padding: '20px 20px 48px', animation: 'sheet-up 300ms cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(var(--fg-rgb),0.12)', margin: '0 auto 16px' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4, textAlign: 'center' }}>Как ты сейчас?</div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 20, textAlign: 'center' }}>Выбери самое близкое ощущение</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {MODE_CHECKIN.map((item) => (
                <div
                  key={item.label}
                  onClick={() => setCheckinMode(item)}
                  style={{ background: 'rgba(var(--fg-rgb),0.05)', borderRadius: 14, padding: '12px 8px', textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(var(--fg-rgb),0.06)' }}
                >
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{item.emoji}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-sub)', lineHeight: 1.4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result overlay */}
      {checkinMode && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fade-in 150ms ease' }}
          onClick={() => { setCheckinMode(null); setShowCheckin(false); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'linear-gradient(145deg, rgba(167,139,250,0.18), rgba(79,163,247,0.08))', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 24, padding: '32px 24px 24px', width: '100%', maxWidth: 320, textAlign: 'center', animation: 'sheet-up 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <div style={{ fontSize: 56, marginBottom: 12 }}>{checkinMode.emoji}</div>
            <SectionLabel purple mb={8}>Режим</SectionLabel>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>{checkinMode.mode}</div>
            <div style={{ background: 'rgba(var(--fg-rgb),0.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 6 }}>Что помогает</div>
              <div style={{ fontSize: 14, color: 'rgba(var(--fg-rgb),0.8)', lineHeight: 1.6 }}>{checkinMode.tip}</div>
            </div>
            <button
              onClick={() => { setCheckinMode(null); setShowCheckin(false); }}
              style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: 'rgba(167,139,250,0.25)', color: 'var(--accent)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >Понятно</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export type SchemaInfoTab = 'needs' | 'schemas' | 'modes';
interface Props { onClose: () => void; ratings?: Record<string, number>; autoStartTest?: boolean; initialTab?: SchemaInfoTab; highlightSchema?: string }

const SCHEMA_TABS: { key: Tab; label: string }[] = [
  { key: 'needs', label: 'Потребности' },
  { key: 'schemas', label: 'Схемы' },
  { key: 'modes', label: 'Режимы' },
];

export function SchemaInfoContent({ initialTab, highlight }: { initialTab?: Tab; highlight?: string }) {
  const [tab, setTab] = useState<Tab>(initialTab ?? 'needs');
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <SectionLabel purple mb={6}>Схема-терапия</SectionLabel>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Как это работает</div>
      </div>
      <div style={{ display: 'flex', background: 'rgba(var(--fg-rgb),0.06)', borderRadius: 12, padding: 3, marginBottom: 20 }}>
        {SCHEMA_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 10, background: active ? 'rgba(var(--fg-rgb),0.12)' : 'transparent', color: active ? '#fff' : 'rgba(var(--fg-rgb),0.4)', fontSize: 13, fontWeight: active ? 500 : 400, cursor: 'pointer', transition: 'all 0.15s ease' }}
            >{t.label}</button>
          );
        })}
      </div>
      {tab === 'needs' && <NeedsTab />}
      {tab === 'schemas' && <SchemasTab highlight={highlight} />}
      {tab === 'modes' && <ModesTab />}
      <div style={{ marginTop: 24 }}>
        <TherapyNote />
      </div>
    </div>
  );
}

export function SchemaInfoSheet({ onClose, ratings, autoStartTest, initialTab, highlightSchema: initHighlight }: Props) {
  const [showTest, setShowTest] = useState(autoStartTest ?? false);
  const [contentKey, setContentKey] = useState(0);
  const [contentInitialTab, setContentInitialTab] = useState<Tab>(initialTab ?? 'needs');
  const hasResult = !!localStorage.getItem(YSQ_RESULT_KEY);
  const hasProgress = !!localStorage.getItem(YSQ_PROGRESS_KEY);

  const [highlightSchema, setHighlightSchema] = useState<string | undefined>(initHighlight);

  const handleViewSchemas = (schemaName?: string) => {
    setContentInitialTab('schemas');
    setHighlightSchema(schemaName);
    setContentKey(k => k + 1);
    setShowTest(false);
  };

  return (
    <>
      <BottomSheet onClose={onClose}>
        <div style={{ paddingTop: 4 }}>
          <SchemaInfoContent key={contentKey} initialTab={contentInitialTab} highlight={highlightSchema} />
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(var(--fg-rgb),0.06)' }}>
            {hasProgress && !hasResult && (
              <div
                onClick={() => setShowTest(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                  borderRadius: 14, padding: '12px 16px', marginBottom: 12, cursor: 'pointer',
                }}>
                <span style={{ fontSize: 18 }}>⏸</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-yellow)' }}>Незаконченный тест</div>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>Нажми, чтобы продолжить с места остановки</div>
                </div>
                <span style={{ fontSize: 16, color: 'var(--accent-yellow)' }}>›</span>
              </div>
            )}
            <div
              onClick={() => setShowTest(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
                  {hasResult ? 'Мои результаты YSQ-R' : hasProgress ? 'Продолжить тест' : 'Пройти тест на схемы'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 3 }}>
                  {hasResult ? 'Посмотреть или пройти заново' : '116 вопросов · ~10 минут · YSQ-R'}
                </div>
              </div>
              <span style={{ fontSize: 20, color: 'var(--accent)' }}>›</span>
            </div>
          </div>
        </div>
      </BottomSheet>
      {showTest && <YSQTestSheet onClose={() => setShowTest(false)} ratings={ratings} autoResume={autoStartTest} onViewSchemas={(name) => handleViewSchemas(name)} />}
    </>
  );
}
