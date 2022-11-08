const fs = require('fs');
const path = require('path');
const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const rimraf = require('rimraf');
const sharp = require('sharp');
const pool = require('../middleware/database');
const { site } = require('../config');
const flash = require('../middleware/flash');
const pagination = require('../middleware/pagination');
const arrayAlign = require('../middleware/arrayalign');
const { addLog } = require('../middleware/addlog');
const { emptyCheck } = require('../middleware/emptyCheck');
const sizeOf = require('image-size');
const datetime = require('../middleware/datetime');
const { match } = require('../middleware/match');

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

const fileSpacesEndpoint = new AWS.Endpoint(`${endpoint}/file`);
const fileS3 = new AWS.S3({
    endpoint: fileSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

exports.page = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.params;
      const [pages, ] = await conn.query(`SELECT * FROM page WHERE slug=? AND status=1`, [page]);
      if (pages.length) {
        const page = pages[0];
        addLog(req, `${page.title}`);
        if (page.type === 'editor') {
          res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
            type: 'page',
            pageTitle: `${page.title} - ${res.locals.setting.siteName}`,
            page,
          });
        } else if (page.type === 'html') {
          res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
            type: 'page',
            pageTitle: `${page.title} - ${res.locals.setting.siteName}`,
            page,
          });
        }
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { searchType, keyword, category } = req.query;
      if (searchType && keyword) { // 검색 리스트
        const { page } = req.query;
        const { boardSlug } = req.params;
        const [boards, ] = await conn.query(`SELECT * FROM board WHERE slug=?`, [boardSlug]);
        if (boards.length) {
          const board = boards[0];
          const listPermission = board.listPermission;
          const boardName = board.title;
          const boardId = board.id;
          if (res.locals.user && res.locals.user.permission >= listPermission || listPermission === 0) {
            const writePermission = res.locals.user && res.locals.user.permission >= board.writePermission;
            let pnQuery = null, pn = null, query = null;
            let articles = null;
            if (searchType === 'title') { // 제목 검색
              pnQuery = `SELECT count(*) AS count
              FROM article AS a
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN user AS u
              ON a.article_user_ID = u.id
              WHERE b.slug = '${board.slug}' AND a.status=1
              AND a.title LIKE CONCAT('%','${keyword}','%')`;
              pn = await pagination(pnQuery, req.query, 'page', board.listCount, 5);
              query = `SELECT a.*, b.title AS board, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName
              FROM article AS a
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN user AS u
              ON a.article_user_ID = u.id
              LEFT JOIN permission AS p
              ON u.permission = p.permission
              WHERE b.slug = ? AND a.status=1
              AND a.title LIKE CONCAT('%',?,'%')
              ORDER BY notice DESC, id DESC
              ${pn.queryLimit}`;
              [articles, ] = await conn.query(query, [board.slug, keyword]);
            } else if (searchType === 'titleAndContent') { // 제목, 내용 검색
              pnQuery = `SELECT count(*) AS count
              FROM article AS a
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN user AS u
              ON a.article_user_ID = u.id
              WHERE b.slug = '${board}' AND a.status=1
              AND a.title LIKE CONCAT('%','${keyword}','%')
              OR a.content LIKE CONCAT('%','${keyword}','%')`;
              pn = await pagination(pnQuery, req.query, 'page', board.listCount, 5);
              query = `SELECT a.*, b.title AS board, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName
              FROM article AS a
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN user AS u
              ON a.article_user_ID = u.id
              LEFT JOIN permission AS p
              ON u.permission = p.permission
              WHERE b.slug = ? AND a.status=1
              AND a.title LIKE CONCAT('%',?,'%')
              OR b.slug = ? AND a.status=1 AND
              a.content LIKE CONCAT('%',?,'%')
              ORDER BY notice DESC, id DESC
              ${pn.queryLimit}`;
              [articles, ] = await conn.query(query, [boardSlug, keyword, boardSlug, keyword]);
            } else if (searchType === 'nickName') { // 닉네임 검색
              pnQuery = `SELECT count(*) AS count
              FROM article AS a
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN user AS u
              ON a.article_user_ID = u.id
              WHERE b.slug = '${board}' AND a.status=1
              AND u.nickName LIKE CONCAT('%','${keyword}','%')`;
              pn = await pagination(pnQuery, req.query, 'page', board.listCount, 5);
              query = `SELECT a.*, b.title AS board, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName
              FROM article AS a
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN user AS u
              ON a.article_user_ID = u.id
              LEFT JOIN permission AS p
              ON u.permission = p.permission
              WHERE b.slug = ? AND a.status=1
              AND u.nickName LIKE CONCAT('%',?,'%')
              ORDER BY notice DESC, id DESC
              ${pn.queryLimit}`;
              [articles, ] = await conn.query(query, [boardSlug, keyword]);
            }
            articles.forEach(a => {
              a.datetime = datetime(a.createdAt);
              // 등급명 변경
              if (Number(a.permissionName)) {
                a.permissionName = `LV ${Number(a.permissionName)}`;
              }
              const permissionImage = res.locals.permission.find(p => p.permission === a.permission).image;
              if (permissionImage) {
                a.permissionImage = `${res.locals.s3Host}/permission/${permissionImage}`;
              } else {
                a.permissionImage = `/permission/${a.permission}.svg`;
              }
            });
            const [categories, ] = await conn.query(`SELECT * FROM category WHERE category_board_ID=?`, [boardId]);
            addLog(req, `${boardName}`);
            
            for (let i = 0; i < articles.length; i ++) {
              const query = `SELECT image
              FROM image
              WHERE image_article_ID=?
              ORDER BY id ASC`;
              const [images, ] = await conn.query(query, [articles[i].id]);
              if (images[0]) {
                articles[i].image = images[0].image;
                articles[i].imageCount = images.length;
              }
            }
            if (board.type === 'board') {
              res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
                type: 'list',
                pageTitle: `${boardName} - ${res.locals.setting.siteName}`,
                articles,
                boardName,
                boardSlug,
                categories,
                writePermission,
                page,
                searchType,
                keyword,
                category,
                pn,
              });
            } else if (board.type === 'gallery') {
              res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
                type: 'gallery',
                pageTitle: `${boardName} - ${res.locals.setting.siteName}`,
                articles,
                boardName,
                boardSlug,
                categories,
                writePermission,
                page,
                searchType,
                keyword,
                category,
                pn,
              });
            } else if (board.type === 'feed') {
              articles.forEach(a => {
                // a.content = a.content.replace(/<[^>]*>/ig, '');
                a.content = a.content.replace(/<figure class="image">[^>]+><\/figure>/ig, '');
                a.tags = a.tags.replaceAll(/([^,]+)/ig, '#$1 ').replaceAll(',', '');
              });
              res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
                type: 'feed',
                pageTitle: `${boardName} - ${res.locals.setting.siteName}`,
                articles,
                boardName,
                boardSlug,
                categories,
                writePermission,
                page,
                searchType,
                keyword,
                category,
                pn,
              });
            }
          } else { // 권한이 없을 때
            res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
              type: 'permission',
              pageTitle: `권한 없음 - ${res.locals.setting.siteName}`,
              message: 'permission',
            });
          }
        } else {
          next();
        }
      } else { // 일반 리스트
        const { category, page } = req.query;
        const { boardSlug } = req.params;
        const [boards, ] = await conn.query(`SELECT * FROM board WHERE slug=?`, [boardSlug]);
        
        if (boards.length) {
          const board = boards[0];
          const listPermission = board.listPermission;
          const boardName = board.title;
          const boardId = board.id;
          if (res.locals.user && res.locals.user.permission >= listPermission || listPermission === 0) {
            const writePermission = res.locals.user && res.locals.user.permission >= board.writePermission;
            let pnQuery = null;
            if (category) {
              pnQuery = `SELECT count(*) AS count
              FROM article AS a
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN user AS u
              ON a.article_user_ID = u.id
              WHERE b.slug = '${boardSlug}' AND c.id = '${category}'
              AND a.status=1`;
            } else {
              pnQuery = `SELECT count(*) AS count
              FROM article AS a
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN user AS u
              ON a.article_user_ID = u.id
              WHERE b.slug = '${boardSlug}'
              AND a.status=1`;
            }
            const pn = await pagination(pnQuery, req.query, 'page', board.listCount, 5);
            let query = null;
            if (category) {
              query = `SELECT a.*, b.title AS board, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName
              FROM article AS a
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN user AS u
              ON a.article_user_ID = u.id
              LEFT JOIN permission AS p
              ON u.permission = p.permission
              WHERE b.slug = ? AND c.id = '${category}'
              AND a.status=1
              ORDER BY notice DESC, id DESC
              ${pn.queryLimit}`;
            } else {
              query = `SELECT a.*, b.title AS board, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName
              FROM article AS a
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN user AS u
              ON a.article_user_ID = u.id
              LEFT JOIN permission AS p
              ON u.permission = p.permission
              WHERE b.slug = ?
              AND a.status=1
              ORDER BY notice DESC, id DESC
              ${pn.queryLimit}`;
            }
            const [articles, ] = await conn.query(query, [boardSlug]);
            articles.forEach(a => {
              a.datetime = datetime(a.createdAt);
              if (res.locals.user && a.article_user_ID === res.locals.user.id) a.isAuthor = true;
              // 등급명 변경
              if (Number(a.permissionName)) {
                a.permissionName = `LV ${Number(a.permissionName)}`;
              }
              const permissionImage = res.locals.permission.find(p => p.permission === a.permission).image;
              if (permissionImage) {
                a.permissionImage = `${res.locals.s3Host}/permission/${permissionImage}`;
              } else {
                a.permissionImage = `/permission/${a.permission}.svg`;
              }
              if (category && page) {
                a.url = `/${boardSlug}/${a.id}?category=${category}&page=${page}`;
              } else if (category) {
                a.url = `/${boardSlug}/${a.id}?category=${category}`;
              } else if (page) {
                a.url = `/${boardSlug}/${a.id}?page=${page}`;
              } else {
                a.url = `/${boardSlug}/${a.id}`;
              };
            });
            const [categories, ] = await conn.query(`SELECT * FROM category WHERE category_board_ID=?`, [boardId]);
            addLog(req, `${boardName}`);

            for (let i = 0; i < articles.length; i ++) {
              const query = `SELECT image
              FROM image
              WHERE image_article_ID=?
              ORDER BY id ASC`;
              const [images, ] = await conn.query(query, [articles[i].id]);
              if (images[0]) {
                articles[i].image = images[0].image;
                articles[i].imageCount = images.length;
              }
            }
            articles.forEach(a => {
              // Youtube
              const longRegex = /<oembed url="[^=]+=([A-z0-9-]+)"><\/oembed>/;
              const shortRegex = /<oembed url="[^"]+youtu.be\/([^"]+)"><\/oembed>/;

              if (a.content.match(longRegex) && !a.image || a.content.match(shortRegex) && !a.image) {
                let youtubeId = null;
                if (a.content.match(longRegex)) {
                  youtubeId = a.content.match(longRegex)[1];
                } else if (a.content.match(shortRegex)) {
                  youtubeId = a.content.match(shortRegex)[1];
                }
                a.youtube = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
              }
            });
            if (board.type === 'board') { // Board
              res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
                type: 'list',
                pageTitle: `${boardName} - ${res.locals.setting.siteName}`,
                articles,
                board,
                boardName,
                boardSlug,
                categories,
                writePermission,
                page,
                category,
                pn,
              });
            } else if (board.type === 'gallery' || board.type === 'bookmark') { // Gallery
              res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
                pageTitle: `${boardName} - ${res.locals.setting.siteName}`,
                type: board.type,
                articles,
                board,
                boardName,
                boardSlug,
                categories,
                writePermission,
                page,
                category,
                pn,
              });
            } else if (board.type === 'feed') {
              articles.forEach(a => {
                // a.content = a.content.replace(/<[^>]*>/ig, '');
                a.content = a.content.replace(/<figure class="image">[^>]+><\/figure>/ig, '');
                a.tags = a.tags.replaceAll(/([^,]+)/ig, '#$1 ').replaceAll(',', '');
              });
              res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
                pageTitle: `${boardName} - ${res.locals.setting.siteName}`,
                type: 'feed',
                articles,
                board,
                boardName,
                boardSlug,
                categories,
                writePermission,
                page,
                category,
                pn,
              });
            }
          } else { // 리스트 권한이 없을 때
            if (!res.locals.user) {
              res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
                type: 'permission',
                pageTitle: `권한 없음 - ${res.locals.setting.siteName}`,
                message: 'needLogin',
              });
            } else {
              res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
                type: 'permission',
                pageTitle: `권한 없음 - ${res.locals.setting.siteName}`,
                message: 'permission',
              });
            }
          }
        } else {
          next();
        }
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.read = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { page } = req.query;
      const { category } = req.query;
      const { id, boardSlug } = req.params;
      const [boards, ] = await conn.query(`SELECT * FROM board WHERE slug=?`, boardSlug);
      if (boards.length) {
        const board = boards[0];
        const readPermission = board.readPermission;
        if (res.locals.user && res.locals.user.permission >= readPermission || readPermission === 0) {
          const commentPermission = res.locals.user && res.locals.user.permission >= board.commentPermission || null;
          const boardName = board.title;
          const query = `SELECT a.*, b.title AS board, b.slug AS boardSlug, c.id AS cid, c.title AS category, c.color AS categoryColor, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName
          FROM article AS a
          LEFT JOIN board AS b
          ON a.article_board_ID = b.id
          LEFT JOIN category AS c
          ON a.article_category_ID = c.id
          LEFT JOIN user AS u
          ON a.article_user_ID = u.id
          LEFT JOIN permission AS p
          ON u.permission = p.permission
          WHERE a.id=?`;
          const [articleResult, ] = await conn.query(query, [id]);
          if (articleResult.length) {
            const article = articleResult[0];
            if (res.locals.user) {
              const [userLikeResult, ] = await conn.query(`SELECT * FROM userArticleLike WHERE userArticleLike_user_ID=? AND userArticleLike_article_ID=?`, [res.locals.user.id, article.id]);
              const userLike = userLikeResult.length ? 1 : 0;
              article.userLike = userLike;
            } else {
              article.userLike = 0;
            }
            // 로그인 시 포인트 내역 조회
            let pointLogs = null;
            if (res.locals.user) {
              const query = `SELECT *
              FROM point
              WHERE point_article_ID=?
              AND point_user_ID=?`;
              [pointLogs, ] = await conn.query(query, [article.id, res.locals.user.id]);
            }
            // 포인트 체크
            if (!board.readPoint || res.locals.user && article.article_user_ID === res.locals.user.id || res.locals.user && pointLogs.length || res.locals.user && res.locals.user.point >= board.readPoint || board.readPoint === 0) {
              article.datetime = datetime(article.createdAt);
              if (article.tags) {
                article.tags = article.tags.replaceAll(',', ', ');
              }

              // OG
              const query = `SELECT image
              FROM image
              WHERE image_article_ID=?
              ORDER BY id ASC`;
              const [images, ] = await conn.query(query, [article.id]);
              if (images[0]) {
                article.image = images[0].image;
                article.imageCount = images.length;
              }
              const longRegex = /<oembed url="[^=]+=([A-z0-9-]+)"><\/oembed>/;
              const shortRegex = /<oembed url="[^"]+youtu.be\/([^"]+)"><\/oembed>/;

              if (article.content.match(longRegex) && !article.image || article.content.match(shortRegex) && !article.image) {
                let youtubeId = null;
                if (article.content.match(longRegex)) {
                  youtubeId = article.content.match(longRegex)[1];
                } else if (article.content.match(shortRegex)) {
                  youtubeId = article.content.match(shortRegex)[1];
                }
                article.youtube = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
              }
              if (article.image) {
                article.ogImage = `${res.locals.s3Host}/article/${article.image}`;
              } else if (article.youtube) {
                article.ogImage = article.youtube;
              } else {
                article.ogImage = `/favicon/original.png`;
              }
              article.ogContent = article.content
                .replace(/<[^>]*>/ig, '')
                .replace(/&nbsp;/ig, '')
                .slice(0, 150);
              article.url = `${res.locals.setting.siteDomain}/${boardSlug}/${article.id}`;
              
              // Comments
              const commentsQuery = `SELECT c.*, u.id AS userId, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName
              FROM comment AS c
              LEFT JOIN user AS u
              ON c.comment_user_ID = u.id
              LEFT JOIN permission AS p
              ON u.permission = p.permission
              WHERE comment_article_ID=?`;
              const [commentsOrigin, ] = await conn.query(commentsQuery, [id]);
              commentsOrigin.forEach(c => {
                c.datetime = datetime(c.createdAt);
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

              // 게시물 목록
              let pnQuery = null;
              if (category) {
                pnQuery = `SELECT count(*) AS count
                FROM article AS a
                LEFT JOIN board AS b
                ON a.article_board_ID = b.id
                LEFT JOIN category AS c
                ON a.article_category_ID = c.id
                LEFT JOIN user AS u
                ON a.article_user_ID = u.id
                WHERE b.slug = '${boardSlug}' AND c.id = '${category}'
                AND a.status=1`;
              } else {
                pnQuery = `SELECT count(*) AS count
                FROM article AS a
                LEFT JOIN board AS b
                ON a.article_board_ID = b.id
                LEFT JOIN category AS c
                ON a.article_category_ID = c.id
                LEFT JOIN user AS u
                ON a.article_user_ID = u.id
                WHERE b.slug = '${boardSlug}'
                AND a.status=1`;
              }
              const pn = await pagination(pnQuery, req.query, 'page', board.listCount, 5);
              let articlesQuery = null;
              if (category) {
                articlesQuery = `SELECT a.*, b.title AS board, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName
                FROM article AS a
                LEFT JOIN board AS b
                ON a.article_board_ID = b.id
                LEFT JOIN category AS c
                ON a.article_category_ID = c.id
                LEFT JOIN user AS u
                ON a.article_user_ID = u.id
                LEFT JOIN permission AS p
                ON u.permission = p.permission
                WHERE b.slug = ? AND c.id = '${category}'
                AND a.status=1
                ORDER BY notice DESC, id DESC
                ${pn.queryLimit}`;
              } else {
                articlesQuery = `SELECT a.*, b.title AS board, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName
                FROM article AS a
                LEFT JOIN board AS b
                ON a.article_board_ID = b.id
                LEFT JOIN category AS c
                ON a.article_category_ID = c.id
                LEFT JOIN user AS u
                ON a.article_user_ID = u.id
                LEFT JOIN permission AS p
                ON u.permission = p.permission
                WHERE b.slug = ?
                AND a.status=1
                ORDER BY notice DESC, id DESC
                ${pn.queryLimit}`;
              }
              const [articles, ] = await conn.query(articlesQuery, [boardSlug]);
              articles.forEach(a => {
                a.datetime = datetime(a.createdAt);
                if (res.locals.user && a.article_user_ID === res.locals.user.id) a.isAuthor = true;
                // 등급명 변경
                if (Number(a.permissionName)) {
                  a.permissionName = `LV ${Number(a.permissionName)}`;
                }
                const permissionImage = res.locals.permission.find(p => p.permission === a.permission).image;
                if (permissionImage) {
                  a.permissionImage = `${res.locals.s3Host}/permission/${permissionImage}`;
                } else {
                  a.permissionImage = `/permission/${a.permission}.svg`;
                }
                if (category && page) {
                  a.url = `/${boardSlug}/${a.id}?category=${category}&page=${page}`;
                } else if (category) {
                  a.url = `/${boardSlug}/${a.id}?category=${category}`;
                } else if (page) {
                  a.url = `/${boardSlug}/${a.id}?page=${page}`;
                } else {
                  a.url = `/${boardSlug}/${a.id}`;
                };
              });
              // 로그 추가
              addLog(req, `${boardName}`, article.id);
              
              // 조회수 증가
              if (req.cookies[article.id] == undefined) {
                res.cookie(article.id, req.ip, {
                  maxAge: 600000,
                });
                await conn.query(`UPDATE article SET viewCount=viewCount+1 WHERE id=?`, [article.id]);
              }
  
              article.content = article.content.replace(longRegex, `<div class="youtube"><iframe src="https://www.youtube.com/embed/$1" allow="fullscreen"></iframe></div>`);
              article.content = article.content.replace(shortRegex, `<div class="youtube"><iframe src="https://www.youtube.com/embed/$1" allow="fullscreen"></iframe></div>`);
  
              // 등급명 변경
              if (Number(article.permissionName)) {
                article.permissionName = `LV ${Number(article.permissionName)}`;
              }
              const permissionImage = res.locals.permission.find(p => p.permission === article.permission).image;
              if (permissionImage) {
                article.permissionImage = `${res.locals.s3Host}/permission/${permissionImage}`;
              } else {
                article.permissionImage = `/permission/${article.permission}.svg`;
              }
              
              comments.forEach(c => {
                if (Number(c.permissionName)) {
                  c.permissionName = `LV ${Number(c.permissionName)}`;
                }
                const permissionImage = res.locals.permission.find(p => p.permission === c.permission).image;
                if (permissionImage) {
                  c.permissionImage = `${res.locals.s3Host}/permission/${permissionImage}`;
                } else {
                  c.permissionImage = `/permission/${c.permission}.svg`;
                }
              });

              // 포인트
              if (res.locals.user) {
                conn.beginTransaction();
                // 포인트 내역이 있으면 (생성안함)
                let pointLogs = null;
                const query = `SELECT *
                FROM point
                WHERE type='read'
                AND point_article_ID=?
                AND point_user_ID=?`;
                [pointLogs, ] = await conn.query(query, [article.id, res.locals.user.id]);
                
                // 포인트 내역이 없으면 (신규)
                if (res.locals.user && res.locals.user.permission !== 10 || !pointLogs.length && res.locals.user && article.article_user_ID !== res.locals.user.id) {
                  const [users, ] = await conn.query(`SELECT * FROM user WHERE id=?`, [res.locals.user.id]);
                  const user = users[0];
                  const [boards, ] = await conn.query(`SELECT * FROM board WHERE id=?`, [article.article_board_ID]);
                  const board = boards[0];
                  const insertQuery = `INSERT INTO point
                  (point_user_ID, point_board_ID, point_article_ID, type, point)
                  VALUES (?, ?, ?, ?, ?)`;
                  await conn.query(insertQuery, [user.id, board.id, article.id, 'read', board.readPoint * -1]);
                  const updateQuery = `UPDATE user
                  SET point=?
                  WHERE id=?`;
                  await conn.query(updateQuery, [user.point + board.readPoint * -1, user.id]);
                }
                // 커밋
                await conn.commit();
              }

              res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
                type: 'read',
                pageTitle: `${article.title} - ${boardName} - ${res.locals.setting.siteName}`,
                boardSlug,
                boardName,
                article,
                comments,
                commentPermission,
                articles,
                page,
                category,
                pn,
              });
            } else {
              res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
                type: 'permission',
                pageTitle: `포인트 부족 - ${res.locals.setting.siteName}`,
                message: 'point',
              });
            }
          } else {
            next();
          }
        } else { // 권한 없음
          if (!res.locals.user) {
            res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
              type: 'permission',
              pageTitle: `권한 없음 - ${res.locals.setting.siteName}`,
              message: 'needLogin',
            });
          } else {
            res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
              type: 'permission',
              pageTitle: `권한 없음 - ${res.locals.setting.siteName}`,
              message: 'permission',
            });
          }
        }
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.new = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { method } = req;
      if (method === 'GET') {
        const { boardSlug } = req.params;
        const [boards, ] = await conn.query(`SELECT * FROM board WHERE slug=?`, [boardSlug]);
        if (boards.length) {
          const board = boards[0];
          if (res.locals.user && res.locals.user.permission >= board.writePermission) {
            const [categories, ] = await conn.query(`SELECT * FROM category WHERE category_board_ID=? ORDER BY viewOrder ASC`, [board.id]);
            res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
              type: 'new',
              pageTitle: `새글 - ${res.locals.setting.siteName}`,
              board,
              categories,
            });
          } else {
            res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
              type: 'permission',
              pageTitle: `권한 없음 - ${res.locals.setting.siteName}`,
              message: 'permission',
            });
          }
        }
      } else if (method === 'POST') {
        const board = req.body.board || null;
        const boardSlug = board || req.params.boardSlug;
        const { title } = req.body;
        const notice = req.body.notice || 0;
        const anonymous = req.body.anonymous || 0;
        let { content } = req.body;
        let { category } = req.body;
        let { tags } = req.body;
        const { link } = req.body;
        let file = {
          key: null,
        };
        file = req.file || file;
        const { customField01, customField02, customField03, customField04, customField05, customField06, customField07, customField08, customField09, customField10 } = req.body;
        if (req.body.category == 0) {
          category = null;
        }
        // Tags
        if (tags) {
          tags = tags.replaceAll(', ', ',');
        }

        conn.beginTransaction();
        const [boards, ] = await conn.query(`SELECT * FROM board WHERE slug=?`, [boardSlug]);
        if (boards.length) {
          // Upload Images
          // const imgs = content.match(/<img src=".\/public\/temp\/([\w\W]+?)>/ig);
          const imgs = content.match(/<img src="\/temp\/([^"]+)">/ig);
          const images = [];
          if (imgs) {
            imgs.forEach(i => {
              images.push(i.replace('<img src="/temp/', '').replace('">', ''));
            });
          }
          const query = `INSERT INTO article
          (article_board_ID, article_category_ID, article_user_ID, notice, anonymous, title, content, tags, link, file, customField01, customField02, customField03, customField04, customField05, customField06, customField07, customField08, customField09, customField10)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const userId = res.locals.user.id;
          const [result, ] = await conn.query(query, [boards[0].id, category, userId, notice, anonymous, title, content, tags, link, file.key, customField01, customField02, customField03, customField04, customField05, customField06, customField07, customField08, customField09, customField10]);
          for (let i = 0; i < images.length; i ++) {
            let extension = path.extname(images[i]);
            if (path.extname(images[i]) === '.jpeg') {
              extension = '.jpg';
            }
            const key = images[i];
            // 비동기로 수행
            fileUploadToS3(key);
            await conn.query(`INSERT INTO image (image_article_ID, image) VALUES (?, ?)`, [result.insertId, key]);
            content = content.replace(`/temp/${images[i]}`, `${host}/article/${key}`);
          }
          rimraf.sync(`./public/temp/${res.locals.user.hash}`);
          await conn.query(`UPDATE article SET content=? WHERE id=?`, [content, result.insertId]);
          await conn.query(`UPDATE board SET updatedAt=NOW() WHERE slug=?`, [boardSlug]);
          
          // 포인트
          const insertQuery = `INSERT INTO point
          (point_user_ID, point_board_ID, point_article_ID, type, point)
          VALUES (?, ?, ?, ?, ?)`;
          await conn.query(insertQuery, [userId, boards[0].id, result.insertId, 'write', boards[0].writePoint]);
          
          const [users, ] = await conn.query(`SELECT * FROM user WHERE id=?`, [userId]);
          if (users.length) {
            const user = users[0];
            const updateQuery = `UPDATE user
            SET point=?
            WHERE id=?`;
            await conn.query(updateQuery, [user.point + boards[0].writePoint, user.id]);
          }

          // 커밋
          await conn.commit();

          res.redirect(`/${boardSlug}/${result.insertId}`);
          // res.redirect(`/${boardSlug}`);
        } else {
          res.redirect(`/${boardSlug}/new`);
        }
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.edit = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { boardType } = req.query;
      const { submit } = req.body;
      const { boardSlug, id } = req.params;
      if (submit === 'edit') {
        const [boards, ] = await conn.query(`SELECT * FROM board WHERE slug=?`, [boardSlug]);
        if (boards.length) {
          const board = boards[0];
          const [categories, ] = await conn.query(`SELECT * FROM category WHERE category_board_id=? ORDER BY viewOrder ASC`, [board.id]);
          const [articles, ] = await conn.query(`SELECT * FROM article WHERE id=?`, [id]);
          if (articles.length) {
            const article = articles[0];
            res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
              type: 'edit',
              pageTitle: `글수정 - ${res.locals.setting.siteName}`,
              board,
              categories,
              article,
              boardType,
            });
          }
        }
      } else if (submit === 'delete') {
        const type = 'delete';
        if (type === 'delete') {
          // 포인트
          conn.beginTransaction();
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

          // 숨기기
          await conn.query(`UPDATE article SET status=0 WHERE id=?`, [id]);

          // 커밋
          await conn.commit();

          res.redirect(`/${boardSlug}`);
        }
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { boardType } = req.query;
      const { boardSlug, id } = req.params;
      const { category, title } = req.body;
      const notice = req.body.notice || 0;
      const anonymous = req.body.anonymous || 0;
      let { content } = req.body;
      let { tags } = req.body;
      const { link } = req.body;
      const { file } = req;
      // Tags
      if (tags) {
        tags = tags.replaceAll(', ', ',');
      }
      const { customField01, customField02, customField03, customField04, customField05, customField06, customField07, customField08, customField09, customField10 } = req.body;
      if (emptyCheck(title, content)) {
        // Delete List
        const [originList, ] = await conn.query(`SELECT * FROM image WHERE image_article_ID=?`, [id]);
        const nowList = [];
        const oldImages = content.match(/amazonaws.com\/article\/([^"]+)/ig);
        if (oldImages) {
          oldImages.forEach(i => {
            nowList.push(i.replace('amazonaws.com/article/', ''));
          });
        }
        const deleteList = originList.filter(i => !nowList.includes(i.image));
        for (let i = 0; i < deleteList.length; i ++) {
          const params = {
            Bucket: bucket,
            Key: deleteList[i].image,
          };
          articleS3.deleteObject(params, (err, data) => {
            if (err) {
              console.log(err);
            } else {
              conn.query(`DELETE FROM image WHERE id=?`, [deleteList[i].id]);
            }
          });
          thumbS3.deleteObject(params, (err, data) => {
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

        // Delete File
        const [result, ] = await conn.query(`SELECT * FROM article WHERE id=?`, [id]);
        const key = result[0].file;
        if (key) {
          const params = {
            Bucket: bucket,
            Key: key,
          };
          fileS3.deleteObject(params, async (err, data) => {
            if (err) {
              console.log(err);
            }
          });
        }
        
        conn.beginTransaction();
        if (file) {
          const query = `UPDATE article
          SET content=?, tags=?, link=?, file=?, customField01=?, customField02=?, customField03=?, customField04=?, customField05=?, customField06=?, customField07=?, customField08=?, customField09=?, customField10=?
          WHERE id=?`;
          await conn.query(query, [content, tags, link, file.key, customField01, customField02, customField03, customField04, customField05, customField06, customField07, customField08, customField09, customField10, id]);
        } else {
          const query = `UPDATE article
          SET content=?, tags=?, link=?, customField01=?, customField02=?, customField03=?, customField04=?, customField05=?, customField06=?, customField07=?, customField08=?, customField09=?, customField10=?
          WHERE id=?`;
          await conn.query(query, [content, tags, link, customField01, customField02, customField03, customField04, customField05, customField06, customField07, customField08, customField09, customField10, id]);
        }
        for (let i = 0; i < images.length; i ++) {
          let extension = path.extname(images[i]);
          if (path.extname(images[i]) === '.jpeg') {
            extension = '.jpg';
          }
          const key = images[i];
          // 비동기로 수행
          fileUploadToS3(key);
          await conn.query(`INSERT INTO image (image_article_ID, image) VALUES (?, ?)`, [id, key]);
          content = content.replace(`/temp/${images[i]}`, `${host}/article/${key}`);
        }
        rimraf.sync(`./public/temp/${res.locals.user.hash}`);
        await conn.query(`UPDATE article SET article_category_ID=?, notice=?, anonymous=?, title=?, content=?, updatedAt=NOW() WHERE id=?`, [category, notice, anonymous, title, content, id]);
        await conn.query(`UPDATE board SET updatedAt=NOW() WHERE slug=?`, [boardSlug]);
        await conn.commit();
        if (boardType === 'feed') {
          res.redirect(`/${boardSlug}`);
        } else {
          res.redirect(`/${boardSlug}/${id}`);
        }
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

const fileUploadToS3 = async (image) => {
  const tempFile = fs.readFileSync(`./public/temp/${image}`);
  
  let file = null;
  const originalSize = await sizeOf(tempFile);
  if (originalSize.width > 1080) {
    file = await sharp(tempFile)
      .resize({ width: 1080 })
      .withMetadata()
      .toBuffer();
  } else {
    file = tempFile;
  }

  let contentType;
  let extension = path.extname(image);
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
    Key: image,
    ACL: 'public-read',
    Body: file,
    ContentType: contentType,
  };

  articleS3.putObject(params, (err, data) => {
    if (err) {
      console.log(err);
    }
  });

  let thumb = null;
  if (originalSize.width > 640) {
    thumb = await sharp(file)
      .resize({ width: 640 })
      .withMetadata()
      .toBuffer();
  } else {
    thumb = await sharp(file)
      .withMetadata()
      .toBuffer();
  }

  const thumbParams = {
    Bucket: bucket,
    Key: image,
    ACL: 'public-read',
    Body: thumb,
    ContentType: contentType,
  };

  thumbS3.putObject(thumbParams, (err, data) => {
    if (err) {
      console.log(err);
    }
  });
};