const fs = require('fs');
const path = require('path');
const { timezone } = require('../config');
const lang = require('../config.json').language;
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const pool = require('../middleware/database');
const arrayAlign = require('../middleware/arrayalign');
const chat = require('../middleware/chat');
const axios = require('axios');
const cheerio = require('cheerio');
const { sendMessage } = require('../middleware/sendMessage');
const datetime = require('../middleware/datetime');

/* AWS S3 */
const AWS = require('aws-sdk');
let s3 = null;
if (process.env.NODE_ENV === 'development') {
  s3 = require('../config').s3.development;
} else {
  s3 = require('../config').s3.production;
}
const { accessKeyId, secretAccessKey, region, bucket, host, endpoint } = s3;

const userImageSpacesEndpoint = new AWS.Endpoint(`${endpoint}/userImage`);
const userImageS3 = new AWS.S3({
    endpoint: userImageSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

exports.userImage = async (req, res, next) => {
  const user = res.locals.user;
  const { file } = req;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(`UPDATE user SET image=? WHERE id=?`, [file.key, user.id]);

      const key = user.image || null;
      if (key) {
        const params = {
          Bucket: bucket,
          Key: key,
        };
        await userImageS3.deleteObject(params, (err, data) => {
          if (err) {
            console.log(err);
          }
        }).promise();
      }
      res.send({
        key: file.key,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.idCheck = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { uId } = req.body;
      const [result, ] = await conn.query(`SELECT * FROM user WHERE uId=?`, [uId]);
      if (result.length) {
        res.send(false);
      } else {
        res.send(true);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.nickNameCheck = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { nickName } = req.body;
      const [result, ] = await conn.query(`SELECT * FROM user WHERE nickName=?`, [nickName]);
      if (result.length) {
        res.send(false);
      } else {
        res.send(true);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.phoneVerify = async (req, res, next) => {
  try {
    const phoneNumberRaw = req.body.phoneNumber;
    const phoneNumber = phoneNumberRaw.replace(/-/ig, '');
    const verifyNumber = Math.random().toString().slice(3, 7);
    // console.log(phoneNumber, verifyNumber);
    sendMessage(phoneNumber, `[${res.locals.setting.siteName}] 인증번호는 ${verifyNumber} 입니다`);
    req.session.verifyNumber = verifyNumber;
    req.session.save();
  } catch (e) {
    console.log(e);
  }
};

exports.phoneVerifyComplete = async (req, res, next) => {
  try {
    const { verifyNumber } = req.body;
    if (verifyNumber === req.session.verifyNumber) {
      res.send(true);
    } else {
      res.send(false);
    }
  } catch (e) {
    console.log(e);
  }
};

exports.getLang = (req, res, next) => {
  try {
    const language = fs.readFileSync(`./locales/${lang}.json`);
    res.send(language);
  } catch (e) {
    console.log(e);
  }
};

exports.getCountryCode = (req, res, next) => {
  res.send(lang);
};

exports.usePermissionImage = (req, res, next) => {
  let usePermissionImage
  if (res.locals.setting.usePermissionImage) {
    usePermissionImage = true;
  } else {
    usePermissionImage = false;
  }
  res.status(200).send(usePermissionImage);
};

exports.getLink = async (req, res, next) => {
  try {
    const { url } = req.query;
    const result = await axios.get(url);
    const html = result.data;
    const $ = cheerio.load(html);
    const title = $('title').text();
    const description = $(`meta[name="description"]`).attr("content");
    if ($(`meta[property="og:image"]`)) {
      const imageUrl = $(`meta[property="og:image"]`).attr("content");
      res.send({
        success: 1,
        meta: {
          title,
          description,
          image: {
            url: imageUrl,
          },
        },
      });
    }
  } catch (e) {
    console.log(e);
  }
};

exports.getContent = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { id } = req.body;
      const [result, ] = await conn.query(`SELECT content FROM article WHERE id=?`, [id]);
      const data = JSON.parse(result[0].content);
      res.send(data);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
}

exports.getContentPage = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { slug } = req.body;
      const [result, ] = await conn.query(`SELECT content FROM page WHERE slug=?`, [slug]);
      const data = JSON.parse(result[0].content);
      res.send(data);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
}

exports.getChat = async (req, res, next) => {
  try {
    const oldChat = await chat.get();
    res.send(oldChat);
  } catch (e) {
    console.log(e);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const selected = req.body.data.selected;
      const query = `SELECT *
      FROM category
      WHERE category_board_ID=?`;
      const [categories, ] = await conn.query(query, [selected]);
      if (categories.length) {
        res.send(categories);
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

exports.getUser = (req, res, next) => {
  let isLogin = false, isAdmin = false;
  if (res.locals.user) {
    isLogin = true;
    const user = res.locals.user;
    if (user.permission === 10) {
      isAdmin = true;
    }
    res.send({
      status: 200,
      isLogin,
      isAdmin,
      user: {
        id: user.id,
        nickName: user.nickName,
        permission: user.permission,
      },
    });
  } else {
    res.send({
      status: 401,
      isLogin,
      isAdmin,
      message: '로그인 필요',
    })
  }
};

exports.like = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { articleId } = req.body;
      const [result, ] = await conn.query(`SELECT * FROM userArticleLike WHERE userArticleLike_user_ID=? AND userArticleLike_article_ID=?`,[res.locals.user.id, articleId]);
      if (!result.length) { // 추천 내역이 없을 경우 (count + 1)
        const insertQuery = `INSERT INTO userArticleLike
        (userArticleLike_user_ID, userArticleLike_article_ID)
        VALUES (?, ?)`;
        await conn.query(insertQuery, [res.locals.user.id, articleId]);
        await conn.query(`UPDATE article SET likeCount=likeCount+1 WHERE id=?`, [articleId]);
      } else { // 추천 내역이 있을 경우 (count - 1)
        const deleteQuery = `DELETE FROM userArticleLike
        WHERE userArticleLike_user_ID=? AND userArticleLike_article_ID`;
        await conn.query(deleteQuery, [res.locals.user.id, articleId]);
        await conn.query(`UPDATE article SET likeCount=likeCount-1 WHERE id=?`, [articleId]);
      }
      res.send(true);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.getComment = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { articleId } = req.body;
      const commentsQuery = `SELECT c.*, a.article_user_ID AS articleUserId, u.id AS userId, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName
      FROM comment AS c
      LEFT JOIN user AS u
      ON c.comment_user_ID = u.id
      LEFT JOIN article AS a
      ON c.comment_article_ID = a.id
      LEFT JOIN permission AS p
      ON u.permission = p.permission
      WHERE comment_article_ID=?`;
      const [commentsOrigin, ] = await conn.query(commentsQuery, [articleId]);
      commentsOrigin.forEach(c => {
        c.datetime = datetime(c.createdAt);
        if (res.locals.user && c.comment_user_ID === res.locals.user.id) c.isAuthor = true;
        if (Number(c.permissionName)) {
          c.permissionName = `LV ${Number(c.permissionName)}`;
        }
      });
      for (let i = 0; i < commentsOrigin.length; i ++) {
        if (res.locals.user) {
          const [userLikeResult, ] = await conn.query(`SELECT * FROM userCommentLike WHERE userCommentLike_user_ID=? AND userCommentLike_comment_ID=?`, [res.locals.user.id, commentsOrigin[i].id]);
          const userLike = userLikeResult.length ? 1 : 0;
          commentsOrigin[i].userLike = userLike;
        } else {
          commentsOrigin[i].userLike = 0;
        }
      }
      const comments = arrayAlign(commentsOrigin);
      if (comments) {
        res.send({
          message: '댓글 가져오기 성공',
          comments,
        });
      } else {
        res.status(401).send({
          message: '댓글 가져오기 실패',
        });
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

// Article
exports.deleteArticle = async (req, res, next) => {
  try {
    const { articleId } = req.body;
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM article WHERE id=?`, [articleId]);
      if (result.length) {
        const article = result[0];
        if (res.locals.user.id === article.article_user_ID) {
          await conn.query(`UPDATE article SET status=0 WHERE id=?`, [articleId]);
          res.send({
            message: '글 삭제 성공',
          });
        }
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
}


exports.newComment = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { articleId } = req.body;
      let { content } = req.body;
      const anonymous = req.body.anonymous || 0;
      const tagRegex = new RegExp(/<[^>]*>/g);
      content = content.replace(tagRegex, '');
      content = content.replace(/\n/ig, '<br>');
      const userId = res.locals.user.id;
      conn.beginTransaction();
      const query = `INSERT INTO comment
      (comment_user_ID, comment_article_ID, anonymous, content)
      VALUES (?, ?, ?, ?)`;
      const [result, ] = await conn.query(query, [userId, articleId, anonymous, content]);
      const uId = result.insertId;
      await conn.query(`UPDATE comment SET comment_group_id=? WHERE id=?`, [uId, uId]);
      await conn.query(`UPDATE article SET commentCount=commentCount+1, updatedAt=NOW() WHERE id=?`, [articleId]);

      // 포인트
      const [articles, ] = await conn.query(`SELECT * FROM article WHERE id=?`, [articleId]);
      const article = articles[0];
      const [boards, ] = await conn.query(`SELECT * FROM board WHERE id=?`, [article.article_board_ID]);;
      const board = boards[0];
      const [users, ] = await conn.query(`SELECT * FROM user WHERE id=?`, userId);
      const user = users[0];
      const insertQuery = `INSERT INTO point
      (point_user_ID, point_board_ID, point_article_ID, point_comment_ID, type, point)
      VALUES (?, ?, ?, ?, ?, ?)`;
      await conn.query(insertQuery, [userId, board.id, article.id, result.insertId, 'commentWrite', board.commentPoint]);
      const updateQuery = `UPDATE user
      SET point=?
      WHERE id=?`;
      await conn.query(updateQuery, [user.point + board.commentPoint, user.id]);

      // 커밋
      await conn.commit();

      if (result) {
        res.send({
          message: '댓글 등록 성공',
        });
      } else {
        res.status(401).send({
          message: '댓글 등록 실패',
        });
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.replyComment = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { articleId, commentParentId, commentGroupId } = req.body;
      const anonymous = req.body.anonymous || 0;
      let { content } = req.body;
      const tagRegex = new RegExp(/<[^>]*>/g);
      content = content.replace(tagRegex, '');
      content = content.replace(/\n/ig, '<br>');
      const insertQuery = `INSERT INTO comment
      (comment_user_ID, comment_article_ID, comment_parent_id, comment_group_id, anonymous, content)
      VALUES (?, ?, ?, ?, ?, ?)`;
      const userId = res.locals.user.id;
      const [result, ] = await conn.query(insertQuery, [userId, articleId, commentParentId, commentGroupId, anonymous, content]);
      if (commentParentId === commentGroupId) {
        await conn.query(`UPDATE comment SET replyCount=replyCount+1 WHERE id=?`, [commentParentId]);
      } else {
        await conn.query(`UPDATE comment SET replyCount=replyCount+1 WHERE id=?`, [commentParentId]);
        await conn.query(`UPDATE comment SET replyCount=replyCount+1 WHERE id=?`, [commentGroupId]);
      }
      await conn.query(`UPDATE article SET commentCount=commentCount+1, updatedAt=NOW() WHERE id=?`, [articleId]);
      if (result.insertId) {
        res.send(true);
      } else {
        res.status(401).send(false);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.editComment = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { commentId } = req.body;
      const anonymous = req.body.anonymous || 0;
      let { content } = req.body;
      const tagRegex = new RegExp(/<[^>]*>/g);
      content = content.replace(tagRegex, '');
      content = content.replace(/\n/ig, '<br>');
      const query = `UPDATE comment SET anonymous=?, content=? WHERE id=?`;
      const [result, ] = await conn.query(query, [anonymous, content, commentId]);
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

exports.deleteComment = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { articleId, commentGroupId, commentId } = req.body;
      let { commentParentId } = req.body;
      if (commentParentId === 'null') commentParentId = null;
      // 검증 기능 추가
      await conn.beginTransaction();
      await conn.query(`UPDATE comment SET status=0 WHERE id=?`, [commentId]);
      if (commentParentId && commentParentId === commentGroupId) {
        await conn.query(`UPDATE comment SET replyCount=replyCount-1 WHERE id=?`, [commentParentId]);
      } else if (commentParentId && commentParentId !== commentGroupId) {
        await conn.query(`UPDATE comment SET replyCount=replyCount-1 WHERE id=?`, [commentParentId]);
        await conn.query(`UPDATE comment SET replyCount=replyCount-1 WHERE id=?`, [commentGroupId]);
      }
      await conn.query(`UPDATE article SET commentCount=commentCount-1, updatedAt=NOW() WHERE id=?`, [articleId]);

      // 포인트
      const [comments, ] = await conn.query(`SELECT * FROM comment WHERE id=?`, [commentId]);
      const comment = comments[0];
      const [users, ] = await conn.query(`SELECT * FROM user WHERE id=?`, [comment.comment_user_ID]);
      const user = users[0];
      const [articles, ] = await conn.query(`SELECT * FROM article WHERE id=?`, comment.comment_article_ID);
      const article = articles[0];
      const [boards, ] = await conn.query(`SELECT * FROM board WHERE id=?`, [article.article_board_ID]);
      const board = boards[0];
      const insertQuery = `INSERT INTO point
      (point_user_ID, point_board_ID, point_article_ID, point_comment_ID, type, point)
      VALUES (?, ?, ?, ?, ?, ?)`;
      await conn.query(insertQuery, [user.id, board.id, article.id, comment.id, 'commentDelete', board.commentPoint * -1]);
      const updateQuery = `UPDATE user
      SET point=?
      WHERE id=?`;
      await conn.query(updateQuery, [user.point + board.commentPoint * -1, user.id]);

      // 커밋
      await conn.commit();
      res.send(true);
    } catch (e) {
      console.log(e);
      await conn.rollback();
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.likeComment = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { commentId } = req.body;
      const userId = res.locals.user.id;
      const query = `SELECT *
      FROM userCommentLike
      WHERE userCommentLike_user_ID=? AND userCommentLike_comment_ID=?`;
      const [result, ] = await conn.query(query, [userId, commentId]);
      if (!result.length) {
        await conn.query(`INSERT INTO userCommentLike (userCommentLike_user_ID, userCommentLike_comment_ID) VALUES (?, ?)`, [userId, commentId]);
        await conn.query(`UPDATE comment SET likeCount=likeCount+1 WHERE id=?`, [commentId]);
      } else {
        await conn.query(`DELETE FROM userCommentLike WHERE id=?`, [result[0].id]);
        await conn.query(`UPDATE comment SET likeCount=likeCount-1 WHERE id=?`, [commentId]);
      }
      res.send(true);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};