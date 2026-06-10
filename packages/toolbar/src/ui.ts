import type { DraftAxis, DraftManifest } from '@design-drafts/conventions';
import { renderAxisControl, type DropdownChoice } from './dropdown.js';
import {
  findCurrentPage,
  humanizeName,
  pageHref,
  resolveChoiceTarget,
} from './manifest.js';
import { TOOLBAR_STYLES } from './styles.js';

export interface ToolbarHandles {
  host: HTMLElement;
  setTucked: (tucked: boolean) => void;
  toggleTucked: () => boolean;
  isTucked: () => boolean;
  destroy: () => void;
}

/** sessionStorage key carrying which axes moved across an auto-route, so the
 * destination page can briefly highlight them. */
const ROUTE_HIGHLIGHT_KEY = 'dd-toolbar-routed';

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
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

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
  brand.innerHTML = `<span class="dot" aria-hidden="true"></span><span>Drafts</span>`;
  bar.appendChild(brand);

  const currentPage = findCurrentPage(manifest, manifestUrl);
  const currentCoords = currentPage?.coordinates ?? {};
  const axes = manifest.axes ?? [];
  const labels = makeLabelResolver(axes);

  for (const axis of axes) {
    bar.appendChild(
      renderAxis(axis, currentCoords, manifest, manifestUrl, labels)
    );
  }

  // Plugin slot: light-DOM children of the host (e.g. `<dd-annotations>`)
  // render here.
  const slot = document.createElement('slot');
  slot.className = 'plugins';
  bar.appendChild(slot);

  bar.appendChild(renderHideAction(host));

  applyRouteHighlight(bar);

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

interface LabelResolver {
  axisLabel: (axisName: string) => string;
  choiceLabel: (axisName: string, choiceName: string) => string;
}

/**
 * Resolve display labels for axes and choices. Prefers the manifest's explicit
 * `label`, falling back to a humanised form of the identifier `name`.
 */
function makeLabelResolver(axes: DraftAxis[]): LabelResolver {
  const byName = new Map(axes.map((a) => [a.name, a]));
  return {
    axisLabel: (axisName) => {
      const axis = byName.get(axisName);
      return axis?.label ?? humanizeName(axisName);
    },
    choiceLabel: (axisName, choiceName) => {
      const choice = byName
        .get(axisName)
        ?.choices.find((c) => c.name === choiceName);
      return choice?.label ?? humanizeName(choiceName);
    },
  };
}

function renderAxis(
  axis: DraftAxis,
  currentCoords: Record<string, string>,
  manifest: DraftManifest,
  manifestUrl: URL,
  labels: LabelResolver
): HTMLElement {
  const currentChoice = currentCoords[axis.name];

  const choices: DropdownChoice[] = axis.choices.map((choice) => {
    const target = resolveChoiceTarget(
      axis.name,
      choice.name,
      currentCoords,
      manifest.pages
    );
    // Sparse coverage: reaching this choice means moving other axes too. Spell
    // out which, so the cross-axis jump isn't a surprise.
    const hint =
      target && target.changedAxes.length > 0
        ? 'also sets ' +
          target.changedAxes
            .map((c) => `${labels.axisLabel(c.axis)} → ${labels.choiceLabel(c.axis, c.value)}`)
            .join(', ')
        : undefined;

    return {
      value: choice.name,
      label: choice.label ?? humanizeName(choice.name),
      hint,
      title: choice.description,
      href: target ? pageHref(target.page, manifestUrl) : undefined,
      selected: choice.name === currentChoice,
    };
  });

  return renderAxisControl({
    axisName: axis.name,
    axisLabel: labels.axisLabel(axis.name),
    axisTitle: axis.description,
    active: currentChoice !== undefined,
    valueLabel:
      currentChoice !== undefined
        ? labels.choiceLabel(axis.name, currentChoice)
        : null,
    choices,
    onSelect: (choice) => {
      if (choice.href === undefined) return;
      const target = resolveChoiceTarget(
        axis.name,
        choice.value,
        currentCoords,
        manifest.pages
      );
      const changedAxisNames = target
        ? [axis.name, ...target.changedAxes.map((c) => c.axis)]
        : [axis.name];
      rememberRoute(choice.href, changedAxisNames);
      window.location.href = choice.href;
    },
  });
}

/** Record, for the next page load, which axes the upcoming navigation moves. */
function rememberRoute(href: string, axisNames: string[]): void {
  try {
    const path = new URL(href, window.location.href).pathname;
    sessionStorage.setItem(
      ROUTE_HIGHLIGHT_KEY,
      JSON.stringify({ path, axes: axisNames })
    );
  } catch {
    // sessionStorage may be unavailable (privacy mode); the highlight is a
    // nicety, so skip silently.
  }
}

/** On load, flash the axis groups that the auto-route moved, then forget it. */
function applyRouteHighlight(bar: HTMLElement): void {
  let payload: { path: string; axes: string[] } | null = null;
  try {
    const raw = sessionStorage.getItem(ROUTE_HIGHLIGHT_KEY);
    if (raw) payload = JSON.parse(raw);
    sessionStorage.removeItem(ROUTE_HIGHLIGHT_KEY);
  } catch {
    return;
  }
  if (!payload || payload.path !== window.location.pathname) return;

  for (const axisName of payload.axes) {
    const group = bar.querySelector(`.group[data-axis="${CSS.escape(axisName)}"]`);
    group?.classList.add('just-changed');
  }
}

function renderHideAction(host: HTMLElement): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'actions';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hide';
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
