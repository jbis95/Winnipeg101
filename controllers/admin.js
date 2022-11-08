const fs = require('fs');
const path = require('path');
const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const rimraf = require('rimraf');
const bcrypt = require('bcrypt');
const pool = require('../middleware/database');
const flash = require('../middleware/flash');
const pagination = require('../middleware/pagination');
const { emptyCheck } = require('../middleware/emptyCheck');
const hashCreate = require('../middleware/hash');
const { menuArrayAlign } = require('../middleware/func');
const delay = require('../middleware/delay');
const { sendMessage } = require('../middleware/sendMessage');
const favicon = require('../middleware/favicon');
const youtube = require('../middleware/youtube');

const saltCount = 10;

/* AWS S3 */
const AWS = require('aws-sdk');
let s3 = null;
if (process.env.NODE_ENV === 'development') {
  s3 = require('../config').s3.development;
} else {
  s3 = require('../config').s3.production;
}
const { accessKeyId, secretAccessKey, region, bucket, host, endpoint } = s3;

const articleSpacesEndpoint = new AWS.Endpoint(`${endpoint}/article`);
const articleS3 = new AWS.S3({
    endpoint: articleSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const thumbSpacesEndpoint = new AWS.Endpoint(`${endpoint}/thumb`);
const thumbS3 = new AWS.S3({
    endpoint: thumbSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const permissionSpacesEndpoint = new AWS.Endpoint(`${endpoint}/permission`);
const permissionS3 = new AWS.S3({
    endpoint: permissionSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const pageSpacesEndpoint = new AWS.Endpoint(`${endpoint}/page`);
const pageS3 = new AWS.S3({
    endpoint: pageSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const bannerSpacesEndpoint = new AWS.Endpoint(`${endpoint}/banner`);
const bannerS3 = new AWS.S3({
    endpoint: bannerSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const categorySpacesEndpoint = new AWS.Endpoint(`${endpoint}/category`);
const categoryS3 = new AWS.S3({
    endpoint: categorySpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

// Plugin
const landingSpacesEndpoint = new AWS.Endpoint(`${endpoint}/landing`);
const landingS3 = new AWS.S3({
    endpoint: landingSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const landingBackgroundVideoSpacesEndpoint = new AWS.Endpoint(`${endpoint}/landing`);
const landingBackgroundVideoS3 = new AWS.S3({
    endpoint: landingBackgroundVideoSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const landingBannerSpacesEndpoint = new AWS.Endpoint(`${endpoint}/landingBanner`);
const landingBannerS3 = new AWS.S3({
    endpoint: landingBannerSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

exports.index = async (req, res, next) => {
  try {
    res.redirect('/admin/log');
  } catch (e) {
    console.log(e);
  }
};

exports.log = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const pnQuery = `SELECT count(*) AS count FROM log`;
      const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
      const query = `SELECT l.*, a.title AS title, b.title AS boardName, b.slug AS boardSlug
      FROM log AS l
      LEFT JOIN article AS a
      ON l.log_article_ID = a.id
      LEFT JOIN board AS b
      ON a.article_board_ID = b.id
      ORDER BY id DESC
      ${pn.queryLimit}`;
      const [logs, ] = await conn.query(query);
      logs.forEach(l => {
        l.datetime = moment(l.viewDate).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
      });
      res.render('admin/log', {
        pageTitle: `${res.__('admin_log')} - ${res.locals.setting.siteName}`,
        logs,
        pn,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/log');
  }
};

exports.user = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const pnQuery = `SELECT count(*) AS count FROM user`;
      const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
      const query = `SELECT *
      FROM user
      ORDER BY id DESC
      ${pn.queryLimit}`;
      const [users, ] = await conn.query(query);
      res.render('admin/user', {
        pageTitle: `${res.__('admin_member')} - ${res.locals.setting.siteName}`,
        users,
        pn,
        page,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/user');
  }
};

exports.userNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { submit } = req.body;
      const userHash = hashCreate(6);
      let uId = null, password = null, nickName = null, email = null, permission = null, workingUser = null;
      if (submit === 'new') {
        uId = req.body.uId;
        password = req.body.password;
        nickName = req.body.nickName;
        email = req.body.email;
        permission = req.body.permission;
        workingUser = req.body.workingUser || 0;
      } else if (submit === 'random') {
        uId = userHash;
        password = userHash;
        nickName = userHash;
        email = userHash;
        permission = 1;
        workingUser = 1;
      }
      if (emptyCheck(uId, password, nickName, email, permission, workingUser)) {
        const [uIdResult, ] = await conn.query(`SELECT * FROM user WHERE uId=?`, uId);
        if (!uIdResult.length) {
          const [nickNameResult, ] = await conn.query(`SELECT * FROM user WHERE nickName=?`, nickName);
          if (!nickNameResult.length) {
            const salt = bcrypt.genSaltSync(saltCount);
            const hash = bcrypt.hashSync(password, salt);
            const query = `INSERT INTO user (hash, uId, password, nickName, email, permission, workingUser) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const [result, ] = await conn.query(query, [userHash, uId, hash, nickName, email, permission, workingUser]);
          } else {
            flash.create({
              status: 400,
              message: '닉네임 중복입니다',
            });
          }
        } else {
          flash.create({
            status: 400,
            message: '아이디 중복입니다',
          });
        }
      } else {
        flash.create({
          status: 400,
          message: '모든 입력란을 입력해주세요',
        });
      }
      res.redirect('/admin/user');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/user');
  }
};

exports.userEdit = async (req, res, next) => {
  try {
    const { page } = req.query;
    // console.log(page);
    const { id } = req.params;
    const { submit } = req.body;
    const conn = await pool.getConnection();
    try {
      if (submit === 'edit') {
        const { uId, password, nickName, email, permission } = req.body;
        const workingUser = req.body.workingUser || 0;
        if (password) {
          const salt = bcrypt.genSaltSync(saltCount);
          const hash = bcrypt.hashSync(password, salt);
          const query = `UPDATE user SET uId=?, password=?, nickName=?, email=?, permission=?, workingUser=? WHERE id=?`;
          await conn.query(query, [uId, hash, nickName, email, permission, workingUser, id]);
        } else {
          const query = `UPDATE user SET uId=?, nickName=?, email=?, permission=?, workingUser=? WHERE id=?`;
          await conn.query(query, [uId, nickName, email, permission, workingUser, id]);
        }
      } else if (submit === 'delete') {
        await conn.query(`DELETE FROM user WHERE id=?`, [id]);
      }
    } finally {
      conn.release();
    }
    if (page) {
      res.redirect(`/admin/user?page=${page}`);
    } else {
      res.redirect('/admin/user');
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/user');
  }
};

exports.menu = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const query = `SELECT *
      FROM menu
      ORDER BY parentId ASC, viewOrder ASC, id ASC`;
      const [menusOrigin, ] = await conn.query(query);
      const menus = menuArrayAlign(menusOrigin);
      res.render('admin/menu', {
        pageTitle: `${res.__('admin_menu')} - ${res.locals.setting.siteName}`,
        menus,
        page,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/menu');
  }
};

exports.menuNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { title, target, viewOrder } = req.body;
      const query = `INSERT INTO menu (title, target) VALUES (?, ?)`;
      await conn.query(query, [title, target.trim(), viewOrder]);
    } finally {
      conn.release();
    }
    res.redirect('/admin/menu');
  } catch (e) {
    console.log(e);
    res.redirect('/admin/menu');
  }
};

exports.menuEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const { id } = req.params;
      const { submit } = req.body;
      if (submit === 'add') {
        const insertQuery = `INSERT INTO menu
        (title, target, parentId, viewOrder)
        VALUES (?, ?, ?, ?)`;
        const query = await conn.query(insertQuery, [`new`, 'new', id, 100]);
      } else if (submit === 'edit') {
        const { title, target, viewOrder } = req.body;
        const query = `UPDATE menu SET title=?, target=?, viewOrder=? WHERE id=?`;
        await conn.query(query, [title, target.trim(), viewOrder, id]);
      } else if (submit === 'delete') {
        await conn.query(`DELETE FROM menu WHERE id=?`, [id]);
      }
      if (page) {
        res.redirect(`/admin/menu?page=${page}`);
      } else {
        res.redirect('/admin/menu');
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/menu');
  }
};

exports.board = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const pnQuery = `SELECT count(*) AS count FROM board`;
      const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
      const query = `SELECT *
      FROM board
      ORDER BY createdAt DESC
      ${pn.queryLimit}`;
      const [boards, ] = await conn.query(query);
      res.render('admin/board', {
        pageTitle: `${res.__('admin_boards')} - ${res.locals.setting.siteName}`,
        boards,
        pn,
        page,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/board');
  }
};

exports.boardNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { title, type } = req.body;
      const slug = req.body.slug || hashCreate(6);
      const query = `INSERT INTO board (title, slug, type) VALUES (?, ?, ?)`;
      await conn.query(query, [title, slug.trim(), type]);
      res.redirect('/admin/board');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/board');
  }
};

exports.boardEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const { id } = req.params;
      const { submit } = req.body;
      if (submit === 'edit') {
        const { title, slug, type, listCount, listPermission, readPermission, writePermission, commentPermission } = req.body;
        const query = `UPDATE board SET title=?, slug=?, type=?, listCount=?, listPermission=?, readPermission=?, writePermission=?, commentPermission=? WHERE id=?`;
        await conn.query(query, [title, slug.trim(), type, listCount, listPermission, readPermission, writePermission, commentPermission, id]);
      } else if (submit === 'delete') {
        await conn.query(`DELETE FROM board WHERE id=?`, [id]);
      }
      if (page) {
        res.redirect(`/admin/board?page=${page}`);
      } else {
        res.redirect('/admin/board');
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/board');
  }
};

exports.boardDetail = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { method } = req;
      const { id } = req.params;
      if (method === 'GET') {
        const [boards, ] = await conn.query(`SELECT * FROM board WHERE id=?`, [id]);
        if (boards.length) {
          const board = boards[0];
          const query = `SELECT c.*, b.title AS board
          FROM category AS c
          LEFT JOIN board AS b
          ON c.category_board_ID = b.id
          WHERE b.id = ?
          ORDER BY b.viewOrder ASC, c.viewOrder ASC`;
          const [categories, ] = await conn.query(query, [board.id]);
          res.render('admin/boardDetail', {
            pageTitle: ``,
            board,
            categories,
          });
        }
      } else if (method === 'POST') {
        const { writePoint, commentPoint, readPoint, useLink, useFileUpload } = req.body;
        const query = `UPDATE board
        SET writePoint=?, commentPoint=?, readPoint=?, useLink=?, useFileUpload=?
        WHERE id=?`;
        await conn.query(query, [writePoint, commentPoint, readPoint, useLink, useFileUpload, id]);
        res.redirect(`/admin/board/detail/${id}`);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.categoryNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { board, title } = req.body;
      const query = `INSERT INTO category (category_board_ID, title) VALUES (?, ?)`;
      await conn.query(query, [board, title]);
      res.redirect(`/admin/board/detail/${board}`);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect(`/admin/board/detail/${board}`);
  }
};

exports.categoryEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { submit } = req.body;
      const { board } = req.body;
      if (submit === 'edit') {
        const query = `SELECT * FROM category WHERE id=?`;
        const [categories, ] = await conn.query(query, [id]);
        if (categories.length) {
          const category = categories[0];
          const key = category.image || null;
          if (key) {
            // Delete Image
            const params = {
              Bucket: bucket,
              Key: key,
            };
            await categoryS3.deleteObject(params, (err, data) => {
              if (err) {
                console.log(err);
              }
            }).promise();
          }
          
          // New Image
          const { file } = req;
          const { title, viewOrder, color } = req.body;
          if (file) {
            const query = `UPDATE category
            SET category_board_ID=?, title=?, viewOrder=?, color=?, image=?
            WHERE id=?`;
            await conn.query(query, [board, title, viewOrder, color, file.key, id]);
          } else {
            const query = `UPDATE category
            SET category_board_ID=?, title=?, viewOrder=?, color=?
            WHERE id=?`;
            await conn.query(query, [board, title, viewOrder, color, id]);
          }
        }
        
      } else if (submit === 'delete') {
        conn.query(`DELETE FROM category WHERE id=?`, [id]);
      }
      res.redirect(`/admin/board/detail/${board}`);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect(`/admin/board/detail/${board}`);
  }
};

exports.article = async (req, res, next) => {
  try {
    const { page } = req.query;
    const conn = await pool.getConnection();
    try {
      const pnQuery = `SELECT count(*) AS count FROM article WHERE status=1`;
      const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
      const query = `SELECT a.*, b.title AS board, b.slug AS slug, c.title AS category, u.uId AS uId, u.nickName AS nickName
      FROM article AS a
      LEFT JOIN board AS b
      ON a.article_board_ID = b.id
      LEFT JOIN category AS c
      ON a.article_category_ID = c.id
      LEFT JOIN user AS u
      ON a.article_user_ID = u.id
      WHERE a.status = 1
      ORDER BY id DESC
      ${pn.queryLimit}`;
      const [articles, ] = await conn.query(query);
      articles.forEach(a => {
        a.datetime = moment(a.createdAt).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
      });
      const [boards, ] = await conn.query(`SELECT * FROM board ORDER BY id ASC`);
      res.render('admin/article', {
        pageTitle: `${res.__('admin_article')} - ${res.locals.setting.siteName}`,
        articles,
        boards,
        pn,
        page,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/article');
  }
};

exports.articleEdit = async (req, res, next) => {
  try {
    const { page } = req.query;
    // console.log(page);
    const { id } = req.params;
    const { submit } = req.body;
    const conn = await pool.getConnection();
    try {
      if (submit === 'edit') {
        const { board, uId, datetime, viewCount } = req.body;
        const [users, ] = await conn.query(`SELECT * FROM user WHERE uId=?`, [uId]);
        if (users.length) {
          const user = users[0];
          await conn.query(`UPDATE article SET article_board_ID=?, article_user_ID=?, updatedAt=?, createdAt=?, viewCount=? WHERE id=?`, [board, user.id, datetime, datetime, viewCount, id]);
        } else {
          flash.create({
            status: 400,
            message: `유저가 존재하지 않습니다`,
          });
        }
      } else if (submit === 'delete') { // 숨기기
        conn.beginTransaction();
        const [result, ] = await conn.query(`SELECT * FROM article WHERE id=?`, [id]);
        const status = result[0].status;
        if (status === 1) {
          await conn.query(`UPDATE article SET status=? WHERE id=?`, [0, id]);
        } else {
          await conn.query(`UPDATE article SET status=? WHERE id=?`, [1, id]);
        }
        
        // 포인트
        const [articles, ] = await conn.query(`SELECT * FROM article WHERE id=?`, [id]);
          if (articles.length) {
            const article = articles[0];
            const [boards, ] = await conn.query(`SELECT * FROM board WHERE id=?`, [article.article_board_ID]);
            if (boards.length) {
              const board = boards[0];
              const insertQuery = `INSERT INTO point
              (point_user_ID, point_board_ID, point_article_ID, type, point)
              VALUES (?, ?, ?, ?, ?)`;
              await conn.query(insertQuery, [article.article_user_ID, article.article_board_ID, article.id, 'delete', board.writePoint * -1]);
              const [users, ] = await conn.query(`SELECT * FROM user WHERE id=?`, [article.article_user_ID]);
              if (users.length) {
                const user = users[0];
                const updateQuery = `UPDATE user
                SET point=?
                WHERE id=?`;
                await conn.query(updateQuery, [user.point + board.writePoint * -1, article.article_user_ID]);
              }
            }
          }

        // 커밋
        await conn.commit();
      }
      if (page) {
        res.redirect(`/admin/article?page=${page}`);
      } else {
        res.redirect(`/admin/article`);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/article');
  }
};

exports.comment = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const pnQuery = `SELECT count(*) AS count FROM comment WHERE status=1`;
      const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
      const query = `SELECT c.*, u.uId AS uId, u.nickName AS nickName
      FROM comment AS c
      LEFT JOIN user AS u
      ON c.comment_user_ID = u.id
      WHERE status = 1
      ORDER BY id DESC
      ${pn.queryLimit}`;
      const [comments, ] = await conn.query(query);
      comments.forEach(c => {
        c.datetime = moment(c.createdAt).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
      });
      res.render('admin/comment', {
        pageTitle: `${res.__('admin_comment')} - ${res.locals.setting.siteName}`,
        comments,
        pn,
        page,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/comment');
  }
};

exports.commentEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const { id } = req.params;
      const { submit } = req.body;
      if (submit === 'edit') {
        const { uId, datetime, content } = req.body;
        const [users, ] = await conn.query(`SELECT * FROM user WHERE uId=?`, [uId]);
        if (users.length) {
          const user = users[0];
          await conn.query(`UPDATE comment SET comment_user_ID=?, content=?, updatedAt=?, createdAt=? WHERE id=?`, [user.id, content, datetime, datetime, id]);
        } else {
          flash.create({
            status: 400,
            message: `유저가 존재하지 않습니다`,
          });
        }
      } else if (submit === 'delete') {
        const [comments, ] = await conn.query(`SELECT * FROM comment WHERE id=?`, [id]);
        if (comments.length) {
          const comment = comments[0];
          // Delete Comment
          if (comment.comment_user_ID === res.locals.user.id || res.locals.user.permission === 10) {
            await conn.query(`UPDATE comment SET status=? WHERE id=?`, [0, comment.id]);
            await conn.query(`UPDATE article SET commentCount=commentCount-1, updatedAt=NOW() WHERE id=?`, [comment.comment_article_ID]);
            await conn.query(`UPDATE comment SET replyCount=replyCount-1 WHERE id=?`, [comment.parent_comment_id]);
            if (comment.parent_comment_id && comment.parent_comment_id != comment.comment_group_id) await conn.query(`UPDATE comment SET replyCount=replyCount-1 WHERE id=?`, [comment.comment_group_id]);
          }
        }
      }
      if (page) {
        res.redirect(`/admin/comment?page=${page}`);
      } else {
        res.redirect('/admin/comment');
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/comment');
  }
};

exports.chat = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const pnQuery = `SELECT count(*) AS count FROM chat`;
      const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
      const query = `SELECT c.*, u.nickName AS nickName
      FROM chat AS c
      LEFT JOIN user AS u
      ON c.chat_user_ID = u.id
      ORDER BY c.id DESC
      ${pn.queryLimit}`;
      const [chats, ] = await conn.query(query);
      chats.forEach(c => {
        c.datetime = moment(c.createdAt).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
      });
      res.render('admin/chat', {
        pageTitle: `${res.__('admin_chat')} - ${res.locals.setting.siteName}`,
        chats,
        pn,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/chat');
  }
};

exports.chatEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { submit } = req.body;
      const { page } = req.query;
      if (submit === 'edit') {
        const { message } = req.body;
        const fixed = req.body.fixed || 0;
        await conn.query(`UPDATE chat SET message=?, fixed=? WHERE id=?`, [message, fixed, id]);
      } else if (submit === 'delete') {
        await conn.query(`DELETE FROM chat WHERE id=?`, [id]);
      }
      if (page) {
        res.redirect(`/admin/chat?page=${page}`);
      } else {
        res.redirect('/admin/chat');
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/chat');
  }
};

exports.pointWithdraw = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { method } = req;
      if (method === 'GET') {
        const pnQuery = `SELECT count(*) AS count FROM pointWithdraw WHERE status = 1`;
        const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
        const query = `SELECT p.*, u.nickName
        FROM pointWithdraw AS p
        JOIN user AS u
        ON pointWithdraw_user_ID = u.id
        WHERE p.status = 1
        ORDER BY p.id DESC
        ${pn.queryLimit}`;
        const [pointWithDrawList, ] = await conn.query(query, []);
        pointWithDrawList.forEach(p => {
          p.datetime = moment(p.createdAt).tz(timezone).format('YY-MM-DD HH:mm:ss');
        });
        res.render('admin/pointWithdraw', {
          pageTitle: `${res.__('admin_pointWithdraw')} - ${res.locals.setting.siteName}`,
          pointWithDrawList,
          pn,
        });
      } else if (method === 'POST') {
        const { submit } = req.body;
        if (submit === 'complete') {
          await conn.query(`UPDATE pointWithdraw SET status=0 WHERE id=?`, [id]);
        } else if (submit === 'reject') {
          const { userId, point } = req.body;
          // 포인트 복구
          await conn.query(`UPDATE user SET point=point+? WHERE id=?`, [point, userId]);
          await conn.query(`DELETE FROM pointWithdraw WHERE id=?`, [id]);
          await conn.query(`INSERT INTO point (point_user_ID, type, point) VALUES (?, ?, ?)`, [userId, 'withdrawReject', point]);
        }
        res.redirect('/admin/pointWithdraw');
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.page = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const pnQuery = `SELECT count(*) AS count FROM page`;
      const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
      const query = `SELECT *
      FROM page
      ORDER BY id DESC
      ${pn.queryLimit}`;
      const [pages, ] = await conn.query(query);
      res.render('admin/page', {
        pageTitle: `${res.__('admin_page')} - ${res.locals.setting.siteName}`,
        pages,
        pn,
        page,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/page');
  }
};

exports.pageNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { method } = req;
      if (method === 'GET') {
        res.render('admin/pageNew', {
          pageTitle: `${res.__('admin_page')} - ${res.locals.setting.siteName}`,
        });
      } else if (method === 'POST') {
        const { title, html, css, javascript } = req.body;
        const slug = req.body.slug || hashCreate(6);
        let { content } = req.body;
        // Upload Images
        const imgs = content.match(/<img src="([^"]+)">/ig);
        const images = [];
        if (imgs) {
          imgs.forEach(i => {
            images.push(i.replace('<img src="/temp/', '').replace('">', ''));
          });
        }
        conn.beginTransaction();
        const query = `INSERT INTO page
        (title, slug, content, html, css, js)
        VALUES (?, ?, ?, ?, ?, ?)`;
        const [result, ] = await conn.query(query, [title, slug, content, html, css, javascript]);
        for (let i = 0; i < images.length; i ++) {
          let extension = path.extname(images[i]);
          if (path.extname(images[i]) === '.jpeg') {
            extension = '.jpg';
          }
          const key = images[i];
          const file = fs.readFileSync(`./public/temp/${images[i]}`);
          let contentType = null;
          if (extension === '.png') {
            contentType = 'image/png';
          } else if (extension === '.jpg' || extension === '.jpeg') {
            contentType = 'image/jpeg';
          } else if (extension === '.gif') {
            contentType = 'image/gif';
          } else {
            contentType = file.type;
          }
          const params = {
            Bucket: bucket,
            Key: key,
            ACL: 'public-read',
            Body: file,
            ContentType: contentType,
          };
          await pageS3.putObject(params, async (err, data) => {
            if (err) {
              console.log(err);
            }
          }).promise();
          await conn.query(`INSERT INTO image (image_page_ID, image) VALUES (?, ?)`, [result.insertId, key]);
          content = content.replace(`/temp/${images[i]}`, `${host}/page/${key}`);
        }
        rimraf.sync(`./public/temp/${res.locals.user.hash}`);
        await conn.query(`UPDATE page SET content=? WHERE id=?`, [content, result.insertId]);
        await conn.commit();
        res.redirect('/admin/page');
      }
    } catch (e) {
      console.log(e);
      await conn.rollback();
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/page');
  }
};

exports.pageEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const { id } = req.params;
      const { submit } = req.body;
      if (submit === 'hide') {
        const [result, ] = await conn.query(`SELECT status FROM page WHERE id=?`, [id]);
        const status = result[0].status;
        if (status === 1) {
          await conn.query(`UPDATE page SET status=? WHERE id=?`, [0, id]);
        } else {
          await conn.query(`UPDATE page SET status=? WHERE id=?`, [1, id]);
        }
        if (page) {
          res.redirect(`/admin/page?page=${page}`);
        } else {
          res.redirect('/admin/page');
        }
      } else if (submit === 'edit') {
        const [pages, ] = await conn.query(`SELECT * FROM page WHERE id=?`, [id]);
        if (pages.length) {
          const page = pages[0];
          res.render(`admin/pageEdit`, {
            pageTitle: `${res.__('admin_page')} - ${res.locals.setting.siteName}`,
            page,
          });
        }
      } else if (submit === 'delete') {
        const query = `SELECT * FROM image WHERE image_page_ID=?`;
        const [images, ] = await conn.query(query, [id]);
        for (let i = 0; i < images.length; i ++) {
          const key = images[i].image;
          const params = {
            Bucket: bucket,
            Key: key,
          };
          await pageS3.deleteObject(params, (err, data) => {
            if (err) {
              console.log(err);
            }
          }).promise();
        }
        await conn.query(`DELETE FROM page WHERE id=?`, [id]);
        if (page) {
          res.redirect(`/admin/page?page=${page}`);
        } else {
          res.redirect('/admin/page');
        }
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/page');
  }
};

exports.pageEditComplete = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      // console.log(page);
      const { id } = req.params;
      const { type, title, slug, html, css, javascript } = req.body;
      let { content } = req.body;
      if (emptyCheck(title, content)) {
        // Delete List
        const [originList, ] = await conn.query(`SELECT * FROM image WHERE image_page_ID=?`, [id]);
        const nowList = [];
        const oldImages = content.match(/amazonaws.com\/page\/([^"]+)/ig);
        if (oldImages) {
          oldImages.forEach(i => {
            nowList.push(i.replace('amazonaws.com/page/', ''));
          });
        }
        const deleteList = originList.filter(i => !nowList.includes(i.image));
        for (let i = 0; i < deleteList.length; i ++) {
          const params = {
            Bucket: bucket,
            Key: deleteList[i].image,
          };
          pageS3.deleteObject(params, (err, data) => {
            if (err) {
              console.log(err);
            } else {
              conn.query(`DELETE FROM image WHERE id=?`, [deleteList[i].id]);
            }
          });
        }

        // Upload Images
        const imgs = content.match(/<img src="\/temp\/([^"]+)">/ig);
        const images = [];
        if (imgs) {
          imgs.forEach(i => {
            images.push(i.replace('<img src="/temp/', '').replace('">', ''));
          });
        }
        conn.beginTransaction();
        const query = `UPDATE page
        SET content=?
        WHERE id=?`;
        await conn.query(query, [content, id]);
        for (let i = 0; i < images.length; i ++) {
          let extension = path.extname(images[i]);
          if (path.extname(images[i]) === '.jpeg') {
            extension = '.jpg';
          }
          const key = images[i];
          const file = fs.readFileSync(`./public/temp/${images[i]}`);
          let contentType = null;
          if (extension === '.png') {
            contentType = 'image/png';
          } else if (extension === '.jpg' || extension === '.jpeg') {
            contentType = 'image/jpeg';
          } else if (extension === '.gif') {
            contentType = 'image/gif';
          } else {
            contentType = file.type;
          }
          const params = {
            Bucket: bucket,
            Key: key,
            ACL: 'public-read',
            Body: file,
            ContentType: contentType,
          };
          await pageS3.putObject(params, async (err, data) => {
            if (err) {
              console.log(err);
            }
          }).promise();
          await conn.query(`INSERT INTO image (image_page_ID, image) VALUES (?, ?)`, [id, key]);
          content = content.replace(`/temp/${images[i]}`, `${host}/page/${key}`);
        }
        rimraf.sync(`./public/temp/${res.locals.user.hash}`);
        await conn.query(`UPDATE page SET type=?, title=?, slug=?, content=?, html=?, css=?, js=? WHERE id=?`, [type, title, slug, content, html, css, javascript, id]);
        await conn.commit();
        res.redirect('/admin/page');
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/page');
  }
};

exports.banner = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const pnQuery = `SELECT count(*) AS count FROM banner`;
      const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
      const query = `SELECT *
      FROM banner
      ORDER BY id DESC
      ${pn.queryLimit}`;
      const [banners, ] = await conn.query(query);
      res.render('admin/banner', {
        pageTitle: `${res.__('admin_banner')} - ${res.locals.setting.siteName}`,
        banners,
        host,
        pn,
        page,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/banner');
  }
};

exports.bannerNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { position, link, viewOrder } = req.body;
      const newPage = req.body.newPage || 0;
      const { key } = req.file;
      const query = `INSERT INTO banner
      (position, image, link, viewOrder, newPage)
      VALUES (?, ?, ?, ?, ?)`;
      await conn.query(query, [position, key, link, viewOrder, newPage]);
      res.redirect('/admin/banner');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/banner');
  }
};

exports.bannerEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const { id } = req.params;
      const { submit } = req.body;
      if (submit === 'hide') {
        const [banners, ] = await conn.query(`SELECT * FROM banner WHERE id=?`, [id]);
        if (banners.length) {
          const banner = banners[0];
          if (banner.status === 1) {
            await conn.query(`UPDATE banner SET status=? WHERE id=?`,[0, id]);
          } else if (banner.status === 0) {
            await conn.query(`UPDATE banner SET status=? WHERE id=?`,[1, id]);
          }
          res.redirect('/admin/banner');
        }
      } else if (submit === 'edit') {
        const { position, link, viewOrder } = req.body;
        const newPage = req.body.newPage || 0;
        const mobileHide = req.body.mobileHide || 0;
        await conn.query(`UPDATE banner SET position=?, link=?, viewOrder=?, newPage=?, mobileHide=? WHERE id=?`, [position, link, viewOrder, newPage, mobileHide, id]);
        if (page) {
          res.redirect(`/admin/banner?page=${page}`);
        } else {
          res.redirect('/admin/banner');
        }
      } else if (submit === 'delete') {
        const [result, ] = await conn.query(`SELECT * FROM banner WHERE id=?`, [id]);
        const key = result[0].image;
        const params = {
          Bucket: bucket,
          Key: key,
        };
        bannerS3.deleteObject(params, async (err, data) => {
          if (err) {
            console.log(err);
          } else {
            await conn.query(`DELETE FROM banner WHERE id=?`, [id]);
            if (page) {
              res.redirect(`/admin/banner?page=${page}`);
            } else {
              res.redirect('/admin/banner');
            }
          }
        });
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/banner');
  }
};

// Message
exports.message = async (req, res, next) => {
  try {
    res.render('admin/message', {
      pageTitle: `${res.__('admin_totalMessage')} - ${res.locals.setting.siteName}`,
    });
  } catch (e) {
    console.log(e);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { content } = req.body;
      const senderUserId = res.locals.user.id;
      const query = `SELECT *
      FROM user
      WHERE id != ?`;
      const [users, ] = await conn.query(query, [senderUserId]);
      for (let user of users) {
        const messageQuery = `INSERT INTO
        message
        (message_sender_ID, message_recipient_ID, content)
        VALUES (?, ?, ?)`;
        await conn.query(messageQuery, [senderUserId, user.id, content]);
      }
      flash.create({
        status: 200,
        message: '전체 메시지 발송 완료',
      });
      res.redirect('/admin/message');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    flash.create({
      status: 400,
      message: '전체 메시지 발송 실패',
    });
    res.redirect('/admin/message');
  }
};

exports.sendEmail = async (req, res, next) => {
  try {
    res.redirect('/admin/message');
  } catch (e) {
    console.log(e);
  }
};

exports.indexBoard = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const query = `SELECT *
      FROM indexBoard
      ORDER BY viewOrder ASC`;
      const [indexBoards, ] = await conn.query(query);
      const [boards, ] = await conn.query(`SELECT * FROM board`);
      res.render('admin/indexBoard', {
        pageTitle: `${res.__('admin_index')} - ${res.locals.setting.siteName}`,
        indexBoards,
        boards,
        page,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/indexBoard');
  }
};

exports.indexBoardNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { board, type, position } = req.body;
      const query = `INSERT INTO indexBoard
      (indexBoard_board_ID, type, position)
      VALUES (?, ?, ?)`;
      await conn.query(query, [board, type, position]);
      res.redirect('/admin/indexBoard');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/indexBoard');
  }
};

exports.indexBoardEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const { id } = req.params;
      const { submit } = req.body;
      if (submit === 'edit') {
        const { board, type, position, exceptBoards, viewCount, viewOrder } = req.body;
        const query = `UPDATE indexBoard
        SET indexBoard_board_ID=?, type=?, position=?, exceptBoards=?, viewCount=?, viewOrder=?
        WHERE id=?`;
        await conn.query(query, [board, type, position, exceptBoards, viewCount, viewOrder, id]);
        if (page) {
          res.redirect(`/admin/indexBoard?page=${page}`);
        } else {
          res.redirect('/admin/indexBoard');
        }
      } else if (submit === 'delete') {
        await conn.query(`DELETE FROM indexBoard WHERE id=?`, [id]);
        if (page) {
          res.redirect(`/admin/indexBoard?page=${page}`);
        } else {
          res.redirect('/admin/indexBoard');
        }
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/indexBoard');
  }
};

exports.permission = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `SELECT * FROM permission ORDER BY viewOrder ASC`;
      const [permissions, ] = await conn.query(query);
      res.render('admin/permission', {
        pageTitle: '회원등급',
        permissions,
      })
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.permissionEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { submit } = req.body;
      if (submit === 'edit') {
        const { title, pointBaseline } = req.body;
        const isAdmin = req.body.isAdmin || 0;
        const { file } = req;
        
        // Delete Image
        const [result, ] = await conn.query(`SELECT * FROM permission WHERE id=?`, [id]);
        const key = result[0].image;
        if (key) {
          const params = {
            Bucket: bucket,
            Key: key,
          };
          permissionS3.deleteObject(params, async (err, data) => {
            if (err) {
              console.log(err);
            }
          });
        }
  
        if (file) {
          const query = `UPDATE permission
          SET title=?, pointBaseline=?, isAdmin=?, image=?
          WHERE id=?`;
          await conn.query(query, [title, pointBaseline, isAdmin, file.key, id]);
        } else {
          const query = `UPDATE permission
          SET title=?, pointBaseline=?, isAdmin=?
          WHERE id=?`;
          await conn.query(query, [title, pointBaseline, isAdmin, id]);
        }
      } else if (submit === 'resetImage') {
        // Delete Image
        const [result, ] = await conn.query(`SELECT * FROM permission WHERE id=?`, [id]);
        const key = result[0].image;
        if (key) {
          const params = {
            Bucket: bucket,
            Key: key,
          };
          permissionS3.deleteObject(params, async (err, data) => {
            if (err) {
              console.log(err);
            }
          });
        }
        
        await conn.query(`UPDATE permission SET image=? WHERE id=?`, [null, id]);
      }
      res.redirect('/admin/permission');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

// Plugin
exports.plugin = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [plugins, ] = await conn.query(`SELECT * FROM plugin`);
      res.render('admin/plugin', {
        pageTitle: `${res.__('admin_plugin')} - ${res.locals.setting.siteName}`,
        plugins,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/plugin');
  }
};

// Update
exports.update = async (req, res, next) => {
  try {
    res.render('admin/update', {
      pageTitle: `${res.__('admin_update')} - ${res.locals.setting.siteName}`,
    });
  } catch (e) {
    console.log(e);
  }
};

exports.pluginNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { slug } = req.body;
      await conn.query(`INSERT INTO plugin (slug) VALUES (?)`, [slug]);
      res.redirect('/admin/plugin');
      await delay(1000);
      process.exit();
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/plugin');
  }
};

exports.pluginEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { submit } = req.body;
      if (submit === 'edit') {
        
      } else if (submit === 'delete') {
        await conn.query(`DELETE FROM plugin WHERE id=?`, [id]);
      }
      res.redirect('/admin/plugin');
      await delay(1000);
      process.exit();
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/plugin');
  }
};

// Setting
exports.setting = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [settings, ] = await conn.query(`SELECT * FROM setting`);
      if (settings.length) {
        const setting = settings[0];
        res.render('admin/setting', {
          pageTitle: `${res.__('admin_settings')} - ${res.locals.setting.siteName}`,
          setting,
        })
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/setting');
  }
};

exports.settingBasic = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      if (result.length) {
        const { site, domain, description } = req.body;
        const query = `UPDATE setting SET siteName=?, siteDescription=?, siteDomain=? WHERE id=?`;
        await conn.query(query, [site, description, domain, result[0].id]);
        res.redirect('/admin/setting');
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/setting');
  }
}

exports.settingEmail = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      if (result.length) {
        const { emailService, emailUser, emailPassword } = req.body;
        const query = `UPDATE setting SET emailService=?, emailUser=?, emailPassword=? WHERE id=?`;
        await conn.query(query, [emailService, emailUser, emailPassword, result[0].id]);
        res.redirect('/admin/setting');
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/setting');
  }
};

exports.settingDesign = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      if (result.length) {
        if (req.file) {
          const logoImage = req.file.filename;
          const { logoType, logoImageSize } = req.body;
          const query = `UPDATE setting
          SET logoType=?, logoImage=?, logoImageSize=?
          WHERE id=?`;
          await conn.query(query, [logoType, logoImage, logoImageSize, result[0].id]);
        } else {
          const { logoType, logoImageSize } = req.body;
          const query = `UPDATE setting
          SET logoType=?, logoImageSize=?
          WHERE id=?`;
          await conn.query(query, [logoType, logoImageSize, result[0].id]);
        }
        res.redirect('/admin/setting');
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/setting');
  }
}

exports.settingEtcDesign = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      if (result.length) {
        if (req.file) {
          const file = req.file;
          favicon(file);
        }
        const { headerFontColor, headerBackgroundColor, bodyFontColor, bodyBackgroundColor, pointColor, pointBackgroundColor } = req.body;
        const query = `UPDATE setting
        SET headerFontColor=?, headerBackgroundColor=?, bodyFontColor=?, bodyBackgroundColor=?, pointColor=?, pointBackgroundColor=?
        WHERE id=?`;
        await conn.query(query, [headerFontColor, headerBackgroundColor, bodyFontColor, bodyBackgroundColor, pointColor, pointBackgroundColor, result[0].id]);
        res.redirect('/admin/setting');
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/setting');
  }
};

exports.settingBanner = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      if (result.length) {
        const { bannerRowsHeader, bannerRowsIndexTop, bannerRowsIndexBottom, bannerRowsSideTop, bannerRowsSideBottom, bannerRowsArticleTop, bannerRowsArticleBottom, bannerRowsCustom, bannerGapDesktop, bannerGapMobile, bannerBorderRounding } = req.body;
        const query = `UPDATE setting
        SET bannerRowsHeader=?, bannerRowsIndexTop=?, bannerRowsIndexBottom=?, bannerRowsSideTop=?, bannerRowsSideBottom=?, bannerRowsArticleTop=?, bannerRowsArticleBottom=?, bannerRowsCustom=?, bannerGapDesktop=?, bannerGapMobile=?, bannerBorderRounding=?
        WHERE id=?`;
        await conn.query(query, [bannerRowsHeader, bannerRowsIndexTop, bannerRowsIndexBottom, bannerRowsSideTop, bannerRowsSideBottom, bannerRowsArticleTop, bannerRowsArticleBottom, bannerRowsCustom, bannerGapDesktop, bannerGapMobile, bannerBorderRounding, result[0].id]);
        res.redirect('/admin/setting');
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/setting');
  }
};

exports.sms = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      if (result.length) {
        const { smsCallerId, smsServiceId, smsAccessKeyId, smsSecretKeyId } = req.body;
        const query = `UPDATE setting
        SET smsCallerId=?, smsServiceId=?, smsAccessKeyId=?, smsSecretKeyId=?
        WHERE id=?`;
        await conn.query(query, [smsCallerId, smsServiceId, smsAccessKeyId, smsSecretKeyId, result[0].id]);
        res.redirect('/admin/setting');
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/setting');
  }
};

exports.seo = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      if (result.length) {
        const { naverSiteVerification, metaTagKeyword } = req.body;
        const query = `UPDATE setting
        SET naverSiteVerification=?, metaTagKeyword=?
        WHERE id=?`;
        await conn.query(query, [naverSiteVerification, metaTagKeyword, result[0].id]);
        res.redirect('/admin/setting');
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/setting');
  }
};

exports.adsense = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      if (result.length) {
        const { side, top, bottom, custom } = req.body;
        const query = `UPDATE setting
        SET adsenseSide=?, adsenseTop=?, adsenseBottom=?, adsenseCustom=?
        WHERE id=?`;
        await conn.query(query, [side, top, bottom, custom, result[0].id]);
        res.redirect('/admin/setting');
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/setting');
  }
};

exports.etc = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      if (result.length) {
        const { useArticleViewCount, useVisitCount, useChat, useSMS, usePermissionImage, usePointWithdraw, pointWithdrawLimit, visitPoint, invitePoint } = req.body;
        const query = `UPDATE setting
        SET useArticleViewCount=?, useVisitCount=?, useChat=?, useSMS=?, usePermissionImage=?, usePointWithdraw=?, pointWithdrawLimit=?, visitPoint=?, invitePoint=?
        WHERE id=?`;
        await conn.query(query, [useArticleViewCount, useVisitCount, useChat, useSMS, usePermissionImage, usePointWithdraw, pointWithdrawLimit, visitPoint, invitePoint, result[0].id]);
        res.redirect('/admin/setting');
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
    res.redirect('/admin/setting');
  }
};

exports.castBroadcast = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { method } = req;
      if (method === 'GET') {
        const [youtubeInfos, ] = await conn.query(`SELECT * FROM plugin_youtube ORDER BY id DESC LIMIT 1`);
        const youtubeInfo = youtubeInfos[0];
        const youtubeLive = youtube.getYoutubeLive();
        const videoId = youtube.getVideoId();
        const youtubeBotStatus = null;
        res.render('plugin/cast/broadcast', {
          pageTitle: '방송',
          youtubeInfo,
          youtubeLive,
          videoId,
          youtubeBotStatus,
        });
      } else if (method === 'POST') {
        // const { submit } = req.body;
        // if (submit === 'start') {
        //   const [youtubeInfo, ] = await conn.query(`SELECT * FROM plugin_youtube ORDER BY id DESC LIMIT 1`);
        //   const youtubeLive = await youtube.getLiveParse();
        //   if (youtubeLive) {
        //     flash.create({
        //       status: 200,
        //       message: '방송이 시작되었습니다',
        //     });
        //   } else {
        //     flash.create({
        //       status: 400,
        //       message: '방송이 시작되지 않았습니다',
        //     });
        //   }
        // } else if (submit === 'stop') {
        //   youtube.youtubeLive = null;
        // }
        res.redirect('/admin/broadcast');
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.castBroadcastEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { channelId, apiKey } = req.body;
      const [youtubes, ] = await conn.query(`SELECT * FROM plugin_youtube ORDER BY id DESC LIMIT 1`);
      const youtube = youtubes[0];
      await conn.query(`UPDATE plugin_youtube SET channelId=?, apiKey=? WHERE id=?`, [channelId, apiKey, youtube.id]);
      res.redirect('/admin/broadcast');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.castPowerball = async (req, res, next) => {
  try {
    res.render('plugin/cast/powerball', {
      pageTitle: '파워볼',
    });
  } catch (e) {
    console.log(e);
  }
};

exports.botStatus = async (req, res, next) => {
  try {
    const { submit } = req.body;
    if (submit === 'start') {
      youtubeBot.start();
    } else if (submit === 'stop') {
      youtubeBot.stop();
    }
    res.redirect('/admin/broadcast');
  } catch (e) {
    console.log(e);
  }
};

exports.landing = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { method } = req;
      if (method === 'GET') {
        const [landingResult, ] = await conn.query(`SELECT * FROM plugin_landing ORDER BY id DESC LIMIT 1`);
        const [landingBanners, ] = await conn.query(`SELECT * FROM plugin_landingBanner ORDER BY viewOrder`);
        if (landingResult.length) {
          const landing = landingResult[0];
          res.render('plugin/landing', {
            pageTitle: '랜딩페이지',
            landing,
            landingBanners,
          });
        }
      } else if (method === 'POST') {
        const { submit } = req.body;
        const [landingResult, ] = await conn.query(`SELECT * FROM plugin_landing ORDER BY id DESC LIMIT 1`);
        const landing = landingResult[0];
        if (submit === 'main') {
          const { mainWidth, subTitle } = req.body;
          await conn.query(`UPDATE plugin_landing SET mainWidth=?, subTitle=? WHERE id=?`, [mainWidth, subTitle, landing.id]);
        } else if (submit === 'image') {
          let logoImage = null, backgroundVideo = null;
          if (req.files.logoImage) logoImage = req.files.logoImage[0].key || null;
          if (req.files.backgroundVideo) backgroundVideo = req.files.backgroundVideo[0].key || null;
          if (logoImage && backgroundVideo) {
            await conn.query(`UPDATE plugin_landing SET logoImage=?, backgroundVideo=? WHERE id=?`, [logoImage, backgroundVideo, landing.id]);
          } else if (logoImage) {
            await conn.query(`UPDATE plugin_landing SET logoImage=? WHERE id=?`, [logoImage, landing.id]);
          } else if (backgroundVideo) {
            await conn.query(`UPDATE plugin_landing SET backgroundVideo=? WHERE id=?`, [backgroundVideo, landing.id]);
          }

          // Delete Old Image
          if (logoImage && landing.logoImage) {
            const key = landing.logoImage;
            const params = {
              Bucket: bucket,
              Key: key,
            };
            landingS3.deleteObject(params, async (err, data) => {
              if (err) {
                console.log(err);
              }
            });
          }
          if (backgroundVideo && landing.backgroundVideo) {
            const key = landing.backgroundVideo;
            const params = {
              Bucket: bucket,
              Key: key,
            };
            landingBackgroundVideoS3.deleteObject(params, async (err, data) => {
              if (err) {
                console.log(err);
              }
            });
          }
        } else if (submit === 'url') {
          const { targetUrl, twitterUrl } = req.body;
          await conn.query(`UPDATE plugin_landing SET targetUrl=?, twitterUrl=? WHERE id=?`, [targetUrl, twitterUrl, landing.id]);
        } else if (submit === 'content') {
          const { content } = req.body;
          await conn.query(`UPDATE plugin_landing SET content=? WHERE id=?`, [content, landing.id]);
        } else if (submit === 'tags') {
          let tags = req.body.tags || null;
          tags = tags.replaceAll(' ', '');
          await conn.query(`UPDATE plugin_landing SET tags=? WHERE id=?`, [tags, landing.id]);
        }
        res.redirect('/admin/landing');
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.landingBannerNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { file } = req;
      const { targetUrl, viewOrder } = req.body;
      await conn.query(`INSERT INTO plugin_landingBanner (image, targetUrl, viewOrder) VALUES (?, ?, ?)`, [file.key, targetUrl, viewOrder]);
      res.redirect('/admin/landing');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.landingBannerEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { submit } = req.body;
      if (submit === 'hide') {
        const [banners, ] = await conn.query(`SELECT * FROM plugin_landingBanner WHERE id=?`, [id]);
        if (banners.length) {
          const banner = banners[0];
          if (banner.status) {
            await conn.query(`UPDATE plugin_landingBanner SET status=? WHERE id=?`, [0, id]);
          } else {
            await conn.query(`UPDATE plugin_landingBanner SET status=? WHERE id=?`, [1, id]);
          }
        }
      } else if (submit === 'edit') {
        const { targetUrl, viewOrder } = req.body;
        await conn.query(`UPDATE plugin_landingBanner SET targetUrl=?, viewOrder=? WHERE id=?`, [targetUrl, viewOrder, id]);
      } else if (submit === 'delete') {
        // Delete Old Image
        const [banners, ] = await conn.query(`SELECT * FROM plugin_landingBanner WHERE id=?`, [id]);
        const banner = banners[0];
        const key = banner.image;
        const params = {
          Bucket: bucket,
          Key: key,
        };
        landingBannerS3.deleteObject(params, async (err, data) => {
          if (err) {
            console.log(err);
          }
        });

        await conn.query(`DELETE FROM plugin_landingBanner WHERE id=?`, [id]);
      }
      res.redirect('/admin/landing');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.landingBackground = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      res.redirect('/admin/landing');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.serverSchedule = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const pnQuery = `SELECT count(*) AS count FROM plugin_serverSchedule`;
      const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
      const query = `SELECT *, date_format(openDate, '%Y-%m-%d') AS datetime
      FROM plugin_serverSchedule
      ORDER BY id DESC
      ${pn.queryLimit}`;
      const [serverSchedules, ] = await conn.query(query);
      res.render('plugin/newdayserver/serverSchedule', {
        pageTitle: '서버 스케쥴',
        serverSchedules,
        pn,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.serverScheduleNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { openDate, score, type, serverName, comment, link } = req.body;
      const query = `INSERT INTO plugin_serverSchedule
      (openDate, score, type, serverName, comment, link)
      VALUES (?, ?, ?, ?, ?, ?)`;
      await conn.query(query, [openDate, score, type, serverName, comment, link]);
      res.redirect('/admin/serverSchedule');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.serverScheduleEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { submit } = req.body;
      if (submit === 'edit') {
        const { id, openDate, score, type, serverName, comment, link } = req.body;
        const query = `UPDATE plugin_serverSchedule
        SET openDate=?, score=?, type=?, serverName=?, comment=?, link=?
        WHERE id=?`;
        await conn.query(query, [openDate, score, type, serverName, comment, link, id]);
        res.redirect('/admin/serverSchedule');
      } else if (submit === 'delete') {
        const { id } = req.body;
        const query = `DELETE FROM plugin_serverSchedule
        WHERE id=?`;
        await conn.query(query, [id]);
        res.redirect('/admin/serverSchedule');
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.domainSell = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const pnQuery = `SELECT count(*) AS count FROM plugin_domainSell`;
      const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
      const query = `SELECT *
      FROM plugin_domainSell ORDER BY id DESC
      ${pn.queryLimit}`;
      const [domainSellList, ] = await conn.query(query);
      res.render('plugin/domain/domainSell', {
        pageTitle: ``,
        domainSellList,
        pn,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.domainSellNew = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { saleTerm, type, domainName, domainPrice } = req.body;
      const [result, ] = await conn.query(`SELECT * FROM plugin_domainSell WHERE domainName=?`, [domainName]);
      if (!result.length) {
        const query = `INSERT INTO plugin_domainSell
        (saleTerm, type, domainName, domainPrice)
        VALUES (?, ?, ?, ?)`;
        await conn.query(query, [saleTerm, type, domainName, domainPrice]);
      } else {
        flash.create({
          status: 400,
          message: `이미 등록된 도메인입니다`,
        });
      }
      res.redirect('/admin/domain/sell');
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.domainSellEdit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { submit } = req.body;
      const { id } = req.params;
      if (submit === 'edit') {
        const { status, saleTerm, type, domainName, domainPrice } = req.body;
        const query = `UPDATE plugin_domainSell
        SET status=?, saleTerm=?, type=?, domainName=?, domainPrice=?
        WHERE id=?`;
        await conn.query(query, [status, saleTerm, type, domainName, domainPrice, id]);
      } else if (submit === 'delete') {
        await conn.query(`DELETE FROM plugin_domainSell WHERE id=?`, [id]);
      }
      res.redirect('/admin/domain/sell');
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
      const { method } = req;
      if (method === 'GET') {
        const pnQuery = `SELECT count(*) AS count FROM plugin_domainBuy`;
        const pn = await pagination(pnQuery, req.query, 'page', 10, 5);
        const query = `SELECT b.*, s.type, s.domainName
        FROM plugin_domainBuy AS b
        JOIN plugin_domainSell AS s
        ON domainBuy_domainSell_ID = s.id
        ORDER BY b.id DESC
        ${pn.queryLimit}`;
        const [domainBuyList, ] = await conn.query(query);
        domainBuyList.forEach(d => {
          d.datetime = moment(d.createdAt).tz(timezone).format('YY-MM-DD HH:mm:ss');
        });
        res.render('plugin/domain/domainBuy', {
          pageTitle: `삽니다`,
          domainBuyList,
          pn,
        });
      } else if (method === 'POST') {
        
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};