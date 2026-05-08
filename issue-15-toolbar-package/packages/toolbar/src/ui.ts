import { entryHref, findActiveEntry, type ManifestEntry } from './manifest.js';
import { TOOLBAR_STYLES } from './styles.js';

interface SectionDef {
  key: string;
  label: string;
  entries: ManifestEntry[];
}

export interface ToolbarHandles {
  host: HTMLElement;
  setVisible: (visible: boolean) => void;
  toggleVisible: () => boolean;
  destroy: () => void;
}

const HOST_TAG = 'design-drafts-toolbar';

/**
 * Mounts the toolbar UI and returns handles for external control. The host
 * element is appended to <body>; styles live in a shadow root so the host
 * page's CSS cannot bleed in.
 */
export function mountToolbar(
  manifest: import('@design-drafts/conventions').DraftManifest,
  manifestUrl: URL,
  initiallyVisible: boolean
): ToolbarHandles {
  // If the host already exists (e.g. the script tag was included twice), bail
  // out and reuse the existing instance.
  const existing = document.querySelector(HOST_TAG) as HTMLElement | null;
  if (existing) {
    return {
      host: existing,
      setVisible: (visible) => setHidden(existing, !visible),
      toggleVisible: () => {
        const nowVisible = existing.hasAttribute('hidden');
        setHidden(existing, !nowVisible);
        return nowVisible;
      },
      destroy: () => existing.remove(),
    };
  }

  const host = document.createElement(HOST_TAG);
  setHidden(host, !initiallyVisible);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = TOOLBAR_STYLES;
  shadow.appendChild(style);

  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Design drafts toolbar');
  shadow.appendChild(bar);

  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.title = manifest.name;
  brand.innerHTML = `<span class="dot" aria-hidden="true"></span><span>drafts</span>`;
  bar.appendChild(brand);

  const sections: SectionDef[] = [
    { key: 'pages', label: 'Page', entries: manifest.pages ?? [] },
    { key: 'variants', label: 'Variant', entries: manifest.variants ?? [] },
    { key: 'themes', label: 'Theme', entries: manifest.themes ?? [] },
    { key: 'layouts', label: 'Layout', entries: manifest.layouts ?? [] },
  ].filter((section) => section.entries.length > 0);

  for (const section of sections) {
    bar.appendChild(renderSection(section, manifestUrl));
  }

  bar.appendChild(renderHideAction(host));

  document.body.appendChild(host);

  return {
    host,
    setVisible: (visible) => setHidden(host, !visible),
    toggleVisible: () => {
      const wasHidden = host.hasAttribute('hidden');
      setHidden(host, !wasHidden);
      return wasHidden; // returns the new "visible" state
    },
    destroy: () => host.remove(),
  };
}

function renderSection(section: SectionDef, manifestUrl: URL): HTMLElement {
  const group = document.createElement('div');
  group.className = 'group';
  group.dataset.section = section.key;

  const active = findActiveEntry(section.entries, manifestUrl);
  if (active) group.dataset.active = 'true';

  const label = document.createElement('div');
  label.className = 'group-label';
  label.textContent = section.label;
  group.appendChild(label);

  const select = document.createElement('select');
  select.setAttribute('aria-label', section.label);

  if (!active) {
    // Insert a placeholder option so users can see what would be selected if
    // they're on a page that isn't part of this section.
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = `Select ${section.label.toLowerCase()}…`;
    placeholder.selected = true;
    placeholder.disabled = true;
    select.appendChild(placeholder);
  }

  for (const entry of section.entries) {
    const option = document.createElement('option');
    option.value = entryHref(entry, manifestUrl);
    option.textContent = entry.name;
    if (active && active.path === entry.path) option.selected = true;
    select.appendChild(option);
  }

  select.addEventListener('change', () => {
    if (select.value) window.location.href = select.value;
  });

  group.appendChild(select);

  const underline = document.createElement('div');
  underline.className = 'underline';
  group.appendChild(underline);

  return group;
}

function renderHideAction(host: HTMLElement): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'actions';
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', 'Hide toolbar');
  button.title = 'Hide (Cmd/Ctrl + .)';
  button.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>`;
  button.addEventListener('click', () => setHidden(host, true));
  wrap.appendChild(button);
  return wrap;
}

function setHidden(host: HTMLElement, hidden: boolean): void {
  if (hidden) host.setAttribute('hidden', '');
  else host.removeAttribute('hidden');
}
