// Вопросы карточки режима (бланк проработки режима из схема-терапии)

export interface ModeCardData {
  modeFunction: string;
  triggers: string;
  feelings: string;
  thoughts: string;
  childhood: string;
  behavior: string;
  needs: string;
  needsMet: string;
  healthyAdult: string;
}

export const EMPTY_MODE_CARD: ModeCardData = {
  modeFunction: '', triggers: '', feelings: '', thoughts: '', childhood: '',
  behavior: '', needs: '', needsMet: '', healthyAdult: '',
};

export const MODE_CARD_QUESTIONS: { key: keyof ModeCardData; label: string; hint: string; placeholder: string }[] = [
  {
    key: 'modeFunction',
    label: 'Какая у него функция',
    hint: 'Зачем этот режим нужен? От чего защищает, что пытается дать?',
    placeholder: 'Защищает от боли отвержения, помогает избежать критики...',
  },
  {
    key: 'triggers',
    label: 'Когда активируется',
    hint: 'Ситуации, люди, слова — что запускает этот режим?',
    placeholder: 'Когда меня критикуют, когда нужно выступить...',
  },
  {
    key: 'feelings',
    label: 'Что чувствую',
    hint: 'Эмоции и ощущения в теле',
    placeholder: 'Тревога, комок в горле, напряжение в плечах...',
  },
  {
    key: 'thoughts',
    label: 'Что говорит внутри',
    hint: 'Убеждения, голос, монолог этого режима',
    placeholder: '«Я недостаточно хорош», «Лучше не рисковать»...',
  },
  {
    key: 'childhood',
    label: 'Откуда он родом',
    hint: 'Детские воспоминания, связанные с этим режимом. Когда он появился?',
    placeholder: 'Когда меня ругали за ошибки, в школе...',
  },
  {
    key: 'behavior',
    label: 'Как проявляется в поведении',
    hint: 'Что делаешь (или перестаёшь делать) в этом режиме',
    placeholder: 'Замолкаю, избегаю, злюсь, переусердствую...',
  },
  {
    key: 'needs',
    label: 'Чего на самом деле хочет',
    hint: 'Глубинная потребность за этим режимом',
    placeholder: 'Безопасности, признания, контакта...',
  },
  {
    key: 'needsMet',
    label: 'Работает ли эта стратегия',
    hint: 'Удовлетворяют ли твои действия в этом режиме настоящую потребность?',
    placeholder: 'Даёт передышку, но ближе к людям не становлюсь...',
  },
  {
    key: 'healthyAdult',
    label: 'Как можно по-другому',
    hint: 'Как действовать из Здорового Взрослого? Что он мог бы сказать этому режиму?',
    placeholder: '«Спасибо, что защищал меня. Теперь я могу справиться сам»...',
  },
];
