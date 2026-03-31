import { useEffect, useState } from 'react';
import { api, UserSettings, StreakData } from '../api';
import { Section } from '../components/BottomNav';

export const DEFAULT_SECTION_KEY = 'default_section';

interface Props {
  onOpenProfile: () => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

function StatCard({ value, label, emoji, color }: { value: number; label: string; emoji: string; color: string }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}22`,
      borderRadius: 18, padding: '16px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{emoji}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-1px' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

export function ProfileSection({ onOpenProfile }: Props) {
  const firstName = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.first_name ?? '';
  const safeTop = (window.Telegram?.WebApp as any)?.safeAreaInset?.top ?? 0;

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [defaultSection, setDefaultSection] = useState<Exclude<Section, 'profile'>>(
    () => {
      const stored = localStorage.getItem(DEFAULT_SECTION_KEY);
      if (stored === 'tracker' || stored === 'diaries') return stored;
      return 'home';
    }
  );

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(() => setSettings({ notifyEnabled: false, notifyLocalHour: 21, notifyTimezone: 'Europe/Moscow', notifyReminderEnabled: false, pairCardDismissed: false }));
    api.getStreak()
      .then(setStreak)
      .catch(() => {});
  }, []);

  async function toggleNotify() {
    if (!settings) return;
    const next = { notifyEnabled: !settings.notifyEnabled };
    setSettings({ ...settings, ...next });
    await api.updateSettings(next).catch(() => {});
  }

  function pickDefault(s: Exclude<Section, 'profile'>) {
    setDefaultSection(s);
    localStorage.setItem(DEFAULT_SECTION_KEY, s);
  }

  const notifyOn = settings?.notifyEnabled ?? false;
  const localHour = settings?.notifyLocalHour ?? 21;
  const currentStreak = streak?.currentStreak ?? 0;
  const totalDays = streak?.totalDays ?? 0;

  const SCREENS: { id: Exclude<Section, 'profile'>; label: string; emoji: string }[] = [
    { id: 'home', label: 'Главная', emoji: '🏠' },
    { id: 'tracker', label: 'Потребности', emoji: '🎯' },
    { id: 'diaries', label: 'Дневники', emoji: '📔' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 90, paddingTop: safeTop + 16, animation: 'fade-in 0.25s ease' }}>

      {/* Header */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          {firstName || 'Профиль'}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          Настройки и прогресс
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 14px' }}>
        <StatCard value={currentStreak} label="дней подряд" emoji="🔥" color="#f97316" />
        <StatCard value={totalDays} label="всего дней" emoji="📅" color="#60a5fa" />
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Notifications */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          animation: 'slide-up 0.3s ease 0.05s both',
        }}>
          <div
            onClick={toggleNotify}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '16px 18px' }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Ежедневное напоминание</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {notifyOn ? `Каждый день в ${pad(localHour)}:00` : 'Выключено'}
              </div>
            </div>
            <div style={{
              width: 44, height: 26, borderRadius: 13, position: 'relative',
              background: notifyOn ? '#a78bfa' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: notifyOn ? 21 : 3,
                width: 20, height: 20, borderRadius: 10,
                background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </div>
          </div>
          {notifyOn && (
            <div
              onClick={onOpenProfile}
              style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                padding: '12px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Изменить время и часовой пояс</div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</div>
            </div>
          )}
        </div>

        {/* Default screen */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '16px 18px',
          animation: 'slide-up 0.3s ease 0.1s both',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
            Открывать сначала
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {SCREENS.map(s => {
              const active = defaultSection === s.id;
              return (
                <button key={s.id} onClick={() => pickDefault(s.id)} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 14, border: 'none',
                  background: active ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                  fontSize: 11, fontWeight: active ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                  outline: active ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed settings */}
        <div onClick={onOpenProfile} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '16px 18px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'slide-up 0.3s ease 0.15s both',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Детальные настройки</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Часовой пояс, партнёр, достижения</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</div>
        </div>

      </div>
    </div>
  );
}
