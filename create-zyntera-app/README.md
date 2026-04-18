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

## Develop locally

**Install dependencies once** in this folder (`degit` and `prompts` are required — without `node_modules`, `node index.mjs` will fail):

```bash
npm install
node index.mjs ./test-output
```

Or link globally:

```bash
npm link
create-zyntera-app my-api
```

## Environment

- Default template: `Chuuch/zyntera-api-blueprint` (override with `ZYNTERA_TEMPLATE` or `--template owner/repo`).
