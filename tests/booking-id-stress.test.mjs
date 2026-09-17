import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import {
  generatePublicBookingId,
  withUniqueBookingId,
  BookingIdExhaustedError,
  BOOKING_ID_MIN,
  BOOKING_ID_MAX,
} from '../lib/booking-id.ts';

/**
 * Booking-ID namespace stress test.
 *
 * Environment: a DEDICATED, ISOLATED, THROWAWAY Postgres container (non-production).
 * Never touches production Neon, production bookings, payments or Sheets.
 *
 * Method: the real generator + the real retry loop from lib/booking-id.ts are used
 * against the real migrated schema (prisma migrate deploy) in the isolated database.
 * Saturation (9,000 unique ids across RU26-REQ-1000..9999) is reached with batched
 * candidate inserts for throughput; collisions are measured per candidate, and the
 * single-attempt path is exercised through the real retry loop before and after.
 */

const CONTAINER = `raas-id-stress-${process.pid}`;
const PG_PORT = 55432;
const ISO_URL = `postgresql://postgres:stress@127.0.0.1:${PG_PORT}/stress?schema=public`;
const TARGET_UNIQUE_IDS = 9000;
const BATCH_SIZE = 400;
const MAX_ATTEMPTS = 250000;

function docker(args, options = {}) {
  return execFileSync('docker', args, { encoding: 'utf8', ...options });
}

function startContainer() {
  docker([
    'run', '--rm', '-d',
    '--name', CONTAINER,
    '-p', `127.0.0.1:${PG_PORT}:5432`,
    '-e', 'POSTGRES_PASSWORD=stress',
    '-e', 'POSTGRES_DB=stress',
    'postgres:16-alpine',
  ]);
}

async function waitForPostgres(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      docker(['exec', CONTAINER, 'pg_isready', '-U', 'postgres']);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('isolated Postgres did not become ready in time');
}

function applyMigrations() {
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: ISO_URL },
    stdio: 'pipe',
  });
}

