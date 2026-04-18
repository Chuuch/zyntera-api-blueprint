# create-zyntera-app

Scaffolds the [Zyntera API blueprint](https://github.com/Chuuch/zyntera-api-blueprint) (or another repo via `--template` / `ZYNTERA_TEMPLATE`): project name, `.env` generation, optional `npm install`.

## Usage

```bash
npm create zyntera-app@latest
npm create zyntera-app@latest my-api
```

## Publish to npm

From this directory:

```bash
npm login
npm publish --access public
```

Ensure the package name `create-zyntera-app` is available on the npm scope you use.

With **npm 10+**, the `bin` path must look like `bin/cli.js` (no `./` prefix). Otherwise `npm publish` may warn that the bin entry was “corrected” or removed ([npm/cli#7302](https://github.com/npm/cli/issues/7302)).

## Develop locally

**Install dependencies once** in this folder (`degit` and `prompts` are required — without `node_modules`, `node bin/cli.js` will fail):

```bash
npm install
node bin/cli.js ./test-output
```

Or link globally:

```bash
npm link
create-zyntera-app my-api
```

## Environment

- Default template: `Chuuch/zyntera-api-blueprint` (override with `ZYNTERA_TEMPLATE` or `--template owner/repo`).
- **Branch:** For GitHub `owner/repo` without `#branch`, the CLI tries: **GitHub API** `default_branch`, then **`git ls-remote`** (works if REST API is blocked), then `main` / `master`. If **degit** still fails, it runs **`git clone --depth 1`** when `git` is installed.
- **`.degitignore`:** After any successful clone, the CLI applies the template’s `.degitignore` (same paths [degit](https://github.com/Rich-Harris/degit) would drop), so the **git** fallback does not leave `create-zyntera-app/` or other scaffold-only paths in the new project.
- **Private repos / rate limits:** optional `GITHUB_TOKEN` (Bearer) is sent to `api.github.com` if set.
