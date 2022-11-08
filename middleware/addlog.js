const pool = require('../middleware/database');
const { isAdmin } = require('../middleware/user');
const { isBot } = require('./isbot');

exports.addLog = async (req, location, articleId) => {
  try {
    if (!(req.session && req.session.user && req.session.user.permission === 10)) {
      const conn = await pool.getConnection();
      try {
        let ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;
        const ipRegex = /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/;
        if (ip.match(ipRegex)) {
          ip = ip.match(ipRegex)[0];
        } else {
          ip = '127.0.0.1';
        }
        const referer = req.headers.referer;
        const userAgent = req.headers['user-agent'];
        if (articleId) {
          const query = `INSERT INTO log (log_article_ID, location, viewIp, referer, userAgent) VALUES (?, ?, ?, ?, ?)`;
          if (!await isBot(ip, userAgent)) await conn.query(query, [articleId, location, ip, referer, userAgent]);
        } else {
          const query = `INSERT INTO log (location, viewIp, referer, userAgent) VALUES (?, ?, ?, ?)`;
          if (!await isBot(ip, userAgent)) await conn.query(query, [location, ip, referer, userAgent]);
        }
      } finally {
        conn.release();
      }
    }
  } catch (e) {
    console.log(e);
  }
};