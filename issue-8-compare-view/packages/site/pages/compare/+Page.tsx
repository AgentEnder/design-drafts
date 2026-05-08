import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from 'vike-react/useData';
import type { CompareData } from './+data.js';
import type { BranchEntry } from '../+onCreateGlobalContext.server.js';

// Query-param shape: `?a=<draft>&b=<draft>&c=<draft>` (c optional).
// Picked over `?drafts=a,b,c` because individual keys are easier to edit by
// hand in the URL bar, easier to wire up to future toolbar selectors, and
// match the wording in issue #8.
//
// NOTE: Synchronized scroll only works because the drafts are served from the
// same origin as this site (both live on the gh-pages deployment). Cross-origin
// iframes would block the `scroll` listener on `contentWindow`.
//
// FOLLOW-UP (depends on #15): once the toolbar package lands, add linked
// toolbar selectors so flipping one iframe to e.g. "dark theme" flips the
// others. Intentionally deferred from this PR.

const base = import.meta.env.BASE_URL;

const SLOTS = ['a', 'b', 'c'] as const;
type Slot = (typeof SLOTS)[number];

function hrefFor(name: string): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${name}/`;
}

type SlotState = {
  slot: Slot;
  name: string | null; // null = empty slot
  branch: BranchEntry | null; // null = name not found in branches
};

export default function Page() {
  const { branches } = useData<CompareData>();
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [syncScroll, setSyncScroll] = useState(true);
  const [ready, setReady] = useState(false);

  // Read query params on mount (querystring isn't available at prerender).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const branchByName = new Map(branches.map((b) => [b.name, b]));
    const next: SlotState[] = [];
    for (const slot of SLOTS) {
      const raw = params.get(slot);
      if (!raw) {
        // Skip optional `c` if absent; keep `a` and `b` as visible empty slots.
        if (slot === 'c') continue;
        next.push({ slot, name: null, branch: null });
        continue;
      }
      next.push({
        slot,
        name: raw,
        branch: branchByName.get(raw) ?? null,
      });
    }
    setSlots(next);
    setReady(true);
  }, [branches]);

  const hasAny = useMemo(
    () => slots.some((s) => s.name !== null),
    [slots]
  );

  const iframeRefs = useRef<Map<Slot, HTMLIFrameElement | null>>(new Map());
  const setIframeRef =
    (slot: Slot) =>
    (el: HTMLIFrameElement | null): void => {
      iframeRefs.current.set(slot, el);
    };

  // Synchronized scroll: when one iframe scrolls, mirror that scroll position
  // to the others. A `syncing` flag prevents the propagated scroll from
  // re-emitting and creating a feedback loop.
  useEffect(() => {
    if (!syncScroll) return;
    if (slots.length < 2) return;

    const cleanups: Array<() => void> = [];
    let syncing = false;

    const attach = (slot: Slot, iframe: HTMLIFrameElement) => {
      const onLoad = () => {
        const win = iframe.contentWindow;
        if (!win) return;

        const onScroll = () => {
          if (syncing) return;
          const sourceWin = iframe.contentWindow;
          if (!sourceWin) return;
          syncing = true;
          try {
            for (const other of slots) {
              if (other.slot === slot) continue;
              const otherEl = iframeRefs.current.get(other.slot);
              const otherWin = otherEl?.contentWindow;
              if (!otherWin) continue;
              try {
                otherWin.scrollTo(sourceWin.scrollX, sourceWin.scrollY);
              } catch {
                // Cross-origin or detached frame; ignore.
              }
            }
          } finally {
            // Release on next tick so the propagated scrolls (which fire
            // their own scroll events) all see `syncing === true`.
            setTimeout(() => {
              syncing = false;
            }, 0);
          }
        };

        try {
          win.addEventListener('scroll', onScroll, { passive: true });
          cleanups.push(() => {
            try {
              win.removeEventListener('scroll', onScroll);
            } catch {
              // frame may already be gone
            }
          });
        } catch {
          // Cross-origin: can't attach. Documented limitation.
        }
      };

      iframe.addEventListener('load', onLoad);
      cleanups.push(() => iframe.removeEventListener('load', onLoad));

      // If the iframe is already loaded by the time this effect runs, wire up now.
      if (iframe.contentDocument?.readyState === 'complete') {
        onLoad();
      }
    };

    for (const s of slots) {
      if (!s.branch) continue;
      const el = iframeRefs.current.get(s.slot);
      if (el) attach(s.slot, el);
    }

    return () => {
      for (const fn of cleanups) fn();
    };
  }, [syncScroll, slots]);

  if (!ready) {
    // Render nothing meaningful during SSR/prerender — content is querystring-driven.
    return <CompareShell branches={branches} />;
  }

  if (!hasAny) {
    return <EmptyState branches={branches} />;
  }

  const cols = slots.length;
  // Tailwind needs static class names; pick from a small set.
  const gridCols =
    cols >= 3
      ? 'md:grid-cols-3'
      : cols === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-1';

  return (
    <div className="-mx-6 md:mx-0">
      <Header
        slots={slots}
        syncScroll={syncScroll}
        onToggleSync={() => setSyncScroll((v) => !v)}
      />
      <div
        className={`grid grid-cols-1 ${gridCols} gap-3 px-3 md:px-0`}
      >
        {slots.map((s) => (
          <Pane key={s.slot} state={s} setRef={setIframeRef(s.slot)} />
        ))}
      </div>
    </div>
  );
}

function CompareShell({ branches }: { branches: BranchEntry[] }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm px-8 py-20 text-center">
      <h2 className="text-xl font-semibold text-gray-200">Compare drafts</h2>
      <p className="mt-2 text-sm text-gray-500">
        Loading… ({branches.length} draft{branches.length === 1 ? '' : 's'} available)
      </p>
    </div>
  );
}

function EmptyState({ branches }: { branches: BranchEntry[] }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm px-8 py-20 text-center">
      <h2 className="text-xl font-semibold text-gray-200">Nothing to compare</h2>
      <p className="mt-2 text-sm text-gray-500">
        Open from the index, or pass{' '}
        <code className="px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-300 text-xs font-mono">
          ?a=…&amp;b=…
        </code>{' '}
        in the URL.
      </p>
      {branches.length > 0 && (
        <p className="mt-4 text-xs text-gray-600">
          Available drafts:{' '}
          {branches.map((b, i) => (
            <span key={b.name}>
              <code className="px-1 py-0.5 rounded bg-gray-800/60 text-gray-400 text-xs font-mono">
                {b.name}
              </code>
              {i < branches.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function Header({
  slots,
  syncScroll,
  onToggleSync,
}: {
  slots: SlotState[];
  syncScroll: boolean;
  onToggleSync: () => void;
}) {
  const labels = slots
    .map((s) => (s.name ? s.name : '(empty)'))
    .join(' vs ');

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-3 md:px-0">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold tracking-tight text-gray-100">
          Compare
        </h2>
        <p className="mt-0.5 truncate text-xs text-gray-500">{labels}</p>
      </div>
      <button
        type="button"
        onClick={onToggleSync}
        aria-pressed={syncScroll}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          syncScroll
            ? 'border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15'
            : 'border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            syncScroll ? 'bg-blue-400 shadow-sm shadow-blue-400/50' : 'bg-gray-600'
          }`}
        />
        Sync scroll: {syncScroll ? 'on' : 'off'}
      </button>
    </div>
  );
}

