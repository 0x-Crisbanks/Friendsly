import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function normalizeWalletAddresses() {
  console.log('🔍 Searching for wallet addresses to normalize...');

  // Find all users with wallet addresses
  const users = await prisma.user.findMany({
    where: {
      walletAddress: {
        not: null,
      },
    },
  });

  console.log(`📊 Found ${users.length} users with wallet addresses`);

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.walletAddress) continue;

    const normalizedAddress = user.walletAddress.toLowerCase();

    // Check if already normalized
    if (user.walletAddress === normalizedAddress) {
      skipped++;
      continue;
    }

    console.log(`\n🔹 User: ${user.username} (${user.id})`);
    console.log(`   Old address: ${user.walletAddress}`);
    console.log(`   New address: ${normalizedAddress}`);

    try {
      // Update to lowercase
      await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress: normalizedAddress },
      });

      console.log(`   ✅ Updated successfully`);
      updated++;
    } catch (error) {
      console.error(`   ❌ Error updating user: ${error}`);
    }
  }

  console.log('\n✨ Normalization complete!');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped (already normalized): ${skipped}`);
}

normalizeWalletAddresses()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
