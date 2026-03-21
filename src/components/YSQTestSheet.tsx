import { useState, useEffect, useRef } from 'react';
import { BottomSheet } from './BottomSheet';
import { SCHEMA_DOMAINS } from './SchemaInfoSheet';
import { api } from '../api';

export const YSQ_RESULT_KEY = 'ysq_result';
export const YSQ_PROGRESS_KEY = 'ysq_progress';

interface Props {
  onClose: () => void;
  ratings?: Record<string, number>;
  autoResume?: boolean;
  onViewSchemas?: (schemaName: string) => void;
}

const QUESTIONS: string[] = [
  'Мне не хватало любви и тепла в жизни.',
  'В основном мне было не к кому обратиться — ни за советом, ни за поддержкой.',
  'На протяжении большей части жизни рядом не было человека, который хотел бы быть близко и проводить со мной время.',
  'На протяжении большей части жизни я не ощущал, что кто-то считает меня важным и ценным.',
  'Рядом редко оказывался зрелый, опытный человек, способный направить меня, когда я не знал, как поступить.',
  'Меня тревожит мысль о том, что близкие однажды уйдут или бросят меня.',
  'Мне кажется, что любые значимые отношения обречены — я жду, что они разрушатся.',
  'Я чувствую привязанность к людям, которые не могут дать мне той близости, которая мне нужна.',
  'Даже кратковременное одиночество выбивает меня из равновесия.',
  'Я избегаю настоящей близости, потому что не знаю, останется ли человек рядом.',
  'Близкие люди в моей жизни часто были непредсказуемы: то тёплые и открытые, то внезапно злые, раздражённые или погружённые в себя.',
  'Я так сильно нуждаюсь в людях, что постоянно боюсь их потерять.',
  'Если я покажу своё настоящее лицо или выражу то, что чувствую, — люди отвернутся.',
  'Я не могу расслабиться рядом с людьми — стоит ослабить бдительность, и меня обидят.',
  'Предательство неизбежно — вопрос лишь в том, когда это произойдёт.',
  'Мне тяжело открываться и доверять другим людям.',
  'Иногда я намеренно проверяю людей, чтобы понять, честны ли они и можно ли им верить.',
  'Я уверен: в отношениях всегда кто-то управляет, и лучше, чтобы это был я.',
  'Я принципиально другой — меня отличает что-то фундаментальное.',
  'Я не чувствую принадлежности ни к одному сообществу или группе.',
  'В любой компании я ощущаю себя лишним.',
  'Меня никто не понимает на самом деле.',
  'Я нередко ощущаю себя посторонним среди людей.',
  'Те, кого я хочу видеть рядом, ушли бы, узнав меня по-настоящему.',
  'В глубине я чувствую, что со мной что-то фундаментально не так.',
  'Я не верю, что достоин любви.',
  'Мои настоящие черты настолько неприятны, что я не могу открыться другим.',
  'Когда я кому-то нравлюсь, возникает ощущение, что я их обманываю.',
  'Я не понимаю, за что меня вообще можно любить.',
  'На работе (или учёбе) у меня почти всегда выходит хуже, чем у других.',
  'В сфере работы и достижений большинство людей превосходят меня.',
  'Я чувствую себя неудачником.',
  'В работе или учёбе у меня меньше таланта, чем у большинства.',
  'Среди других мне бывает неловко — мои достижения явно уступают их достижениям.',
  'Сравнивая себя с другими, я почти всегда прихожу к выводу, что они намного успешнее.',
  'Я не уверен, что справляюсь с обычными жизненными задачами в одиночку.',
  'Другие умеют позаботиться обо мне лучше, чем я сам.',
  'Без чьей-то помощи или направления мне сложно браться за новые дела вне привычных рамок.',
  'В большинстве вещей, за которые я берусь в жизни, у меня ничего не выходит.',
  'Если я буду опираться только на себя в обычных ситуациях — скорее всего ошибусь.',
  'Мне нужен кто-то, кому можно доверять и у кого спрашивать совета по практическим делам.',
  'В повседневных делах я чувствую себя скорее ребёнком, чем самостоятельным взрослым.',
  'Обычные бытовые задачи кажутся мне непосильными.',
  'Я живу в ожидании беды — катастрофы, несчастного случая, кризиса или преступления.',
  'Я боюсь физической угрозы со стороны других.',
  'Я очень тщательно оберегаю себя от болезней и травм.',
  'Даже когда врачи не находят ничего серьёзного, я не перестаю бояться тяжёлой болезни.',
  'Меня постоянно тревожат мировые проблемы: преступность, экология и тому подобное.',
  'Мир кажется мне опасным и враждебным.',
  'Мы с родителями слишком сильно вмешиваемся в жизнь и проблемы друг друга.',
  'Если я что-то скрываю от родителей, я чувствую себя виноватым — как будто предаю их.',
  'Когда мы с родителями пропускаем несколько дней без общения, кто-то из нас чувствует обиду, вину или одиночество.',
  'Мне часто трудно ощутить себя отдельной личностью — независимой от партнёра или родителей.',
  'Сохранять психологическую дистанцию в близких отношениях мне очень сложно — я словно растворяюсь в другом человеке.',
  'В отношениях с родителями или партнёром у меня почти не остаётся пространства для себя.',
  'Мне кажется, родителей очень обижает или обидело бы, если бы я жил отдельно и самостоятельно.',
  'Я убеждён, что действия по собственному желанию рано или поздно приводят к проблемам.',
  'В отношениях я, как правило, уступаю главенство другому человеку.',
  'Я так привык, что за меня решают другие, что потерял понимание собственных желаний.',
  'Меня сильно тревожит, не разочаровываю ли я других — лишь бы они меня не отвергли.',
  'Чтобы избежать открытого конфликта, я готов сделать значительно больше, чем большинство людей.',
  'Я вкладываю в отношения больше, чем получаю обратно.',
  'Как правило, именно на мне лежит забота о близких.',
  'Сколько бы дел у меня ни было, я всегда нахожу время для других.',
  'Я привык быть тем, кто слушает чужие проблемы.',
  'Окружающие говорят, что я чрезмерно жертвую собой ради других.',
  'Сколько бы я ни делал для других — ощущение, что недостаточно, не проходит.',
  'Мысль о том, что я могу утратить контроль над собой, пугает меня.',
  'Я опасаюсь, что если разозлюсь по-настоящему — могу причинить кому-то вред.',
  'Я убеждён, что обязан держать эмоции под контролем — иначе всё выйдет из-под контроля.',
  'Внутри накопилось много злости, обиды и раздражения, которые я не выражаю.',
  'Мне неловко проявлять тепло и привязанность к другим — даже когда это уместно.',
  'Показывать свои чувства другим людям мне очень тяжело.',
  'Мне трудно открываться и чувствовать себя свободно с людьми.',
  'Я так сдерживаю себя, что окружающим кажется, будто я вообще ничего не чувствую.',
  'Меня считают закрытым и зажатым в эмоциональном плане.',
  'Мне важно быть лучшим в том, что я делаю — второе место меня не устраивает.',
  'Я стараюсь, чтобы всё было близко к идеалу.',
  'Стремление к достижениям оставляет мало места для отдыха и расслабления.',
  'Я обязан выполнять все взятые на себя обязательства.',
  'Ради соответствия своим стандартам я нередко отказываюсь от радостей и удовольствий.',
  'Мне трудно простить себе ошибку или найти ей оправдание.',
  'Я стремлюсь быть лучшим по результатам и продуктивности.',
  'Когда мне отказывают в просьбе, мне очень сложно это принять.',
  'Любые ограничения или запреты вызывают у меня сильное раздражение.',
  'Я не считаю нужным следовать правилам и нормам, которые обязательны для всех.',
  'Увлёкшись собственными делами, я нередко забываю о времени для близких.',
  'Мне часто говорят, что я слишком стремлюсь контролировать, как всё происходит.',
  'Я плохо переношу, когда кто-то диктует мне, что делать.',
  'Рутинные и неинтересные задачи я почти не в состоянии выполнять регулярно.',
  'Я нередко поддаюсь порывам и выражаю эмоции, которые потом оборачиваются проблемами для меня или окружающих.',
  'Я быстро устаю от однообразия и начинаю скучать.',
  'Когда задача усложняется, мне обычно не хватает настойчивости, чтобы её закончить.',
  'Даже понимая, что это нужно, я не могу заставить себя делать то, что мне неприятно.',
  'Я часто не следую принятым решениям до конца.',
  'Я нередко действую импульсивно и впоследствии об этом сожалею.',
  'Мне важно, чтобы большинство знакомых хорошо относились ко мне.',
  'Я подстраиваю своё поведение под конкретного человека, чтобы произвести хорошее впечатление.',
  'То, как я себя воспринимаю, во многом определяется мнением окружающих.',
  'Я прилагаю усилия, чтобы понравиться и получить одобрение от важных для меня людей.',
  'Меня чрезмерно беспокоит вопрос: принимают ли меня окружающие.',
  'Я невольно замечаю плохое в жизни, а не хорошее.',
  'Я жду, что что-нибудь неизбежно сорвётся.',
  'Трудностей и неприятностей впереди больше, чем хорошего — я в этом уверен.',
  'Если мне не уделяют особого внимания, я ощущаю себя неважным и незначительным.',
  'Осторожности много не бывает — почти в любой ситуации что-то может пойти не так.',
  'Меня тревожит: одно неправильное решение — и всё рухнет.',
  'Когда я ошибаюсь, я считаю, что должен быть наказан.',
  'Если я сделал что-то не так — оправданий нет и быть не может.',
  'Не справился — значит, должен нести последствия, без исключений.',
  'Причина ошибки не имеет значения — сделал не так, значит должен за это ответить.',
  'В глубине я считаю себя плохим человеком, который заслуживает наказания.',
  'Тех, кто не выполняет свои обязательства, необходимо как-то наказать.',
  'Когда другие оправдываются — я обычно не верю: это просто нежелание брать на себя ответственность.',
  'Даже после извинений обида во мне не проходит.',
  'Меня раздражает, когда люди ищут оправдания или перекладывают вину на других.',
];

