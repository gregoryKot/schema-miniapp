const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

/** "7 апр" from "2026-04-07" */
export function fmtDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`;
}
