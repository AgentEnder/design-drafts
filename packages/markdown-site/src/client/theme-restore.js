// Runs before first paint so a saved preference never flashes the other theme.
try {
  const saved = localStorage.getItem('dd-theme');
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.dataset.theme = saved;
  }
} catch {}
