(function(){function*e(e){let t=new URL(e),n=t.pathname.endsWith(`/`)?t.pathname:t.pathname.slice(0,t.pathname.lastIndexOf(`/`)+1);for(;yield new URL(n,t.origin),n!==`/`;)n=n.slice(0,n.lastIndexOf(`/`,n.length-2)+1)}async function t(t,n,i=fetch){for(let a of e(t)){let e=new URL(`design-drafts.config.json`,a),t=await r(e,i);if(t!==null&&n(t))return{manifestUrl:e,manifest:t}}return null}function n(e){return new URL(`.`,e).href}async function r(e,t){let n;try{n=await t(e.href,{cache:`no-cache`})}catch{return null}if(!n.ok)return null;try{return await n.json()}catch{return null}}function i(e){return e.querySelector(`meta[name="draftId"]`)?.getAttribute(`content`)?.trim()||void 0}function a(e){return o(e)??s(e)??c(e)??l(e)??u(e)}function o(e){let t=te(e);if(!t)return null;let n=ee(t),r=[],i=null,a=t;for(let e=0;a&&e<40;e++,a=a.return){if(!i&&a._debugSource?.fileName){let{fileName:e,lineNumber:t}=a._debugSource;i=t?`${e}:${t}`:e}let e=a.type;if(typeof e!=`function`)continue;let t=e.displayName||e.name;t&&(!n&&!f(t)||r[r.length-1]!==t&&r.push(t))}return r.length?{trail:d(r),source:i,framework:`react`}:null}function s(e){let t;for(let n=e;n&&!t;n=n.parentElement)t=n.__vueParentComponent;if(!t)return null;let n=[],r=null,i=t;for(let e=0;i&&e<40;e++,i=i.parent){let e=i.type;if(!e)continue;!r&&e.__file&&(r=e.__file);let t=e.name||e.__name;t&&(!e.__file&&!f(t)||n[n.length-1]!==t&&n.push(t))}return!n.length&&!r?null:{trail:d(n),source:r,framework:`vue`}}function c(e){let t=window.ng;if(typeof t?.getComponent!=`function`)return null;let n=[];for(let r=e;r;r=r.parentElement){let e;try{e=t.getComponent(r)}catch{continue}let i=e?.constructor?.name;if(i&&n[n.length-1]!==i&&(n.push(i),n.length>=5))break}return n.length?{trail:d(n),source:null,framework:`angular`}:null}function l(e){for(let t=e;t;t=t.parentElement){let e=t.__svelte_meta?.loc;if(!e?.file)continue;let n=e.line?`${e.file}:${e.line}`:e.file;return{trail:e.file.split(`/`).pop()?.replace(/\.svelte$/,``)??null,source:n,framework:`svelte`}}return null}function u(e){let t=[];for(let n=e;n;n=n.parentElement){let e=n.tagName.toLowerCase();if(e.includes(`-`)&&t[t.length-1]!==e&&(t.push(e),t.length>=5))break}return t.length?{trail:d(t),source:null,framework:`custom-element`}:null}function d(e){return e.slice(0,5).reverse().join(` › `)}function ee(e){return Object.getOwnPropertyNames(e).some(e=>e.startsWith(`_debug`))}function f(e){return!(e.length<3||!/^[A-Z]/.test(e))}function te(e){for(let t of Object.getOwnPropertyNames(e))if(t.startsWith(`__reactFiber$`)||t.startsWith(`__reactInternalInstance$`)){let n=e[t];if(n&&typeof n==`object`)return n}return null}let p=`#4f46e5`,m=`rgba(79, 70, 229, 0.14)`,h=`#ffffff`,g=`#fbfaf8`,_=`#ffffff`,v=`#f1efea`,y=`rgba(0, 0, 0, 0.12)`,b=`rgba(0, 0, 0, 0.08)`,x=`#1d1d20`,S=`#6b6b70`,ne=`#dc2626`,re=`rgba(220, 38, 38, 0.12)`,C=`0 10px 30px -8px rgba(0, 0, 0, 0.35), 0 2px 6px -2px rgba(0, 0, 0, 0.16)`,ie=`
:host {
  all: initial;
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2147483100;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, ui-sans-serif, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: ${x};
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
  outline: 2px solid ${p};
  outline-offset: 2px;
}

.outline {
  position: absolute;
  pointer-events: none;
  border: 2px dashed ${p};
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
  background: ${m};
  border: 2px solid ${p};
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

/* Saved text annotations tint the exact words they're about. One node per
   Range client rect, so a quote wrapping across lines highlights each line
   box rather than one fat bounding box swallowing the margins. */
.range-highlight {
  position: absolute;
  pointer-events: none;
  background: ${m};
  border-bottom: 2px solid ${p};
  border-radius: 2px;
}

/* The selection currently being commented on, before it is saved. */
.range-highlight.pending {
  background: rgba(79, 70, 229, 0.22);
}

.range-highlight.hovered {
  background: rgba(79, 70, 229, 0.3);
}

.outline-label {
  position: absolute;
  pointer-events: none;
  top: -22px;
  left: -2px;
  background: ${p};
  color: ${h};
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
  background: ${p};
  color: ${h};
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
  background: ${S};
  color: ${h};
}

.composer {
  position: absolute;
  pointer-events: auto;
  z-index: 3;
  background: ${g};
  border: 1px solid ${y};
  border-radius: 11px;
  padding: 10px;
  width: 280px;
  box-shadow: ${C};
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.composer textarea,
textarea.field {
  font: inherit;
  width: 100%;
  color: ${x};
  background: ${_};
  border: 1px solid ${y};
  border-radius: 7px;
  padding: 6px 8px;
  resize: vertical;
  min-height: 64px;
  outline: none;
}

.composer textarea::placeholder,
textarea.field::placeholder {
  color: ${S};
}

.composer textarea:focus,
textarea.field:focus {
  border-color: ${p};
  box-shadow: 0 0 0 3px ${m};
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
  border: 1px solid ${y};
  background: ${_};
  color: ${x};
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}

.btn:hover {
  background: ${v};
}

.btn.primary {
  background: ${p};
  border-color: ${p};
  color: ${h};
}

.btn.primary:hover {
  background: ${p};
  filter: brightness(1.08);
}

.btn.danger {
  color: ${ne};
}

.btn.ghost {
  background: transparent;
  border-color: transparent;
  color: ${S};
}

.btn.ghost:hover {
  color: ${x};
  background: ${v};
}

/* Clear, waiting on its second click. The click after this one is the one that
   takes the annotations, so the button stops reading as one more ghost control
   while it waits. Specificity beats .btn.ghost, which would otherwise mute it
   straight back to grey. */
.btn.ghost.armed,
.btn.ghost.armed:hover {
  color: ${ne};
  background: ${re};
  border-color: ${re};
}

.panel {
  position: absolute;
  pointer-events: auto;
  top: 16px;
  right: 16px;
  width: 320px;
  max-height: calc(100vh - 32px - 56px);
  background: ${g};
  border: 1px solid ${y};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: ${C};
  overflow: hidden;
  z-index: 2;
}

/* Lifted off a host that sits at the foot of the viewport — the toolbar bar —
   instead of opening at the top-right. A host at the top of the page (a
   markdown-site header) keeps the default anchoring above. Either way the
   standalone toggle is suppressed; the host's own button drives activation. */
.panel.above-trigger {
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
  border-bottom: 1px solid ${b};
}

.panel-head-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
}

.panel-tabs {
  display: flex;
  gap: 4px;
  padding: 7px 9px;
  border-bottom: 1px solid ${b};
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: ${y} transparent;
}

.panel-tab {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  background: transparent;
  border: 1px solid ${y};
  border-radius: 999px;
  font: inherit;
  font-size: 11px;
  color: ${S};
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
  border-color: ${y};
  background: ${v};
  color: ${x};
}

.panel-tab.active {
  border-color: ${p};
  background: ${m};
  color: ${p};
}

.panel-tab-count {
  background: ${v};
  color: ${S};
  border-radius: 10px;
  padding: 0 6px;
  font-size: 10px;
  flex-shrink: 0;
}

.panel-tab.active .panel-tab-count {
  background: ${p};
  color: ${h};
}

.panel-title {
  font-size: 12.5px;
  font-weight: 600;
  color: ${x};
  /* The head holds three controls, and an armed Clear grows to "Clear all 12?".
     Give under pressure here rather than letting the buttons wrap. */
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-body {
  overflow-y: auto;
  padding: 4px 0;
}

.panel-empty {
  padding: 20px 12px;
  color: ${S};
  font-size: 12px;
  text-align: center;
}

.entry {
  padding: 10px 13px;
  border-bottom: 1px solid ${b};
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
  background: ${p};
  color: ${h};
  font-size: 10px;
  font-weight: 700;
}

.entry-num.stale {
  background: ${S};
}

.entry-anchor {
  font-size: 11px;
  color: ${S};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.entry-body {
  font-size: 12.5px;
  color: ${x};
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
  background: ${g};
  color: ${x};
  border: 1px solid ${y};
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
  background: ${v};
}

.toggle.active {
  border-color: ${p};
  color: ${p};
}

.toggle-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${S};
}

.toggle.active .toggle-dot {
  background: ${p};
}
`,w=4e3,ae=new Set([`SCRIPT`,`STYLE`,`NOSCRIPT`,`TEMPLATE`]);function oe(e){let t=e.commonAncestorContainer;return t.nodeType===Node.ELEMENT_NODE?t:t.parentElement}function se(e,t){if(t.collapsed)return null;let n=T(e);if(!n.length)return null;let r=de(n),i=fe(n,t.startContainer,t.startOffset),a=fe(n,t.endContainer,t.endOffset);a<i&&([i,a]=[a,i]),a-i>w&&(a=i+w);let o=r.slice(i,a);if(!o.trim())return null;let s={exact:o,prefix:r.slice(Math.max(0,i-48),i),suffix:r.slice(a,a+48),start:i,end:a},c=le(n,i,a),l=c.slice(1).map(e=>e.offset);return l.length&&(s.zones=l),{selector:s,elements:c.map(e=>e.element)}}function ce(e){let t=[0,...e.zones??[],e.exact.length],n=[];for(let r=0;r<t.length-1;r++)n.push(e.exact.slice(t[r],t[r+1]).replace(/\s+/g,` `).trim());return n}function le(e,t,n){let r=[],i=0,a=null;for(let o of e){let e=i,s=i+o.data.length;if(i=s,s<=t||e>=n)continue;let c=o.parentElement;c&&(a===null?r.push({offset:0,element:c}):c!==a&&r.push({offset:Math.max(e,t)-t,element:c}),a=c)}return r}function ue(e,t){if(!t.exact)return null;let n=T(e);if(!n.length)return null;let r=de(n);if(r.slice(t.start,t.end)===t.exact)return E(n,t.start,t.end);let i=pe(r,t);return i===-1?null:E(n,i,i+t.exact.length)}function T(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,{acceptNode(t){let n=t.parentElement,r=e.parentElement;for(;n&&n!==r;){if(ae.has(n.tagName)||n.id===`design-drafts-annotate-root`)return NodeFilter.FILTER_REJECT;n=n.parentElement}return NodeFilter.FILTER_ACCEPT}}),n=[];for(let e=t.nextNode();e;e=t.nextNode())n.push(e);return n}function de(e){let t=``;for(let n of e)t+=n.data;return t}function fe(e,t,n){let r=document.createRange();try{r.setStart(t,n),r.collapse(!0)}catch{return 0}let i=0;for(let t of e){if(r.comparePoint(t,t.length)<=0){i+=t.length;continue}if(r.comparePoint(t,0)>=0)return i;for(let e=1;e<t.length;e++)if(r.comparePoint(t,e)>=0)return i+e;return i+t.length}return i}function pe(e,t){let{exact:n,prefix:r,suffix:i,start:a}=t,o=-1,s=-1/0;for(let t=e.indexOf(n);t!==-1;t=e.indexOf(n,t+1)){let c=e.slice(Math.max(0,t-r.length),t),l=e.slice(t+n.length,t+n.length+i.length),u=(he(c,r)+me(l,i))*1e4-Math.min(9999,Math.abs(t-a));u>s&&(s=u,o=t)}return o}function me(e,t){let n=Math.min(e.length,t.length),r=0;for(;r<n&&e[r]===t[r];)r++;return r}function he(e,t){let n=Math.min(e.length,t.length),r=0;for(;r<n&&e[e.length-1-r]===t[t.length-1-r];)r++;return r}function E(e,t,n){let r=D(e,t),i=D(e,n);if(!r||!i)return null;let a=document.createRange();try{a.setStart(r.node,r.offset),a.setEnd(i.node,i.offset)}catch{return null}return a}function D(e,t){let n=0;for(let r of e){if(t<=n+r.data.length)return{node:r,offset:t-n};n+=r.data.length}let r=e[e.length-1];return r?{node:r,offset:r.data.length}:null}function O(e,t=48){let n=e=>e.replace(/\s+/g,` `),r=n(e.prefix),i=n(e.suffix),a=r.slice(-t),o=i.slice(0,t),s=(e,t,n)=>e.length<t.length||n.length>=48,c=s(a,r,e.prefix)?`…`:``,l=s(o,i,e.suffix)?`…`:``;return`${c}${a}⟦${n(e.exact)}⟧${o}${l}`}let ge=new Set([`BR`,`HR`,`IMG`,`INPUT`,`META`,`LINK`,`SOURCE`]),k=`h1, h2, h3, h4, h5, h6`;function A(e){let{css:t,xpath:n}=ye(e),r={css:t,xpath:n,tagName:e.tagName.toLowerCase(),unique:j(t,e)&&Se(n,e)},i=_e(e);return i.length&&(r.classes=i),r}function _e(e){return Array.from(e.classList).slice(0,4)}function ve(e){let t=[];for(let n=e;n&&n!==document.documentElement&&t.length<5;n=n.parentElement){let e=_e(n),r=e.length?`.`+e.map(e=>e.replace(/\s+/g,``)).join(`.`):``;t.unshift(n.tagName.toLowerCase()+r)}return t.length?t.join(` > `):null}function ye(e){let t=N(e);if(t&&!t.includes(`"`)){let n={css:`[data-annotate-id="${F(t)}"]`,xpath:`//*[@data-annotate-id="${t}"]`};if(be(n,e))return n}let n=P(e);if(n&&!n.includes(`"`)){let t={css:`#${F(n)}`,xpath:`//*[@id="${n}"]`};if(be(t,e))return t}return xe(e)}function be(e,t){return j(e.css,t)&&Se(e.xpath,t)}function xe(e){let t=[],n=[];for(let r=e;r;r=r.parentElement){let i=r.parentElement,a=r.tagName.toLowerCase();if(!i){t.unshift(a),n.unshift(`/${a}`);break}if(r!==e){let e=P(r);if(e&&!e.includes(`"`)&&j(`#${F(e)}`,r)){t.unshift(`#${F(e)}`),n.unshift(`//*[@id="${e}"]`);break}}let o=Array.from(i.children).filter(e=>e.tagName===r.tagName),s=o.length===1?null:o.indexOf(r)+1;t.unshift(s===null?a:`${a}:nth-of-type(${s})`),n.unshift(s===null?`/${a}`:`/${a}[${s}]`)}return{css:t.join(` > `),xpath:n.join(``)}}function j(e,t){try{let n=document.querySelectorAll(e);return n.length===1&&n[0]===t}catch{return!1}}function Se(e,t){if(typeof document.evaluate!=`function`)return!1;try{let n=document.evaluate(e,document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);return n.snapshotLength===1&&n.snapshotItem(0)===t}catch{return!1}}function Ce(e,t){let n={annotateId:N(e),sourceRef:De(e),elementId:P(e),cssPath:Ne(e),headingAnchor:ke(e),tagName:e.tagName.toLowerCase(),preview:Fe(e),anchors:[A(e)],trail:ve(e)},r=a(e);if(r&&(r.trail&&(n.component=`${r.trail} (${r.framework})`),!n.sourceRef&&r.source&&(n.sourceRef=r.source)),t){let r=se(e,t);r&&(n.textRange=r.selector,r.elements.length&&(n.anchors=r.elements.map(A)))}return n}function M(e){let t=e.tagName;if(e.textRange){let{exact:n}=e.textRange;return n.trim().length<=12?`${t} · ${O(e.textRange,28)}`:`${t} · “${Te(n,60)}”`}return e.annotateId?`${t} · #${e.annotateId}`:e.headingAnchor?`${t} · under “${e.headingAnchor.text}”`:e.elementId?`${t}#${e.elementId}`:`${t} · ${e.preview}`}function we(e,t){let n=[];return t&&n.push(e.textRange?`STALE — the quoted text is no longer on this page`:`STALE — selector did not resolve on this page`),e.textRange&&n.push(`Text: ${O(e.textRange)}`),n.push(`Selector: ${e.cssPath||`(none)`}`),e.annotateId&&n.push(`data-annotate-id: ${e.annotateId}`),e.elementId&&n.push(`#${e.elementId}`),e.headingAnchor&&n.push(`Near heading “${e.headingAnchor.text}” (offset +${e.headingAnchor.offset})`),!e.textRange&&e.preview&&n.push(`Preview: ${e.preview}`),n.join(`
`)}function Te(e,t){let n=e.trim().replace(/\s+/g,` `);return n.length>t?n.slice(0,t-1)+`…`:n}function Ee(e){if(e.annotateId){let t=document.querySelector(`[data-annotate-id="${F(e.annotateId)}"]`);if(t)return{element:t,strategy:`annotateId`}}if(e.elementId){let t=document.getElementById(e.elementId);if(t)return{element:t,strategy:`elementId`}}if(e.cssPath)try{let t=document.querySelectorAll(e.cssPath);if(t.length===1)return{element:t[0],strategy:`cssPath`}}catch{}if(e.headingAnchor){let t=Me(e.headingAnchor,e.tagName);if(t)return{element:t,strategy:`headingAnchor`}}return{element:null,strategy:null}}function De(e){for(let t=e;t&&t!==document.documentElement;t=t.parentElement){let e=t.getAttribute(`data-draft-source`);if(e?.trim())return e.trim();let n=t.getAttribute(`data-v-inspector`);if(n?.trim())return n.trim();let r=t.getAttribute(`data-inspector-relative-path`);if(r?.trim()){let e=t.getAttribute(`data-inspector-line`),n=t.getAttribute(`data-inspector-column`);return[r.trim(),e,n].filter(Boolean).join(`:`)}}return null}function N(e){let t=e.getAttribute(`data-annotate-id`);return t&&t.trim()?t.trim():null}let Oe=[/^:r\d+:?$/,/^radix-/,/^headlessui-/,/^mui-/,/^[a-z0-9_-]{20,}$/i];function P(e){let t=e.id;return!t||Oe.some(e=>e.test(t))?null:t}function ke(e){let t=e.querySelector(k)??Ae(e);if(!t)return null;let n=(t.textContent||``).trim().slice(0,200);return n?{text:n,offset:je(t,e)}:null}function Ae(e){let t=e;for(;t;){let e=t.previousSibling;for(;e;){if(e.nodeType===Node.ELEMENT_NODE){let t=e;if(t.matches(k))return t;let n=t.querySelector(k);if(n){let e=t.querySelectorAll(k);return e[e.length-1]??n}}e=e.previousSibling}t=t.parentNode}return null}function je(e,t){let n=t.tagName,r=document.getElementsByTagName(n),i=0,a=!1,o=!1;for(let n of Array.from(r))if(a||e.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING&&(a=!0),a){if(n===t){o=!0;break}i++}return o?i:0}function Me(e,t){let n=document.querySelectorAll(k),r=null;for(let t of Array.from(n))if((t.textContent||``).trim().slice(0,200)===e.text){r=t;break}if(!r)return null;let i=document.getElementsByTagName(t.toUpperCase()),a=0;for(let t of Array.from(i))if(r.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING){if(a===e.offset)return t;a++}return null}function Ne(e){if(e===document.documentElement)return`html`;if(e===document.body)return`body`;let t=[],n=e;for(;n&&n!==document.documentElement;){if(n===document.body){t.unshift(`body`);break}t.unshift(Pe(n));let e=t.join(` > `);try{if(document.querySelectorAll(e).length===1)return e}catch{}n=n.parentElement}return t.join(` > `)}function Pe(e){let t=e.tagName.toLowerCase(),n=e.parentElement;if(!n)return t;for(let r of Array.from(e.classList)){let e=`${t}.${F(r)}`,i=0;for(let t of Array.from(n.children)){try{t.matches(e)&&i++}catch{}if(i>1)break}if(i===1)return e}let r=Array.from(n.children).filter(t=>t.tagName===e.tagName);return r.length===1?t:`${t}:nth-of-type(${r.indexOf(e)+1})`}function Fe(e){if(ge.has(e.tagName))return e.tagName===`IMG`?e.alt||e.src.split(`/`).pop()||`<img>`:`<${e.tagName.toLowerCase()}>`;let t=(e.textContent||``).trim().replace(/\s+/g,` `);return t?t.slice(0,80):`<${e.tagName.toLowerCase()}>`}function F(e){return typeof CSS<`u`&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/(["\\])/g,`\\$1`)}function Ie(e,t){let n=e.filter(e=>e.annotations.length>0),r=n.reduce((e,t)=>e+t.annotations.length,0),i=[`# Draft feedback`,``];if(t.draftId&&i.push(`- Draft: \`${t.draftId}\``),i.push(`- Exported: ${t.exportedAt}`),i.push(`- Annotations: ${r}`),i.push(``),!n.length)return i.push(`_No annotations recorded._`),i.join(`
`)+`
`;for(let e of n)i.push(`## ${e.url}`,``),e.annotations.forEach((e,t)=>{i.push(`### ${t+1}. ${M(e.selector)}`,``),i.push(...Le(e.selector)),i.push(``),i.push(e.comment.trim()),i.push(``)});return i.join(`
`)}function Le(e){let t=[];return e.headingAnchor&&t.push(`- Section: “${e.headingAnchor.text}”`),e.textRange?t.push(`- Context: ${O(e.textRange)}`):e.preview&&t.push(`- Text: ${e.preview}`),e.component&&t.push(`- Component: ${e.component}`),e.sourceRef&&t.push(`- Source: \`${e.sourceRef}\``),e.trail&&t.push(`- Trail: \`${e.trail}\``),t.push(...Re(e)),t}function Re(e){let t=e.anchors??[];if(!t.length)return e.cssPath?[`- Anchor: \`${e.cssPath}\` (rendered DOM)`]:[];if(t.length===1){let e=t[0];return[`- Anchor (rendered DOM${L(e)}):`,...I(e,`  `)]}let n=e.textRange?ce(e.textRange):[],r=[`- Anchors (rendered DOM). The selection crosses inline markup, so the whole`,`  quote may not appear verbatim in source — these runs will, in this order:`],i=0;return t.forEach((e,t)=>{let a=n[t];a&&(i++,r.push(`  ${i}. \`${a}\`${L(e)}`),r.push(...I(e,`     `)))}),r}function I(e,t){let n=[`${t}- CSS: \`${e.css}\``,`${t}- XPath: \`${e.xpath}\``];return e.classes?.length&&n.push(`${t}- Classes: ${e.classes.join(` `)}`),n}function L(e){return e.unique?``:` — WARNING: matches more than one element`}function ze(e){return e?`${e}-feedback.md`:`feedback.md`}let Be=new Set([`H1`,`H2`,`H3`,`H4`,`H5`,`H6`]),Ve=new Set([`BUTTON`,`A`,`INPUT`,`SELECT`,`TEXTAREA`,`LABEL`,`SUMMARY`,`DETAILS`]),He=new Set([`IMG`,`VIDEO`,`PICTURE`,`CANVAS`,`SVG`,`AUDIO`]),Ue=new Set([`TABLE`,`TR`,`TD`,`TH`,`CAPTION`]),We=new Set([`THEAD`,`TBODY`,`TFOOT`]),Ge=new Set([`DL`,`DT`,`DD`]),Ke=new Set([`FIGURE`,`FIGCAPTION`,`BLOCKQUOTE`]),qe=new Set([`SECTION`,`ARTICLE`,`ASIDE`,`HEADER`,`FOOTER`,`MAIN`,`NAV`,`FORM`]),Je=new Set([`HTML`,`BODY`,`SCRIPT`,`STYLE`,`NOSCRIPT`]),Ye=/\b(card|tile|panel|widget|module|chip|badge|pill|item|row|cell|entry)\b/;function R(e,t,n){let r=document.elementsFromPoint(e,t);if(!r.length)return null;let i=r.filter(e=>!(n&&(e===n||n.contains(e))||Je.has(e.tagName)));if(!i.length)return null;for(let e of i)if(Xe(e))return{element:e,rect:e.getBoundingClientRect()};let a=i[0];return a?{element:a,rect:a.getBoundingClientRect()}:null}function Xe(e){let t=e.tagName;return e.hasAttribute(`data-annotate-id`)||Be.has(t)?!0:Ve.has(t)?!(t===`A`&&!(e.textContent||``).trim()&&!e.getAttribute(`aria-label`)):He.has(t)||Ue.has(t)||Ge.has(t)||Ke.has(t)||t===`LI`?!0:t===`P`?(e.textContent||``).trim().length>0:t===`PRE`||t===`CODE`||We.has(t)?!0:t===`DIV`||t===`SPAN`?!!(e.hasAttribute(`role`)||Ye.test((e.getAttribute(`class`)||``).toLowerCase())):!!qe.has(t)}let z=`dd:annotate:`;function B(e){return z+e}function V(){let e=new URL(window.location.href);return e.searchParams.delete(`annotate`),e.searchParams.delete(`toolbar`),e.searchParams.delete(`reveal`),e.hash=``,e.toString()}function H(e){try{let t=window.localStorage.getItem(B(e));if(!t)return[];let n=JSON.parse(t);return Array.isArray(n)?n.filter(W):[]}catch{return[]}}function U(e,t){try{window.localStorage.setItem(B(e),JSON.stringify(t))}catch{}}function W(e){if(!e||typeof e!=`object`)return!1;let t=e;return typeof t.id==`string`&&typeof t.comment==`string`&&typeof t.createdAt==`number`&&typeof t.updatedAt==`number`&&typeof t.selector==`object`&&t.selector!==null&&(t.draftId===void 0||typeof t.draftId==`string`)}function G(e,t){return t.draftId===e}function Ze(e){return H(V()).filter(t=>G(e,t))}function K(e,t){let n=new Map;try{for(let r=0;r<window.localStorage.length;r++){let i=window.localStorage.key(r);if(!i||!i.startsWith(z))continue;let a=i.slice(12);if(!a.startsWith(e))continue;let o=window.localStorage.getItem(i);if(o)try{let e=JSON.parse(o);if(Array.isArray(e)){let r=e.filter(W).filter(e=>G(t,e));r.length&&n.set(a,r)}}catch{}}}catch{}return n}function Qe(e,t){let n=0;try{let r=[];for(let t=0;t<window.localStorage.length;t++){let n=window.localStorage.key(t);!n||!n.startsWith(z)||n.slice(12).startsWith(e)&&r.push(n)}for(let e of r){let r=window.localStorage.getItem(e);if(!r)continue;let i;try{i=JSON.parse(r)}catch{continue}if(!Array.isArray(i))continue;let a=i.filter(W).filter(e=>!G(t,e));n+=i.filter(W).length-a.length,a.length?window.localStorage.setItem(e,JSON.stringify(a)):window.localStorage.removeItem(e)}}catch{}return n}function $e(e,t){let n=H(t),r=n.findIndex(t=>t.id===e.id);r>=0?n[r]=e:n.push(e),U(t,n)}function et(e,t){let n=H(t).filter(t=>t.id!==e);if(n.length)U(t,n);else try{window.localStorage.removeItem(B(t))}catch{U(t,n)}}function tt(){return Date.now().toString(36)+`-`+Math.random().toString(36).slice(2,8)}let nt=[`keydown`,`keyup`,`keypress`,`input`,`beforeinput`],q=`Clear`;function J(e,t,n){e.textContent=t,window.setTimeout(()=>{e.isConnected&&(e.textContent=n)},1600)}function rt(e){return t=>{e.isActive()&&t.stopPropagation()}}function it(e,t){e.addEventListener(`keydown`,e=>{e.key===`Enter`&&(!e.metaKey&&!e.ctrlKey||(e.preventDefault(),t()))})}function at(){return/Mac|iPhone|iPad|iPod/.test(navigator.userAgent)?`⌘`:`Ctrl+`}function ot(e){if(!e||typeof e!=`object`)return!1;let t=e;return typeof t.name==`string`&&Array.isArray(t.pages)}var st=class{host=null;root=null;outlineEl=null;outlineLabelEl=null;mode;triggerElement;panelAnchor;constructor(e={}){this.mode=e.mode??`standalone`,this.triggerElement=e.triggerElement??null,this.panelAnchor=e.panelAnchor??`viewport-top`}setTriggerElement(e){this.triggerElement=e}panelEl=null;panelBodyEl=null;panelTabsEl=null;currentTab=V();toggleEl=null;composerEl=null;pinLayer=null;highlightLayer=null;pendingHighlight=[];active=!1;draftScope=window.location.origin+`/`;scopeRequested=!1;draftId=i(document);hovered=null;composing=null;editing=null;clearArmTimer=null;pins=[];rafScheduled=!1;mount(){if(this.host)return;let e=document.createElement(`div`);e.id=`design-drafts-annotate-root`,e.style.cssText=`all: initial; position: fixed; inset: 0; z-index: 2147483100; pointer-events: none;`;let t=e.attachShadow({mode:`open`}),n=new CSSStyleSheet;n.replaceSync(ie),t.adoptedStyleSheets=[n];let r=document.createElement(`div`);r.style.cssText=`position: absolute; inset: 0; pointer-events: none;`,t.appendChild(r);let i=document.createElement(`div`);i.style.cssText=`position: absolute; inset: 0; pointer-events: none;`,t.appendChild(i);let a=document.createElement(`div`);a.className=`outline`;let o=document.createElement(`div`);o.className=`outline-label`,a.appendChild(o),t.appendChild(a);for(let t of nt)e.addEventListener(t,rt(this));document.documentElement.appendChild(e),this.host=e,this.root=t,this.outlineEl=a,this.outlineLabelEl=o,this.pinLayer=i,this.highlightLayer=r,this.renderToggle(),this.refreshPins()}unmount(){this.host&&(this.host.remove(),this.host=null,this.root=null,this.outlineEl=null,this.outlineLabelEl=null,this.panelEl=null,this.panelBodyEl=null,this.toggleEl=null,this.composerEl=null,this.pinLayer=null,this.highlightLayer=null,this.pendingHighlight=[],this.pins=[])}isActive(){return this.active}ensureDraftScope(){this.scopeRequested||(this.scopeRequested=!0,t(window.location.href,ot).then(e=>{e&&(this.draftScope=n(e.manifestUrl),this.panelBodyEl&&this.renderPanel())}))}activate(){if(this.active)return;this.ensureDraftScope(),this.mount(),this.active=!0,window.addEventListener(`pointermove`,this.onPointerMove,!0),window.addEventListener(`click`,this.onClick,!0),window.addEventListener(`auxclick`,this.onClick,!0),window.addEventListener(`mousedown`,this.onMouseButton,!0),window.addEventListener(`mouseup`,this.onMouseButton,!0),window.addEventListener(`keydown`,this.onKeyDown,!0),window.addEventListener(`scroll`,this.onViewportChange,!0),window.addEventListener(`resize`,this.onViewportChange,!0),this.renderToggle(),this.openPanel(),this.refreshPins();let e=new URLSearchParams(window.location.search).get(`reveal`);if(e){let t=new URL(window.location.href);t.searchParams.delete(`reveal`),window.history.replaceState(null,``,t.toString()),setTimeout(()=>{let t=this.pins.find(t=>t.annotation.id===e);if(t?.element){let e=t.range??t.element;this.scrollTargetIntoView(e),setTimeout(()=>this.flash(e),280)}},60)}}deactivate(){this.active&&(this.active=!1,window.removeEventListener(`pointermove`,this.onPointerMove,!0),window.removeEventListener(`click`,this.onClick,!0),window.removeEventListener(`auxclick`,this.onClick,!0),window.removeEventListener(`mousedown`,this.onMouseButton,!0),window.removeEventListener(`mouseup`,this.onMouseButton,!0),window.removeEventListener(`keydown`,this.onKeyDown,!0),window.removeEventListener(`scroll`,this.onViewportChange,!0),window.removeEventListener(`resize`,this.onViewportChange,!0),this.hovered=null,this.composing=null,this.closeComposer(),this.closePanel(),this.hideOutline(),this.clearPins(),this.renderToggle())}toggle(){this.active?this.deactivate():this.activate()}onPointerMove=e=>{if(!this.active||this.composing)return;if(e.buttons!==0){this.hovered=null,this.hideOutline();return}if(this.eventCrossesOverlay(e)){this.hovered=null,this.hideOutline();return}let t=R(e.clientX,e.clientY,this.host);if(!t){this.hovered=null,this.hideOutline();return}this.hovered=t,this.drawOutline(t.element,Z(t.element))};onMouseButton=e=>{this.active&&(this.eventCrossesOverlay(e)||e.stopPropagation())};onClick=e=>{if(!this.active||this.eventCrossesOverlay(e)||(e.preventDefault(),e.stopPropagation(),this.composing))return;let t=ct(),n=t?oe(t):null;if(t&&n){let e=Ce(n,t);if(e.textRange){this.composing={selector:e,element:n,range:t},this.openComposer(X(t),t);return}}let r=R(e.clientX,e.clientY,this.host);if(!r)return;let i=Ce(r.element);this.composing={selector:i,element:r.element,range:null},this.openComposer(r.rect,null)};onKeyDown=e=>{if(e.key===`Escape`){if(this.composing){this.closeComposer(),this.composing=null;return}if(this.editing){this.editing=null,this.renderPanel();return}}};onViewportChange=()=>{this.rafScheduled||(this.rafScheduled=!0,requestAnimationFrame(()=>{this.rafScheduled=!1,this.repositionPins(),this.composing?.range&&this.syncHighlight(this.pendingHighlight,Y(this.composing.range),`range-highlight pending`),this.hovered&&this.drawOutline(this.hovered.element,Z(this.hovered.element))}))};drawOutline(e,t){if(!this.outlineEl||!this.outlineLabelEl)return;let n=X(e);if(n.width===0&&n.height===0){this.hideOutline();return}Object.assign(this.outlineEl.style,{left:`${n.left}px`,top:`${n.top}px`,width:`${n.width}px`,height:`${n.height}px`}),this.outlineEl.classList.add(`visible`),this.outlineLabelEl.textContent=t}hideOutline(){this.outlineEl&&this.outlineEl.classList.remove(`visible`)}openComposer(e,t){if(this.closeComposer(),!this.root)return;let n=document.createElement(`div`);n.className=`composer`,t&&this.syncHighlight(this.pendingHighlight,Y(t),`range-highlight pending`);let r=document.createElement(`textarea`);r.placeholder=t?`Leave a note on this text…`:`Leave a note for this element…`,r.rows=3;let i=document.createElement(`div`);i.className=`composer-actions`;let a=document.createElement(`button`);a.className=`btn ghost`,a.textContent=`Cancel`,a.type=`button`,a.addEventListener(`click`,()=>{this.closeComposer(),this.composing=null});let o=document.createElement(`button`);o.className=`btn primary`,o.textContent=`Save`,o.type=`button`,o.title=`Save (${at()}↵)`;let s=()=>{let e=r.value.trim();if(!e||!this.composing){this.closeComposer(),this.composing=null;return}let t=Date.now();$e({id:tt(),draftId:this.draftId,selector:this.composing.selector,comment:e,createdAt:t,updatedAt:t},V()),this.composing=null,this.closeComposer(),this.refreshPins(),this.renderPanel()};o.addEventListener(`click`,s),it(r,s),i.appendChild(a),i.appendChild(o),n.appendChild(r),n.appendChild(i),ft(n,e),this.root.appendChild(n),this.composerEl=n,requestAnimationFrame(()=>ft(n,e)),setTimeout(()=>r.focus(),0)}closeComposer(){this.composerEl&&(this.composerEl.remove(),this.composerEl=null,window.getSelection()?.removeAllRanges()),this.syncHighlight(this.pendingHighlight,[])}refreshPins(){this.clearPins(),this.pinLayer&&(Ze(this.draftId).forEach((e,t)=>{let n=Ee(e.selector),r=e.selector.textRange,i=r&&n.element?ue(n.element,r):null,a=r&&!i?null:n.element,o=!a,s=document.createElement(`button`);s.type=`button`,s.className=`pin`,s.textContent=String(t+1),s.title=e.comment.slice(0,200),o&&s.classList.add(`stale`);let c={annotation:e,element:a,range:i,pinNode:s,highlightNodes:[],number:t+1,stale:o};s.addEventListener(`click`,t=>{t.preventDefault(),t.stopPropagation(),this.editing={id:e.id},this.openPanel(),this.renderPanel(),this.scrollEntryIntoView(e.id)}),a&&(s.addEventListener(`pointerenter`,()=>{if(c.range){for(let e of c.highlightNodes)e.classList.add(`hovered`);return}this.drawOutline(a,Z(a))}),s.addEventListener(`pointerleave`,()=>{for(let e of c.highlightNodes)e.classList.remove(`hovered`);this.hideOutline()})),this.pinLayer.appendChild(s),this.pins.push(c)}),this.repositionPins())}clearPins(){for(let e of this.pins){e.pinNode.remove();for(let t of e.highlightNodes)t.remove()}this.pins=[]}syncHighlight(e,t,n=`range-highlight`){if(this.highlightLayer){for(;e.length>t.length;)e.pop()?.remove();for(;e.length<t.length;){let t=document.createElement(`div`);t.className=n,this.highlightLayer.appendChild(t),e.push(t)}t.forEach((t,n)=>{let r=e[n];r&&(r.style.left=`${t.left}px`,r.style.top=`${t.top}px`,r.style.width=`${t.width}px`,r.style.height=`${t.height}px`)})}}repositionPins(){let e=window.innerWidth,t=window.innerHeight;for(let n of this.pins){if(!n.element){n.pinNode.style.display=`none`,this.syncHighlight(n.highlightNodes,[]);continue}let r=Y(n.range??n.element);this.syncHighlight(n.highlightNodes,n.range?r:[]);let i=n.range?r[r.length-1]:r[0];if(!i||i.width===0&&i.height===0){n.pinNode.style.display=`none`;continue}if(!(i.right>0&&i.left<e&&i.bottom>0&&i.top<t)){n.pinNode.style.display=`none`;continue}let a=i.right+11,o=i.top,s=a,c=o,l=e-4-11;s<15&&(s=15),s>l&&(s=l);let u=t-4;c<26&&(c=26),c>u&&(c=u);let d=s!==a||c!==o;n.pinNode.classList.toggle(`clamped`,d),n.pinNode.style.display=``,n.pinNode.style.left=`${s}px`,n.pinNode.style.top=`${c}px`}}openPanel(){if(!this.root||this.panelEl)return;let e=document.createElement(`div`);e.className=this.panelAnchor===`above-trigger`?`panel above-trigger`:`panel`;let t=document.createElement(`div`);t.className=`panel-head`;let n=document.createElement(`div`);n.className=`panel-title`,n.textContent=`Annotations`,t.appendChild(n);let r=document.createElement(`div`);r.className=`panel-head-actions`;let i=document.createElement(`button`);i.type=`button`,i.className=`btn ghost`,i.textContent=`Export`,i.title=`Copy every annotation on this draft as markdown, ready to paste to an agent`,i.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),this.exportMarkdown(i)}),r.appendChild(i);let a=document.createElement(`button`);a.type=`button`,a.className=`btn ghost clear-all`,a.textContent=q,a.title=`Delete every annotation on this draft`,a.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),this.clearAll(a)}),r.appendChild(a);let o=document.createElement(`button`);o.type=`button`,o.className=`btn ghost`,o.textContent=`Hide`,o.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),this.deactivate()}),r.appendChild(o),t.appendChild(r);let s=document.createElement(`div`);s.className=`panel-tabs`;let c=document.createElement(`div`);c.className=`panel-body`,e.appendChild(t),e.appendChild(s),e.appendChild(c),this.root.appendChild(e),this.panelEl=e,this.panelTabsEl=s,this.panelBodyEl=c,this.currentTab=V(),this.renderPanel()}closePanel(){this.disarmClear(),this.panelEl&&(this.panelEl.remove(),this.panelEl=null,this.panelBodyEl=null,this.panelTabsEl=null)}renderPanel(){if(!this.panelBodyEl||!this.panelTabsEl)return;let e=V(),t=K(this.draftScope,this.draftId);t.has(e)||t.set(e,[]),t.has(this.currentTab)||(this.currentTab=e),this.panelTabsEl.replaceChildren();let n=Array.from(t.entries()).sort(([t],[n])=>t===e?-1:n===e?1:t.localeCompare(n));for(let[t,r]of n){let n=document.createElement(`button`);n.type=`button`,n.className=`panel-tab`+(t===this.currentTab?` active`:``),n.title=t;let i=document.createElement(`span`);i.className=`panel-tab-label`,i.textContent=dt(t,e);let a=document.createElement(`span`);a.className=`panel-tab-count`,a.textContent=String(r.length),n.appendChild(i),n.appendChild(a),n.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),this.currentTab=t,this.renderPanel()}),this.panelTabsEl.appendChild(n)}this.panelBodyEl.replaceChildren();let r=t.get(this.currentTab)??[],i=this.currentTab===e;if(!r.length){let e=document.createElement(`div`);e.className=`panel-empty`,e.textContent=i?`No annotations yet. Click any block on the page to leave one.`:`No annotations on this page.`,this.panelBodyEl.appendChild(e);return}r.forEach((e,t)=>{let n=i?this.pinByAnnotationId(e.id)?.stale??!1:!1,r=this.renderEntry(e,t+1,n,this.currentTab);this.panelBodyEl.appendChild(r)})}pinByAnnotationId(e){return this.pins.find(t=>t.annotation.id===e)}renderEntry(e,t,n,r){let i=document.createElement(`div`);i.className=`entry`,i.dataset.id=e.id;let a=document.createElement(`div`);a.className=`entry-head`;let o=document.createElement(`div`);o.className=`entry-num`,n&&o.classList.add(`stale`),o.textContent=String(t),a.appendChild(o);let s=document.createElement(`div`);if(s.className=`entry-anchor`,s.textContent=n?`${M(e.selector)} · stale`:M(e.selector),s.title=we(e.selector,n),a.appendChild(s),i.appendChild(a),this.editing?.id===e.id){let t=document.createElement(`textarea`);t.className=`field`,t.value=e.comment,t.rows=3;let n=document.createElement(`div`);n.className=`entry-actions`;let a=document.createElement(`button`);a.type=`button`,a.className=`btn ghost`,a.textContent=`Cancel`,a.addEventListener(`click`,()=>{this.editing=null,this.renderPanel()});let o=document.createElement(`button`);o.type=`button`,o.className=`btn primary`,o.textContent=`Save`,o.title=`Save (${at()}↵)`;let s=()=>{let n=t.value.trim();n&&($e({...e,comment:n,updatedAt:Date.now()},r),this.editing=null,this.renderPanel())};o.addEventListener(`click`,s),it(t,s),n.appendChild(a),n.appendChild(o),i.appendChild(t),i.appendChild(n),setTimeout(()=>t.focus(),0)}else{let t=document.createElement(`div`);t.className=`entry-body`,t.textContent=e.comment,i.appendChild(t);let a=document.createElement(`div`);a.className=`entry-actions`;let o=document.createElement(`button`);o.type=`button`,o.className=`btn ghost`,o.textContent=`Reveal`,o.disabled=n,o.addEventListener(`click`,()=>{if(r===V()){let t=this.pins.find(t=>t.annotation.id===e.id);if(!t?.element)return;let n=t.range??t.element;this.scrollTargetIntoView(n),setTimeout(()=>this.flash(n),220);return}try{let t=new URL(r);t.searchParams.set(`annotate`,`1`),t.searchParams.set(`reveal`,e.id),window.location.href=t.toString()}catch{}});let s=document.createElement(`button`);s.type=`button`,s.className=`btn ghost`,s.textContent=`Edit`,s.addEventListener(`click`,()=>{this.editing={id:e.id},this.renderPanel()});let c=document.createElement(`button`);c.type=`button`,c.className=`btn ghost danger`,c.textContent=`Delete`,c.addEventListener(`click`,()=>{et(e.id,r),this.refreshPins(),this.renderPanel()}),a.appendChild(o),a.appendChild(s),a.appendChild(c),i.appendChild(a)}return i}scrollEntryIntoView(e){this.panelBodyEl&&this.panelBodyEl.querySelector(`[data-id="${pt(e)}"]`)?.scrollIntoView({behavior:`smooth`,block:`nearest`})}exportMarkdown(e){let t=V(),n=K(this.draftScope,this.draftId),r=Array.from(n.entries()).sort(([e],[n])=>e===t?-1:n===t?1:e.localeCompare(n)).map(([e,t])=>({url:e,annotations:t})),i=t=>J(e,t,`Export`);if(!r.some(e=>e.annotations.length)){i(`Nothing yet`);return}let a=Ie(r,{draftId:this.draftId,exportedAt:new Date().toISOString()});lt(a).then(()=>i(`Copied`),()=>{ut(a,ze(this.draftId)),i(`Downloaded`)})}clearAll(e){if(this.clearArmTimer!==null){this.disarmClear();let t=Qe(this.draftScope,this.draftId);this.editing=null,this.refreshPins(),this.renderPanel(),J(e,`Cleared ${t}`,q);return}let t=0;for(let e of K(this.draftScope,this.draftId).values())t+=e.length;if(!t){J(e,`Nothing yet`,q);return}e.classList.add(`armed`),e.textContent=`Clear all ${t}?`,this.clearArmTimer=window.setTimeout(()=>{this.clearArmTimer=null,e.classList.remove(`armed`),e.textContent=q},4e3)}disarmClear(){this.clearArmTimer!==null&&(window.clearTimeout(this.clearArmTimer),this.clearArmTimer=null,(this.panelEl?.querySelector(`.clear-all`))?.classList.remove(`armed`))}renderToggle(){if(!this.root||(this.toggleEl&&=(this.toggleEl.remove(),null),this.active)||this.mode===`integrated`)return;let e=document.createElement(`button`);e.type=`button`,e.className=`toggle`,e.innerHTML=``;let t=document.createElement(`span`);t.className=`toggle-dot`,e.appendChild(t);let n=document.createElement(`span`);n.textContent=`Annotate`,e.appendChild(n),e.addEventListener(`click`,()=>this.toggle()),this.root.appendChild(e),this.toggleEl=e}flash(e){if(!this.root)return;let t=Y(e);if(!t.length)return;let n=t.map(()=>{let e=document.createElement(`div`);return e.className=`flash`,this.root.appendChild(e),e}),r=performance.now(),i=()=>{let t=Y(e);if(n.forEach((e,n)=>{let r=t[n];if(!r){e.style.display=`none`;return}e.style.display=``,e.style.left=`${r.left}px`,e.style.top=`${r.top}px`,e.style.width=`${r.width}px`,e.style.height=`${r.height}px`}),performance.now()-r<1100)requestAnimationFrame(i);else for(let e of n)e.remove()};requestAnimationFrame(i)}scrollTargetIntoView(e){if(e instanceof Range){let t=X(e),n=window.scrollY+t.top-(window.innerHeight-t.height)/2;window.scrollTo({top:Math.max(0,n),behavior:`smooth`});return}e.scrollIntoView({behavior:`smooth`,block:`center`})}isInsideOverlay(e){return!this.host||!(e instanceof Node)?!1:this.host.contains(e)||this.host===e}eventCrossesOverlay(e){if(!this.host)return!1;let t=typeof e.composedPath==`function`?e.composedPath():[];if(t.includes(this.host))return!0;if(this.triggerElement){let e=this.triggerElement;for(;e&&!(e===document.body||e===document.documentElement);){if(t.includes(e))return!0;e=e.parentElement}}return this.isInsideOverlay(e.target)}};function ct(){let e=window.getSelection();if(!e||e.isCollapsed||e.rangeCount===0)return null;let t=e.getRangeAt(0);return!t||t.collapsed||!t.toString().trim()||t.commonAncestorContainer.getRootNode()!==document?null:t.cloneRange()}function Y(e){return e instanceof Range?typeof e.getClientRects==`function`?Array.from(e.getClientRects()):[]:[e.getBoundingClientRect()]}function X(e){return e instanceof Range&&typeof e.getBoundingClientRect!=`function`?new DOMRect(0,0,0,0):e.getBoundingClientRect()}async function lt(e){if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(e);return}throw Error(`clipboard unavailable`)}function ut(e,t){let n=URL.createObjectURL(new Blob([e],{type:`text/markdown;charset=utf-8`})),r=document.createElement(`a`);r.href=n,r.download=t,document.body.appendChild(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(n),0)}function Z(e){return`${e.tagName.toLowerCase()}${e.id?`#${e.id}`:``}${e.classList.length?`.${Array.from(e.classList).slice(0,2).join(`.`)}`:``}`}function dt(e,t){if(e===t)return`This page`;try{let t=new URL(e),n=t.pathname.split(`/`).filter(Boolean);return n.length?n[n.length-1]??t.host:t.host}catch{return e}}function ft(e,t){let n=e.offsetWidth||280,r=e.offsetHeight||120,i=window.innerWidth,a=window.innerHeight,o=t.left,s=t.bottom+8;s+r>a&&(s=Math.max(8,t.top-r-8)),o+n>i-8&&(o=Math.max(8,i-n-8)),o<8&&(o=8),e.style.left=`${o}px`,e.style.top=`${s}px`}function pt(e){return typeof CSS<`u`&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/(["\\])/g,`\\$1`)}function mt(){try{let e=new URL(window.location.href).searchParams.get(`annotate`);return e===`1`||e===`true`}catch{return!1}}let Q=`dd-annotations`;var ht=class extends HTMLElement{overlay=null;trigger=null;mode=`standalone`;panelAnchor=`viewport-top`;connectedCallback(){if(this.overlay||typeof document>`u`)return;let e=this.closest(`dd-toolbar`),t=e!==null||this.hasAttribute(`inline`);if(this.mode=t?`integrated`:`standalone`,this.panelAnchor=e?`above-trigger`:`viewport-top`,this.mode===`standalone`&&this.shadowRoot&&this.shadowRoot.replaceChildren(),this.mode===`integrated`){let e=this.shadowRoot??this.attachShadow({mode:`open`}),t=new CSSStyleSheet;t.replaceSync(`
:host { display: inline-flex; }
.trigger {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 13px;
  background: transparent;
  border: 0;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--dd-text-dim, #9b9ba0);
  cursor: pointer;
  white-space: nowrap;
}
.trigger:hover { color: var(--dd-text, #f5f5f5); }
.trigger.active { color: var(--dd-accent, #4f46e5); }
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dd-text-dim, #6b6b70);
}
.trigger.active .dot { background: var(--dd-accent, #4f46e5); }
`),e.adoptedStyleSheets=[t],e.innerHTML=`
        <button class="trigger" part="trigger" type="button">
          <span class="dot" part="dot" aria-hidden="true"></span>
          <span>Annotate</span>
        </button>
      `;let n=e.querySelector(`.trigger`);n&&(this.trigger=n,n.addEventListener(`click`,()=>this.overlay?.toggle()))}if(this.overlay=new st({mode:this.mode,triggerElement:this.mode===`integrated`?this:null,panelAnchor:this.panelAnchor}),this.overlay.mount(),this.trigger){let e=()=>{this.overlay?.isActive()?this.trigger?.classList.add(`active`):this.trigger?.classList.remove(`active`)};this.addEventListener(`click`,e,!0);let t=window.setInterval(e,250);this.addEventListener(`dd-annotations-disconnect`,()=>window.clearInterval(t),{once:!0})}mt()&&this.overlay.activate()}disconnectedCallback(){this.dispatchEvent(new CustomEvent(`dd-annotations-disconnect`)),this.overlay?.deactivate(),this.overlay?.unmount(),this.overlay=null,this.trigger=null}activate(){this.overlay?.activate()}deactivate(){this.overlay?.deactivate()}toggle(){this.overlay?.toggle()}isActive(){return this.overlay?.isActive()??!1}};typeof customElements<`u`&&!customElements.get(Q)&&customElements.define(Q,ht);function $(){if(typeof document>`u`||document.querySelector(Q))return;if(!document.body){document.addEventListener(`DOMContentLoaded`,$,{once:!0});return}let e=document.createElement(Q);e.setAttribute(`data-auto`,``);let t=document.querySelector(`dd-toolbar`);t?t.appendChild(e):document.body.appendChild(e),window.DesignDraftsAnnotate=e}$()})();