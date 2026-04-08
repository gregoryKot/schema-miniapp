export type Theme = 'dark' | 'light';

const KEY = 'app_theme';

export function getTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) ?? 'dark';
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(KEY, theme);
}

export function toggleTheme(): Theme {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
