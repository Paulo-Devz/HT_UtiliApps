import sql from './connection.js';  // usa ES Module

async function testConnection() {
    const result = await sql`SELECT * FROM informacoes_progama`;
    console.log('Resultado:', result);
}

testConnection();