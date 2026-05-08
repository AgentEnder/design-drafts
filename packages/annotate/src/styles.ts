// Styles for the annotate shadow root. Inlined as a string so the package
// ships a single bundle with no separate CSS file.
//
// Visual brief: restrained palette, near-black surface, single accent,
// no gradients, no glassmorphism. Sits alongside the toolbar without
// competing visually.

// Z-index strategy: the toolbar package owns the bottom of the viewport at
// z-index 2147483000. Annotate uses 2147483100 for its overlay (one notch
// above) so hover outlines and the comment panel sit above the toolbar but
// still below browser UI like devtools and native dialogs. The host root
// element itself has no painted box; only its descendants render anything.

export const ACCENT = '#f97316';
export const SURFACE = '#0b0b0c';
export const SURFACE_2 = '#161618';
export const BORDER = '#26262a';
export const TEXT = '#f5f5f5';
export const TEXT_MUTED = '#9b9ba0';

export const Z_BASE = 2147483100;

export const STYLES = `
:host {
  all: initial;
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: ${Z_BASE};
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
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
  border-radius: 2px;
  transition: opacity 80ms linear;
  opacity: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.45);
}

.outline.visible {
  opacity: 1;
}

.flash {
  position: absolute;
  pointer-events: none;
  background: rgba(249, 115, 22, 0.22);
  border: 2px solid ${ACCENT};
  border-radius: 2px;
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
  color: ${SURFACE};
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 2px;
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
  color: ${SURFACE};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  transform: translate(-50%, -100%);
  transition: transform 120ms ease;
}

.pin:hover {
  transform: translate(-50%, -100%) scale(1.08);
}

.pin.stale {
  background: ${TEXT_MUTED};
  color: ${SURFACE};
}

.composer {
  position: absolute;
  pointer-events: auto;
  z-index: 3;
  background: ${SURFACE};
  border: 1px solid ${BORDER};
  border-radius: 4px;
  padding: 8px;
  width: 280px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.composer textarea {
  font: inherit;
  color: ${TEXT};
  background: ${SURFACE_2};
  border: 1px solid ${BORDER};
  border-radius: 3px;
  padding: 6px 8px;
  resize: vertical;
  min-height: 64px;
  outline: none;
}

.composer textarea:focus {
  border-color: ${ACCENT};
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.btn {
  pointer-events: auto;
  padding: 5px 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${BORDER};
  background: ${SURFACE_2};
  color: ${TEXT};
}

.btn:hover {
  background: ${BORDER};
}

.btn.primary {
  background: ${ACCENT};
  border-color: ${ACCENT};
  color: ${SURFACE};
}

.btn.primary:hover {
  background: ${ACCENT};
  filter: brightness(1.1);
}

.btn.danger {
  color: #ef6464;
}

.btn.ghost {
  background: transparent;
  border-color: transparent;
  color: ${TEXT_MUTED};
}

.btn.ghost:hover {
  color: ${TEXT};
  background: ${SURFACE_2};
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
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 2;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid ${BORDER};
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${TEXT_MUTED};
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
  padding: 10px 12px;
  border-bottom: 1px solid ${BORDER};
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
  color: ${SURFACE};
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
  border-radius: 3px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle:hover {
  border-color: ${ACCENT};
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
