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
  setTucked: (tucked: boolean) => void;
  toggleTucked: () => boolean;
  isTucked: () => boolean;
  destroy: () => void;
}

/**
 * Populates an already-existing host element (a `<dd-toolbar>` custom
 * element) with the toolbar UI. Styles live in a shadow root attached to
 * the host so the page's CSS cannot bleed in.
 *
 * The bar contains a `<slot></slot>` between the axis groups and the
 * hide-action, so plugin custom elements that are children of
 * `<dd-toolbar>` (e.g. `<dd-annotations>`) render inline as part of the
 * bar.
 */
export function populateToolbar(
  host: HTMLElement,
  manifest: DraftManifest,
  manifestUrl: URL,
  initiallyTucked: boolean
): ToolbarHandles {
  // Idempotent: a second call on the same host (e.g. element reconnected)
  // returns existing handles rather than building a duplicate shadow.
  const existingHandles = (host as HostWithHandles).__ddToolbarHandles;
  if (existingHandles) return existingHandles;

  setTucked(host, initiallyTucked);
  const shadow =
    host.shadowRoot ?? host.attachShadow({ mode: 'open' });

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

  // Plugin slot: light-DOM children of the host (e.g. `<dd-annotations>`)
  // render here.
  const slot = document.createElement('slot');
  slot.className = 'plugins';
  bar.appendChild(slot);

  bar.appendChild(renderHideAction(host));

  const handles: ToolbarHandles = {
    host,
    setTucked: (tucked) => setTucked(host, tucked),
    toggleTucked: () => {
      const wasTucked = host.hasAttribute('data-tucked');
      setTucked(host, !wasTucked);
      return !wasTucked; // returns the new "tucked" state
    },
    isTucked: () => host.hasAttribute('data-tucked'),
    destroy: () => host.remove(),
  };
  (host as HostWithHandles).__ddToolbarHandles = handles;
  return handles;
}

interface HostWithHandles extends HTMLElement {
  __ddToolbarHandles?: ToolbarHandles;
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
  button.title = 'Hide (Cmd/Ctrl + .) — peek by moving mouse to bottom edge';
  button.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>`;
  button.addEventListener('click', () => setTucked(host, true));
  wrap.appendChild(button);
  return wrap;
}

function setTucked(host: HTMLElement, tucked: boolean): void {
  if (tucked) host.setAttribute('data-tucked', '');
  else host.removeAttribute('data-tucked');
}