interface SchemaInfo {
  name: string;
  questions: number[]; // 1-indexed
  color: string;
  desc: string;
  tip: string;
  needId: string;
}

const SCHEMAS: SchemaInfo[] = [
  {
    name: 'Эмоциональная депривация',
    questions: [1,2,3,4,5],
    color: '#f87171',
    desc: 'Ощущение что тебя никто по-настоящему не понимает и не заботится о тебе так, как ты нуждаешься.',
    tip: 'Попробуй прямо попросить о поддержке — не намёком, а словами.',
    needId: 'attachment',
  },
  {
    name: 'Покинутость/Нестабильность',
    questions: [6,7,8,9,10,11,12,13],
    color: '#f87171',
    desc: 'Страх что близкие уйдут или окажутся ненадёжными — даже если сейчас всё хорошо.',
    tip: 'Замечай, когда партнёр рядом — это реальный факт, а не случайность.',
    needId: 'attachment',
  },
  {
    name: 'Недоверие/Ожидание жестокого обращения',
    questions: [14,15,16,17,18],
    color: '#f87171',
    desc: 'Убеждённость что люди в конечном счёте причинят боль, обманут или используют.',
    tip: 'Выбери одного человека которому доверяешь — и сделай один маленький шаг навстречу.',
    needId: 'attachment',
  },
  {
    name: 'Социальная отчужденность',
    questions: [19,20,21,22,23],
    color: '#f87171',
    desc: 'Ощущение что ты принципиально другой и не принадлежишь ни к какой группе.',
    tip: 'Найди одно сообщество по интересу — не для дружбы, просто чтобы быть среди своих.',
    needId: 'attachment',
  },
  {
    name: 'Дефективность/Стыд',
    questions: [24,25,26,27,28,29],
    color: '#f87171',
    desc: 'Глубокое ощущение что ты плох, и если кто-то узнает тебя настоящего — отвернётся.',
    tip: 'Поделись чем-то личным с одним человеком которому доверяешь — и посмотри что будет.',
    needId: 'attachment',
  },
  {
    name: 'Неуспешность',
    questions: [30,31,32,33,34,35],
    color: '#fb923c',
    desc: 'Убеждённость что ты неизбежно потерпишь неудачу и хуже других в работе или учёбе.',
    tip: 'Запиши три реальных достижения за последний год — маленьких, но своих.',
    needId: 'autonomy',
  },
  {
    name: 'Зависимость/Беспомощность',
    questions: [36,37,38,39,40,41,42,43],
    color: '#fb923c',
    desc: 'Чувство что не способен справляться с жизнью самостоятельно без чьей-то помощи.',
    tip: 'Реши одну бытовую задачу без совета — любую, самую маленькую.',
    needId: 'autonomy',
  },
  {
    name: 'Уязвимость',
    questions: [44,45,46,47,48,49],
    color: '#fb923c',
    desc: 'Хроническое ожидание катастрофы: болезни, финансового краха, опасности.',
    tip: 'Когда возникает тревога — спроси себя: какова реальная вероятность этого прямо сейчас?',
    needId: 'autonomy',
  },
  {
    name: 'Спутанность/Неразвитая идентичность',
    questions: [50,51,52,53,54,55,56],
    color: '#fb923c',
    desc: 'Трудно ощущать себя отдельной личностью — слишком много слияния с близкими.',
    tip: 'Сделай что-то только для себя — без объяснений и разрешения.',
    needId: 'autonomy',
  },
  {
    name: 'Покорность',
    questions: [57,58,59,60,61],
    color: '#34d399',
    desc: 'Привычка уступать и подавлять свои желания из страха конфликта или отвержения.',
    tip: 'Выскажи одно своё мнение сегодня — даже если оно отличается от чужого.',
    needId: 'expression',
  },
  {
    name: 'Самопожертвование',
    questions: [62,63,64,65,66,67],
    color: '#34d399',
    desc: 'Постоянная забота о других за счёт собственных потребностей, с накопленной обидой.',
    tip: 'Откажи кому-то в одной просьбе — и заметь, что ничего страшного не произошло.',
    needId: 'expression',
  },
  {
    name: 'Страх потери контроля над эмоциями',
    questions: [68,69,70,71],
    color: '#818cf8',
    desc: 'Страх что если дать волю чувствам — они выйдут из-под контроля и навредят.',
    tip: 'Назови вслух одну эмоцию которую сейчас чувствуешь — просто назови, не действуй.',
    needId: 'expression',
  },
  {
    name: 'Эмоциональная скованность',
    questions: [72,73,74,75,76],
    color: '#818cf8',
    desc: 'Подавление спонтанных чувств из стыда или убеждения что эмоции — слабость.',
    tip: 'Позволь себе что-то почувствовать сегодня — смех, злость, нежность — не сдерживай.',
    needId: 'expression',
  },
  {
    name: 'Жёсткие стандарты/Придирчивость',
    questions: [77,78,79,80,81,82,83],
    color: '#818cf8',
    desc: 'Постоянное давление соответствовать очень высоким стандартам, жертвуя радостью.',
    tip: 'Сделай что-то «достаточно хорошо» — не идеально — и остановись на этом.',
    needId: 'play',
  },
  {
    name: 'Привилегированность/Грандиозность',
    questions: [84,85,86,87,88,89],
    color: '#facc15',
    desc: 'Ощущение особых прав, нетерпимость к ограничениям и чужим нуждам.',
    tip: 'Спроси кого-то что им нужно — и сделай это, даже если тебе не хочется.',
    needId: 'limits',
  },
  {
    name: 'Недостаточность самоконтроля',
    questions: [90,91,92,93,94,95,96],
    color: '#facc15',
    desc: 'Трудно сдерживать импульсы или доводить дела до конца когда скучно.',
    tip: 'Поставь таймер на 20 минут и сделай одно неприятное дело до сигнала.',
    needId: 'limits',
  },
  {
    name: 'Поиск одобрения',
    questions: [97,98,99,100,101],
    color: '#818cf8',
    desc: 'Самооценка зависит от чужой оценки, подстройка под других чтобы понравиться.',
    tip: 'Прими одно решение исходя только из своих желаний — без оглядки на реакцию других.',
    needId: 'expression',
  },
  {
    name: 'Негативизм/Пессимизм',
    questions: [102,103,104,105,106,107],
    color: '#818cf8',
    desc: 'Устойчивый фокус на негативном, хроническое ожидание плохого исхода.',
    tip: 'Запиши одну хорошую вещь которая случилась сегодня — даже маленькую.',
    needId: 'play',
  },
  {
    name: 'Пунитивность (на себя)',
    questions: [108,109,110,111,112],
    color: '#818cf8',
    desc: 'Жёсткая самокритика за ошибки, убеждённость что заслуживаешь наказания.',
    tip: 'Скажи себе то, что сказал бы другу в такой же ситуации — без осуждения.',
    needId: 'play',
  },
  {
    name: 'Пунитивность (на других)',
    questions: [113,114,115,116],
    color: '#818cf8',
    desc: 'Нетерпимость к чужим ошибкам, гнев когда другие не соответствуют ожиданиям.',
    tip: 'Спроси себя: что стоит за поведением этого человека? Что он чувствовал?',
    needId: 'limits',
  },
];

