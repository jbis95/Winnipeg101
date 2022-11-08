const mysql = require('mysql2/promise');

let sql = null;
if (process.env.NODE_ENV === 'development') {
  sql = require('../config').sql.development;
} else {
  sql = require('../config').sql.production;
}

const { host, user, password, port, database, connectionLimit } = sql;

const pool = mysql.createPool({
  host,
  user,
  password,
  port,
  database,
  connectionLimit,
});

module.exports = pool;