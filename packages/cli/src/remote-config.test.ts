import { describe, expect, it, vi, afterEach } from 'vitest';

import { CONFIG_FILENAME } from './config';
import {
  fetchRemoteConfig,
  parseRemoteConfig,
  remoteConfigUrl,
} from './remote-config';

describe('parseRemoteConfig', () => {
  it('reads the drafts sub-path the host publishes under', () => {
    expect(parseRemoteConfig('{"draftsPath": "d"}')).toEqual({ draftsPath: 'd' });
  });

  // Hand-written, so it arrives written every plausible way.
  it('strips the slashes a hand-written path arrives with', () => {
    expect(parseRemoteConfig('{"draftsPath": "/d/"}')).toEqual({ draftsPath: 'd' });
    expect(parseRemoteConfig('{"draftsPath": "previews/d"}')).toEqual({
      draftsPath: 'previews/d',
    });
  });

  it('reads an absent or empty path as "drafts sit at the site root"', () => {
    expect(parseRemoteConfig('{}')).toEqual({ draftsPath: '' });
    expect(parseRemoteConfig('{"draftsPath": ""}')).toEqual({ draftsPath: '' });
    expect(parseRemoteConfig('{"draftsPath": "/"}')).toEqual({ draftsPath: '' });
  });

  // This filename is the draft manifest in a draft directory, so a host repo
  // whose root is itself a draft serves a manifest at this URL. That host has
  // declared nothing, which is not the same as being misconfigured.
  it('ignores the rest of a file that is a draft manifest', () => {
    const manifest = JSON.stringify({
      name: 'Some draft',
      pages: [{ path: 'index.html' }],
      createdAt: '2026-08-27T00:00:00.000Z',
    });

    expect(parseRemoteConfig(manifest)).toEqual({ draftsPath: '' });
  });

  it('rejects a file it cannot read as a config', () => {
    expect(() => parseRemoteConfig('not json')).toThrow();
    expect(() => parseRemoteConfig('[]')).toThrow(/object/);
    expect(() => parseRemoteConfig('{"draftsPath": 3}')).toThrow(/string/);
  });

  it('rejects a path that would climb out of the site', () => {
    expect(() => parseRemoteConfig('{"draftsPath": "../elsewhere"}')).toThrow(/\.\./);
  });
});

describe('remoteConfigUrl', () => {
  it('points at the config on the host repo default branch', () => {
    expect(remoteConfigUrl('acme/previews')).toBe(
      `https://raw.githubusercontent.com/acme/previews/main/${CONFIG_FILENAME}`
    );
  });
});

describe('fetchRemoteConfig', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Stands in for the network. */
  function respond(init: { ok: boolean; status?: number; body?: string }): void {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: init.ok,
        status: init.status ?? (init.ok ? 200 : 404),
        text: async () => init.body ?? '',
      }))
    );
  }

  it('reads the layout the host declares', async () => {
    respond({ ok: true, body: '{"draftsPath": "d"}' });

    expect(await fetchRemoteConfig('acme/previews')).toEqual({ draftsPath: 'd' });
  });

  // The overwhelmingly common case: no file, because most hosts publish drafts
  // to the site root. It must not warn about a file nobody has to have.
  it('falls back silently when the host declares nothing', async () => {
    respond({ ok: false, status: 404 });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(await fetchRemoteConfig('acme/previews')).toEqual({ draftsPath: '' });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns and falls back when the file is there but unreadable', async () => {
    respond({ ok: true, body: '{"draftsPath": 3}' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(await fetchRemoteConfig('acme/previews')).toEqual({ draftsPath: '' });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('falls back when the network is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('getaddrinfo ENOTFOUND');
      })
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(await fetchRemoteConfig('acme/previews')).toEqual({ draftsPath: '' });
    warn.mockRestore();
  });
});

describe('resolveDraftsPath', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('./config');
    vi.resetModules();
  });

  /**
   * Loads a fresh copy of the resolver with both places it checks stubbed:
   * `remote` is what the host repo serves (null = no file), `home` is what the
   * home config would supply. The module has to be re-imported after the mock,
   * hence the reset — importing it directly at the top of the file would bind
   * the real `readHomeConfigValue` and quietly read the developer's own config.
   */
  async function resolverWith(options: {
    remote: string | null;
    home?: string;
  }): Promise<(repo: string) => Promise<string>> {
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        options.remote === null
          ? { ok: false, status: 404, text: async () => '' }
          : { ok: true, status: 200, text: async () => options.remote }
      )
    );
    vi.doMock('./config', async () => ({
      ...(await vi.importActual<typeof import('./config')>('./config')),
      readHomeConfigValue: () => options.home,
    }));
    return (await import('./remote-config')).resolveDraftsPath;
  }

  it('takes the host repo over the home config', async () => {
    const resolve = await resolverWith({
      remote: '{"draftsPath": "d"}',
      home: 'elsewhere',
    });

    expect(await resolve('acme/previews')).toBe('d');
  });

  it('falls back to the home config for a host that declares nothing', async () => {
    const resolve = await resolverWith({ remote: null, home: 'd' });

    expect(await resolve('acme/previews')).toBe('d');
  });

  it('reads no declaration anywhere as the site root', async () => {
    const resolve = await resolverWith({ remote: null });

    expect(await resolve('acme/previews')).toBe('');
  });
});
