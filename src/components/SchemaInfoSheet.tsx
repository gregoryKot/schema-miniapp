import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

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
    emoji: '🧭',
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
    emoji: '🛡️',
    title: 'Границы',
    subtitle: 'Безопасность и справедливость',
    desc: 'Потребность в чётких правилах и предсказуемости — как внутри, так и вовне. Без неё сложно отказывать, защищать себя и удерживать фокус.',
  },
];

/* ─── 18 EMS Schemas (Young Schema Therapy, MIST standard) ─── */
const SCHEMA_DOMAINS = [
  {
    domain: 'Отчуждение и отвержение',
    color: '#f87171',
    schemas: [
      { name: 'Покинутость / Нестабильность', desc: 'Ожидание, что значимые люди уйдут — умрут, бросят, уйдут к другому. Внутренняя нестабильность или непредсказуемость близких' },
      { name: 'Недоверие / Ожидание насилия', desc: 'Убеждение, что окружающие причинят боль, унизят, обманут или используют. Особенно в отношениях с теми, кто должен быть близким' },
      { name: 'Эмоциональная депривация', desc: 'Ожидание, что нормальные потребности в эмоциональной поддержке, заботе, защите и руководстве не будут удовлетворены' },
      { name: 'Дефектность / Стыд', desc: 'Ощущение себя плохим, нежеланным, неполноценным — как будто, узнав правду, близкие отвернутся. Острая чувствительность к критике' },
      { name: 'Социальная изоляция / Отчуждённость', desc: 'Ощущение себя изолированным от людей, другим, непринадлежащим ни к одной группе или сообществу' },
    ],
  },
  {
    domain: 'Нарушение автономии',
    color: '#fb923c',
    schemas: [
      { name: 'Зависимость / Некомпетентность', desc: 'Убеждённость в неспособности справляться с повседневными обязанностями без помощи других — вести дела, принимать решения, новые задачи' },
      { name: 'Уязвимость к болезням и опасностям', desc: 'Преувеличенный страх надвигающейся катастрофы: болезни, финансового краха, природных катастроф, криминала' },
      { name: 'Запутанность / Неразвитое Я', desc: 'Чрезмерная эмоциональная привязанность к значимым людям в ущерб собственной идентичности и социальному развитию' },
      { name: 'Провал', desc: 'Убеждение, что неизбежно потерпишь неудачу в сферах достижений — работе, школе, спорте. Ощущение глупости и некомпетентности на фоне других' },
    ],
  },
  {
    domain: 'Нарушение границ',
    color: '#facc15',
    schemas: [
      { name: 'Привилегированность / Грандиозность', desc: 'Убеждённость в своей особенности, праве на всё желаемое — вне зависимости от разумности и ущерба для других. Не поддаётся правилам' },
      { name: 'Недостаточный самоконтроль / Самодисциплина', desc: 'Трудность терпеть дискомфорт или сдерживать импульсы ради целей. Или нежелание — когда комфорт и немедленное удовольствие важнее' },
    ],
  },
  {
    domain: 'Ориентация на других',
    color: '#34d399',
    schemas: [
      { name: 'Покорность', desc: 'Чрезмерная уступка контроля другим из страха наказания, отвержения или конфликта. Обычно — подавление злости и собственных желаний. Ощущение ловушки' },
      { name: 'Самопожертвование', desc: 'Добровольное удовлетворение потребностей других за счёт собственного. Причина — избегание вины, поддержание связи или сохранение самооценки. Часто — накопление обиды' },
      { name: 'Поиск признания и одобрения', desc: 'Чрезмерная сосредоточенность на получении признания и внимания от окружающих в ущерб собственной аутентичности. Высокая чувствительность к реакциям других' },
    ],
  },
  {
    domain: 'Бдительность и подавление',
    color: '#818cf8',
    schemas: [
      { name: 'Негативизм / Пессимизм', desc: 'Устойчивый фокус на негативных аспектах жизни при минимизации позитивных. Хроническое ожидание плохого — финансовых потерь, болезней, ошибок, катастроф' },
      { name: 'Подавление эмоций', desc: 'Чрезмерное сдерживание спонтанных действий, чувств и общения — обычно, чтобы избежать осуждения, стыда или потери контроля. Особенно — злости' },
      { name: 'Жёсткие стандарты / Придирчивость', desc: 'Убеждение, что нужно соответствовать очень высоким требованиям — обычно, чтобы избежать критики. Ценой приходит давление, проблемы со здоровьем и трудности в отношениях' },
      { name: 'Наказуемость', desc: 'Убеждение, что люди — включая себя — должны жёстко наказываться за ошибки. Трудность прощать себе и другим, нетерпимость к слабостям' },
    ],
  },
];

