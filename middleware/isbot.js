const pool = require('../middleware/database');

exports.isBot = async (ip, userAgent) => {
  const conn = await pool.getConnection();
    try {
      const [whitelist, ] = await conn.query(`SELECT * FROM whitelist`);
      for (let item of whitelist) {
        if (ip && ip.match(item.ip)) {
          return true;
        }
        if (userAgent && userAgent.match(item.userAgent)) {
          return true;
        }
        if (userAgent && userAgent.length <= 15) {
          return true;
        }
      }
      return false;
    } finally {
      conn.release();
    }
};