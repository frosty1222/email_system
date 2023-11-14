const db = require('../dbconnect');
const createUser = async (fullName, email, password) => {
  try {
    const pool = await db.connect();
    const [results, fields] = await pool.query('INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)', [fullName, email, password]);
    return results.insertId;
  } catch (error) {
    throw error;
  }
};

const getUserByEmail = async (email) => {
  try {
    const pool = await db.connect();
    const [results, fields] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return results[0];
  } catch (error) {
    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const pool = await db.connect();
    const [results, fields] = await pool.query('SELECT * FROM users');
    return results;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUser,
  getUserByEmail,
  getAllUsers
};
