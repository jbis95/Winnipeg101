const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const bcrypt = require('bcrypt');
const pool = require('../middleware/database');
const { site } = require('../config');
const flash = require('../middleware/flash');
const pagination = require('../middleware/pagination');
const datetime = require('../middleware/datetime');

const saltCount = 10;

exports.mypage = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { method } = req;
      if (method === 'GET') {
        if (res.locals.user) {
          const userId = res.locals.user.id;
          const query = `SELECT u.*, p.title AS permissionName
          FROM user AS u
          JOIN permission AS p
          ON u.permission = p.permission
          WHERE u.id = ?
          `;
          const [users, ] = await conn.query(query, [userId]);
          if (users) {
            const user = users[0];
            res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
              type: 'mypage',
              pageTitle: `${res.__('user_mypage')} - ${res.locals.setting.siteName}`,
              user,
            });
          } else {
            next();
          }
        } else {
          res.redirect('/login');
        }
      } else if (method === 'POST') {
        const { id, nickName, oldPassword, password, passwordCheck } = req.body;
        if (password === '' && passwordCheck === '') {
          // 닉네임만 변경
          await conn.query(`UPDATE user SET nickName=? WHERE id=?`, [nickName, id]);
        } else {
          // 비밀번호도 변경
          await conn.query(`UPDATE user SET nickName=? WHERE id=?`, [nickName, id]);
          const [users, ] = await conn.query(`SELECT * FROM user WHERE id=?`, id);
          if (users.length) {
            const user = users[0];
            const result = bcrypt.compareSync(oldPassword, user.password);
            if (result) { // 기존 비밀번호와 대조 성공시
              if (password === passwordCheck) {
                const salt = bcrypt.genSaltSync(saltCount);
                const hash = bcrypt.hashSync(password, salt);
                await conn.query(`UPDATE user SET password=? WHERE id=?`, [hash, id]);
              }
            }
          }
        }
        res.redirect('/mypage');
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.message = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const userId = res.locals.user.id;
      const query = `SELECT m.*, u.nickName AS sender
      FROM message AS m
      LEFT JOIN user AS u
      ON message_sender_ID = u.id
      WHERE m.message_recipient_ID = ?
      AND m.status = 1 OR m.status = 2`;
      const [messages, ] = await conn.query(query, [userId]);
      messages.forEach(m => {
        m.datetime = datetime(m.created_at);
        m.content = m.content.replaceAll('\r\n', '<br>');
      });
      for (let message of messages) {
        await conn.query(`UPDATE message SET status=2 WHERE id=?`, [message.id]);
      }
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'message',
        pageTitle: `${res.__('user_message')} - ${res.locals.setting.siteName}`,
        messages,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.pointWithdraw = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { method } = req;
      if (method === 'GET') {
        if (res.locals.user) {
          res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
            type: 'pointWithdraw',
            pageTitle: `${res.__('user_pointWithdraw')} - ${res.locals.setting.siteName}`,
          });
        } else {
          res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
            type: 'permission',
            pageTitle: `${res.__('board_permission')} - ${res.locals.setting.siteName}`,
            message: `needLogin`,
          });
        }
      } else if (method === 'POST') {
        const { userId } = req.params;
        const { type, comment } = req.body;
        const point = Number(req.body.point) || 0;
        // 포인트 조회
        const [users, ] = await conn.query(`SELECT * FROM user WHERE id=?`, [userId]);
        if (users.length) {
          const user = users[0];
          // 포인트 지급
          if (user.point >= point && point !== 0) {
            const pointWithdrawLimit = res.locals.setting.pointWithdrawLimit;
            console.log(pointWithdrawLimit);
            if (point >= pointWithdrawLimit || pointWithdrawLimit === 0) {
              const [result, ] = await conn.query(`UPDATE user SET point=point-? WHERE id=?`, [point, userId]);
              // 포인트 지급 내역 등록
              const query = `INSERT INTO pointWithdraw
              (pointWithdraw_user_ID, type, point, comment)
              VALUES (?, ?, ?, ?)`;
              await conn.query(query, [user.id, type, point, comment]);
              await conn.query(`INSERT INTO point (point_user_ID, type, point) VALUES (?, ?, ?)`, [user.id, 'withdraw', point * -1]);
              flash.create({
                status: 200,
                message: `출금신청 완료`,
              });
            } else {
              flash.create({
                status: 400,
                message: `최소 출금가능 포인트가 부족합니다`,
              });
            }
          } else {
            flash.create({
              status: 400,
              message: `지급 가능한 포인트가 부족합니다`,
            });
          }
        }
        res.redirect('/mypage/pointWithdraw');
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};