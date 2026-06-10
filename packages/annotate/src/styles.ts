// Styles for the annotate shadow root. Inlined as a string so the package
// ships a single bundle with no separate CSS file.
//
// Visual brief: light "paper" surfaces, hairline borders, soft elevation
// shadows, system sans, one restrained accent. Matches the toolbar package so
// the two read as one system. The overlay mounts as its own page-positioned
// shadow root (not inside <dd-toolbar>), so it can't inherit the toolbar's
// --dd-* vars — these constants mirror the toolbar's palette directly.

// Z-index strategy: the toolbar package owns the bottom of the viewport at
// z-index 2147483000. Annotate uses 2147483100 for its overlay (one notch
// above) so hover outlines and the comment panel sit above the toolbar but
// still below browser UI like devtools and native dialogs. The host root
// element itself has no painted box; only its descendants render anything.

export const ACCENT = '#4f46e5';
export const ACCENT_SOFT = 'rgba(79, 70, 229, 0.14)';
export const ON_ACCENT = '#ffffff';
export const SURFACE = '#fbfaf8';
export const SURFACE_2 = '#ffffff';
export const SURFACE_SUNK = '#f1efea';
export const BORDER = 'rgba(0, 0, 0, 0.12)';
export const BORDER_SOFT = 'rgba(0, 0, 0, 0.08)';
export const TEXT = '#1d1d20';
export const TEXT_MUTED = '#6b6b70';
export const DANGER = '#dc2626';
export const SHADOW =
  '0 10px 30px -8px rgba(0, 0, 0, 0.35), 0 2px 6px -2px rgba(0, 0, 0, 0.16)';

export const Z_BASE = 2147483100;

