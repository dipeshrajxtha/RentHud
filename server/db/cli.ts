import { closeDatabase, db } from '../config/database.js';
import { getMigrationStatus, migrateDown, migrateToLatest } from './migrator.js';

async function run() {
  const command = process.argv[2] || 'latest';

  console.log(`[RentHub Migration CLI] Executing command: '${command}'...`);

  try {
    if (command === 'latest') {
      const { error, results } = await migrateToLatest(db);

      results?.forEach((it) => {
        if (it.status === 'Success') {
          console.log(`  [OK] Migration "${it.migrationName}" executed successfully.`);
        } else if (it.status === 'Error') {
          console.error(`  [FAILED] Migration "${it.migrationName}" failed.`);
        }
      });

      if (error) {
        console.error('[RentHub Migration CLI] Failed to run migrations to latest:');
        console.error(error);
        process.exit(1);
      }

      if (!results || results.length === 0) {
        console.log('  No pending migrations to run. Database schema is up to date.');
      }
    } else if (command === 'down') {
      const { error, results } = await migrateDown(db);

      results?.forEach((it) => {
        if (it.status === 'Success') {
          console.log(`  [OK] Migration "${it.migrationName}" rolled back successfully.`);
        } else if (it.status === 'Error') {
          console.error(`  [FAILED] Rollback of "${it.migrationName}" failed.`);
        }
      });

      if (error) {
        console.error('[RentHub Migration CLI] Failed to rollback migration:');
        console.error(error);
        process.exit(1);
      }

      if (!results || results.length === 0) {
        console.log('  No executed migrations to rollback.');
      }
    } else if (command === 'status') {
      const migrations = await getMigrationStatus(db);
      console.log('  Current migration status:');
      for (const m of migrations) {
        const state = m.executedAt ? `Executed at ${m.executedAt.toISOString()}` : 'Pending';
        console.log(`  - ${m.name}: ${state}`);
      }
    } else {
      console.error(`[RentHub Migration CLI] Unknown command "${command}". Use "latest", "down", or "status".`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error('[RentHub Migration CLI] Unexpected error:', err.message);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

run();
