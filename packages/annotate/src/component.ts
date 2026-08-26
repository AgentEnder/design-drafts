// Component names, read from whatever the page already exposes.
//
// ADR 0001 turned down building the picker on framework internals, and that
// call still stands. This is a narrower bet: the picker touches none of it,
// an annotation is complete without it, and every path returns null when the
// marker isn't there.
//
// What each framework offers was measured rather than assumed:
//
//   framework   development                          production
//   ---------   -----------------------------------  ------------------------
//   React       fiber `_debug*` → names, _debugSource  minified to `eu`, `tR`, `d`
//   Vue 3       __vueParentComponent → name, __file   name often survives
//   Angular     window.ng.getComponent()              absent (verified)
//   Svelte      __svelte_meta.loc → file:line         absent (verified)
//   any         —                                     hyphenated tag names
//
// That last row is the one that matters most in production, and it needs no
// internals at all. angular.dev ships no readable component names through
// `window.ng` or `__ngContext__`, but renders `adev-progress-bar` and
// `docs-cookie-popup` — Angular components use element selectors, so the tag
// name IS the component name, and it survives minification because it lives
// in a template rather than in a symbol.
//
// The recurring rule: when a framework tells us it is a development build,
// its names are taken as written. Otherwise they must look authored, because
// `Component: eu` in an export would read as fact and silence would not.

/** How far up the fiber chain to look before giving up. */
const MAX_HOPS = 40;

/** How many component names to keep, nearest the element. */
const MAX_NAMES = 5;

export interface ComponentInfo {
  /** Outermost first, nearest last: "PricingCard › PricingCopy". */
  trail: string | null;
  /** "file" or "file:line", when the framework recorded one. */
  source: string | null;
  /** Which marker this came from, so a reader knows what kind of file to
   * open — a `.vue` and a `.tsx` are found different ways. */
  framework: string;
}

/** Try each framework in turn, then fall back to the signal that works
 * everywhere. First hit wins; null means the page said nothing. */
export function readComponentInfo(element: Element): ComponentInfo | null {
  return (
    readReactComponents(element) ??
    readVueComponents(element) ??
    readAngularComponents(element) ??
    readSvelteComponent(element) ??
    readCustomElements(element)
  );
}

export function readReactComponents(element: Element): ComponentInfo | null {
  const fiber = fiberOf(element);
  if (!fiber) return null;

  // In a development build React vouches for the names, so they are taken as
  // written — including ones the fallback heuristic would throw out, like a
  // component called `Hd`. Outside one, every name is suspect.
  const development = isDevelopmentBuild(fiber);

  const names: string[] = [];
  let source: string | null = null;
  let node: FiberLike | undefined = fiber;

  for (let hop = 0; node && hop < MAX_HOPS; hop++, node = node.return) {
    if (!source && node._debugSource?.fileName) {
      const { fileName, lineNumber } = node._debugSource;
      source = lineNumber ? `${fileName}:${lineNumber}` : fileName;
    }

    const type = node.type as
      | (Function & { displayName?: string })
      | undefined;
    if (typeof type !== 'function') continue;
    const name = type.displayName || type.name;
    if (!name) continue;
    if (!development && !looksAuthored(name)) continue;
    // Higher-order components stack the same name repeatedly; one is enough.
    if (names[names.length - 1] === name) continue;
    names.push(name);
  }

  if (!names.length) return null;
  return { trail: trailOf(names), source, framework: 'react' };
}

/**
 * Vue 3 hangs the owning component instance off the DOM node, and its SFC
 * compiler stamps `__file` on the component in development — so Vue gives up
 * a source path outright, which React does not.
 *
 * Names here are string literals the compiler emitted (`name`, or `__name`
 * from `<script setup>`), so they often survive minification too. `__file`
 * standing in for the development signal: when it is there, the build is a
 * development one and the names are trustworthy as-is.
 */
function readVueComponents(element: Element): ComponentInfo | null {
  let instance: VueInstance | undefined;
  for (let el: Element | null = element; el && !instance; el = el.parentElement) {
    instance = (el as unknown as { __vueParentComponent?: VueInstance })
      .__vueParentComponent;
  }
  if (!instance) return null;

  const names: string[] = [];
  let source: string | null = null;
  let node: VueInstance | undefined = instance;

  for (let hop = 0; node && hop < MAX_HOPS; hop++, node = node.parent) {
    const type = node.type;
    if (!type) continue;
    if (!source && type.__file) source = type.__file;
    const name = type.name || type.__name;
    if (!name) continue;
    // `__file` only appears in a development build, which is the same
    // trust signal React's `_debug*` fields give.
    if (!type.__file && !looksAuthored(name)) continue;
    if (names[names.length - 1] === name) continue;
    names.push(name);
  }

  if (!names.length && !source) return null;
  return { trail: trailOf(names), source, framework: 'vue' };
}

/**
 * Angular exposes `window.ng` in development builds only — verified absent on
 * angular.dev, which is a production build. `__ngContext__` is present in
 * both but carries no readable name, so there is nothing to salvage in
 * production here; the custom-element fallback covers that case instead.
 */
