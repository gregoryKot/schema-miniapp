export interface Need {
  id: string;
  emoji: string;
  title: string;
  chartLabel: string;
}

export interface DayHistory {
  date: string;
  ratings: Record<string, number>;
}

export const COLORS: Record<string, string> = {
  attachment: '#ff6b9d',
  autonomy:   '#4fa3f7',
  expression: '#ffd166',
  play:       '#06d6a0',
  limits:     '#a78bfa',
};

export const YESTERDAY: Record<string, number> = {
  attachment: 5,
  autonomy:   6,
  expression: 4,
  play:       7,
  limits:     6,
};
