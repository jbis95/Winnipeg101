const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const pool = require('../middleware/database');

// Hangul
exports.getDomain = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { id, domainName } = req.body.data;
      if (id) {
        const [domains, ] = await conn.query(`SELECT * FROM plugin_domainSell WHERE id=?`, [id]);
        if (domains.length) {
          const domain = domains[0];
          res.send(domain);
        }
      } else if (domainName) {
        const [domains, ] = await conn.query(`SELECT * FROM plugin_domainSell WHERE domainName=?`, [domainName]);
        if (domains.length) {
          const domain = domains[0];
          res.send(domain);
        }
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.getDomainList = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { type } = req.body.data;
      const [domainList, ] = await conn.query(`SELECT * FROM plugin_domainSell WHERE type=? ORDER BY id DESC`, [type]);
      res.send(domainList);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.domainBuy = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { id, buyerName, buyerPhone, buyerEmail, content } = req.body.data;
      conn.beginTransaction();
      // 삽니다 내역 추가
      const query = `INSERT INTO plugin_domainBuy
      (domainBuy_domainSell_ID, buyerName, buyerPhone, buyerEmail, content)
      VALUES (?, ?, ?, ?, ?)`;
      const result = await conn.query(query, [id, buyerName, buyerPhone, buyerEmail, content]);
      // 팝니다 상태 변경
      const sellQuery = `UPDATE plugin_domainSell
      SET status = 2
      WHERE id=?`;
      await conn.query(sellQuery, [id]);
      await conn.commit();
      if (result) {
        res.send(true);
      } else {
        res.send(false);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.newDomain = async (req, res, next) => {
  try {
    res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
      type: 'newDomain',
      pageTitle: `도메인 신규등록 - ${res.locals.setting.siteName}`,
    });
  } catch (e) {
    console.log(e);
  }
};

exports.domainList = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [premiumDomain, ] = await conn.query(`SELECT * FROM plugin_domainSell WHERE type='premium' ORDER BY id DESC LIMIT 6`);
      const [paidDomain, ] = await conn.query(`SELECT * FROM plugin_domainSell WHERE type='paid' ORDER BY id DESC LIMIT 6`);
      const [freeDomain, ] = await conn.query(`SELECT * FROM plugin_domainSell WHERE type='free' ORDER BY id DESC LIMIT 6`);
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'domainList',
        pageTitle: `도메인 목록 - ${res.locals.setting.siteName}`,
        premiumDomain,
        paidDomain,
        freeDomain,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};