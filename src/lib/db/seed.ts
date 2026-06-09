import { config } from 'dotenv';
config(); // Deve essere prima della creazione del Pool

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema';
import { hash } from 'argon2';

async function seed() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error('ADMIN_USERNAME e ADMIN_PASSWORD sono richiesti nel .env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema: { users } });

  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    console.log('Utente admin già esistente, skip.');
    await pool.end();
    process.exit(0);
  }

  const passwordHash = await hash(password);
  const id = crypto.randomUUID();

  await db.insert(users).values({ id, username, passwordHash, role: 'admin' });
  console.log(`Utente admin "${username}" creato con successo.`);
  await pool.end();
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
