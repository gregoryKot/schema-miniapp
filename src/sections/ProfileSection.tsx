import { useEffect, useState } from 'react';
import { api, UserSettings } from '../api';
import { Section } from '../components/BottomNav';

export const DEFAULT_SECTION_KEY = 'default_section';

const SECTION_LABELS: Record<Exclude<Section, 'profile'>, string> = {
  home: 'Главная',
  tracker: 'Трекер',
  diaries: 'Дневники',
};

interface Props {
  onOpenProfile: () => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function ProfileSection({ onOpenProfile }: Props) {
  const firstName = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.first_name ?? '';
  const [settings, setSettings] = useState<UserSettings | null>(null);
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

  const SCREENS: Exclude<Section, 'profile'>[] = ['home', 'tracker', 'diaries'];

  const notifyOn = settings?.notifyEnabled ?? false;
  const localHour = settings?.notifyLocalHour ?? 21;

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', paddingBottom: 90, animation: 'fade-in 0.25s ease' }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: 6, letterSpacing: '0.02em' }}>
          Настройки
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
          {firstName || 'Профиль'}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Default screen */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '16px 18px',
          animation: 'slide-up 0.3s ease 0.05s both',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
            Экран при открытии
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {SCREENS.map(s => {
              const active = defaultSection === s;
              return (
                <button key={s} onClick={() => pickDefault(s)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 12, border: 'none',
                  background: active ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                  outline: active ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
                }}>
                  {SECTION_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '16px 18px',
          animation: 'slide-up 0.3s ease 0.1s both',
        }}>
          <div
            onClick={toggleNotify}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginBottom: 3 }}>Ежедневное напоминание</div>
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
        </div>

        {/* Full profile & stats */}
        <div onClick={onOpenProfile} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '18px 20px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
          position: 'relative', overflow: 'hidden',
          animation: 'slide-up 0.3s ease 0.2s both',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            background: 'linear-gradient(to bottom, #60a5fa, #34d399)',
            borderRadius: '0 2px 2px 0',
          }} />
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: 'rgba(96,165,250,0.12)',
            border: '1px solid rgba(96,165,250,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Статистика и достижения</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Стрик, инсайты, партнёр, практики</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18, flexShrink: 0 }}>›</div>
        </div>

      </div>
    </div>
  );
}
