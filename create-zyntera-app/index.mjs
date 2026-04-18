#!/usr/bin/env node
/**
 * create-zyntera-app — degit-based scaffold + .env + optional npm install.
 * Usage: npm create zyntera-app@latest [project-name]
 */
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * Node 25 + IDE-injected `--localstorage-file` without a path. The message can be
 * emitted via process.emitWarning and/or written straight to stderr — handle both.
 * Only filters lines matching this specific warning.
 */
(function suppressLocalstorageFilePathWarning() {
  const origEmit = process.emitWarning;
  process.emitWarning = function (warning, type, code, ctor) {
    const msg =
      typeof warning === 'string'
        ? warning
        : warning && typeof warning === 'object' && 'message' in warning
          ? String(warning.message)
          : '';
    if (/localstorage-file/i.test(msg) && /valid path/i.test(msg)) return;
    return origEmit.apply(process, arguments);
  };

  const origWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = function (chunk, encoding, cb) {
    let s = '';
    if (Buffer.isBuffer(chunk)) s = chunk.toString('utf8');
    else if (typeof chunk === 'string') s = chunk;
    else if (chunk != null) s = String(chunk);

    if (s && /localstorage-file/i.test(s) && /valid path/i.test(s)) {
      if (typeof encoding === 'function') encoding();
      else if (typeof cb === 'function') cb();
      return true;
    }
    return origWrite(chunk, encoding, cb);
  };
})();

const DEFAULT_TEMPLATE = 'Chuuch/zyntera-api-blueprint';

/** Banner icon (emoji) when ASCII wordmark is off. `ZYNTERA_CLI_ICON=` disables. */
const CLI_ICON = process.env.ZYNTERA_CLI_ICON ?? '⚡';

/**
 * Subtitle under the ASCII art, and the text after “Zyntera ” in the compact banner.
 * Tweak here or override at runtime: `ZYNTERA_CLI_TAGLINE="API · scaffold" node index.mjs`
 */
const CLI_TAGLINE = process.env.ZYNTERA_CLI_TAGLINE ?? '⚡ Zyntera API — create app';

/** Set `ZYNTERA_NO_ASCII=1` to force the one-line banner only. */
const NO_ASCII = process.env.ZYNTERA_NO_ASCII === '1';

/**
 * Block wordmark “Zyntera” (~62 cols). Row colors ≈ purple/magenta Z → white (brand).
 */
const LOGO_LINES = [
  ' ███████╗ ██╗   ██╗███╗   ██╗████████╗███████╗██████╗  █████╗ ',
  '     ██╔╝ ╚██╗ ██╔╝████╗  ██║╚══██╔══╝██╔════╝██╔══██╗██╔══██╗',
  '    ██╔╝   ╚████╔╝ ██╔██╗ ██║   ██║   █████╗  ██████╔╝███████║',
  '   ██╔╝     ╚██╔╝  ██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗██╔══██║',
  '  ██╔╝       ██║   ██║ ╚████║   ██║   ███████╗██║  ██║██║  ██║',
  ' ███████╗    ╚═╝   ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝',
];

const LOGO_ROW_COLORS = [
  '\x1b[38;5;201m',
  '\x1b[38;5;207m',
  '\x1b[38;5;213m',
  '\x1b[38;5;219m',
  '\x1b[38;5;225m',
  '\x1b[97m',
];

function logoMaxWidth() {
  return Math.max(...LOGO_LINES.map((l) => [...l].length));
}

function printLogo() {
  const rawCols = process.stdout.columns;
  const cols =
    typeof rawCols === 'number' && rawCols > 0 ? rawCols : 80;
  const need = logoMaxWidth() + 2;

  function printCompact() {
    const line = [CLI_ICON, `Zyntera ${CLI_TAGLINE}`].filter(Boolean).join('  ');
    console.log(`\x1b[36m%s\x1b[0m`, line);
  }

  if (NO_ASCII) {
    printCompact();
    return;
  }
  if (cols < need) {
    printCompact();
    console.log(`\x1b[90m  (widen terminal to ≥${need} cols for ASCII wordmark)\x1b[0m`);
    return;
  }

  for (let i = 0; i < LOGO_LINES.length; i++) {
    console.log(`${LOGO_ROW_COLORS[i]}${LOGO_LINES[i]}\x1b[0m`);
  }
  console.log(`\x1b[90m  ${CLI_TAGLINE}\x1b[0m`);
}

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
  printLogo();
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
