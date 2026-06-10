## 0.2.0 (2026-06-10)

### 🚀 Features

- **cli:** make the manifest the single per-draft config ([e91ad6b](https://github.com/AgentEnder/design-drafts/commit/e91ad6b))
- rework skills + toolbar ([4396a05](https://github.com/AgentEnder/design-drafts/commit/4396a05))
- **cli:** add preview command to serve drafts locally ([f36a5b7](https://github.com/AgentEnder/design-drafts/commit/f36a5b7))
- **cli:** ship toolbar + annotate overlays in the draft scaffold ([19750bd](https://github.com/AgentEnder/design-drafts/commit/19750bd))
- **cli:** add `ref add` subcommand for inline reference capture ([ecfa159](https://github.com/AgentEnder/design-drafts/commit/ecfa159))
- **repo:** setup publishing ([3e75f1f](https://github.com/AgentEnder/design-drafts/commit/3e75f1f))
- **cli:** tmpdir-default, interactive init host with auth-aware remotes ([f0a0576](https://github.com/AgentEnder/design-drafts/commit/f0a0576))
- **cli:** report created vs skipped files in init draft ([9b40f57](https://github.com/AgentEnder/design-drafts/commit/9b40f57))
- **cli:** add init host/draft command group ([#20](https://github.com/AgentEnder/design-drafts/pull/20))
- **cli:** encode draft metadata in push commit message ([#24](https://github.com/AgentEnder/design-drafts/pull/24), [#26](https://github.com/AgentEnder/design-drafts/issues/26))
- **cli:** bind options to env vars via cli-forge .env() ([9760f37](https://github.com/AgentEnder/design-drafts/commit/9760f37))
- **cli:** add configurable branch prefix (closes #23 cli portion) ([#23](https://github.com/AgentEnder/design-drafts/issues/23))
- **cli:** validate and sanitize site-name before git operations ([9ab593f](https://github.com/AgentEnder/design-drafts/commit/9ab593f))

### 🩹 Fixes

- **cli:** scaffold a schema-valid draft manifest in init draft ([1bd65a7](https://github.com/AgentEnder/design-drafts/commit/1bd65a7))
- **cli:** clean error handling instead of raw stack traces ([e9cfc96](https://github.com/AgentEnder/design-drafts/commit/e9cfc96))
- **cli:** persist repo to global config only after a successful push ([52d6d38](https://github.com/AgentEnder/design-drafts/commit/52d6d38))
- **cli:** harden init inputs and fix first-deploy + UX rough edges ([648f0ee](https://github.com/AgentEnder/design-drafts/commit/648f0ee))
- **cli:** copy workflow into dir before push so it triggers ([31e18d1](https://github.com/AgentEnder/design-drafts/commit/31e18d1))
- **cli:** make bin.js executable so the global link runs ([58f95ea](https://github.com/AgentEnder/design-drafts/commit/58f95ea))

### ❤️ Thank You

- Craigory Coppola @AgentEnder