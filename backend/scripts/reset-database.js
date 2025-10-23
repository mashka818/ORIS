const { Client } = require('pg');

async function resetDatabase() {
  // Подключаемся к postgres database для управления базами данных
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '010406',
    database: 'postgres', // Подключаемся к системной БД
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Отключаем все активные соединения с базой temp
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'temp'
        AND pid <> pg_backend_pid();
    `);
    console.log('Terminated all connections to temp database');

    // Удаляем базу данных
    await client.query('DROP DATABASE IF EXISTS temp;');
    console.log('Dropped database temp');

    // Создаем новую базу данных
    await client.query('CREATE DATABASE temp;');
    console.log('Created database temp');

    await client.end();
    console.log('\nDatabase reset successful! You can now run: npm start');
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  }
}

resetDatabase();



