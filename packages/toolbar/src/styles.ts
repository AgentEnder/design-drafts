/**
 * Styles for the toolbar's shadow root.
 *
 * Visual brief (kept short so it travels with the code):
 * - Bottom-anchored, inset from edges with a small margin.
 * - Light "paper" surface, hairline border, soft elevation shadow. Because the
 *   bar floats over arbitrary draft pages (including dark hero images), the
 *   shadow — not a glow — is what separates it from the page.
 * - System sans throughout, normal case. No monospace/uppercase "dev tool"
 *   chrome; one restrained accent used only on the active selection.
 * - Each axis is a button that opens a small custom listbox (see dropdown.ts).
 *   Going custom (vs native <select>) lets each choice show a secondary
 *   "also sets …" hint for sparse, auto-routed combinations.
 *
 * Theming contract: the `--dd-*` custom properties below are declared on
 * `:host`, so they also cascade into light-DOM plugin children (e.g.
 * `<dd-annotations>`) and their shadow roots. Plugins should read these vars
 * (with fallbacks) instead of hard-coding colours, so they travel with the
 * bar's theme.
 */
export const TOOLBAR_STYLES = /* css */ `
  :host {
    --dd-surface: #fbfaf8;
    --dd-surface-hover: #f1efea;
    --dd-menu-surface: #ffffff;
    --dd-border: rgba(0, 0, 0, 0.09);
    --dd-border-strong: rgba(0, 0, 0, 0.14);
    --dd-text: #1d1d20;
    --dd-text-dim: #6b6b70;
    --dd-accent: #4f46e5;
    --dd-accent-soft: rgba(79, 70, 229, 0.12);
    --dd-radius: 11px;
    --dd-shadow: 0 8px 28px -8px rgba(0, 0, 0, 0.35),
                 0 2px 6px -2px rgba(0, 0, 0, 0.18);

    position: fixed;
    inset: auto 0 0 0;
    padding: 12px;
    z-index: 2147483646;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    color-scheme: light;
  }

  .bar {
    pointer-events: auto;
    margin: 0 auto;
    max-width: max-content;
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 0;
    background: var(--dd-surface);
    border: 1px solid var(--dd-border);
    border-radius: var(--dd-radius);
    box-shadow: var(--dd-shadow);
    color: var(--dd-text);
    font-size: 13px;
    line-height: 1;
    transition: transform 220ms cubic-bezier(0.32, 0.72, 0.34, 1);
    will-change: transform;
  }

  /* Tucked: slide the bar fully below the viewport. The host stays in place
     (so the bottom-edge pointer detector keeps firing); only the visible bar
     moves. Pointer events are disabled while tucked so it can't intercept
     clicks meant for the page. */
  :host([data-tucked]) .bar {
    transform: translateY(calc(100% + 28px));
    pointer-events: none;
  }

  .brand {
    display: flex;
    align-items: center;
    padding: 0 14px;
    gap: 8px;
    border-right: 1px solid var(--dd-border);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--dd-text-dim);
    user-select: none;
  }

  .brand .dot {
    width: 7px;
    height: 7px;
    border-radius: 2px;
    background: var(--dd-accent);
    transform: rotate(45deg);
  }

  /* One axis = a trigger button that opens a custom listbox. */
  .group {
    position: relative;
    display: flex;
    align-items: stretch;
    border-right: 1px solid var(--dd-border);
    min-width: 0;
  }

  .group:last-of-type {
    border-right: none;
  }

  .trigger {
    appearance: none;
    background: transparent;
    border: 0;
    border-bottom: 2px solid transparent;
    margin: 0;
    padding: 9px 13px 7px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    text-align: left;
    font: inherit;
    color: var(--dd-text);
    cursor: pointer;
    min-width: 0;
    transition: background 120ms ease, border-color 120ms ease;
  }

  .trigger:hover {
    background: var(--dd-surface-hover);
  }

  .trigger:focus-visible {
    outline: none;
    background: var(--dd-surface-hover);
  }

  .trigger-label {
    font-size: 10.5px;
    letter-spacing: 0.02em;
    color: var(--dd-text-dim);
    white-space: nowrap;
  }

  .trigger-value {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--dd-text);
    max-width: 18ch;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trigger-value.is-empty {
    color: var(--dd-text-dim);
    font-weight: 400;
  }

  .trigger .chevron {
    flex: 0 0 auto;
    width: 9px;
    height: 9px;
    color: var(--dd-text-dim);
    transition: transform 140ms ease;
  }

  .trigger[aria-expanded="true"] .chevron {
    transform: rotate(180deg);
  }

  /* The axis the current page sits on gets the accent underline. */
  .group[data-active="true"] .trigger {
    border-bottom-color: var(--dd-accent);
  }

  /* One-shot highlight after an auto-route, so the axes that moved are visible
     even though navigation replaced the page. Added by ui.ts on load. */
  .group.just-changed .trigger {
    animation: dd-flash 900ms ease;
  }

  @keyframes dd-flash {
    0%, 25% { background: var(--dd-accent-soft); border-bottom-color: var(--dd-accent); }
    100% { background: transparent; }
  }

  /* ---- Custom listbox popover ---- */
  .menu {
    position: absolute;
    bottom: calc(100% + 9px);
    left: 8px;
    min-width: max(100%, 200px);
    max-width: 320px;
    max-height: min(60vh, 420px);
    overflow-y: auto;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: var(--dd-menu-surface);
    border: 1px solid var(--dd-border-strong);
    border-radius: 10px;
    box-shadow: var(--dd-shadow);
    z-index: 1;
  }

  .menu[hidden] {
    display: none;
  }

  .option {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 7px;
    cursor: pointer;
    scroll-margin: 6px;
  }

  .option[aria-disabled="true"] {
    cursor: default;
    opacity: 0.45;
  }

  .option.active-option {
    background: var(--dd-surface-hover);
  }

  .option[aria-selected="true"] {
    color: var(--dd-accent);
  }

  .option-main {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--dd-text);
  }

  .option[aria-selected="true"] .option-main {
    color: var(--dd-accent);
  }

  .option .check {
    flex: 0 0 auto;
    width: 13px;
    height: 13px;
    opacity: 0;
    color: var(--dd-accent);
  }

  .option[aria-selected="true"] .check {
    opacity: 1;
  }

  .option-hint {
    margin-left: 21px;
    font-size: 11px;
    line-height: 1.3;
    color: var(--dd-text-dim);
    font-weight: 400;
  }

  /* Plugin slot — children of <dd-toolbar> (e.g. <dd-annotations>) appear here,
     between the axis groups and the hide button. They render their own UI; we
     only ensure they're interactive and stretch with the bar. They inherit the
     --dd-* theming vars declared on :host. */
  ::slotted(*) {
    pointer-events: auto;
    display: flex;
    align-items: stretch;
    border-left: 1px solid var(--dd-border);
  }

  .actions {
    display: flex;
    align-items: stretch;
    border-left: 1px solid var(--dd-border);
  }

  button.hide {
    background: transparent;
    border: none;
    color: var(--dd-text-dim);
    font: inherit;
    cursor: pointer;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 120ms ease, background 120ms ease;
  }

  button.hide:hover {
    color: var(--dd-text);
    background: var(--dd-surface-hover);
  }

  button.hide:focus-visible {
    outline: none;
    color: var(--dd-accent);
  }

  button.hide svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @media (max-width: 640px) {
    :host {
      padding: 8px;
    }
    .bar {
      max-width: calc(100vw - 16px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .trigger, .chevron { transition: none; }
    .group.just-changed .trigger { animation: none; }
  }
`;
