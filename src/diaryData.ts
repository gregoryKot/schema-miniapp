// ─── Emotions (Plutchik + ST-relevant) ───────────────────────────────────────

export const EMOTIONS = [
  { id: 'fear',        label: 'Страх',       emoji: '😨' },
  { id: 'anxiety',     label: 'Тревога',     emoji: '😰' },
  { id: 'sadness',     label: 'Грусть',      emoji: '😔' },
  { id: 'shame',       label: 'Стыд',        emoji: '😳' },
  { id: 'guilt',       label: 'Вина',        emoji: '😕' },
  { id: 'anger',       label: 'Злость',      emoji: '😠' },
  { id: 'disgust',     label: 'Отвращение',  emoji: '🤢' },
  { id: 'joy',         label: 'Радость',     emoji: '😊' },
  { id: 'trust',       label: 'Доверие',     emoji: '🤗' },
  { id: 'surprise',    label: 'Удивление',   emoji: '😲' },
  { id: 'anticipation',label: 'Ожидание',    emoji: '🤔' },
  { id: 'apathy',      label: 'Апатия',      emoji: '😶' },
];

export const INTENSITY_LABELS = ['слабо', 'умеренно', 'сильно', 'очень сильно', 'невыносимо'];

// ─── 20 Schemas (5 domains) ──────────────────────────────────────────────────

export const SCHEMA_DOMAINS = [
  {
    id: 'rejection',
    domain: 'Отчуждение и отвержение',
    color: '#f87171',
    schemas: [
      { id: 'emotional_deprivation',  name: 'Эмоциональная депривация',          emoji: '🫤', desc: 'Убеждение, что эмоциональные потребности никогда не будут удовлетворены' },
      { id: 'abandonment',            name: 'Покинутость / Нестабильность',       emoji: '💔', desc: 'Страх, что близкие бросят или окажутся ненадёжными' },
      { id: 'mistrust',               name: 'Недоверие / Жестокое обращение',     emoji: '🛡️', desc: 'Ожидание, что люди причинят боль, используют или обманут' },
      { id: 'defectiveness',          name: 'Дефективность / Стыд',               emoji: '😶‍🌫️', desc: 'Ощущение себя плохим, неполноценным — страх что отвергнут если узнают правду' },
      { id: 'social_isolation',       name: 'Социальная отчуждённость',           emoji: '🌑', desc: 'Ощущение чужим — другим, не вписывающимся ни в одну группу' },
    ],
  },
  {
    id: 'autonomy',
    domain: 'Нарушение автономии',
    color: '#fb923c',
    schemas: [
      { id: 'dependence',              name: 'Зависимость / Беспомощность',         emoji: '🪢', desc: 'Убеждённость в неспособности справляться с жизнью без чужой помощи' },
      { id: 'vulnerability',           name: 'Уязвимость',                          emoji: '⚠️', desc: 'Преувеличенный страх надвигающейся катастрофы: болезни, краха, аварии' },
      { id: 'enmeshment',              name: 'Спутанность / Неразвитая идентичность', emoji: '🌀', desc: 'Чрезмерная слитость с близкими в ущерб собственной идентичности' },
      { id: 'failure',                 name: 'Неуспешность',                         emoji: '📉', desc: 'Убеждение, что неизбежно потерпишь неудачу там, где другие успешны' },
    ],
  },
  {
    id: 'limits',
    domain: 'Нарушение границ',
    color: '#facc15',
    schemas: [
      { id: 'entitlement',              name: 'Привилегированность / Грандиозность', emoji: '👑', desc: 'Ощущение особости и права получать всё желаемое вне зависимости от других' },
      { id: 'insufficient_self_control', name: 'Недостаточность самоконтроля',        emoji: '⚡', desc: 'Сложно терпеть дискомфорт, откладывать удовольствия или придерживаться рутины' },
    ],
  },
  {
    id: 'other_directed',
    domain: 'Ориентация на других',
    color: '#34d399',
    schemas: [
      { id: 'subjugation',       name: 'Покорность',         emoji: '🎭', desc: 'Подавление своих желаний чтобы избежать конфликта или отвержения' },
      { id: 'self_sacrifice',    name: 'Самопожертвование',  emoji: '🕊️', desc: 'Чрезмерный фокус на нуждах других в ущерб собственным потребностям' },
      { id: 'approval_seeking',  name: 'Поиск одобрения',    emoji: '🪞', desc: 'Сильная потребность в одобрении окружающих в ущерб подлинному себе' },
    ],
  },
  {
    id: 'vigilance',
    domain: 'Бдительность и подавление',
    color: '#818cf8',
    schemas: [
      { id: 'negativity',              name: 'Негативизм / Пессимизм',                  emoji: '🌧️', desc: 'Устойчивый фокус на негативе: потерях, разочарованиях, худшем сценарии' },
      { id: 'emotion_inhibition_fear', name: 'Страх потери контроля над эмоциями',       emoji: '🌋', desc: 'Страх, что эмоции — особенно злость — выйдут из-под контроля' },
      { id: 'emotional_inhibition',    name: 'Эмоциональная скованность',                emoji: '🧊', desc: 'Привычка сдерживать чувства, спонтанность и естественное общение' },
      { id: 'unrelenting_standards',   name: 'Жёсткие стандарты / Придирчивость',        emoji: '📐', desc: 'Недостижимые внутренние требования — всё должно быть идеально' },
      { id: 'punitiveness_self',       name: 'Пунитивность (на себя)',                   emoji: '⚔️', desc: 'Жёсткое наказание себя за ошибки, сложность прощать себя' },
      { id: 'punitiveness_others',     name: 'Пунитивность (на других)',                 emoji: '⚖️', desc: 'Нетерпимость к чужим ошибкам, убеждение что они должны нести суровые последствия' },
    ],
  },
];