function readAngularComponents(element: Element): ComponentInfo | null {
  const ng = (window as unknown as { ng?: { getComponent?(el: Element): unknown } })
    .ng;
  if (typeof ng?.getComponent !== 'function') return null;

  const names: string[] = [];
  for (let el: Element | null = element; el; el = el.parentElement) {
    let instance: unknown;
    try {
      instance = ng.getComponent(el);
    } catch {
      continue;
    }
    const name = (instance as { constructor?: { name?: string } })?.constructor
      ?.name;
    // window.ng means a development build, so the name is taken as written.
    if (!name) continue;
    if (names[names.length - 1] === name) continue;
    names.push(name);
    if (names.length >= MAX_NAMES) break;
  }

  if (!names.length) return null;
  return { trail: trailOf(names), source: null, framework: 'angular' };
}

/**
 * Svelte compiles components away, leaving nothing to walk — but a
 * development build stamps `__svelte_meta` on the elements it created, with
 * the source file and line. That is better than a component name, and the
 * component name falls out of the filename.
 */
function readSvelteComponent(element: Element): ComponentInfo | null {
  for (let el: Element | null = element; el; el = el.parentElement) {
    const meta = (el as unknown as { __svelte_meta?: SvelteMeta }).__svelte_meta;
    const loc = meta?.loc;
    if (!loc?.file) continue;
    const source = loc.line ? `${loc.file}:${loc.line}` : loc.file;
    const name = loc.file.split('/').pop()?.replace(/\.svelte$/, '') ?? null;
    return { trail: name, source, framework: 'svelte' };
  }
  return null;
}

/**
 * The one that works in production, on any framework, with no internals: a
 * hyphenated tag name is a component name. Angular components use element
 * selectors, Vue and Lit register custom elements, and all of them survive
 * minification because the name lives in a template rather than a symbol.
 */
function readCustomElements(element: Element): ComponentInfo | null {
  const names: string[] = [];
  for (let el: Element | null = element; el; el = el.parentElement) {
    const tag = el.tagName.toLowerCase();
    if (!tag.includes('-')) continue;
    if (names[names.length - 1] === tag) continue;
    names.push(tag);
    if (names.length >= MAX_NAMES) break;
  }
  if (!names.length) return null;
  return { trail: trailOf(names), source: null, framework: 'custom-element' };
}

/** Nearest `MAX_NAMES`, rendered outermost first. */
function trailOf(names: string[]): string {
  return names.slice(0, MAX_NAMES).reverse().join(' › ');
}

interface VueInstance {
  parent?: VueInstance;
  type?: { name?: string; __name?: string; __file?: string };
}

interface SvelteMeta {
  loc?: { file?: string; line?: number; column?: number };
}

/**
 * Is this a development build, as React itself reports it?
 *
 * React attaches its `_debug*` bookkeeping to every fiber it creates, but
 * only under `__DEV__`. Testing for the property rather than a truthy value
 * matters: `_debugSource` is legitimately null on a fiber the JSX dev
 * transform didn't annotate, and `_debugOwner` is null at the root.
 *
 * Any `_debug*` field counts rather than one named field, because the set has
 * changed across versions — React 19 dropped `_debugSource` while keeping
 * `_debugOwner`. If a future version drops all of them, this reports
 * production and the fallback heuristic takes over, which is the safe way to
 * be wrong.
 */
function isDevelopmentBuild(fiber: FiberLike): boolean {
  return Object.getOwnPropertyNames(fiber).some((name) =>
    name.startsWith('_debug')
  );
}

/**
 * Fallback for a build React won't vouch for: does this look like a name a
 * person wrote, or one a minifier produced?
 *
 * Measured against react.dev's production bundle, where the chain above a
 * paragraph reads `eu, tR, d, r, p, z, $, es` — every one of them rejected
 * here, which is the point. A production build configured to keep function
 * names passes instead, and that's a bonus rather than a problem.
 */
function looksAuthored(name: string): boolean {
  if (name.length < 3) return false;
  if (!/^[A-Z]/.test(name)) return false;
  return true;
}

interface FiberLike {
  type?: unknown;
  return?: FiberLike;
  _debugSource?: { fileName?: string; lineNumber?: number };
}

/**
 * React hangs its fiber off the DOM node under a key with a random suffix —
 * `__reactFiber$k3n9x`. The prefix is a string literal in React's source, so
 * it survives minification; the suffix changes per page load, which is why
 * this scans keys rather than looking one up.
 */
function fiberOf(element: Element): FiberLike | null {
  // getOwnPropertyNames rather than keys: React assigns the fiber plainly, so
  // it is enumerable today, but nothing in the DOM contract says a host object
  // property has to be.
  for (const key of Object.getOwnPropertyNames(element)) {
    if (
      key.startsWith('__reactFiber$') ||
      key.startsWith('__reactInternalInstance$')
    ) {
      const value = (element as unknown as Record<string, unknown>)[key];
      if (value && typeof value === 'object') return value as FiberLike;
    }
  }
  return null;
}
