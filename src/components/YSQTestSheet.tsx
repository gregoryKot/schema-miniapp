import { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { SCHEMA_DOMAINS } from './SchemaInfoSheet';

export const YSQ_RESULT_KEY = 'ysq_result';
export const YSQ_PROGRESS_KEY = 'ysq_progress';

interface Props {
  onClose: () => void;
}

const QUESTIONS: string[] = [
  'У меня не было достаточно любви и внимания.',
  'По большей части мне не на кого было положиться в плане советов и эмоциональной поддержки.',
  'Большую часть моей жизни у меня не было человека, который хотел бы сблизиться со мной и проводить со мной много времени.',
  'Большую часть своей жизни я не чувствовал себя особенным для кого-то.',
  'Рядом со мной редко был сильный человек, который мог бы дать мне разумный совет или подсказать направление, когда я не был уверен, что мне делать.',
  'Я беспокоюсь, что близкие мне люди покинут или бросят меня.',
  'Я чувствую, что важные отношения не будут длиться долго; я ожидаю, что они закончатся.',
  'Я ощущаю себя зависимым от партнеров, которые не могут быть рядом со мной в полной мере.',
  'Я расстраиваюсь, когда меня оставляют в одиночестве даже на короткое время.',
  'Я не могу позволить себе по-настоящему сблизиться с другими людьми, потому что не могу быть уверен, что они всегда будут рядом.',
  'Близкие мне люди были очень непредсказуемы: в один момент они доступны и милы со мной; в другой — они злы, расстроены, поглощены собой, ругаются и т.д.',
  'Я так сильно нуждаюсь в других людях, что боюсь их потерять.',
  'Если я буду собой или начну выражать свои настоящие чувства, люди меня бросят.',
  'Я чувствую, что не могу расслабиться в присутствии других людей, иначе они намеренно причинят мне боль.',
  'Меня рано или поздно предадут — это лишь вопрос времени.',
  'Мне очень трудно доверять людям.',
  'Я устраиваю людям «проверки», чтобы выяснить, говорят ли они мне правду и имеют ли благие намерения.',
  'Я убежден: или контролируешь ты, или тебя.',
  'Я в корне отличаюсь от других людей.',
  'Я — одиночка и не принадлежу ни к какому «кругу».',
  'Я всегда чувствую себя «за бортом» в компании.',
  'Никто не понимает меня по-настоящему.',
  'Иногда я чувствую себя чужаком.',
  'Никто из тех, кого я желаю, не захочет оставаться рядом со мной, если узнает меня настоящего.',
  'Я по своей сути ущербен и неполноценен.',
  'Мне кажется, что меня нельзя полюбить.',
  'Мои основные черты и качества слишком неприятны, чтобы раскрыться перед другими людьми.',
  'Когда я нравлюсь людям, я чувствую, что ввожу их в заблуждение.',
  'Я не могу понять, как кто-то мог бы полюбить меня.',
  'Почти всё, что я делаю на работе (или на учёбе) получается не так хорошо, как это делают другие люди.',
  'Большинство людей способнее меня в плане работы (или учёбы) и достижений.',
  'Я неудачник.',
  'Я не такой талантливый, как большинство людей в работе (или учёбе).',
  'Я часто чувствую себя неловко в окружении других людей, потому что мой уровень достижений не соответствует им.',
  'Я часто сравниваю свои достижения с достижениями других людей и чувствую, что они гораздо успешнее.',
  'Я не чувствую себя способным самостоятельно справляться с повседневной жизнью.',
  'Я считаю, что другие люди лучше способны позаботиться обо мне, чем я сам.',
  'Мне трудно решать новые задачи вне работы (или школы), если меня никто не направляет.',
  'Я косячу во всем, что пробую сделать, даже если это не касается работы или учёбы.',
  'Если я положусь только на своё мнение в повседневных ситуациях, я приму неверное решение.',
  'Я чувствую, что мне нужен человек, на которого можно положиться и с которым я мог бы советоваться по практическим вопросам.',
  'Когда дело касается выполнения повседневных обязанностей, я ощущаю себя скорее ребёнком, чем взрослым.',
  'Я считаю повседневные обязанности непосильными.',
  'Я чувствую, что в любой момент может произойти нечто ужасное (природная катастрофа, преступление, финансовый кризис или несчастный случай).',
  'Я опасаюсь нападения.',
  'Я принимаю большие меры предосторожности, чтобы не заболеть или не получить травму.',
  'Несмотря на то, что врачи ничего не нашли, я всё равно боюсь, что прямо сейчас у меня развивается серьёзная болезнь.',
  'Я много беспокоюсь о плохих вещах, происходящих в мире: преступности, загрязнении окружающей среды и т.д.',
  'Мне кажется, что мир — опасное место.',
  'Мы с родителями склонны чрезмерно вовлекаться в жизнь и решение проблем друг друга.',
  'Мне и моим родителям трудно скрывать друг от друга личные сведения, не чувствуя себя при этом предатёлями или виноватыми.',
  'Если мы с родителями не общаемся почти каждый день, кто-то из нас начинает чувствовать себя виноватым, обиженным, разочарованным или одиноким.',
  'Зачастую я не чувствую себя целостной личностью, отдельной от личности моего партнёра или кого-то из родителей.',
  'Мне очень трудно сохранять дистанцию с людьми, с которыми я близко общаюсь; я испытываю сложности с ощущением себя отдельной личностью.',
  'Я часто чувствую, что в отношениях с родителями или партнёром у меня нет никакого личного пространства.',
  'Я чувствую, что моих родителей очень ранит или ранило бы то, что я живу самостоятельно, вдали от них.',
  'Я думаю, что если я буду делать то, что мне хочется, это непременно приведёт к неприятностям.',
  'В отношениях я обычно позволяю другому человеку быть главным.',
  'Я всегда позволял другим выбирать за меня, поэтому я на самом деле не знаю, чего хочу.',
  'Я много беспокоюсь о том, как угодить другим людям, чтобы они не отвергли меня.',
  'Я приложу гораздо больше усилий, чем большинство людей, чтобы избежать открытого конфликта.',
  'Я отдаю другим людям больше, чем получаю взамен.',
  'В конечном итоге обычно именно я забочусь о близких мне людях.',
  'Как бы я ни был занят, я всегда могу найти время для других.',
  'Я всегда был тем, кто выслушивает проблемы всех остальных.',
  'Люди считают, что я слишком много делаю для других и недостаточно для себя.',
  'Сколько бы я ни давал, мне кажется, что этого всегда мало.',
  'Я боюсь потерять контроль над своими действиями.',
  'Я беспокоюсь, что могу навредить кому-то физически или эмоционально, если мой гнев выйдет из-под контроля.',
  'Мне кажется, что я должен контролировать свои эмоции и импульсы, или произойдёт что-то плохое.',
  'Во мне скопилось много невыраженного гнева, возмущения и обиды.',
  'Я слишком стесняюсь проявлять положительные чувства к другим (например, показывать привязанность, неравнодушие).',
  'Мне неловко показывать свои чувства другим.',
  'Мне трудно быть открытым и раскованным.',
  'Я настолько контролирую себя, что людям кажется, что у меня нет эмоций.',
  'Люди считают меня эмоционально зажатым.',
  'Я должен быть лучшим в большей части того, что я делаю; я не могу согласиться на второе место.',
  'Я стремлюсь содержать почти всё в идеальном порядке.',
  'Мне нужно многого достичь, поэтому почти не остаётся времени, чтобы по-настоящему расслабиться.',
  'Я должен выполнять все свои обязанности.',
  'Я часто жертвую удовольствием и счастьем, чтобы соответствовать собственным стандартам.',
  'Мне сложно снять с себя ответственность или найти оправдание своим ошибкам.',
  'Я всегда должен быть первым по продуктивности и достижениям.',
  'Мне очень трудно принять отказ, когда мне что-то нужно от других людей.',
  'Я ненавижу, когда меня ограничивают или не дают делать то, что я хочу.',
  'Я не чувствую себя обязанным соблюдать обычные правила и условности, как это делают другие люди.',
  'Я часто замечаю, что настолько вовлечён в свои собственные приоритетные задачи, что у меня не остаётся времени на друзей и семью.',
  'Люди часто говорят мне, что я чрезмерно контролирую то, как делаются дела.',
  'Я не выношу, когда мне указывают, что делать.',
  'Я не могу приучить себя выполнять рутинные или скучные задания.',
  'Часто я позволяю себе идти на поводу у импульсов и выражать эмоции, которые чреваты для меня неприятностями или могут причинить боль другим людям.',
  'Я очень быстро начинаю испытывать скуку.',
  'Когда задания становятся трудными, я обычно не могу проявить настойчивость и завершить их.',
  'Я не могу заставить себя делать то, что мне не нравится, даже если знаю, что это для моего же блага.',
  'Мне редко удаётся придерживаться своих решений.',
  'Я часто совершаю импульсивные поступки, о которых потом жалею.',
  'Для меня важно нравиться большинству из тех, кого я знаю.',
  'Я меняюсь и подстраиваюсь под людей, с которыми общаюсь, чтобы больше им понравиться.',
  'Моя самооценка зависит главным образом от того, как меня оценивают другие люди.',
  'Я стараюсь произвести впечатление и добиться одобрения со стороны людей, которые мне небезразличны.',
  'Я слишком озабочен тем, принимают ли меня другие люди.',
  'Я сосредотачиваюсь на плохих вещах в жизни, а не на хороших.',
  'Что-то обязательно пойдёт не так.',
  'Плохие дела, с которыми мне предстоит столкнуться, перевешивают хорошие.',
  'Когда я не получаю повышенного внимания, я чувствую себя недостаточно значимым.',
  'Ты не можешь переборщить с осторожностью; почти всегда что-то может пойти не так.',
  'Я беспокоюсь, что неверное решение может привести к катастрофе.',
  'Если я совершаю ошибку, я заслуживаю наказания.',
  'Когда я совершаю ошибку — мне нет оправдания.',
  'Если я не справлюсь с задачей, то должен буду пострадать от последствий.',
  'Не имеет значения, почему я сделал ошибку — если я делаю что-то не так, то мне придётся за это расплачиваться.',
  'Я плохой человек, который заслуживает наказания.',
  'Люди, которые не выполняют свою часть работы, должны быть каким-то образом наказаны.',
  'Чаще всего я не принимаю оправданий, которые приводят другие люди — они просто не хотят брать на себя ответственность и расплачиваться за последствия.',
  'Я продолжаю чувствовать обиду даже после того, как передо мной извинились.',
  'Я злюсь, когда люди оправдывают себя или обвиняют других в своих проблемах.',
];

interface SchemaInfo {
  name: string;
  questions: number[]; // 1-indexed
  color: string;
}

const SCHEMAS: SchemaInfo[] = [
  { name: 'Эмоциональная депривация', questions: [1,2,3,4,5], color: '#f87171' },
  { name: 'Покинутость/Нестабильность', questions: [6,7,8,9,10,11,12,13], color: '#f87171' },
  { name: 'Недоверие/Ожидание жестокого обращения', questions: [14,15,16,17,18], color: '#f87171' },
  { name: 'Социальная отчужденность', questions: [19,20,21,22,23], color: '#f87171' },
  { name: 'Дефективность/Стыд', questions: [24,25,26,27,28,29], color: '#f87171' },
  { name: 'Неуспешность', questions: [30,31,32,33,34,35], color: '#fb923c' },
  { name: 'Зависимость/Беспомощность', questions: [36,37,38,39,40,41,42,43], color: '#fb923c' },
  { name: 'Уязвимость', questions: [44,45,46,47,48,49], color: '#fb923c' },
  { name: 'Спутанность/Неразвитая идентичность', questions: [50,51,52,53,54,55,56], color: '#fb923c' },
  { name: 'Покорность', questions: [57,58,59,60,61], color: '#34d399' },
  { name: 'Самопожертвование', questions: [62,63,64,65,66,67], color: '#34d399' },
  { name: 'Страх потери контроля над эмоциями', questions: [68,69,70,71], color: '#818cf8' },
  { name: 'Эмоциональная скованность', questions: [72,73,74,75,76], color: '#818cf8' },
  { name: 'Жёсткие стандарты/Придирчивость', questions: [77,78,79,80,81,82,83], color: '#818cf8' },
  { name: 'Привилегированность/Грандиозность', questions: [84,85,86,87,88,89], color: '#facc15' },
  { name: 'Недостаточность самоконтроля', questions: [90,91,92,93,94,95,96], color: '#facc15' },
  { name: 'Поиск одобрения', questions: [97,98,99,100,101], color: '#818cf8' },
  { name: 'Негативизм/Пессимизм', questions: [102,103,104,105,106,107], color: '#818cf8' },
  { name: 'Пунитивность (на себя)', questions: [108,109,110,111,112], color: '#818cf8' },
  { name: 'Пунитивность (на других)', questions: [113,114,115,116], color: '#818cf8' },
];

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

export function YSQTestSheet({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS.length).fill(0));
  const [page, setPage] = useState(0);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(YSQ_PROGRESS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { answers: number[]; page: number };
        if (Array.isArray(parsed.answers) && parsed.answers.length === QUESTIONS.length) {
          setAnswers(parsed.answers);
          setPage(parsed.page ?? 0);
          setPhase('test');
        }
      }
    } catch { /* ignore */ }
  }, []);

  const saveProgress = (newAnswers: number[], newPage: number) => {
    localStorage.setItem(YSQ_PROGRESS_KEY, JSON.stringify({ answers: newAnswers, page: newPage }));
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
    } else {
      // finish
      const scores = computeScores(answers);
      localStorage.setItem(YSQ_RESULT_KEY, JSON.stringify({
        date: new Date().toISOString(),
        scores,
      }));
      localStorage.removeItem(YSQ_PROGRESS_KEY);
      setPhase('result');
    }
  };

  const handleBack = () => {
    if (page > 0) {
      const prev = page - 1;
      setPage(prev);
      saveProgress(answers, prev);
    } else {
      setPhase('intro');
    }
  };

  const scores = phase === 'result' ? computeScores(answers) : null;
  const sortedSchemas = scores
    ? [...SCHEMAS].sort((a, b) => scores[b.name].pct5plus - scores[a.name].pct5plus)
    : [];

  // Resolve color from SCHEMA_DOMAINS based on schema name
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
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 20 }}>
            116 утверждений. Оцени каждое от 1 до 6 — насколько это про тебя. Занимает ~10 минут.
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
          <button
            onClick={() => { setPhase('test'); setPage(0); }}
            style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: '#a78bfa', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}
          >
            Начать
          </button>
          <button
            onClick={onClose}
            style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
          >
            Отмена
          </button>
        </div>
      )}

      {phase === 'test' && (
        <div style={{ padding: '8px 0 16px' }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Страница {page + 1} из {TOTAL_PAGES}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{Math.round(((page + 1) / TOTAL_PAGES) * 100)}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${((page + 1) / TOTAL_PAGES) * 100}%`, background: '#a78bfa', borderRadius: 2, transition: 'width 0.3s ease' }} />
            </div>
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
        </div>
      )}

      {phase === 'result' && scores && (
        <div style={{ padding: '8px 0 16px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Твои активные схемы
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 20 }}>
            Схема считается выраженной если больше половины ответов — 5 или 6
          </div>

          {sortedSchemas.map(schema => {
            const s = scores[schema.name];
            const active = s.pct5plus > 50;
            const mid = s.pct5plus >= 30 && s.pct5plus <= 50;
            const barColor = active ? schemaColor(schema) : mid ? '#fbbf24' : 'rgba(255,255,255,0.2)';
            return (
              <div key={schema.name} style={{
                marginBottom: 10,
                background: active ? `rgba(${hexToRgb(schemaColor(schema))},0.1)` : 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                padding: '12px 14px',
                border: active ? `1px solid rgba(${hexToRgb(schemaColor(schema))},0.3)` : '1px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.6)', flex: 1, paddingRight: 8, lineHeight: 1.3 }}>
                    {schema.name}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: barColor, flexShrink: 0 }}>
                    {s.pct5plus}%
                  </div>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${s.pct5plus}%`, background: barColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            );
          })}

          <button
            onClick={onClose}
            style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 14, background: '#a78bfa', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}
          >
            Сохранить и закрыть
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
