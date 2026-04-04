import postgres from 'postgres';

const sql = postgres({
  host:     'aws-1-us-east-1.pooler.supabase.com',
  port:      5432,
  database: 'postgres',
  username: 'postgres.pxjgpblwibzozgniumix',
  password: process.env.DB_PASSWORD || 'Paodequeij0.',
  ssl:      'require',
  prepare:  false,
  max:      1,
});

export default sql;