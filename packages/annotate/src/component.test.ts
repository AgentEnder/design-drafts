// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { readComponentInfo, readReactComponents } from './component.js';

/** Hand-build the fiber chain React would hang off a DOM node. The shapes
 * here are copied from what real React trees produced when probed in Chrome.
 *
 * `mode` decides whether the fibers carry React's `_debug*` bookkeeping,
 * which is the difference between a development and a production build and
 * is what the reader keys off. A development fiber owns `_debugOwner` even
 * when its value is null, so these are defined rather than merely assigned. */
function attachFiber(
  element: Element,
  chain: Array<{ type: unknown; source?: { fileName: string; lineNumber: number } }>,
  mode: 'dev' | 'prod' = 'dev'
): void {
  let next: unknown;
  for (let i = chain.length - 1; i >= 0; i--) {
    const fiber: Record<string, unknown> = { type: chain[i]!.type, return: next };
    if (mode === 'dev') {
      fiber['_debugOwner'] = null;
      fiber['_debugSource'] = chain[i]!.source ?? null;
      fiber['_debugHookTypes'] = null;
    }
    next = fiber;
  }
  // Plain assignment, which is how React attaches it — and therefore
  // enumerable, which is what the lookup has to cope with.
  (element as unknown as Record<string, unknown>)['__reactFiber$k3n9x'] = next;
}

function named(name: string): () => null {
  return { [name]: () => null }[name] as () => null;
}

beforeEach(() => {
  document.body.innerHTML = '<p id="target">copy</p>';
});

function target(): Element {
  return document.getElementById('target')!;
}

describe('readReactComponents', () => {
  it('returns null when the page is not React', () => {
    expect(readReactComponents(target())).toBeNull();
  });

  it('reads the component chain, outermost first', () => {
    attachFiber(target(), [
      { type: 'p' },
      { type: named('PricingCopy') },
      { type: 'div' },
      { type: named('PricingCard') },
      { type: named('PricingSection') },
    ]);

    expect(readReactComponents(target())?.trail).toBe(
      'PricingSection › PricingCard › PricingCopy'
    );
  });

  it('rejects the minified names a production build actually produces', () => {
    // Verbatim from react.dev's production bundle, walking up from a <p>.
    attachFiber(
      target(),
      ['eu', 'tR', 'd', 'r', 'p', 'z', '$', 'es'].map((n) => ({ type: named(n) })),
      'prod'
    );

    expect(readReactComponents(target())).toBeNull();
  });

  it('keeps an authored name that survived a production build', () => {
    attachFiber(
      target(),
      [{ type: named('a') }, { type: named('PricingCard') }, { type: named('r') }],
      'prod'
    );

    expect(readReactComponents(target())?.trail).toBe('PricingCard');
  });

  it('prefers displayName when a wrapper sets one', () => {
    const wrapped = Object.assign(named('x'), { displayName: 'ConnectedCard' });
    attachFiber(target(), [{ type: 'p' }, { type: wrapped }]);

    expect(readReactComponents(target())?.trail).toBe('ConnectedCard');
  });

  it('collapses a name repeated by higher-order components', () => {
    attachFiber(target(), [
      { type: named('Card') },
      { type: named('Card') },
      { type: named('Page') },
    ]);

    expect(readReactComponents(target())?.trail).toBe('Page › Card');
  });

  it('picks up a dev-build source location when React recorded one', () => {
    attachFiber(target(), [
      { type: 'p', source: { fileName: 'src/Pricing.tsx', lineNumber: 42 } },
      { type: named('PricingCopy') },
    ]);

    expect(readReactComponents(target())?.source).toBe('src/Pricing.tsx:42');
  });

  it('reports no source when React did not record one', () => {
    attachFiber(target(), [{ type: 'p' }, { type: named('PricingCopy') }]);

    expect(readReactComponents(target())?.source).toBeNull();
  });

  it('keeps only the components nearest the element', () => {
    attachFiber(
      target(),
      ['Lvl1', 'Lvl2', 'Lvl3', 'Lvl4', 'Lvl5', 'Lvl6', 'Lvl7'].map((n) => ({
        type: named(n),
      }))
    );

    // Nearest five, still rendered outermost-first.
    expect(readReactComponents(target())?.trail).toBe(
      'Lvl5 › Lvl4 › Lvl3 › Lvl2 › Lvl1'
    );
  });

  it('survives a fiber chain that loops back on itself', () => {
    const loop: Record<string, unknown> = { type: named('Card') };
    loop.return = loop;
    (target() as unknown as Record<string, unknown>)['__reactFiber$k3n9x'] =
      loop;

    expect(readReactComponents(target())?.trail).toBe('Card');
  });
});

