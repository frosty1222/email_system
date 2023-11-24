const mysql = require('mysql2');
const util = require('util'); 

async function connectDb() {
  // Create a connection pool
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'wpr',
    password: 'fit2023',
    database: 'wpr2023',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Test the connection
  const query = util.promisify(pool.query).bind(pool);
  const promisePool = pool.promise();
  
  try {
    await promisePool.query('SELECT 1');
    console.log('Connection to the database has been established successfully.');
    return promisePool;
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    throw error;
  }
}

module.exports = { connectDb };