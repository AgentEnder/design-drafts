// The page-actions split button: "Copy markdown" is the default action, the
// caret opens a menu holding "View raw". The markdown is embedded in the page
// as JSON, so copying works without fetching anything (gh-pages, preview, even
// file://).
export function initCopyMarkdown(): void {
  const group = document.querySelector<HTMLElement>('.md-actions');
  const button = document.querySelector<HTMLButtonElement>('.copy-markdown');
  const toggle = document.querySelector<HTMLButtonElement>('.md-actions-toggle');
  const menu = document.querySelector<HTMLElement>('.md-actions-menu');
  const source = document.getElementById('dd-markdown-source');
  if (!group || !button || !toggle || !menu || !source?.textContent) return;

  let markdown: string;
  try {
    markdown = JSON.parse(source.textContent) as string;
  } catch {
    group.remove();
    return;
  }

  // `hidden` is tri-state: `false`, `true`, or `'until-found'` — hidden but
  // revealable by find-in-page, at which point the browser drops the attribute
  // and it reflects as `false` again. So "open" is the one case where it is
  // exactly `false`; anything else is some flavour of hidden. Reading the state
  // through this predicate keeps `aria-expanded` a real "true"/"false" instead
  // of echoing an attribute value back into it.
  const isMenuOpen = (): boolean => menu.hidden === false;
  const setMenuOpen = (open: boolean): void => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => {
    setMenuOpen(!isMenuOpen());
  });
  document.addEventListener('click', (event) => {
    if (isMenuOpen() && !group.contains(event.target as Node)) setMenuOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  const label = button.querySelector('.copy-markdown-label') ?? button;
  const original = label.textContent;
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  const flash = (message: string, copied: boolean): void => {
    label.textContent = message;
    button.classList.toggle('copied', copied);
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      label.textContent = original;
      button.classList.remove('copied');
    }, 1600);
  };

  const write = async (text: string): Promise<void> => {
    // The async clipboard API needs a secure context and can still reject
    // (permissions policy, unfocused document). A preview served over plain
    // http on a LAN address isn't a secure context at all — so treat the API
    // as best-effort and fall back to a scratch textarea rather than leaving
    // the button dead.
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        /* fall through to the legacy path */
      }
    }
    const scratch = document.createElement('textarea');
    scratch.value = text;
    scratch.setAttribute('readonly', '');
    scratch.style.position = 'fixed';
    scratch.style.opacity = '0';
    document.body.append(scratch);
    scratch.select();
    const copied = document.execCommand('copy');
    scratch.remove();
    if (!copied) throw new Error('copy command rejected');
  };

  button.addEventListener('click', () => {
    setMenuOpen(false);
    write(markdown).then(
      () => flash('Copied', true),
      () => flash('Copy failed', false)
    );
  });
}
