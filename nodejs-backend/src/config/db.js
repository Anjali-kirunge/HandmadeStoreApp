const mysql = require('mysql2/promise');
const fs = require('fs');
const env = require('./env');

function sslConfig() {
  if (process.env.DB_SSL !== 'true') return undefined;
  if (process.env.DB_SSL_CA_PEM) {
    return { ca: process.env.DB_SSL_CA_PEM };
  }
  if (process.env.DB_CA_CERT) {
    return { ca: fs.readFileSync(process.env.DB_CA_CERT, 'utf8') };
  }
  return {};
}

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: env.db.poolSize,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: false,
  namedPlaceholders: true,
  ssl: sslConfig(),
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
}

function txQuery(conn) {
  return async (sql, params = []) => {
    const [rows] = await conn.query(sql, params);
    return rows;
  };
}

function txQueryOne(conn) {
  const exec = txQuery(conn);
  return async (sql, params = []) => {
    const rows = await exec(sql, params);
    return rows.length ? rows[0] : null;
  };
}

async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const tx = {
      query: txQuery(conn),
      queryOne: txQueryOne(conn),
      conn,
    };
    const result = await fn(tx);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function testConnection() {
  await pool.query('SELECT 1');
}

module.exports = { pool, query, queryOne, transaction, testConnection };
