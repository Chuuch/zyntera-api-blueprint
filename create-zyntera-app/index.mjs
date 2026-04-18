#!/usr/bin/env node
/**
 * create-zyntera-app — degit-based scaffold + .env + optional npm install.
 * Usage: npm create zyntera-app@latest [project-name]
 */
import { execSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * Node 25 + some IDEs set NODE_OPTIONS with `--localstorage-file` but no path,
 * which prints: Warning: `--localstorage-file` was provided without a valid path
 * Re-exec once with that flag removed (keep `--localstorage-file=/valid/path`).
 */
(function reexecIfBrokenLocalstorageInNodeOptions() {
  const raw = process.env.NODE_OPTIONS;
  if (!raw?.includes('localstorage-file')) return;

  const prefix = '--localstorage-file';
  const tokens = raw.split(/\s+/).filter(Boolean);
  const kept = [];
  for (const t of tokens) {
    if (t === prefix) continue;
    if (t.startsWith(`${prefix}=`)) {
      const v = t.slice(prefix.length + 1);
      if (v.length > 0) kept.push(t);
      continue;
    }
    kept.push(t);
  }
  const next = kept.join(' ').trim();
  if (next === raw.trim()) return;

  const env = { ...process.env };
  if (next) env.NODE_OPTIONS = next;
  else delete env.NODE_OPTIONS;

  const r = spawnSync(process.execPath, [...process.execArgv, ...process.argv.slice(1)], {
    stdio: 'inherit',
    env,
  });
  const code = r.status ?? (r.signal ? 1 : 0);
  process.exit(code);
})();

const DEFAULT_TEMPLATE = 'Chuuch/zyntera-api-blueprint';

/** Banner icon (emoji). Override: `ZYNTERA_CLI_ICON="🚀" node index.mjs` or `ZYNTERA_CLI_ICON=` for none */
const CLI_ICON = process.env.ZYNTERA_CLI_ICON ?? '⚡';

/**
 * degit often fails with "could not find commit hash for HEAD" when no ref is set
 * (GitHub API / default branch resolution). Pin a branch: github:user/repo#main
 */
function toDegitSource(templateRepo) {
  const ref = process.env.ZYNTERA_REF ?? 'main';
  const t = templateRepo.trim();

  if (t.includes('#')) {
    return t.includes(':') ? t : `github:${t}`;
  }
  if (!t.includes(':')) {
    return `github:${t}#${ref}`;
  }
  if (/^github:/i.test(t)) {
    return `${t}#${ref}`;
  }
  return t;
}

function toPackageName(input) {
  const s = String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_.]/g, '');
  return s || 'my-zyntera-api';
}

function buildDatabaseUrl({ user, password, host, port, database }) {
  const u = encodeURIComponent(user);
  const p = encodeURIComponent(password);
  return `mysql://${u}:${p}@${host}:${port}/${database}`;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let project = null;
  let template = process.env.ZYNTERA_TEMPLATE ?? DEFAULT_TEMPLATE;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--template' || a === '-t') {
      template = args[++i] ?? template;
      continue;
    }
    if (a.startsWith('-')) continue;
    if (!project) project = a;
  }
  return { project, template };
}

