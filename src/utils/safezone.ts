/** Returns the top inset to avoid Telegram's native UI overlay on iOS. */
export function getTelegramSafeTop(): number {
  const tg = (window.Telegram?.WebApp as any);
  if (!tg) return 0;
  const contentTop: number = tg?.contentSafeAreaInset?.top ?? 0;
  const deviceTop: number = tg?.safeAreaInset?.top ?? 0;
  const natural = contentTop + deviceTop;
  if (natural > 0) return natural;
  // Fallback for older Telegram versions on iOS where the close button still overlays
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  return isIOS ? 56 : 0;
}
