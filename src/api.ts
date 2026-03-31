const rawBase = (import.meta.env.VITE_API_URL as string) ?? '';
const BASE = rawBase && !rawBase.startsWith('http') ? `https://${rawBase}` : rawBase;

function authHeaders(): Record<string, string> {
  return {
    'x-telegram-init-data': window.Telegram?.WebApp?.initData ?? '',
    'Content-Type': 'application/json',
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export interface UserSettings {
  notifyEnabled: boolean;
  notifyLocalHour: number;
  notifyTimezone: string;
  notifyReminderEnabled: boolean;
  pairCardDismissed: boolean;
  mySchemaIds: string[];
  myModeIds: string[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  todayDone: boolean;
  weekDots: boolean[];
}

export interface Achievement {
  id: string;
  earned: boolean;
}

export interface UserPractice {
  id: number;
  needId: string;
  text: string;
}

export interface PartnerInfo {
  code: string;
  partnerIndex: number | null;
  partnerTodayDone: boolean;
  partnerName: string | null;
  partnerTelegramId: number | null;
  partnerWeekAvgs: (number | null)[];
}

export interface PairsData {
  partners: PartnerInfo[];
  pendingCode: string | null;
}

export interface PracticePlan {
  id: number;
  needId: string;
  practiceText: string;
  scheduledDate: string;
  reminderUtcHour: number | null;
  done: boolean | null;
}

export const api = {
  init:           (tzOffset?: number) => post('/api/init', { tzOffset }),
  getDisclaimer:  () => get<{ accepted: boolean }>('/api/disclaimer'),
  acceptDisclaimer: () => post('/api/disclaimer', {}),
  getYsqProgress: () => get<{ answers: number[]; page: number } | null>('/api/ysq-progress'),
  saveYsqProgress: (answers: number[], page: number) => post('/api/ysq-progress', { answers, page }),
  deleteYsqProgress: async () => {
    const res = await fetch(`${BASE}/api/ysq-progress`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
  },
  needs:          () => get<import('./types').Need[]>('/api/needs'),
  ratings:        (date?: string) => get<Record<string, number>>(`/api/ratings${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  saveRating:     (needId: string, value: number, date?: string) => {
    const res = fetch(`${BASE}/api/rating`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ needId, value, date }) });
    return res.then(r => { if (!r.ok) throw new Error(`API error: ${r.status}`); return r.json() as Promise<{ ok: boolean; allDone: boolean; streak?: StreakData }>; });
  },
  history:        (days = 7) => get<import('./types').DayHistory[]>(`/api/history?days=${days}`),
  getSettings:    () => get<UserSettings>('/api/settings'),
  updateSettings: (body: Partial<UserSettings>) => post('/api/settings', body),
  getAchievements: () => get<Achievement[]>('/api/achievements'),
  getNote:         (date: string) => get<{ text: string | null; tags: string[] }>(`/api/note?date=${date}`),
  saveNote:        (date: string, text: string, tags?: string[]) => post('/api/note', { date, text, tags }),
  getStreak:      () => get<StreakData>('/api/streak'),
  recordActivity: () => post('/api/activity', {}),
  getInsights:    () => get<{
    weeklyStats: Array<{ needId: string; avg: number | null; trend: '↑' | '↓' | '→' }>;
    bestDayOfWeek: string | null;
    worstDayOfWeek: string | null;
    totalDays: number;
  }>('/api/insights'),
  getExport: () => get<{ text: string }>('/api/export'),
  getPractices:  (needId: string) => get<UserPractice[]>(`/api/practices?needId=${needId}`),
  addPractice:   (needId: string, text: string) => post('/api/practices', { needId, text }),
  deletePractice:(id: number) => fetch(`${BASE}/api/practices/${id}`, { method: 'DELETE', headers: authHeaders() }).then(r => { if (!r.ok) throw new Error(`API error: ${r.status}`); }),
  deleteAllUserData: () => fetch(`${BASE}/api/user`, { method: 'DELETE', headers: authHeaders() }).then(r => { if (!r.ok) throw new Error('Failed'); }),
  getPendingPlans:() => get<PracticePlan[]>('/api/plan/pending'),
  getPlanHistory: (days = 30) => get<PracticePlan[]>(`/api/plans/history?days=${days}`),
  createPlan:    (needId: string, practiceText: string, reminderUtcHour?: number) =>
    post('/api/plan', { needId, practiceText, reminderUtcHour }),
  checkinPlan:   (id: number, done: boolean) => post(`/api/plan/${id}/checkin`, { done }),
  getPair: () => get<PairsData>('/api/pair'),
  createPairInvite: async () => {
    const res = await fetch(`${BASE}/api/pair/invite`, { method: 'POST', headers: authHeaders(), body: '{}' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<{ code: string; url: string }>;
  },
  joinPair: (code: string) => post('/api/pair/join', { code }),
  leavePair: async (code: string) => {
    const res = await fetch(`${BASE}/api/pair`, { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ code }) });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
  },
  getChildhoodRatings: () => get<Record<string, number>>('/api/childhood-ratings'),
  saveChildhoodRatings: (ratings: Record<string, number>) => post('/api/childhood-ratings', ratings),
  getYsqResult: () => get<{ answers: number[]; completedAt: string } | null>('/api/ysq-result'),
  saveYsqResult: (answers: number[]) => post('/api/ysq-result', { answers }),
  deleteYsqResult: async () => {
    const res = await fetch(`${BASE}/api/ysq-result`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
  },

  // ─── Profile ────────────────────────────────────────────────────────────────
  getProfile: () => get<import('./types').UserProfile>('/api/profile'),

  // ─── Diary ──────────────────────────────────────────────────────────────────
  getSchemaDiary:    () => get<import('./types').SchemaDiaryEntry[]>('/api/diary/schema'),
  createSchemaDiary: (data: {
    trigger: string; emotions: import('./types').EmotionEntry[];
    thoughts?: string; bodyFeelings?: string; actualBehavior?: string;
    schemaIds: string[]; schemaOrigin?: string; healthyView?: string;
    realProblems?: string; excessiveReactions?: string; healthyBehavior?: string;
  }) => postJson<import('./types').SchemaDiaryEntry>('/api/diary/schema', data),
  deleteSchemaDiary: (id: number) => del(`/api/diary/schema/${id}`),

  getModeDiary: () => get<import('./types').ModeDiaryEntry[]>('/api/diary/mode'),
  createModeDiary: (data: {
    modeId: string; situation: string; thoughts?: string; feelings?: string;
    bodyFeelings?: string; actions?: string; actualNeed?: string; childhoodMemories?: string;
  }) => postJson<import('./types').ModeDiaryEntry>('/api/diary/mode', data),
  deleteModeDiary: (id: number) => del(`/api/diary/mode/${id}`),

  getGratitudeDiary:    () => get<import('./types').GratitudeDiaryEntry[]>('/api/diary/gratitude'),
  createGratitudeDiary: (date: string, items: string[]) =>
    postJson<import('./types').GratitudeDiaryEntry>('/api/diary/gratitude', { date, items }),
  deleteGratitudeDiary: (id: number) => del(`/api/diary/gratitude/${id}`),
};