function percentile(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

async function main() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — BOOKING-ID NAMESPACE STRESS TEST');
  console.log('Environment: isolated throwaway Postgres container (non-production)');
  console.log('================================================================\n');

  const metrics = {
    targetUniqueIds: TARGET_UNIQUE_IDS,
    actualUniqueIds: 0,
    totalGenerationAttempts: 0,
    collisionCount: 0,
    retryCount: 0,
    retryExhaustionCount: 0,
    minGeneratedId: null,
    maxGeneratedId: null,
    duplicateCount: 0,
    durationMs: 0,
    passed: false,
  };

  startContainer();
  console.log(`  ✓ Started isolated Postgres container ${CONTAINER} on 127.0.0.1:${PG_PORT}`);

  const startedAt = Date.now();
  let isoPrisma = null;

  try {
    await waitForPostgres();
    applyMigrations();
    console.log('  ✓ Applied production migrations to the isolated database');

    isoPrisma = new PrismaClient({ datasources: { db: { url: ISO_URL } }, log: ['error'] });

    const pass = await isoPrisma.pass.create({
      data: {
        passType: 'stress-pass',
        name: 'Stress Pass',
        price: 100,
        totalQuantity: 100000,
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });

    const trackGenerated = (publicId) => {
      const numeric = Number(publicId.slice('RU26-REQ-'.length));
      assert.ok(
        numeric >= BOOKING_ID_MIN && numeric <= BOOKING_ID_MAX,
        `generated id ${publicId} must be within RU26-REQ-${BOOKING_ID_MIN}..${BOOKING_ID_MAX}`
      );
      metrics.minGeneratedId = metrics.minGeneratedId === null ? numeric : Math.min(metrics.minGeneratedId, numeric);
      metrics.maxGeneratedId = metrics.maxGeneratedId === null ? numeric : Math.max(metrics.maxGeneratedId, numeric);
    };

    // ------------------------------------------------------------------
    // 1. Real single-attempt path through the real retry loop
    // ------------------------------------------------------------------
    console.log('\n--- 1. Real retry-loop path (25 sequential bookings at low saturation) ---');
    const realPathLatencies = [];
    for (let i = 0; i < 25; i++) {
      const t = Date.now();
      const booking = await withUniqueBookingId(async (publicId) => {
        trackGenerated(publicId);
        return isoPrisma.booking.create({
          data: {
            publicId,
            fullName: 'Stress Attendee',
            phone: '+91 99315 03999',
            passId: pass.id,
            quantity: 1,
            unitPrice: 100,
            totalAmount: 100,
            status: 'PENDING',
            paymentStatus: 'NOT_STARTED',
            expiresAt: new Date(Date.now() + 3600000),
            source: 'id-stress',
          },
        });
      });
      realPathLatencies.push(Date.now() - t);
      metrics.totalGenerationAttempts++;
      assert.match(booking.publicId, /^RU26-REQ-\d{4}$/);
    }
    const sortedLatencies = [...realPathLatencies].sort((a, b) => a - b);
    console.log(
      `  ✓ 25/25 real-path bookings created (p50 ${percentile(sortedLatencies, 0.5)}ms, max ${percentile(sortedLatencies, 0.99)}ms)`
    );

    // ------------------------------------------------------------------
    // 2. Namespace saturation to 9,000 unique ids
    // ------------------------------------------------------------------
    console.log(`\n--- 2. Saturating the namespace to ${TARGET_UNIQUE_IDS} unique ids ---`);
    let uniqueCount = await isoPrisma.$queryRawUnsafe(
      'SELECT count(*)::int AS n FROM bookings'
    );
    let unique = uniqueCount[0].n;

    const saturationStarted = Date.now();
    let batches = 0;

    while (unique < TARGET_UNIQUE_IDS && metrics.totalGenerationAttempts < MAX_ATTEMPTS) {
      const candidates = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const id = generatePublicBookingId();
        trackGenerated(id);
        candidates.push(id);
      }

      const inserted = await isoPrisma.$queryRawUnsafe(
        'INSERT INTO bookings (id, public_id, full_name, phone, pass_id, quantity, unit_price, total_amount, status, payment_status, expires_at, created_at, updated_at, source) ' +
          "SELECT gen_random_uuid()::text, c, 'Stress Attendee', '+91 99315 03999', $2, 1, 100, 100, 'PENDING'::\"BookingStatus\", 'NOT_STARTED'::\"PaymentStatus\", NOW() + interval '1 hour', NOW(), NOW(), 'id-stress' " +
          'FROM unnest($1::text[]) AS c ON CONFLICT (public_id) DO NOTHING RETURNING public_id',
        candidates,
        pass.id
      );

      metrics.totalGenerationAttempts += BATCH_SIZE;
      metrics.collisionCount += BATCH_SIZE - inserted.length;
      unique += inserted.length;
      batches++;

      if (batches % 25 === 0) {
        console.log(
          `  … ${unique}/${TARGET_UNIQUE_IDS} unique (${metrics.totalGenerationAttempts} attempts, ${metrics.collisionCount} collisions)`
        );
      }
    }

    metrics.actualUniqueIds = unique;
    metrics.retryCount = 0; // batched path performs no internal retries; exhausted retries counted below
    console.log(
      `  ✓ Saturation loop finished in ${Date.now() - saturationStarted}ms over ${batches} batches`
    );

    // ------------------------------------------------------------------
    // 3. Integrity verification
    // ------------------------------------------------------------------
    console.log('\n--- 3. Integrity checks on the saturated namespace ---');
    const dupRow = await isoPrisma.$queryRawUnsafe(
      'SELECT count(*)::int AS total, count(DISTINCT public_id)::int AS distinct_ids FROM bookings'
    );
    metrics.duplicateCount = dupRow[0].total - dupRow[0].distinct_ids;
    assert.equal(metrics.duplicateCount, 0, 'no duplicate public ids may exist');

    const outOfRange = await isoPrisma.$queryRawUnsafe(
      "SELECT count(*)::int AS n FROM bookings WHERE public_id !~ '^RU26-REQ-(1[0-9]{3}|[2-9][0-9]{3})$'"
    );
    assert.equal(outOfRange[0].n, 0, 'every stored id must be inside RU26-REQ-1000..9999');

    const minMax = await isoPrisma.$queryRawUnsafe(
      "SELECT min(substring(public_id from 10)::int) AS min_id, max(substring(public_id from 10)::int) AS max_id FROM bookings"
    );
    console.log(
      `  ✓ ${metrics.actualUniqueIds} unique ids, 0 duplicates, 0 out-of-range (stored min ${minMax[0].min_id}, max ${minMax[0].max_id})`
    );

    // ------------------------------------------------------------------
    // 4. Retry exhaustion at full saturation (real retry loop)
    // ------------------------------------------------------------------
    console.log('\n--- 4. Retry exhaustion once the namespace is saturated ---');
    const rowCountBefore = (await isoPrisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM bookings'))[0].n;
    const sampleBefore = await isoPrisma.booking.findFirst({ orderBy: { publicId: 'asc' } });

    let exhaustionError = null;
    const attemptsAtExhaustionProbe = [];
    try {
      await withUniqueBookingId(
        async (publicId) => {
          attemptsAtExhaustionProbe.push(publicId);
          trackGenerated(publicId);
          return isoPrisma.booking.create({
            data: {
              publicId,
              fullName: 'Exhaustion Probe',
              phone: '+91 99315 03999',
              passId: pass.id,
              quantity: 1,
              unitPrice: 100,
              totalAmount: 100,
              status: 'PENDING',
              paymentStatus: 'NOT_STARTED',
              expiresAt: new Date(Date.now() + 3600000),
              source: 'id-stress',
            },
          });
        },
        { onAttempt: () => undefined }
      );
    } catch (err) {
      exhaustionError = err;
    }

    assert.ok(exhaustionError instanceof BookingIdExhaustedError, 'exhaustion must raise BookingIdExhaustedError');
    metrics.retryExhaustionCount++;
    metrics.retryCount += attemptsAtExhaustionProbe.length - 1;
    metrics.totalGenerationAttempts += attemptsAtExhaustionProbe.length;
    assert.equal(attemptsAtExhaustionProbe.length, 5, 'exhaustion must consume exactly the retry budget');

    const rowCountAfter = (await isoPrisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM bookings'))[0].n;
    assert.equal(rowCountAfter, rowCountBefore, 'exhaustion must not insert or overwrite any row');

    const sampleAfter = await isoPrisma.booking.findUnique({ where: { publicId: sampleBefore.publicId } });
    assert.deepEqual(
      { id: sampleAfter.id, publicId: sampleAfter.publicId, fullName: sampleAfter.fullName },
      { id: sampleBefore.id, publicId: sampleBefore.publicId, fullName: sampleBefore.fullName },
      'existing rows must never be reassigned or mutated on exhaustion'
    );
    console.log(
      `  ✓ Exhaustion raised after exactly 5 attempts; 0 rows inserted, existing rows untouched`
    );

    metrics.durationMs = Date.now() - startedAt;
    metrics.passed =
      metrics.actualUniqueIds === TARGET_UNIQUE_IDS &&
      metrics.duplicateCount === 0 &&
      metrics.retryExhaustionCount === 1;

    console.log('\n================================================================');
    console.log('BOOKING-ID STRESS TEST METRICS');
    console.log('================================================================');
    console.log(`  target unique ids          : ${metrics.targetUniqueIds}`);
    console.log(`  actual unique ids          : ${metrics.actualUniqueIds}`);
    console.log(`  total generation attempts  : ${metrics.totalGenerationAttempts}`);
    console.log(`  collision count            : ${metrics.collisionCount}`);
    console.log(`  retry count                : ${metrics.retryCount}`);
    console.log(`  retry exhaustion count     : ${metrics.retryExhaustionCount}`);
    console.log(`  min generated id           : ${metrics.minGeneratedId}`);
    console.log(`  max generated id           : ${metrics.maxGeneratedId}`);
    console.log(`  duplicate count            : ${metrics.duplicateCount}`);
    console.log(`  duration                   : ${metrics.durationMs}ms`);
    console.log(`  result                     : ${metrics.passed ? 'PASS' : 'FAIL'}`);
    console.log('================================================================');

    assert.equal(metrics.passed, true, 'stress test must meet the saturation target with zero duplicates');
    console.log('\n✓ BOOKING-ID STRESS TEST PASSED\n');
  } finally {
    if (isoPrisma) await isoPrisma.$disconnect();
    try {
      docker(['rm', '-f', CONTAINER]);
      console.log('  ✓ Isolated Postgres container removed');
    } catch {
      console.warn('  ! Could not remove the isolated container — remove it manually:', CONTAINER);
    }
  }
}

main().catch((err) => {
  console.error('\n✗ BOOKING-ID STRESS TEST FAILED');
  console.error(err);
  process.exit(1);
});
