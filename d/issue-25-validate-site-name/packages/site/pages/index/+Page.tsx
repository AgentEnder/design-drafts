import { useData } from 'vike-react/useData';
import type { IndexData } from './+data.js';

const base = import.meta.env.BASE_URL;

function hrefFor(name: string): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${name}/`;
}

export default function Page() {
  const { branches } = useData<IndexData>();

  if (branches.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm px-8 py-20 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-800/60 flex items-center justify-center">
          <svg className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-200">No previews yet</h2>
        <p className="mt-2 text-sm text-gray-500">
          Push a site preview with the{' '}
          <code className="px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-300 text-xs font-mono">
            design-drafts
          </code>{' '}
          CLI to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Site Previews</h2>
          <p className="mt-1 text-sm text-gray-500">
            {branches.length} active {branches.length === 1 ? 'branch' : 'branches'}
          </p>
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {branches.map((branch) => (
          <li key={branch.name}>
            <a
              href={hrefFor(branch.name)}
              className="group relative block overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-blue-500/30 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-purple-500/0 opacity-0 transition-opacity group-hover:opacity-100 group-hover:from-blue-500/5 group-hover:to-purple-500/5" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    <span className="text-xs font-mono uppercase tracking-wider text-gray-500">
                      branch
                    </span>
                  </div>
                  <h3 className="mt-2 truncate font-medium text-gray-100 group-hover:text-white">
                    {branch.name}
                  </h3>
                </div>
                <svg
                  className="h-4 w-4 flex-shrink-0 text-gray-600 transition-all group-hover:translate-x-0.5 group-hover:text-blue-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