export const ALL_SCHEMAS = SCHEMA_DOMAINS.flatMap(d =>
  d.schemas.map(s => ({ ...s, domainColor: d.color, domainId: d.id }))
);

// ─── 35 Modes (schema-therapy.ru/modes, МИСТ) ────────────────────────────────

export const MODE_GROUPS = [
  {
    id: 'child',
    group: 'Детские режимы',
    color: '#60a5fa',
    items: [
      // Уязвимые
      { id: 'vulnerable_child',  name: 'Уязвимый Ребёнок',   emoji: '🥺' },
      { id: 'lonely_child',      name: 'Одинокий Ребёнок',   emoji: '😞' },
      { id: 'abandoned_child',   name: 'Покинутый Ребёнок',  emoji: '💔' },
      { id: 'humiliated_child',  name: 'Униженный Ребёнок',  emoji: '😶‍🌫️' },
      { id: 'dependent_child',   name: 'Зависимый Ребёнок',  emoji: '🫂' },
      // Агрессивные
      { id: 'angry_child',       name: 'Сердитый Ребёнок',   emoji: '😤' },
      { id: 'stubborn_child',    name: 'Упрямый Ребёнок',    emoji: '🙅' },
      { id: 'enraged_child',     name: 'Разъярённый Ребёнок', emoji: '🔴' },
      // Импульсивные
      { id: 'impulsive_child',      name: 'Импульсивный Ребёнок',      emoji: '⚡' },
      { id: 'undisciplined_child',  name: 'Недисциплинированный Ребёнок', emoji: '🌀' },
    ],
  },
  {
    id: 'coping_surrender',
    group: 'Копинг: Капитуляция',
    color: '#94a3b8',
    items: [
      { id: 'compliant_surrenderer', name: 'Послушный Капитулянт',    emoji: '😶' },
      { id: 'helpless_surrenderer',  name: 'Беспомощный Капитулянт', emoji: '🫠' },
    ],
  },
  {
    id: 'coping_avoidance',
    group: 'Копинг: Избегание',
    color: '#a78bfa',
    items: [
      { id: 'detached_protector',      name: 'Отстранённый Защитник',      emoji: '🌫️' },
      { id: 'detached_self_soother',   name: 'Отстранённый Самоутешитель', emoji: '🛋️' },
      { id: 'avoidant_protector',      name: 'Избегающий Защитник',        emoji: '🚪' },
      { id: 'angry_protector',         name: 'Гневный Защитник',           emoji: '😡' },
    ],
  },
  {
    id: 'coping_overcompensation',
    group: 'Копинг: Гиперкомпенсация',
    color: '#fb923c',
    items: [
      { id: 'self_aggrandiser',          name: 'Самовозвеличиватель',              emoji: '🔥' },
      { id: 'overcontroller',            name: 'Гиперконтролёр',                   emoji: '🎛️' },
      { id: 'perfectionistic_oc',        name: 'Перфекционист-Гиперконтролёр',    emoji: '✅' },
      { id: 'suspicious_oc',             name: 'Подозрительный Гиперконтролёр',   emoji: '🔍' },
      { id: 'invincible_oc',             name: 'Неуязвимый Гиперконтролёр',       emoji: '🛡️' },
      { id: 'flagellating_oc',           name: 'Самобичующий Гиперконтролёр',     emoji: '😩' },
      { id: 'compulsive_oc',             name: 'Компульсивный Гиперконтролёр',    emoji: '🔁' },
      { id: 'worrying_oc',               name: 'Беспокоящийся Гиперконтролёр',   emoji: '😟' },
      { id: 'bully_attack',              name: 'Агрессор',                         emoji: '👊' },
      { id: 'manipulative',              name: 'Манипулятор',                      emoji: '🎭' },
      { id: 'predator',                  name: 'Хищник',                           emoji: '🦊' },
      { id: 'attention_seeker',          name: 'Ищущий Внимания и Одобрения',     emoji: '🌟' },
      { id: 'pollyanna',                 name: 'Полианна',                          emoji: '🌈' },
    ],
  },
  {
    id: 'critic',
    group: 'Критикующие режимы',
    color: '#f87171',
    items: [
      { id: 'demanding_critic',  name: 'Требовательный Критик',    emoji: '😬' },
      { id: 'punitive_critic',   name: 'Карающий Критик',          emoji: '😠' },
      { id: 'guilt_critic',      name: 'Внушающий Вину Критик',    emoji: '😔' },
    ],
  },
  {
    id: 'healthy',
    group: 'Здоровые режимы',
    color: '#34d399',
    items: [
      { id: 'happy_child',    name: 'Счастливый Ребёнок', emoji: '😄' },
      { id: 'healthy_adult',  name: 'Здоровый Взрослый',  emoji: '🌿' },
      { id: 'good_parent',    name: 'Хороший Родитель',   emoji: '💚' },
    ],
  },
];

export const ALL_MODES = MODE_GROUPS.flatMap(g =>
  g.items.map(m => ({ ...m, groupColor: g.color, groupId: g.id }))
);

export function getModeById(id: string) {
  return ALL_MODES.find(m => m.id === id);
}

export function getSchemaById(id: string) {
  return ALL_SCHEMAS.find(s => s.id === id);
}
