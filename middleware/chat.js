const pool = require('../middleware/database');
let s3 = null;
if (process.env.NODE_ENV === 'development') {
  s3 = require('../config').s3.development;
} else {
  s3 = require('../config').s3.production;
}
const s3Host = s3.host;

const chat = {
  async add (data) {
    const { user, message } = data;
    const conn = await pool.getConnection();
    try {
      const query = `INSERT INTO chat
      (chat_user_ID, isLogin, isAdmin, message)
      VALUES (?, ?, ?, ?)`;
      let isAdmin = false;
      if (user.user.permission === 10) isAdmin = true;
      await conn.query(query, [user.user.id, true, isAdmin, message]);
    } finally {
      conn.release();
    }
  },
  async get () {
    const conn = await pool.getConnection();
    try {
      const fixedQuery = `SELECT c.*, u.id AS uId, u.nickName, u.permission
      FROM chat AS c
      LEFT JOIN user AS u
      ON c.chat_user_ID = u.id
      WHERE c.fixed = 1
      ORDER BY c.id DESC
      `;
      const [fixedList, ] = await conn.query(fixedQuery);
      const query = `SELECT c.*, u.id AS uId, u.nickName, u.permission
      FROM chat AS c
      LEFT JOIN user AS u
      ON c.chat_user_ID = u.id
      WHERE c.fixed = 0
      ORDER BY c.id DESC
      LIMIT 20`;
      const [list, ] = await conn.query(query);
      const [permission, ] = await conn.query(`SELECT * FROM permission ORDER BY id ASC`);
      list.forEach(l => {
        const permissionImage = permission.find(p => p.permission === l.permission).image;
        if (permissionImage) {
          l.permissionImage = `${s3Host}/permission/${permissionImage}`;
        } else {
          l.permissionImage = `/permission/${l.permission}.svg`;
        }
      });
      const fixedListReverse = fixedList.reverse();
      const listReverse = list.reverse();
      const result = [];
      fixedListReverse.forEach(l => {
        result.push({
          user: {
            isLogin: l.isLogin,
            isAdmin: l.isAdmin,
            user: {
              uId: l.uId,
              nickName: l.nickName,
              permission: l.permission,
              permissionImage: l.permissionImage,
            }
          },
          message: l.message,
        })
      });
      listReverse.forEach(l => {
        result.push({
          user: {
            isLogin: l.isLogin,
            isAdmin: l.isAdmin,
            user: {
              uId: l.uId,
              nickName: l.nickName,
              permission: l.permission,
              permissionImage: l.permissionImage,
            }
          },
          message: l.message,
        })
      });
      return result;
    } finally {
      conn.release();
    }
  }
}

module.exports = chat;