async function main() {
  let degit;
  let prompts;
  try {
    const d = await import('degit');
    const p = await import('prompts');
    degit = d.default;
    prompts = p.default;
  } catch (e) {
    if (e?.code === 'ERR_MODULE_NOT_FOUND') {
      console.error(
        '\x1b[31mMissing dependencies.\x1b[0m Run \x1b[1mnpm install\x1b[0m in the create-zyntera-app directory first.',
      );
      process.exit(1);
    }
    throw e;
  }

  const { project: argProject, template: templateRepo } = parseArgs(process.argv);
  const cwd = process.cwd();

  console.log('');
  const banner = [CLI_ICON, 'Zyntera API — create app'].filter(Boolean).join('  ');
  console.log('\x1b[36m%s\x1b[0m', banner);
  console.log('');

  let projectName = argProject;
  if (!projectName) {
    const r = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project directory name',
      initial: 'my-zyntera-api',
      validate: (v) => {
        const name = toPackageName(v);
        if (!name) return 'Enter a valid name';
        const target = path.join(cwd, name);
        if (fs.existsSync(target)) return `Folder already exists: ${name}`;
        return true;
      },
    });
    if (r.projectName === undefined) process.exit(0);
    projectName = toPackageName(r.projectName);
  } else {
    projectName = toPackageName(projectName);
  }

  const targetDir = path.resolve(cwd, projectName);
  if (fs.existsSync(targetDir)) {
    console.error(`\x1b[31mError:\x1b[0m directory already exists: ${targetDir}`);
    process.exit(1);
  }

  const src = toDegitSource(templateRepo);
  console.log(`\x1b[90mTemplate:\x1b[0m ${src}`);
  console.log(`\x1b[90mTarget:\x1b[0m  ${targetDir}\n`);

  const emitter = degit(src, { cache: true, force: true });
  emitter.on('info', (info) => {
    if (info.message) console.log(`\x1b[90m  ${info.message}\x1b[0m`);
  });

  try {
    await emitter.clone(targetDir);
  } catch (e) {
    console.error('\x1b[31mFailed to clone template.\x1b[0m', e.message ?? e);
    console.error(
      'Try: ZYNTERA_REF=main (default), or owner/repo#branch, or --template owner/repo#master. Ensure git is installed.',
    );
    process.exit(1);
  }

  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = projectName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  const authSecret = crypto.randomBytes(32).toString('hex');

  const portAnswer = await prompts(
    {
      type: 'number',
      name: 'PORT',
      message: 'HTTP port',
      initial: 3000,
    },
    { onCancel: () => process.exit(0) },
  );
  if (portAnswer.PORT === undefined) process.exit(0);

  const p = Number(portAnswer.PORT) || 3000;

  const envAnswers = await prompts(
    [
      {
        type: 'text',
        name: 'BETTER_AUTH_URL',
        message: 'Better Auth base URL (public API origin)',
        initial: `http://localhost:${p}`,
      },
      {
        type: 'text',
        name: 'DB_HOST',
        message: 'MySQL host',
        initial: 'localhost',
      },
      {
        type: 'number',
        name: 'DB_PORT',
        message: 'MySQL port',
        initial: 3306,
      },
      {
        type: 'text',
        name: 'DB_USER',
        message: 'MySQL user',
        initial: 'zyntera',
      },
      {
        type: 'password',
        name: 'DB_PASSWORD',
        message: 'MySQL password',
      },
      {
        type: 'text',
        name: 'DB_NAME',
        message: 'MySQL database name',
        initial: 'zyntera',
      },
      {
        type: 'password',
        name: 'DB_ROOT_PASSWORD',
        message: 'MySQL root password (for Docker Compose / local MySQL)',
      },
    ],
    { onCancel: () => process.exit(0) },
  );
  const dbPort = Number(envAnswers.DB_PORT) || 3306;
  const databaseUrl = buildDatabaseUrl({
    user: envAnswers.DB_USER ?? '',
    password: envAnswers.DB_PASSWORD ?? '',
    host: envAnswers.DB_HOST ?? 'localhost',
    port: dbPort,
    database: envAnswers.DB_NAME ?? '',
  });

  const envContent = `# Generated by create-zyntera-app
NODE_ENV=development
PORT=${p}
LOG_LEVEL=debug

BETTER_AUTH_SECRET=${authSecret}
BETTER_AUTH_URL=${envAnswers.BETTER_AUTH_URL ?? `http://localhost:${p}`}

DB_HOST=${envAnswers.DB_HOST ?? 'localhost'}
DB_PORT=${dbPort}
DB_USER=${envAnswers.DB_USER ?? ''}
DB_PASSWORD=${envAnswers.DB_PASSWORD ?? ''}
DB_NAME=${envAnswers.DB_NAME ?? ''}
DB_ROOT_PASSWORD=${envAnswers.DB_ROOT_PASSWORD ?? ''}

DATABASE_URL=${databaseUrl}
`;

  fs.writeFileSync(path.join(targetDir, '.env'), envContent, 'utf8');

  const { runInstall } = await prompts(
    {
      type: 'confirm',
      name: 'runInstall',
      message: 'Run npm install now?',
      initial: true,
    },
    { onCancel: () => process.exit(0) },
  );

  if (runInstall) {
    console.log('\n\x1b[90mRunning npm install…\x1b[0m\n');
    try {
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
    } catch {
      process.exit(1);
    }
  }

  console.log('');
  console.log('\x1b[32mDone.\x1b[0m Next steps:\n');
  console.log(`  \x1b[1mcd\x1b[0m ${path.relative(cwd, targetDir) || '.'}`);
  if (!runInstall) console.log('  npm install');
  console.log('  Ensure MySQL is running, then:');
  console.log('  npm run db:generate   # if drizzle/ migrations are missing');
  console.log('  npm run db:migrate');
  console.log('  npm run dev');
  console.log('');
  console.log(`  Health: \x1b[90mcurl http://localhost:${p}/health\x1b[0m`);
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
