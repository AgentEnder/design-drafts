import type { DraftAxis, DraftManifest } from '@design-drafts/conventions';
import {
  findCurrentPage,
  findNeighbourPage,
  indexPagesByCoords,
  pageHref,
} from './manifest.js';
import { TOOLBAR_STYLES } from './styles.js';

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
  manifest: DraftManifest,
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

  const currentPage = findCurrentPage(manifest, manifestUrl);
  const currentCoords = currentPage?.coordinates ?? {};
  const pageIndex = indexPagesByCoords(manifest.pages);

  for (const axis of manifest.axes ?? []) {
    bar.appendChild(renderAxis(axis, currentCoords, pageIndex, manifestUrl));
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

function renderAxis(
  axis: DraftAxis,
  currentCoords: Record<string, string>,
  pageIndex: Map<string, import('@design-drafts/conventions').DraftPage>,
  manifestUrl: URL
): HTMLElement {
  const group = document.createElement('div');
  group.className = 'group';
  group.dataset.axis = axis.name;

  const currentChoice = currentCoords[axis.name];
  const onAxis = currentChoice !== undefined;
  if (onAxis) group.dataset.active = 'true';

  const labelText = (axis.description ?? axis.name).toUpperCase();

  const label = document.createElement('div');
  label.className = 'group-label';
  label.textContent = labelText;
  group.appendChild(label);

  const select = document.createElement('select');
  select.setAttribute('aria-label', labelText);

  // Map option value (the choice name) to its href so we can navigate on
  // change. Disabled options are present but have no href entry.
  const hrefByChoice = new Map<string, string>();

  if (!onAxis) {
    // The current page doesn't sit on this axis. Show a placeholder so the
    // <select> still reads "no selection" rather than auto-picking choice 0.
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = `Select ${axis.name}…`;
    placeholder.selected = true;
    placeholder.disabled = true;
    select.appendChild(placeholder);
  }

  for (const choice of axis.choices) {
    const option = document.createElement('option');
    option.value = choice.name;
    option.textContent = choice.description ?? choice.name;

    if (onAxis) {
      const target = findNeighbourPage(
        axis,
        choice.name,
        currentCoords,
        pageIndex
      );
      if (target) {
        hrefByChoice.set(choice.name, pageHref(target, manifestUrl));
      } else {
        option.disabled = true;
      }
      if (choice.name === currentChoice) option.selected = true;
    } else {
      // Off-axis: every choice is unreachable from here without picking
      // values for the missing axes. Disable rather than guess.
      option.disabled = true;
    }

    select.appendChild(option);
  }

  select.addEventListener('change', () => {
    const href = hrefByChoice.get(select.value);
    if (href) window.location.href = href;
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
