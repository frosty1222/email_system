// dbsetup.js

const mysql = require('mysql2');
const util = require('util');

async function connect() {
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

  // Promisify the query method
  const query = util.promisify(pool.query).bind(pool);

  try {
    // Create tables if they don't exist
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_has_in_out_box (
        id INT AUTO_INCREMENT PRIMARY KEY,
        in_out_box_id INT NOT NULL,
        user_id INT NOT NULL,
        status VARCHAR(255) NOT NULL DEFAULT 'on',
        type VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS in_out_box (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient INT NOT NULL,
        sender VARCHAR(255) NULL,
        subject VARCHAR(255) NULL,
        content LONGTEXT NULL,
        file_link LONGTEXT NULL,
        status VARCHAR(255) DEFAULT 'on',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables created successfully.');

    // Insert data into tables
    const usersData = [
      { fullName: 'Test1', email: 'a@a.com', password: '12345678' },
      { fullName: 'Test2', email: 'Test2@a.com', password: '12345678' },
      { fullName: 'Test3', email: 'Test3@a.com', password: '12345678' }
    ];

    for (const user of usersData) {
      await query('INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)', [user.fullName, user.email, user.password]);
    }

    // Insert data for user_has_in_out_box and in_out_box
    const dataInsertOutbox = [
      { recipient: 2, sender: "Test2", subject: "test inbox", content: "this is a test content", file_link: [{ "fileName": "file1.jpg" }] },
      { recipient: 2, sender: "Test2", subject: "test inbox", content: "this is a test content", file_link: [{ "fileName": "file2.jpg" }] },
    ];

    for (const o of dataInsertOutbox) {
      const { insertId: in_out_box_id } = await query('INSERT INTO in_out_box (recipient, sender, subject, content, file_link) VALUES (?, ?, ?, ?, ?)', [o.recipient, o.sender, o.subject, o.content, JSON.stringify(o.file_link)]);

      await query('INSERT INTO user_has_in_out_box (user_id, in_out_box_id, type) VALUES (?, ?, ?)', [1, in_out_box_id, 'out']);
    }

    const dataInsertInbox = [
      { recipient: 1, sender: "Test1", subject: "test inbox", content: "this is a test content", file_link: [{ "fileName": "file3.jpg" }] },
      { recipient: 1, sender: "Test1", subject: "test inbox", content: "this is a test content", file_link: [{ "fileName": "file4.jpg" }] },
    ];

    for (const i of dataInsertInbox) {
      const { insertId: in_out_box_id } = await query('INSERT INTO in_out_box (recipient, sender, subject, content, file_link) VALUES (?, ?, ?, ?, ?)', [i.recipient, i.sender, i.subject, i.content, JSON.stringify(i.file_link)]);

      await query('INSERT INTO user_has_in_out_box (user_id, in_out_box_id, type) VALUES (?, ?, ?)', [1, in_out_box_id, 'in']);
    }

    console.log('Data inserted successfully.');

    // Test the connection
    const promisePool = pool.promise();
    await promisePool.query('SELECT 1');
    console.log('Connection to the database has been established successfully.');
    return promisePool;
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    throw error;
  }
}

// Run the connect function when the script is executed
if (require.main === module) {
  connect();
}

module.exports = connect;