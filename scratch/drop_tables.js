const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });

  await client.connect();
  console.log("Connected to database.");

  try {
    // Drop the tables that depend on auth.users or are RBAC related
    await client.query(`DROP TABLE IF EXISTS public.profiles CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS public.user_roles CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS public.role_permissions CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS public.roles CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS public.permissions CASCADE;`);
    await client.query(`DROP FUNCTION IF EXISTS public.has_role CASCADE;`);
    await client.query(`DROP FUNCTION IF EXISTS public.has_permission CASCADE;`);
    await client.query(`DROP TYPE IF EXISTS "AppRole" CASCADE;`);
    console.log("Dropped leftover tables and types successfully.");
  } catch (err) {
    console.error("Error dropping tables:", err);
  } finally {
    await client.end();
  }
}

main();