/* ─── Schema Modes (MIST nomenclature) ─── */
const MODES = [
  {
    group: 'Детские режимы',
    color: '#60a5fa',
    items: [
      {
        name: 'Уязвимый ребёнок',
        emoji: '🥺',
        feel: 'одиноко, страшно, грустно',
        desc: 'Базовый режим боли — те самые ранние чувства брошенности, стыда или беспомощности. Активируется, когда что-то задело схему. Нуждается в безопасности и заботе.',
      },
      {
        name: 'Злой / Разгневанный ребёнок',
        emoji: '😤',
        feel: 'злость, ярость, «это несправедливо»',
        desc: 'Незрелая злость в ответ на нарушение потребностей. Злой ребёнок сердится, разгневанный — может вспыхнуть. Возникает, когда потребности игнорировались или была воспринята несправедливость.',
      },
      {
        name: 'Импульсивный / Недисциплинированный ребёнок',
        emoji: '⚡',
        feel: 'хочу сейчас, скучно, не могу терпеть',
        desc: 'Действует импульсивно, требует немедленного удовлетворения, не способен откладывать. В умеренной форме — нежелание прилагать усилия ради долгосрочных целей.',
      },
      {
        name: 'Счастливый ребёнок',
        emoji: '😄',
        feel: 'лёгкость, радость, игривость',
        desc: 'Здоровый детский режим — спонтанность, любопытство, радость без тревоги. Признак того, что базовые потребности сейчас удовлетворены. Цель терапии — расширить доступ к этому режиму.',
      },
    ],
  },
  {
    group: 'Режимы дисфункциональной адаптации',
    color: '#fb923c',
    items: [
      {
        name: 'Покорный сдающийся',
        emoji: '😶',
        feel: 'соглашаюсь, лишь бы не конфликтовать',
        desc: 'Подчиняется ожиданиям других, подавляет собственные нужды ради сохранения отношений или избегания наказания. Реализует схемы покорности и самопожертвования напрямую.',
      },
      {
        name: 'Отстранённый защитник',
        emoji: '🌫️',
        feel: 'онемение, отстранённость, «не трогайте меня»',
        desc: 'Отключается эмоционально, уходит от боли через изоляцию, диссоциацию, прокрастинацию или отвлечение. Временно снижает страдание, но блокирует контакт с собой и другими.',
      },
      {
        name: 'Гиперкомпенсатор',
        emoji: '🔥',
        feel: 'контроль, превосходство, «я сам справлюсь»',
        desc: 'Борьба со схемой через противоположное — сверхдостижения, жёсткий контроль, грандиозность, доминирование. Внешне сильный — внутри тот же страх или стыд. Включает режимы Самовозвеличивающегося и Тирана.',
      },
    ],
  },
  {
    group: 'Дисфункциональные родительские режимы',
    color: '#f87171',
    items: [
      {
        name: 'Карающий родитель',
        emoji: '😠',
        feel: 'стыд, «я плохой», самонаказание',
        desc: 'Голос, который атакует и наказывает за ошибки — жёстко и без пощады. Усвоенный голос значимого взрослого, который критиковал, стыдил или наказывал. Главная мишень схема-терапии.',
      },
      {
        name: 'Требовательный родитель',
        emoji: '😬',
        feel: 'давление, «надо стараться больше», тревога',
        desc: 'Постоянное давление высоких стандартов. Не атакует, но не даёт расслабиться — пока всё не идеально, нельзя отдыхать. Нередко маскируется под продуктивность и дисциплину.',
      },
    ],
  },
  {
    group: 'Здоровые режимы',
    color: '#34d399',
    items: [
      {
        name: 'Здоровый взрослый',
        emoji: '🌿',
        feel: 'спокойно, ясно, устойчиво',
        desc: 'Цель схема-терапии. В этом режиме ты можешь заботиться о своих потребностях, ставить границы, успокаивать Уязвимого ребёнка и не поддаваться Родительским режимам. Растёт с практикой.',
      },
    ],
  },
];

