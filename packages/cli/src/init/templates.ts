// Files generated (not checked out) into a host repo. The deploy workflow is a
// non-nx rewrite of the canonical monorepo workflow: it builds the index with
// plain `pnpm build`, keeps the gh-pages branch as the durable preview store,
// and serves via actions/deploy-pages (Pages source = "GitHub Actions").

export const DRAFT_BRANCH_PREFIX = 'drafts/';

// Marker embedded in the generated workflow so `init host` can detect an
// already-scaffolded repo and stay idempotent.
export const HOST_MARKER = '# design-drafts: host deploy workflow';

export const DEPLOY_WORKFLOW = `${HOST_MARKER}
name: Deploy Preview

on:
  push:
    branches:
      - 'drafts/**'
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main]
  delete:
  workflow_dispatch:
    inputs:
      branch:
        description: 'Branch to deploy a preview for'
        required: true
        type: string

# The gh-pages branch is the durable store of every preview (NOT the Pages
# source — Pages serves the artifact uploaded below). Each run reconstructs the
# full site from gh-pages, swaps in the changed preview, and republishes.
concurrency:
  group: deploy-preview
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    if: |
      (github.event_name == 'push' && startsWith(github.ref_name, 'drafts/')) ||
      (github.event_name == 'pull_request' && startsWith(github.head_ref, 'drafts/')) ||
      (github.event_name == 'delete' && github.event.ref_type == 'branch' && startsWith(github.event.ref, 'drafts/')) ||
      github.event_name == 'workflow_dispatch'
    permissions:
      contents: write
    env:
      BRANCH_NAME: \${{ inputs.branch || github.head_ref || github.ref_name }}
      DRAFT_BRANCH_PREFIX: drafts/
    steps:
      - name: Checkout main
        uses: actions/checkout@v4
        with:
          ref: main

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Configure git identity
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Checkout gh-pages store to staging
        run: |
          if git fetch origin gh-pages:gh-pages 2>/dev/null; then
            git worktree add .gh-pages-staging gh-pages
          else
            echo "gh-pages store does not exist yet, starting fresh"
            git worktree add --orphan -b gh-pages .gh-pages-staging
          fi

      - name: Resolve preview directory name
        run: |
          if [ "\${{ github.event_name }}" = "delete" ]; then
            BRANCH_NAME="\${{ github.event.ref }}"
          fi
          # Strip the draft prefix so branch "drafts/my-site" maps to "/my-site/".
          PREVIEW_DIR="\${BRANCH_NAME#\${DRAFT_BRANCH_PREFIX}}"
          if [ -z "$PREVIEW_DIR" ] || [ "$PREVIEW_DIR" = "$BRANCH_NAME" ]; then
            PREVIEW_DIR="$BRANCH_NAME"
          fi
          echo "PREVIEW_DIR=$PREVIEW_DIR" >> "$GITHUB_ENV"

      - name: Stage branch content
        if: github.event_name != 'delete'
        run: |
          git clone --depth 1 --branch "$BRANCH_NAME" \\
            "https://x-access-token:\${{ secrets.GITHUB_TOKEN }}@github.com/\${{ github.repository }}.git" \\
            /tmp/branch-content
          rm -rf /tmp/branch-content/.git
          # The CLI embeds this workflow on the draft branch so the push event
          # can resolve it. Strip it back out so it never ships into the preview.
          rm -rf /tmp/branch-content/.github
          rm -rf ".gh-pages-staging/\${PREVIEW_DIR}"
          mkdir -p ".gh-pages-staging/\${PREVIEW_DIR}"
          cp -a /tmp/branch-content/. ".gh-pages-staging/\${PREVIEW_DIR}/"

      - name: Remove deleted branch's directory
        if: github.event_name == 'delete'
        run: rm -rf ".gh-pages-staging/\${PREVIEW_DIR}"

      - name: Build index site
        run: pnpm build
        env:
          PAGES_DIR: \${{ github.workspace }}/.gh-pages-staging
          DESIGN_DRAFTS_PREFIX: drafts/
          DESIGN_DRAFTS_REPO: \${{ github.repository }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Copy index site into staging
        run: |
          cp -r dist/client/* .gh-pages-staging/ 2>/dev/null || true
          touch .gh-pages-staging/.nojekyll

      - name: Persist preview store to gh-pages
        run: |
          cd .gh-pages-staging
          git add -A
          git commit -m "deploy: \${PREVIEW_DIR}" || echo "no changes to persist"
          git push origin HEAD:gh-pages

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .gh-pages-staging

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

export const NOJEKYLL = '';

export const GITIGNORE = `node_modules
dist
.gh-pages-staging
`;

/**
 * The starter manifest written by \`init draft\`. The push command reads the
 * \`prompt\` field for the commit trailer.
 */
export function draftConfig(siteName: string): string {
  return (
    JSON.stringify(
      {
        siteName,
        prompt: '',
      },
      null,
      2
    ) + '\n'
  );
}

export const DRAFT_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Draft preview</title>
  </head>
  <body>
    <main>
      <h1>Draft preview</h1>
      <p>Replace this with your design draft, then run <code>design-drafts</code> to publish.</p>
    </main>
  </body>
</html>
`;