const NEED_LABELS: Record<string, string> = {
  attachment: 'Привязанность',
  autonomy: 'Автономия',
  expression: 'Выражение',
  play: 'Игра/Радость',
  limits: 'Границы',
};

const PAGE_SIZE = 5;
const TOTAL_PAGES = Math.ceil(QUESTIONS.length / PAGE_SIZE);

type Phase = 'intro' | 'test' | 'result';

interface SchemaScore {
  sum: number;
  max: number;
  pct: number;
  pct5plus: number;
}

function computeScores(answers: number[]): Record<string, SchemaScore> {
  const result: Record<string, SchemaScore> = {};
  for (const schema of SCHEMAS) {
    const vals = schema.questions.map(q => answers[q - 1] ?? 0).filter(v => v > 0);
    const sum = vals.reduce((a, b) => a + b, 0);
    const max = schema.questions.length * 6;
    const pct = Math.round((sum / max) * 100);
    const pct5plus = vals.length > 0 ? Math.round((vals.filter(v => v >= 5).length / schema.questions.length) * 100) : 0;
    result[schema.name] = { sum, max, pct, pct5plus };
  }
  return result;
}

export function YSQTestSheet({ onClose, ratings, autoResume, onViewSchemas }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS.length).fill(0));
  const [page, setPage] = useState(0);
  const userStartedRef = useRef(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [inactiveExpanded, setInactiveExpanded] = useState(false);

  // Always computed from current answers — never stale
  const progressAnswered = answers.filter(a => a > 0).length;

  // Check for saved result or in-progress test on mount
  useEffect(() => {
    // Load from localStorage immediately (offline/fast path)
    try {
      if (!autoResume) {
        const result = localStorage.getItem(YSQ_RESULT_KEY);
        if (result) {
          const parsed = JSON.parse(result);
          if (parsed.answers && Array.isArray(parsed.answers) && parsed.answers.length === QUESTIONS.length) {
            setAnswers(parsed.answers);
            setPhase('result');
          }
        }
      }
      const saved = localStorage.getItem(YSQ_PROGRESS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { answers: number[]; page: number };
        if (Array.isArray(parsed.answers) && parsed.answers.length === QUESTIONS.length) {
          setHasProgress(true);
          setAnswers(parsed.answers);
          if (autoResume) {
            setPage(parsed.page ?? 0);
            setPhase('test');
          }
        }
      }
    } catch { /* ignore */ }

    // Fetch from server — takes priority (syncs across devices)
    if (!autoResume) {
      Promise.all([api.getYsqResult(), api.getYsqProgress()]).then(([serverResult, serverProgress]) => {
        if (userStartedRef.current) return; // user already started test, don't overwrite
        if (serverResult?.answers && Array.isArray(serverResult.answers) && serverResult.answers.length === QUESTIONS.length) {
          localStorage.setItem(YSQ_RESULT_KEY, JSON.stringify({ date: serverResult.completedAt, answers: serverResult.answers }));
          setAnswers(serverResult.answers);
          setPhase('result');
        } else if (serverProgress?.answers && Array.isArray(serverProgress.answers) && serverProgress.answers.length === QUESTIONS.length) {
          localStorage.setItem(YSQ_PROGRESS_KEY, JSON.stringify({ answers: serverProgress.answers, page: serverProgress.page }));
          setAnswers(serverProgress.answers);
          setPage(serverProgress.page);
          setHasProgress(true);
        }
      }).catch(() => {});
    }
  }, []);

  const saveProgress = (newAnswers: number[], newPage: number) => {
    localStorage.setItem(YSQ_PROGRESS_KEY, JSON.stringify({ answers: newAnswers, page: newPage }));
  };

  const handleContinue = () => {
    userStartedRef.current = true;
    try {
      const saved = localStorage.getItem(YSQ_PROGRESS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { answers: number[]; page: number };
        if (Array.isArray(parsed.answers) && parsed.answers.length === QUESTIONS.length) {
          setAnswers(parsed.answers);
          setPage(parsed.page ?? 0);
        }
      }
    } catch { /* ignore */ }
    setPhase('test');
  };

  const handleStartFresh = () => {
    userStartedRef.current = true;
    localStorage.removeItem(YSQ_PROGRESS_KEY);
    setAnswers(Array(QUESTIONS.length).fill(0));
    setPage(0);
    setHasProgress(false);
    setPhase('test');
  };

  const handleAnswer = (qIndex: number, value: number) => {
    const next = [...answers];
    next[qIndex] = value;
    setAnswers(next);
    saveProgress(next, page);
  };

  const pageStart = page * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, QUESTIONS.length);
  const pageQuestions = QUESTIONS.slice(pageStart, pageEnd);
  const pageAnswered = pageQuestions.every((_, i) => answers[pageStart + i] > 0);

  const handleNext = () => {
    if (page < TOTAL_PAGES - 1) {
      const next = page + 1;
      setPage(next);
      saveProgress(answers, next);
      api.saveYsqProgress(answers, next).catch(() => {});
    } else {
      const scores = computeScores(answers);
      localStorage.setItem(YSQ_RESULT_KEY, JSON.stringify({
        date: new Date().toISOString(),
        scores,
        answers,
      }));
      api.saveYsqResult(answers).catch(() => {});
      api.deleteYsqProgress().catch(() => {});
      localStorage.removeItem(YSQ_PROGRESS_KEY);
      setPhase('result');
    }
  };

  const handleBack = () => {
    if (page > 0) {
      const prev = page - 1;
      setPage(prev);
      saveProgress(answers, prev);
      api.saveYsqProgress(answers, prev).catch(() => {});
    } else {
      setPhase('intro');
    }
  };

  const handleRetake = () => {
    localStorage.removeItem(YSQ_RESULT_KEY);
    localStorage.removeItem(YSQ_PROGRESS_KEY);
    setAnswers(Array(QUESTIONS.length).fill(0));
    setPage(0);
    setHasProgress(false);
    setInactiveExpanded(false);
    setPhase('intro');
  };

  const scores = phase === 'result' ? computeScores(answers) : null;
  const sortedSchemas = scores
    ? [...SCHEMAS].sort((a, b) => scores[b.name].pct5plus - scores[a.name].pct5plus)
    : [];

  const getColor = (schemaName: string): string => {
    for (const domain of SCHEMA_DOMAINS) {
      if (domain.schemas.some((s: { name: string }) => schemaName.includes(s.name.split('/')[0].split(' ')[0]) || s.name.includes(schemaName.split('/')[0]))) {
        return domain.color;
      }
    }
    return '#818cf8';
  };

  const schemaColor = (s: SchemaInfo) => getColor(s.name) || s.color;

  return (
    <BottomSheet onClose={onClose} zIndex={300}>
      {phase === 'intro' && (
        <div style={{ padding: '8px 0 16px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Опросник схем YSQ-R
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 12 }}>
            116 утверждений. Оцени каждое от 1 до 6 — насколько это про тебя. Занимает ~10 минут.
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: 20 }}>
            Можно остановиться в любой момент и вернуться позже — прогресс сохраняется автоматически.
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 16px', marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Шкала оценок:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {[1,2,3,4,5,6].map(n => (
                <div key={n} style={{ textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{n}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', maxWidth: 36 }}>
                    {n === 1 ? 'Совсем не про меня' : n === 6 ? 'Полностью про меня' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5, marginBottom: 20, textAlign: 'center' }}>
            Ответы привязаны к аккаунту Telegram и не передаются третьим лицам.
          </div>

          {hasProgress ? (
            <>
              <button
                onClick={handleContinue}
                style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: '#a78bfa', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}
              >
                Продолжить ({progressAnswered} из 116 ответов)
              </button>
              <button
                onClick={handleStartFresh}
                style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginBottom: 10 }}
              >
                Начать заново
              </button>
            </>
          ) : (
            <button
              onClick={() => { userStartedRef.current = true; setPhase('test'); setPage(0); }}
              style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: '#a78bfa', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}
            >
              Начать
            </button>
          )}

          <button
            onClick={onClose}
            style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
          >
            Отмена
          </button>

          <div style={{ marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.7, textAlign: 'center' }}>
            Основан на опроснике YSQ-R (Young Schema Questionnaire, пересмотренная версия).{' '}
            © Jeffrey Young, Schema Therapy Institute.{' '}
            Все права на методику принадлежат{' '}
            <a href="https://schematherapy.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(167,139,250,0.5)', textDecoration: 'none' }}>
              Jeffrey Young
            </a>
            . Используется в образовательных целях.
          </div>
        </div>
      )}

      {phase === 'test' && (
        <div style={{ padding: '8px 0 16px' }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Страница {page + 1} из {TOTAL_PAGES}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{Math.round(((page + 1) / TOTAL_PAGES) * 100)}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${((page + 1) / TOTAL_PAGES) * 100}%`, background: '#a78bfa', borderRadius: 2, transition: 'width 0.3s ease' }} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
            ~{Math.ceil((TOTAL_PAGES - page) * 0.4)} мин осталось
          </div>

          {/* Questions */}
          {pageQuestions.map((q, i) => {
            const qIdx = pageStart + i;
            const selected = answers[qIdx];
            return (
              <div key={qIdx} style={{ marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 14px 12px' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
                  Вопрос {qIdx + 1}
                </div>
                <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.5, marginBottom: 12 }}>{q}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5,6].map(n => (
                    <button
                      key={n}
                      onClick={() => handleAnswer(qIdx, n)}
                      style={{
                        flex: 1, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer',
                        background: selected === n ? '#a78bfa' : 'rgba(255,255,255,0.09)',
                        color: selected === n ? '#fff' : 'rgba(255,255,255,0.55)',
                        fontSize: 14, fontWeight: selected === n ? 700 : 400,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              onClick={handleBack}
              style={{ flex: 1, padding: '13px 0', border: 'none', borderRadius: 14, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
            >
              ← Назад
            </button>
            <button
              onClick={handleNext}
              disabled={!pageAnswered}
              style={{
                flex: 2, padding: '13px 0', border: 'none', borderRadius: 14,
                background: pageAnswered ? '#a78bfa' : 'rgba(255,255,255,0.07)',
                color: pageAnswered ? '#fff' : 'rgba(255,255,255,0.25)',
                fontSize: 15, fontWeight: 600, cursor: pageAnswered ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
            >
              {page < TOTAL_PAGES - 1 ? 'Далее →' : 'Завершить →'}
            </button>
          </div>
          {page < TOTAL_PAGES - 1 && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>
              Можно остановиться — прогресс сохранится
            </div>
          )}
        </div>
      )}

      {phase === 'result' && scores && (() => {
        const activeSchemas = sortedSchemas.filter(s => scores[s.name].pct5plus > 50);
        const inactiveSchemas = sortedSchemas.filter(s => scores[s.name].pct5plus <= 50);

        return (
          <div style={{ padding: '8px 0 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              Схемы, которые могут быть актуальны
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 8 }}>
              Схема считается выраженной если больше половины ответов — 5 или 6
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginBottom: 20, fontStyle: 'italic' }}>
              Это инструмент самоисследования, не клиническое заключение. Результаты могут быть отправной точкой для разговора с психологом.
            </div>

            {/* Active schemas */}
            {activeSchemas.length === 0 && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20, textAlign: 'center', padding: '20px 0' }}>
                Активных схем не обнаружено
              </div>
            )}

            {activeSchemas.map(schema => {
              const s = scores[schema.name];
              const color = schemaColor(schema);
              const rgb = hexToRgb(color);
              const diaryRating = ratings?.[schema.needId];
              const showDiaryHint = diaryRating !== undefined && diaryRating <= 4;
              const needLabel = NEED_LABELS[schema.needId] ?? schema.needId;

              return (
                <div key={schema.name} style={{
                  marginBottom: 12,
                  background: `rgba(${rgb},0.1)`,
                  borderRadius: 14,
                  padding: '14px 16px',
                  border: `1px solid rgba(${rgb},0.3)`,
                }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                        {schema.name}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: color, flexShrink: 0 }}>
                      {s.pct5plus}%
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${s.pct5plus}%`, background: color, borderRadius: 2 }} />
                  </div>

                  {/* Desc */}
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 8 }}>
                    {schema.desc}
                  </div>

                  {/* Link to schema card */}
                  <div
                    onClick={() => onViewSchemas ? onViewSchemas(schema.name) : onClose()}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showDiaryHint ? 8 : 0, padding: '4px 0' }}
                  >
                    <span style={{ fontSize: 13, color: 'rgba(167,139,250,0.85)' }}>Читать карточку схемы</span>
                    <span style={{ fontSize: 16, color: 'rgba(167,139,250,0.5)' }}>›</span>
                  </div>

                  {/* Diary connection */}
                  {showDiaryHint && (
                    <div style={{ fontSize: 12, color: '#facc15', lineHeight: 1.4, padding: '6px 10px', background: 'rgba(250,204,21,0.1)', borderRadius: 8 }}>
                      <span style={{ marginRight: 4 }}>⚡</span>
                      Совпадает с дневником: «{needLabel}» стабильно низкая
                    </div>
                  )}
                </div>
              );
            })}

            {/* Inactive schemas — collapsed section */}
            {inactiveSchemas.length > 0 && (
              <div style={{ marginTop: 8, marginBottom: 12 }}>
                <button
                  onClick={() => setInactiveExpanded(prev => !prev)}
                  style={{
                    width: '100%', padding: '11px 16px', border: 'none', borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                    fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>Остальные схемы ({inactiveSchemas.length})</span>
                  <span style={{ fontSize: 12 }}>{inactiveExpanded ? '▲' : '▼'}</span>
                </button>

                {inactiveExpanded && (
                  <div style={{ marginTop: 8 }}>
                    {inactiveSchemas.map(schema => {
                      const s = scores[schema.name];
                      const mid = s.pct5plus >= 30 && s.pct5plus <= 50;
                      const barColor = mid ? '#fbbf24' : 'rgba(255,255,255,0.2)';
                      return (
                        <div key={schema.name} style={{
                          marginBottom: 8,
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: 12,
                          padding: '12px 14px',
                          border: '1px solid transparent',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.6)', flex: 1, paddingRight: 8, lineHeight: 1.3 }}>
                              {schema.name}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: barColor, flexShrink: 0 }}>
                              {s.pct5plus}%
                            </div>
                          </div>
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${s.pct5plus}%`, background: barColor, borderRadius: 2 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSchemas.length > 0 && (
              <div style={{
                marginTop: 8, marginBottom: 16,
                background: 'rgba(167,139,250,0.07)',
                border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: 16, padding: '16px 18px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa', marginBottom: 8 }}>
                  Хочешь разобраться глубже?
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 12 }}>
                  Схемы — это паттерны, сформировавшиеся давно. Их можно менять, но это требует времени и поддержки. Схема-терапия — один из самых эффективных методов для этой работы.
                </div>
                <a
                  href="https://t.me/kotlarewski"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '11px 0', borderRadius: 12,
                    background: 'rgba(167,139,250,0.15)',
                    color: '#a78bfa', fontSize: 14, fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Поговорить с психологом →
                </a>
              </div>
            )}

            <button
              onClick={onClose}
              style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: '#a78bfa', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 4, marginBottom: 10 }}
            >
              Сохранить и закрыть
            </button>
            <button
              onClick={handleRetake}
              style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
            >
              Пройти заново
            </button>

            <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.15)', lineHeight: 1.7, textAlign: 'center' }}>
              © Jeffrey Young, Schema Therapy Institute.{' '}
              Все права на методику YSQ-R принадлежат{' '}
              <a href="https://schematherapy.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(167,139,250,0.3)', textDecoration: 'none' }}>
                Jeffrey Young
              </a>
              . Используется в образовательных целях.
            </div>
          </div>
        );
      })()}
    </BottomSheet>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