function Pane({
  state,
  setRef,
}: {
  state: SlotState;
  setRef: (el: HTMLIFrameElement | null) => void;
}) {
  const { slot, name, branch } = state;

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[480px] flex-col overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 bg-black/20 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded bg-gray-800/80 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-gray-400">
            {slot}
          </span>
          <span className="truncate text-xs font-medium text-gray-200">
            {name ?? '(empty)'}
          </span>
        </div>
        {branch && (
          <a
            href={hrefFor(branch.name)}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-gray-500 hover:text-blue-400"
          >
            open ↗
          </a>
        )}
      </div>
      <div className="relative flex-1 bg-gray-950">
        {branch ? (
          <iframe
            ref={setRef}
            src={hrefFor(branch.name)}
            title={`Draft: ${branch.name}`}
            className="h-full w-full border-0 bg-white"
          />
        ) : (
          <NotFound name={name} />
        )}
      </div>
    </div>
  );
}

function NotFound({ name }: { name: string | null }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 h-10 w-10 rounded-full bg-gray-800/60 flex items-center justify-center">
        <svg
          className="h-5 w-5 text-gray-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-300">
        {name ? <>Draft <code className="font-mono text-gray-200">{name}</code> not found</> : 'Empty slot'}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {name
          ? 'No deployed draft matches this name.'
          : 'Add a draft name to the URL to fill this slot.'}
      </p>
    </div>
  );
}
