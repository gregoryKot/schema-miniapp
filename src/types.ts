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

// ─── Diary types ──────────────────────────────────────────────────────────────

export type DiaryType = 'schema' | 'mode' | 'gratitude';

export interface EmotionEntry {
  id: string;
  intensity: number;
}

export interface SchemaDiaryEntry {
  id: number;
  createdAt: string;
  trigger: string;
  emotions: EmotionEntry[];
  thoughts?: string | null;
  bodyFeelings?: string | null;
  actualBehavior?: string | null;
  schemaIds: string[];
  schemaOrigin?: string | null;
  healthyView?: string | null;
  realProblems?: string | null;
  excessiveReactions?: string | null;
  healthyBehavior?: string | null;
}

export interface ModeDiaryEntry {
  id: number;
  createdAt: string;
  modeId: string;
  situation: string;
  thoughts?: string | null;
  feelings?: string | null;
  bodyFeelings?: string | null;
  actions?: string | null;
  actualNeed?: string | null;
  childhoodMemories?: string | null;
}

export interface GratitudeDiaryEntry {
  id: number;
  date: string;
  items: string[];
  createdAt: string;
}

export interface UserProfile {
  role: 'CLIENT' | 'THERAPIST';
  ysq: {
    completedAt: string | null;
    activeSchemaIds: string[];
  };
  notifications: {
    enabled: boolean;
    reminderEnabled: boolean;
    timezone: string;
    localHour: number;
  };
  streak: number;
  lastActivity: {
    needsTracker: string | null;
    schemaDiary: string | null;
    modeDiary: string | null;
    gratitudeDiary: string | null;
  };
}