export const STYLES = `
:host {
  all: initial;
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: ${Z_BASE};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, ui-sans-serif, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: ${TEXT};
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}

button {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}

button:focus-visible {
  outline: 2px solid ${ACCENT};
  outline-offset: 2px;
}

.outline {
  position: absolute;
  pointer-events: none;
  border: 2px dashed ${ACCENT};
  border-radius: 3px;
  transition: opacity 80ms linear;
  opacity: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7);
}

.outline.visible {
  opacity: 1;
}

.flash {
  position: absolute;
  pointer-events: none;
  background: ${ACCENT_SOFT};
  border: 2px solid ${ACCENT};
  border-radius: 3px;
  animation: dd-flash 1100ms ease-out;
  z-index: 1;
}
@keyframes dd-flash {
  0%   { opacity: 0; }
  12%  { opacity: 1; }
  35%  { opacity: 0; }
  55%  { opacity: 1; }
  100% { opacity: 0; }
}

.outline-label {
  position: absolute;
  pointer-events: none;
  top: -22px;
  left: -2px;
  background: ${ACCENT};
  color: ${ON_ACCENT};
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.pin {
  position: absolute;
  pointer-events: auto;
  width: 22px;
  height: 22px;
  border-radius: 50% 50% 50% 2px;
  background: ${ACCENT};
  color: ${ON_ACCENT};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
  transform: translate(-50%, -100%);
  transition: transform 120ms ease;
}

.pin:hover {
  transform: translate(-50%, -100%) scale(1.08);
}

/* When the pin's natural top-right-of-element anchor would put it
   outside the viewport (large element, element near edge), the pin is
   clamped inward and ends up inside the element's bounds. The squared
   bottom-left corner ("tail") is meaningful only when the pin is
   hanging off the corner; once it's inside the shape, drop the tail
   and render as a circle. */
.pin.clamped {
  border-radius: 50%;
}

.pin.stale {
  background: ${TEXT_MUTED};
  color: ${ON_ACCENT};
}

.composer {
  position: absolute;
  pointer-events: auto;
  z-index: 3;
  background: ${SURFACE};
  border: 1px solid ${BORDER};
  border-radius: 11px;
  padding: 10px;
  width: 280px;
  box-shadow: ${SHADOW};
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.composer textarea,
textarea.field {
  font: inherit;
  width: 100%;
  color: ${TEXT};
  background: ${SURFACE_2};
  border: 1px solid ${BORDER};
  border-radius: 7px;
  padding: 6px 8px;
  resize: vertical;
  min-height: 64px;
  outline: none;
}

.composer textarea::placeholder,
textarea.field::placeholder {
  color: ${TEXT_MUTED};
}

.composer textarea:focus,
textarea.field:focus {
  border-color: ${ACCENT};
  box-shadow: 0 0 0 3px ${ACCENT_SOFT};
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.btn {
  pointer-events: auto;
  padding: 5px 11px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${BORDER};
  background: ${SURFACE_2};
  color: ${TEXT};
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}

.btn:hover {
  background: ${SURFACE_SUNK};
}

.btn.primary {
  background: ${ACCENT};
  border-color: ${ACCENT};
  color: ${ON_ACCENT};
}

.btn.primary:hover {
  background: ${ACCENT};
  filter: brightness(1.08);
}

.btn.danger {
  color: ${DANGER};
}

.btn.ghost {
  background: transparent;
  border-color: transparent;
  color: ${TEXT_MUTED};
}

.btn.ghost:hover {
  color: ${TEXT};
  background: ${SURFACE_SUNK};
}

.panel {
  position: absolute;
  pointer-events: auto;
  top: 16px;
  right: 16px;
  width: 320px;
  max-height: calc(100vh - 32px - 56px);
  background: ${SURFACE};
  border: 1px solid ${BORDER};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: ${SHADOW};
  overflow: hidden;
  z-index: 2;
}

/* In integrated mode the panel anchors above the toolbar (which lives at
   the bottom of the viewport) instead of floating at the top-right.
   Standalone-mode toggle is suppressed; the toolbar's slot button drives
   activation. */
.panel.integrated {
  top: auto;
  right: 16px;
  bottom: 76px;
  max-height: calc(100vh - 100px);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 13px;
  border-bottom: 1px solid ${BORDER_SOFT};
}

.panel-tabs {
  display: flex;
  gap: 4px;
  padding: 7px 9px;
  border-bottom: 1px solid ${BORDER_SOFT};
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: ${BORDER} transparent;
}

.panel-tab {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  background: transparent;
  border: 1px solid ${BORDER};
  border-radius: 999px;
  font: inherit;
  font-size: 11px;
  color: ${TEXT_MUTED};
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 180px;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}

.panel-tab-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-tab:hover {
  border-color: ${BORDER};
  background: ${SURFACE_SUNK};
  color: ${TEXT};
}

.panel-tab.active {
  border-color: ${ACCENT};
  background: ${ACCENT_SOFT};
  color: ${ACCENT};
}

.panel-tab-count {
  background: ${SURFACE_SUNK};
  color: ${TEXT_MUTED};
  border-radius: 10px;
  padding: 0 6px;
  font-size: 10px;
  flex-shrink: 0;
}

.panel-tab.active .panel-tab-count {
  background: ${ACCENT};
  color: ${ON_ACCENT};
}

.panel-title {
  font-size: 12.5px;
  font-weight: 600;
  color: ${TEXT};
}

.panel-body {
  overflow-y: auto;
  padding: 4px 0;
}

.panel-empty {
  padding: 20px 12px;
  color: ${TEXT_MUTED};
  font-size: 12px;
  text-align: center;
}

.entry {
  padding: 10px 13px;
  border-bottom: 1px solid ${BORDER_SOFT};
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.entry:last-child {
  border-bottom: 0;
}

.entry-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.entry-num {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${ACCENT};
  color: ${ON_ACCENT};
  font-size: 10px;
  font-weight: 700;
}

.entry-num.stale {
  background: ${TEXT_MUTED};
}

.entry-anchor {
  font-size: 11px;
  color: ${TEXT_MUTED};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.entry-body {
  font-size: 12.5px;
  color: ${TEXT};
  white-space: pre-wrap;
  word-wrap: break-word;
}

.entry-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.toggle {
  position: absolute;
  pointer-events: auto;
  top: 16px;
  right: 16px;
  z-index: 2;
  background: ${SURFACE};
  color: ${TEXT};
  border: 1px solid ${BORDER};
  border-radius: 9px;
  padding: 6px 11px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 6px 18px -6px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle:hover {
  background: ${SURFACE_SUNK};
}

.toggle.active {
  border-color: ${ACCENT};
  color: ${ACCENT};
}

.toggle-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${TEXT_MUTED};
}

.toggle.active .toggle-dot {
  background: ${ACCENT};
}
`;