describe('trusting the build React reports', () => {
  it('takes a name a minifier would never produce, in development', () => {
    // `Hd` fails the fallback heuristic on length. In a development build
    // React vouches for the name, so there is nothing to second-guess.
    attachFiber(target(), [{ type: 'p' }, { type: named('Hd') }], 'dev');

    expect(readReactComponents(target())?.trail).toBe('Hd');
  });

  it('rejects that same name when the build is not development', () => {
    attachFiber(target(), [{ type: 'p' }, { type: named('Hd') }], 'prod');

    expect(readReactComponents(target())).toBeNull();
  });

  it('reads development from any _debug field, not one named field', () => {
    // React 19 dropped _debugSource while keeping _debugOwner, so keying off
    // a single field would misread a whole major version as production.
    const fiber: Record<string, unknown> = {
      type: named('Hd'),
      _debugOwner: null,
    };
    (target() as unknown as Record<string, unknown>)['__reactFiber$k3n9x'] =
      fiber;

    expect(readReactComponents(target())?.trail).toBe('Hd');
  });

  it('treats a null _debugOwner as development, since the property is there', () => {
    // The root fiber's owner is legitimately null; presence is the signal,
    // not truthiness.
    const fiber: Record<string, unknown> = {
      type: named('Nav'),
      _debugOwner: null,
      _debugSource: null,
    };
    (target() as unknown as Record<string, unknown>)['__reactFiber$k3n9x'] =
      fiber;

    expect(readReactComponents(target())?.trail).toBe('Nav');
  });

  it('falls back to the heuristic when React drops every _debug field', () => {
    // A hypothetical future React with no debug bookkeeping reads as
    // production here — the safe way to be wrong.
    attachFiber(
      target(),
      [{ type: named('PricingCard') }, { type: named('eu') }],
      'prod'
    );

    expect(readReactComponents(target())?.trail).toBe('PricingCard');
  });
});

describe('other frameworks', () => {
  it('reads Vue 3 component names and the .vue file', () => {
    // Shape verified against Vue 3.5.41: the instance hangs off the element,
    // the SFC compiler stamps __file in development.
    const copy = { type: { name: 'PricingCopy', __file: 'src/PricingCopy.vue' } };
    const card = { type: { name: 'PricingCard', __file: 'src/PricingCard.vue' } };
    (copy as Record<string, unknown>).parent = card;
    (target() as unknown as Record<string, unknown>).__vueParentComponent = copy;

    const info = readComponentInfo(target())!;

    expect(info.framework).toBe('vue');
    expect(info.trail).toBe('PricingCard › PricingCopy');
    expect(info.source).toBe('src/PricingCopy.vue');
  });

  it('filters Vue names when there is no __file to vouch for the build', () => {
    const inst = { type: { name: 'a' } };
    (target() as unknown as Record<string, unknown>).__vueParentComponent = inst;

    expect(readComponentInfo(target())).toBeNull();
  });

  it('finds the Vue instance on an ancestor when the element has none', () => {
    document.body.innerHTML = '<div id="host"><p id="target">copy</p></div>';
    const inst = { type: { name: 'PricingCard', __file: 'src/Card.vue' } };
    (document.getElementById('host') as unknown as Record<string, unknown>)
      .__vueParentComponent = inst;

    expect(readComponentInfo(target())?.trail).toBe('PricingCard');
  });

  it('reads a Svelte dev build’s source location and derives a name', () => {
    (target() as unknown as Record<string, unknown>).__svelte_meta = {
      loc: { file: 'src/lib/Pricing.svelte', line: 12, column: 2 },
    };

    const info = readComponentInfo(target())!;

    expect(info.framework).toBe('svelte');
    expect(info.trail).toBe('Pricing');
    expect(info.source).toBe('src/lib/Pricing.svelte:12');
  });

  it('falls back to custom element tags, which survive minification', () => {
    // Verbatim shape from angular.dev, a production build: no readable names
    // through window.ng or __ngContext__, but the tags say plenty.
    document.body.innerHTML =
      '<adev-root><docs-cookie-popup><p id="target">copy</p>' +
      '</docs-cookie-popup></adev-root>';

    const info = readComponentInfo(target())!;

    expect(info.framework).toBe('custom-element');
    expect(info.trail).toBe('adev-root › docs-cookie-popup');
  });

  it('says nothing on a plain page with no framework markers', () => {
    document.body.innerHTML = '<main><p id="target">copy</p></main>';

    expect(readComponentInfo(target())).toBeNull();
  });

  it('prefers a real framework marker over the tag-name fallback', () => {
    document.body.innerHTML = '<my-widget><p id="target">copy</p></my-widget>';
    attachFiber(target(), [{ type: 'p' }, { type: named('PricingCopy') }], 'dev');

    expect(readComponentInfo(target())?.framework).toBe('react');
  });
});
