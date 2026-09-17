#!/usr/bin/env node
/**
 * RAAS UTSAV 2026 — Organiser bootstrap / emergency administration CLI.
 *
 * Usage (run with the IPv4 wrapper + env file, e.g.):
 *   ./scripts/run-with-ipv4.sh node --env-file=.env.local scripts/organiser-admin.mjs list
 *   ./scripts/run-with-ipv4.sh node --env-file=.env.local scripts/organiser-admin.mjs create --name "Rahul Kumar" --login rahul --role ADMIN --gate MAIN-GATE
 *   ./scripts/run-with-ipv4.sh node --env-file=.env.local scripts/organiser-admin.mjs create --name "Gate One" --login gate1 --role ENTRY_SCANNER --gate GATE-01
 *   ./scripts/run-with-ipv4.sh node --env-file=.env.local scripts/organiser-admin.mjs set-gate --login gate1 --gate GATE-02
 *   ./scripts/run-with-ipv4.sh node --env-file=.env.local scripts/organiser-admin.mjs reset-credential --login gate1
 *   ./scripts/run-with-ipv4.sh node --env-file=.env.local scripts/organiser-admin.mjs deactivate --login gate1
 *   ./scripts/run-with-ipv4.sh node --env-file=.env.local scripts/organiser-admin.mjs reactivate --login gate1
 *
 * Credentials are NEVER hardcoded. The password is taken from --password, the
 * ORGANISER_PASSWORD environment variable, or an interactive hidden prompt.
 * Only the scrypt hash is stored; the plaintext is never written anywhere.
 */

import readline from 'node:readline';
import { PrismaClient } from '@prisma/client';
import {
  hashCredential,
  validatePassword,
  normalizeLoginId,
  normalizeGateId,
  isGateIdAllowed,
} from '../lib/organiser-credentials.ts';

const prisma = new PrismaClient({ log: ['error'] });

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const stdin = process.stdin;

    const onData = (char) => {
      const str = char.toString('utf8');
      if (str === '\n' || str === '\r' || str === '\u0004') {
        stdin.removeListener('data', onData);
      } else {
        // Repaint the prompt without echoing the typed characters.
        process.stdout.clearLine?.(0);
        process.stdout.cursorTo?.(0);
        process.stdout.write(question);
      }
    };

    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    stdin.on('data', onData);

    if (!stdin.isTTY) {
      reject(new Error('No TTY available for hidden password prompt; pass --password or set ORGANISER_PASSWORD.'));
    }
  });
}

async function resolvePassword(args) {
  if (typeof args.password === 'string' && args.password.length > 0) return args.password;
  if (process.env.ORGANISER_PASSWORD) return process.env.ORGANISER_PASSWORD;
  return promptHidden('Password: ');
}

function requireLogin(args) {
  const loginId = normalizeLoginId(args.login);
  if (!loginId) {
    throw new Error('Provide a valid --login (3–64 chars: a–z, 0–9, ".", "_", "-").');
  }
  return loginId;
}

async function findOrganiserByLoginOrThrow(loginId) {
  const organiser = await prisma.organiser.findUnique({ where: { loginId } });
  if (!organiser) throw new Error(`No organiser found with login "${loginId}".`);
  return organiser;
}

async function commandCreate(args) {
  const loginId = requireLogin(args);
  const name = typeof args.name === 'string' ? args.name.trim() : '';
  if (name.length < 2 || name.length > 80) {
    throw new Error('Provide --name (2–80 characters).');
  }

  const role = args.role === undefined ? 'ENTRY_SCANNER' : String(args.role).toUpperCase();
  if (role !== 'ENTRY_SCANNER' && role !== 'ADMIN') {
    throw new Error('Provide --role ENTRY_SCANNER or --role ADMIN.');
  }

  const gateId = normalizeGateId(args.gate);
  if (!gateId) throw new Error('Provide a valid --gate (e.g. GATE-01, MAIN-GATE).');
  if (!isGateIdAllowed(gateId)) {
    throw new Error(`Gate "${gateId}" is not permitted by ORGANISER_GATE_IDS.`);
  }

  const hidden = args.hidden === true || String(args.hidden).toLowerCase() === 'true';

  const password = await resolvePassword(args);
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);

  const existing = await prisma.organiser.findUnique({ where: { loginId } });
  if (existing) throw new Error(`An organiser with login "${loginId}" already exists.`);

  const credentialHash = await hashCredential(password);
  const created = await prisma.organiser.create({
    data: { name, loginId, credentialHash, role, gateId, active: true, hidden },
  });

  console.log(
    `✓ Created organiser "${created.loginId}" (${created.role}, gate ${created.gateId}, active=${created.active}${
      created.hidden ? ', hidden from the organiser panel' : ''
    }).`
  );
}

