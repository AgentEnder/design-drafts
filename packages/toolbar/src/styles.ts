/**
 * Styles for the toolbar's shadow root.
 *
 * Visual brief (kept short so it travels with the code):
 * - Bottom-anchored, inset from edges with small margin.
 * - Solid near-black surface, thin hairline border. No backdrop-blur, no glow.
 * - One accent (cyan-ish) used sparingly on the active selection underline.
 * - Native <select> elements styled to feel like part of the bar; their open
 *   menu is the browser's, which avoids re-implementing focus/keyboard logic.
 * - Type: system sans for content, system mono for the section labels — the
 *   labels are utility chrome and reading them as code-y reinforces that this
 *   is dev tooling, not part of the design.
 */
export const TOOLBAR_STYLES = /* css */ `
  :host {
    --dd-surface: #101012;
    --dd-surface-hover: #1a1a1d;
    --dd-border: rgba(255, 255, 255, 0.09);
    --dd-text: #e8e8ea;
    --dd-text-dim: #8d8d94;
    --dd-accent: #7cd6ff;
    --dd-radius: 10px;

    position: fixed;
    inset: auto 0 0 0;
    padding: 12px;
    z-index: 2147483646;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    color-scheme: dark;
  }

  .bar {
    pointer-events: auto;
    margin: 0 auto;
    max-width: max-content;
    display: flex;
    align-items: stretch;
    gap: 0;
    background: var(--dd-surface);
    border: 1px solid var(--dd-border);
    border-radius: var(--dd-radius);
    box-shadow: 0 6px 20px -6px rgba(0, 0, 0, 0.6),
                0 1px 0 rgba(255, 255, 255, 0.04) inset;
    color: var(--dd-text);
    font-size: 13px;
    line-height: 1;
    overflow: hidden;
    transition: transform 220ms cubic-bezier(0.32, 0.72, 0.34, 1);
    will-change: transform;
  }

  /* Tucked: slide the bar fully below the viewport. The host stays in
     place (so the bottom-edge pointer detector keeps firing); only the
     visible bar moves. Pointer events are disabled while tucked so the
     bar can't intercept clicks meant for the page. */
  :host([data-tucked]) .bar {
    transform: translateY(calc(100% + 24px));
    pointer-events: none;
  }

  .brand {
    display: flex;
    align-items: center;
    padding: 0 12px 0 14px;
    gap: 8px;
    border-right: 1px solid var(--dd-border);
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dd-text-dim);
  }

  .brand .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--dd-accent);
    box-shadow: 0 0 0 3px rgba(124, 214, 255, 0.12);
  }

  .group {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 8px 12px;
    border-right: 1px solid var(--dd-border);
    min-width: 0;
  }

  /* Plugin slot — children of <dd-toolbar> appear here, between the
     axis groups and the hide button. Each child is responsible for its
     own visual treatment; we only ensure they're interactive and
     inherit the bar's stretch alignment. */
  ::slotted(*) {
    pointer-events: auto;
    display: flex;
    align-items: stretch;
    border-left: 1px solid var(--dd-border);
  }

  .group:last-of-type {
    border-right: none;
  }

  .group-label {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dd-text-dim);
    margin-bottom: 4px;
  }

  select {
    appearance: none;
    -webkit-appearance: none;
    background: transparent;
    border: none;
    color: var(--dd-text);
    font: inherit;
    font-size: 13px;
    padding: 0 18px 0 0;
    margin: 0;
    cursor: pointer;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'><path fill='none' stroke='%238d8d94' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' d='M1.5 3 L4 5.5 L6.5 3'/></svg>");
    background-repeat: no-repeat;
    background-position: right 0 center;
    background-size: 8px 8px;
    max-width: 22ch;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  select:focus-visible {
    outline: none;
    color: var(--dd-accent);
  }

  select:focus-visible + .underline,
  select:hover + .underline {
    background: var(--dd-accent);
  }

  .underline {
    height: 1px;
    margin-top: 6px;
    background: transparent;
    transition: background 120ms ease;
  }

  .group[data-active="true"] .underline {
    background: var(--dd-accent);
  }

  /* Native option list inherits OS styling; force readable colors where supported. */
  option {
    background: #18181b;
    color: var(--dd-text);
  }

  option:disabled {
    color: var(--dd-text-dim);
  }

  .actions {
    display: flex;
    align-items: stretch;
    border-left: 1px solid var(--dd-border);
  }

  .actions:first-of-type {
    border-left: none;
  }

  button {
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

  button:hover {
    color: var(--dd-text);
    background: var(--dd-surface-hover);
  }

  button:focus-visible {
    outline: none;
    color: var(--dd-accent);
  }

  button svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @media (max-width: 640px) {
    :host {
      padding: 8px;
    }
    .bar {
      max-width: calc(100vw - 16px);
      overflow-x: auto;
    }
    .group {
      padding: 6px 10px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .underline {
      transition: none;
    }
  }
`;
