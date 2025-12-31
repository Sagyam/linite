import { db } from '../src/db/index';

const categories = await db.query.categories.findMany({
  orderBy: (categories, { asc }) => [asc(categories.displayOrder)]
});

console.log('Current categories:');
categories.forEach(cat => {
  console.log(`  ${cat.slug}: ${cat.name} (icon: ${cat.icon || 'none'})`);
});

process.exit(0);