async function commandDeactivate(args) {
  const loginId = requireLogin(args);
  const organiser = await findOrganiserByLoginOrThrow(loginId);
  await prisma.organiser.update({ where: { id: organiser.id }, data: { active: false } });
  console.log(`✓ Deactivated "${loginId}". Existing sessions are rejected on their next request.`);
}

async function commandReactivate(args) {
  const loginId = requireLogin(args);
  const organiser = await findOrganiserByLoginOrThrow(loginId);
  await prisma.organiser.update({ where: { id: organiser.id }, data: { active: true } });
  console.log(`✓ Reactivated "${loginId}".`);
}

async function commandSetGate(args) {
  const loginId = requireLogin(args);
  const organiser = await findOrganiserByLoginOrThrow(loginId);
  const gateId = normalizeGateId(args.gate);
  if (!gateId) throw new Error('Provide a valid --gate (e.g. GATE-01, MAIN-GATE).');
  if (!isGateIdAllowed(gateId)) {
    throw new Error(`Gate "${gateId}" is not permitted by ORGANISER_GATE_IDS.`);
  }

  await prisma.organiser.update({ where: { id: organiser.id }, data: { gateId } });
  console.log(`✓ Gate for "${loginId}" set to ${gateId}.`);
}

async function commandResetCredential(args) {
  const loginId = requireLogin(args);
  const organiser = await findOrganiserByLoginOrThrow(loginId);

  const password = await resolvePassword(args);
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);

  const credentialHash = await hashCredential(password);
  await prisma.organiser.update({
    where: { id: organiser.id },
    data: {
      credentialHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  console.log(`✓ Credential for "${loginId}" reset; lock counters cleared.`);
}

async function commandList() {
  const organisers = await prisma.organiser.findMany({ orderBy: { loginId: 'asc' } });
  if (organisers.length === 0) {
    console.log('No organisers provisioned.');
    return;
  }

  console.log(`${organisers.length} organiser(s):`);
  for (const o of organisers) {
    console.log(
      [
        `  • ${o.loginId}`,
        `name="${o.name}"`,
        `role=${o.role}`,
        `gate=${o.gateId}`,
        `active=${o.active}`,
        `hidden=${o.hidden}`,
        `lastLogin=${o.lastLoginAt ? o.lastLoginAt.toISOString() : 'never'}`,
        `lockedUntil=${o.lockedUntil ? o.lockedUntil.toISOString() : '-'}`,
      ].join(' | ')
    );
  }
}

const COMMANDS = {
  create: commandCreate,
  deactivate: commandDeactivate,
  reactivate: commandReactivate,
  'set-gate': commandSetGate,
  'reset-credential': commandResetCredential,
  list: commandList,
};

function printUsage() {
  console.log(`RAAS UTSAV 2026 organiser administration (bootstrap / emergency fallback)

Usage:
  node scripts/organiser-admin.mjs <command> [options]

Commands:
  create             --name "Full Name" --login <id> [--role ENTRY_SCANNER|ADMIN] --gate GATE-01 [--hidden] [--password <pw>]
  deactivate         --login <id>
  reactivate         --login <id>
  set-gate           --login <id> --gate <GATE-ID>
  reset-credential   --login <id> [--password <pw>]
  list

--hidden marks a service/developer account that never appears in the organiser
panel (listings or management actions) and can only be operated from this CLI.

Password resolution order: --password, ORGANISER_PASSWORD env, interactive hidden prompt.
Only a scrypt hash is stored; plaintext credentials are never persisted.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || command === 'help' || args.help) {
    printUsage();
    return;
  }

  const handler = COMMANDS[command];
  if (!handler) {
    printUsage();
    throw new Error(`Unknown command "${command}".`);
  }

  await handler(args);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
    await prisma.$disconnect();
    process.exit(1);
  });
