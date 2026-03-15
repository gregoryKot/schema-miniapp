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
  attachment: '#FF6B9D',
  autonomy:   '#4FACFE',
  expression: '#FFD93D',
  play:       '#6BCB77',
  limits:     '#C77DFF',
};