/* ─── Mode Check-in ─── */
const MODE_CHECKIN = [
  { emoji: '🥺', label: 'Одиноко / страшно', mode: 'Уязвимый ребёнок', tip: 'Найди что-то тёплое — разговор, объятие, уют. Уязвимый ребёнок нуждается в безопасности и присутствии, а не в советах.' },
  { emoji: '😤', label: 'Злюсь / несправедливо', mode: 'Злой / Разгневанный ребёнок', tip: 'Сначала — тело. Выдох, пауза, физическое движение. Потом можно разбираться с ситуацией. Злость — сигнал о нарушенной потребности.' },
  { emoji: '⚡', label: 'Не могу терпеть / скучно', mode: 'Импульсивный ребёнок', tip: 'Это нормально — часть нас не умеет ждать. Попробуй назвать, чего именно хочешь. Иногда достаточно просто признать потребность.' },
  { emoji: '😬', label: 'Давление / надо больше', mode: 'Требовательный родитель', tip: 'Это не твой голос — это усвоенное. Спроси: что бы я сказал другу в похожей ситуации? Требовательный родитель ошибается насчёт твоих пределов.' },
  { emoji: '😠', label: 'Стыдно / я плохой', mode: 'Карающий родитель', tip: 'Карающий родитель врёт. Ошибки — часть человеческого опыта, не приговор. Попробуй сострадание к себе — как к другу, совершившему ту же ошибку.' },
  { emoji: '🌫️', label: 'Хочу отключиться / исчезнуть', mode: 'Отстранённый защитник', tip: 'За отстранённостью — боль. Попробуй назвать, что именно больно, хотя бы для себя. Защита справилась — теперь можно чуть ближе подойти к чувству.' },
  { emoji: '😶', label: 'Соглашаюсь, хотя не хочу', mode: 'Покорный сдающийся', tip: 'Твои потребности тоже важны. Даже маленький «нет» — шаг к себе. Подумай: что тебе на самом деле хочется в этой ситуации?' },
  { emoji: '🔥', label: 'Буду делать сам / контроль', mode: 'Гиперкомпенсатор', tip: 'Под контролем — страх или стыд. Что произойдёт, если немного ослабить хватку? Гиперкомпенсация защищает, но и изолирует.' },
  { emoji: '😄', label: 'Легко и радостно', mode: 'Счастливый ребёнок', tip: 'Ты в ресурсном режиме! Запомни это ощущение — к нему можно возвращаться. Это то, как должно ощущаться удовлетворение базовых потребностей.' },
  { emoji: '🌿', label: 'Спокойно, устойчиво', mode: 'Здоровый взрослый', tip: 'Отличное состояние. Хорошее время для рефлексии, сложных решений и заботы о других. Можно поговорить с Уязвимым ребёнком внутри — что ему сейчас нужно?' },
];

/* ─── Sub-components ─── */
function NeedsTab() {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20 }}>
        Схема-терапия строится на идее, что у каждого есть пять базовых эмоциональных потребностей. Когда они систематически не удовлетворялись в детстве — формируются схемы: устойчивые паттерны мышления и поведения.
      </p>
      {NEEDS_DATA.map((n) => (
        <div key={n.title} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '14px 16px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{n.emoji}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{n.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{n.subtitle}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{n.desc}</div>
        </div>
      ))}
    </div>
  );
}

function SchemasTab() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20 }}>
        18 ранних дезадаптивных схем (Young, 1990) сгруппированы в 5 доменов. Схема — не диагноз, а паттерн, который когда-то помогал выжить и приспособиться.
      </p>
      {SCHEMA_DOMAINS.map((d) => (
        <div key={d.domain} style={{ marginBottom: 12 }}>
          <div
            onClick={() => setOpen(open === d.domain ? null : d.domain)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)', borderRadius: open === d.domain ? '14px 14px 0 0' : 14,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{d.domain}</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {d.schemas.length}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ transform: open === d.domain ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
          {open === d.domain && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
              {d.schemas.map((s, i) => (
                <div key={s.name} style={{ padding: '11px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: d.color, marginBottom: 3 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
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
        <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Режим прямо сейчас
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Как ты себя чувствуешь? →</div>
      </div>

      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20 }}>
        Режим — это актуальное состояние психики прямо сейчас. В отличие от схем (устойчивых паттернов), режимы меняются в течение дня. Цель — расширить доступ к Здоровому взрослому.
      </p>

      {MODES.map((g) => (
        <div key={g.group} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: g.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{g.group}</div>
          {g.items.map((m) => (
            <div key={m.name} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{m.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Чувствуется как: {m.feel}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{m.desc}</div>
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
            style={{ background: '#161821', borderRadius: '24px 24px 0 0', padding: '20px 20px 48px', animation: 'sheet-up 300ms cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 16px' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4, textAlign: 'center' }}>Как ты сейчас?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, textAlign: 'center' }}>Выбери самое близкое ощущение</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {MODE_CHECKIN.map((item) => (
                <div
                  key={item.label}
                  onClick={() => setCheckinMode(item)}
                  style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 8px', textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{item.emoji}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{item.label}</div>
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
            <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Режим</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{checkinMode.mode}</div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: '#a78bfa', marginBottom: 6 }}>Что помогает</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{checkinMode.tip}</div>
            </div>
            <button
              onClick={() => { setCheckinMode(null); setShowCheckin(false); }}
              style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: 'rgba(167,139,250,0.25)', color: '#a78bfa', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >Понятно</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
interface Props { onClose: () => void }

export function SchemaInfoSheet({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('needs');

  const TABS: { key: Tab; label: string }[] = [
    { key: 'needs', label: 'Потребности' },
    { key: 'schemas', label: 'Схемы' },
    { key: 'modes', label: 'Режимы' },
  ];

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Схема-терапия</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Как это работает</div>
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 3, marginBottom: 20 }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 10, background: active ? 'rgba(255,255,255,0.12)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: active ? 500 : 400, cursor: 'pointer', transition: 'all 0.15s ease' }}
              >{t.label}</button>
            );
          })}
        </div>
        {tab === 'needs' && <NeedsTab />}
        {tab === 'schemas' && <SchemasTab />}
        {tab === 'modes' && <ModesTab />}
      </div>
    </BottomSheet>
  );
}
