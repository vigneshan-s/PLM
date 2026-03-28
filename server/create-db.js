const mysql = require('mysql2/promise');

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '2005',
    });
    
    await connection.query('CREATE DATABASE IF NOT EXISTS smartplm;');
    console.log('Database "smartplm" created or already exists.');
    
    await connection.end();
  } catch (err) {
    console.error('Failed to create database:', err.message);
    process.exit(1);
  }
}

createDatabase();
