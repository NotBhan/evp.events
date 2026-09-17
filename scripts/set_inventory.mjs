import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  const [,, target, qtyStr] = process.argv;

  if (!target) {
    console.log('Current Neon Pass Inventory:');
    const passes = await prisma.pass.findMany({ orderBy: { price: 'asc' } });
    console.table(
      passes.map((p) => ({
        slug: p.passType,
        name: p.name,
        price: `₹${p.price}`,
        total: p.totalQuantity,
        reserved: p.reservedQuantity,
        sold: p.soldQuantity,
        available: p.totalQuantity - p.reservedQuantity - p.soldQuantity,
      }))
    );
    console.log('\nUsage:');
    console.log('  pnpm run db:inventory <slug> <quantity>   (e.g. pnpm run db:inventory solo-female 50)');
    console.log('  pnpm run db:inventory all <quantity>      (e.g. pnpm run db:inventory all 100)\n');
    return;
  }

  const quantity = Number(qtyStr);
  if (!Number.isInteger(quantity) || quantity < 0) {
    console.error('Error: quantity must be positive integer');
    process.exit(1);
  }

  if (target === 'all') {
    await prisma.pass.updateMany({
      data: { totalQuantity: quantity },
    });
    console.log(`Updated all passes total_quantity to ${quantity}`);
  } else {
    const pass = await prisma.pass.findFirst({
      where: {
        OR: [{ passType: target }, { id: target }],
      },
    });

    if (!pass) {
      console.error(`Error: Pass "${target}" not found in database.`);
      process.exit(1);
    }

    const updated = await prisma.pass.update({
      where: { id: pass.id },
      data: { totalQuantity: quantity },
    });
    console.log(`Updated "${updated.passType}" (${updated.name}) total_quantity = ${updated.totalQuantity}`);
  }

  const passes = await prisma.pass.findMany({ orderBy: { price: 'asc' } });
  console.table(
    passes.map((p) => ({
      slug: p.passType,
      name: p.name,
      price: `₹${p.price}`,
      total: p.totalQuantity,
      reserved: p.reservedQuantity,
      sold: p.soldQuantity,
      available: p.totalQuantity - p.reservedQuantity - p.soldQuantity,
    }))
  );
}

main()
  .catch((err) => {
    console.error('Failed to set inventory:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
