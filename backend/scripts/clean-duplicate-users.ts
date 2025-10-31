import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDuplicateUsers() {
  console.log('🔍 Searching for duplicate users...');

  // Find all users grouped by wallet address
  const users = await prisma.user.findMany({
    where: {
      walletAddress: {
        not: null,
      },
    },
    orderBy: {
      createdAt: 'asc', // Oldest first
    },
  });

  // Group users by normalized wallet address
  const usersByWallet = new Map<string, any[]>();
  
  for (const user of users) {
    if (user.walletAddress) {
      const normalized = user.walletAddress.toLowerCase();
      if (!usersByWallet.has(normalized)) {
        usersByWallet.set(normalized, []);
      }
      usersByWallet.get(normalized)!.push(user);
    }
  }

  // Find duplicates
  const duplicates = Array.from(usersByWallet.entries()).filter(
    ([_, users]) => users.length > 1
  );

  console.log(`📊 Found ${duplicates.length} wallet addresses with duplicate users`);

  for (const [walletAddress, dupeUsers] of duplicates) {
    console.log(`\n🔹 Wallet: ${walletAddress}`);
    console.log(`   Duplicate users found: ${dupeUsers.length}`);

    // Keep the NEWEST user (last one created)
    const usersToDelete = dupeUsers.slice(0, -1);
    const userToKeep = dupeUsers[dupeUsers.length - 1];

    console.log(`   ✅ Keeping user: ${userToKeep.id} (${userToKeep.username}) - created ${userToKeep.createdAt}`);

    for (const user of usersToDelete) {
      console.log(`   ❌ Deleting user: ${user.id} (${user.username}) - created ${user.createdAt}`);
      
      try {
        // Delete related records first
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.nonce.deleteMany({ where: { userId: user.id } });
        
        // Delete the user
        await prisma.user.delete({ where: { id: user.id } });
        
        console.log(`      ✅ Deleted successfully`);
      } catch (error) {
        console.error(`      ❌ Error deleting user: ${error}`);
      }
    }
  }

  console.log('\n✨ Cleanup complete!');
}

cleanDuplicateUsers()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
