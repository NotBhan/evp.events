import 'server-only';
import { prisma } from './db';
import { eventData } from '../data/eventData';
import type { Pass, PrismaClient } from '@/lib/generated/prisma';

type DbClient = PrismaClient | Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/**
 * Synchronizes the official event pass tiers from data/eventData.ts into the database.
 * 
 * Rules:
 * 1. Creates missing pass records.
 * 2. New passes initialize with totalQuantity = 0 (no invented inventory).
 * 3. NEVER resets or reduces existing totalQuantity, reservedQuantity, or soldQuantity.
 * 4. Preserves existing configured inventory.
 * 5. If database price differs from eventData.ts, logs a clear warning and preserves
 *    the existing database price rather than silently overwriting configured production pricing.
 */
export async function syncPassCatalog(customClient?: DbClient): Promise<Pass[]> {
  const db = customClient || prisma;
  const synchronizedPasses: Pass[] = [];

  for (const tier of eventData.passes) {
    const existing = await db.pass.findUnique({
      where: { passType: tier.id },
    });

    if (!existing) {
      const created = await db.pass.create({
        data: {
          passType: tier.id,
          name: tier.name,
          price: tier.price,
          totalQuantity: 0,
          reservedQuantity: 0,
          soldQuantity: 0,
          isActive: true,
        },
      });
      synchronizedPasses.push(created);
    } else {
      if (existing.price !== tier.price) {
        console.warn(
          `[Pass Catalog Sync] Price mismatch for pass tier "${tier.id}": database has ₹${existing.price}, eventData has ₹${tier.price}. Preserving database price as authoritative.`
        );
      }

      // Update name or active status if modified, preserving all quantities and DB price
      const updated = await db.pass.update({
        where: { id: existing.id },
        data: {
          name: tier.name,
          isActive: true,
        },
      });
      synchronizedPasses.push(updated);
    }
  }

  return synchronizedPasses;
}

/**
 * Resolves an active pass record by its database ID or unique slug (passType).
 * If the pass catalog has not yet been seeded, automatically initializes official pass tiers.
 */
export async function resolvePass(
  passIdentifier: string,
  customClient?: DbClient
): Promise<Pass | null> {
  const db = customClient || prisma;

  let pass = await db.pass.findFirst({
    where: {
      isActive: true,
      OR: [
        { id: passIdentifier },
        { passType: passIdentifier },
      ],
    },
  });

  if (!pass) {
    // If table is unpopulated or missing official tier, run safe catalog sync
    const passCount = await db.pass.count();
    if (passCount === 0 || eventData.passes.some((p) => p.id === passIdentifier)) {
      await syncPassCatalog(db);
      pass = await db.pass.findFirst({
        where: {
          isActive: true,
          OR: [
            { id: passIdentifier },
            { passType: passIdentifier },
          ],
        },
      });
    }
  }

  return pass;
}

