export function initTheme(): void {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const current = (): string =>
    root.dataset.theme ?? (systemDark.matches ? 'dark' : 'light');
  button.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('dd-theme', next);
    } catch {
      /* storage unavailable (private mode) — the toggle still works per-page */
    }
  });
}
