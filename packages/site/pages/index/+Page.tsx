import { useData } from 'vike-react/useData';
import type { IndexData } from './+data.js';

export default function Page() {
  const { branches } = useData<IndexData>();

  if (branches.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold text-gray-400">
          No previews yet
        </h2>
        <p className="mt-3 text-gray-500">
          Push a site preview with the <code className="text-gray-300">design-drafts</code> CLI to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Site Previews</h2>
      <ul className="space-y-3">
        {branches.map((branch) => (
          <li key={branch.name}>
            <a
              href={branch.path}
              className="block px-4 py-3 rounded-lg border border-gray-800 hover:border-gray-600 hover:bg-gray-900 transition-colors"
            >
              <span className="text-blue-400 font-medium">{branch.name}</span>
              <span className="text-gray-500 text-sm ml-2">{branch.path}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
