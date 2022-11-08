const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const pool = require('../middleware/database');
const datetime = require('../middleware/datetime');

const getPopularityArticle = async (boardId, listCount, exceptBoards) => {
  try {
    const conn = await pool.getConnection();
    try {
      if (!boardId) { // 전체 게시글
        let articles = [];
        let exceptArticles = [];
        let weekQuery = null;
        if (!exceptBoards) {
          weekQuery = `SELECT a.*, b.title AS boardTitle, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor
          FROM article AS a
          LEFT JOIN board AS b
          ON a.article_board_ID = b.id
          LEFT JOIN category AS c
          ON a.article_category_ID = c.id
          WHERE a.status = 1
          AND a.createdAt >= date_format(date_add(NOW(), INTERVAL -7 DAY), '%Y-%m-%d')
          ORDER BY (a.viewCount * 0.3) + (a.likeCount * 0.7) DESC
          LIMIT ${listCount}`;
        } else {
          let exceptQuery = '';
          for (let i = 0; i < exceptBoards.length; i ++) {
            if (i === exceptBoards.length - 1) {
              exceptQuery += ` AND b.id != ${exceptBoards[i]}`;
            } else {
              exceptQuery += ` AND b.id != ${exceptBoards[i]}`;
            }
          }
          weekQuery = `SELECT a.*, b.title AS boardTitle, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor
          FROM article AS a
          LEFT JOIN board AS b
          ON a.article_board_ID = b.id
          LEFT JOIN category AS c
          ON a.article_category_ID = c.id
          WHERE a.status = 1
          AND a.createdAt >= date_format(date_add(NOW(), INTERVAL -7 DAY), '%Y-%m-%d')
          ${exceptQuery}
          ORDER BY (a.viewCount * 0.3) + (a.likeCount * 0.7) DESC
          LIMIT ${listCount}`;
        }
        
        const [weekArticles, ] = await conn.query(weekQuery);
        articles = weekArticles;
        // 한달
        weekArticles.forEach(a => {
          exceptArticles.push(a.id);
        });
        let monthQuery = null;
        if (articles.length < listCount) {
          let exceptArticlesQuery = '';
          for (let i = 0; i < exceptArticles.length; i ++) {
            if (i === exceptArticles.length - 1) {
              exceptArticlesQuery += ` AND a.id != ${exceptArticles[i]}`;
            } else {
              exceptArticlesQuery += ` AND a.id != ${exceptArticles[i]}`;
            }
          }
          if (!exceptBoards) {
            monthQuery = `SELECT a.*, b.title AS boardTitle, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor
            FROM article AS a
            LEFT JOIN board AS b
            ON a.article_board_ID = b.id
            LEFT JOIN category AS c
            ON a.article_category_ID = c.id
            WHERE a.status = 1
            AND a.createdAt >= date_format(date_add(NOW(), INTERVAL -1 MONTH), '%Y-%m-%d')
            ${exceptArticlesQuery}
            ORDER BY (a.viewCount * 0.3) + (a.likeCount * 0.7) DESC
            LIMIT ${listCount - articles.length}`;
          } else {
            let exceptBoardsQuery = '';
            for (let i = 0; i < exceptBoards.length; i ++) {
              if (i === exceptBoards.length - 1) {
                exceptBoardsQuery += ` AND b.id != ${exceptBoards[i]}`;
              } else {
                exceptBoardsQuery += ` AND b.id != ${exceptBoards[i]}`;
              }
            }
            monthQuery = `SELECT a.*, b.title AS boardTitle, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor
            FROM article AS a
            LEFT JOIN board AS b
            ON a.article_board_ID = b.id
            LEFT JOIN category AS c
            ON a.article_category_ID = c.id
            WHERE a.status = 1
            AND a.createdAt >= date_format(date_add(NOW(), INTERVAL -1 MONTH), '%Y-%m-%d')
            ${exceptBoardsQuery}
            ${exceptArticlesQuery}
            ORDER BY (a.viewCount * 0.3) + (a.likeCount * 0.7) DESC
            LIMIT ${listCount - articles.length}`;
          }
          const [monthArticles, ] = await conn.query(monthQuery);
          monthArticles.forEach(a => {
            articles.push(a);
            exceptArticles.push(a.id);
          });
        }
        
        // 전체
        let totalQuery = null;
        if (articles.length < listCount) {
          let exceptArticlesQuery = '';
          for (let i = 0; i < exceptArticles.length; i ++) {
            if (i === exceptArticles.length - 1) {
              exceptArticlesQuery += ` AND a.id != ${exceptArticles[i]}`;
            } else {
              exceptArticlesQuery += ` AND a.id != ${exceptArticles[i]}`;
            }
          }
          if (!exceptBoards) {
            totalQuery = `SELECT a.*, b.title AS boardTitle, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor
            FROM article AS a
            LEFT JOIN board AS b
            ON a.article_board_ID = b.id
            LEFT JOIN category AS c
            ON a.article_category_ID = c.id
            WHERE a.status = 1
            ${exceptArticlesQuery}
            ORDER BY (a.viewCount * 0.3) + (a.likeCount * 0.7) DESC
            LIMIT ${listCount - articles.length}`;
          } else {
            let exceptBoardsQuery = '';
            for (let i = 0; i < exceptBoards.length; i ++) {
              if (i === exceptBoards.length - 1) {
                exceptBoardsQuery += ` AND b.id != ${exceptBoards[i]}`;
              } else {
                exceptBoardsQuery += ` AND b.id != ${exceptBoards[i]}`;
              }
            }
            let exceptArticlesQuery = '';
            for (let i = 0; i < exceptArticles.length; i ++) {
              if (i === exceptArticles.length - 1) {
                exceptArticlesQuery += ` AND a.id != ${exceptArticles[i]}`;
              } else {
                exceptArticlesQuery += ` AND a.id != ${exceptArticles[i]}`;
              }
            }
            totalQuery = `SELECT a.*, b.title AS boardTitle, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor
            FROM article AS a
            LEFT JOIN board AS b
            ON a.article_board_ID = b.id
            LEFT JOIN category AS c
            ON a.article_category_ID = c.id
            WHERE a.status = 1
            ${exceptBoardsQuery}
            ${exceptArticlesQuery}
            ORDER BY (a.viewCount * 0.3) + (a.likeCount * 0.7) DESC
            LIMIT ${listCount - articles.length}`;
          }
          const [totalArticles, ] = await conn.query(totalQuery);
          totalArticles.forEach(a => {
            articles.push(a);
          });
        }

        // Articles 정리
        articles.forEach(a => {
          a.datetime = datetime(a.createdAt);
        });
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
        const board = {
          id: 0,
          title: `인기 게시글`,
          slug: 'all',
          articles,
        };
        return board;
      } else { // 개별 게시판
        const [boardsResult, ] = await conn.query(`SELECT * FROM board WHERE id=?`, [boardId]);
        if (boardsResult.length) {
          const boardOrigin = boardsResult[0];
          const { id, title, slug } = boardOrigin;
          let articles = [];
          let exceptArticles = [];
          const weekQuery = `SELECT a.*, c.title AS category
          FROM article AS a
          LEFT JOIN category AS c
          ON a.article_category_ID = c.id
          WHERE a.article_board_ID = ?
          AND a.status = 1
          AND a.createdAt >= date_format(date_add(NOW(), INTERVAL - 7 DAY), '%Y-%m-%d')
          ORDER BY (a.viewCount * 0.3) + (a.likeCount * 0.7) DESC
          LIMIT ${listCount}`;

          const [weekArticles, ] = await conn.query(weekQuery, id);
          articles = weekArticles;
          
          // 한달
          weekArticles.forEach(a => {
            exceptArticles.push(a.id);
          });
          let monthQuery = null;
          if (articles.length < listCount) {
            let exceptArticlesQuery = '';
            for (let i = 0; i < exceptArticles.length; i ++) {
              if (i === exceptArticles.length - 1) {
                exceptArticlesQuery += ` AND a.id != ${exceptArticles[i]}`;
              } else {
                exceptArticlesQuery += ` AND a.id != ${exceptArticles[i]}`;
              }
            }
            monthQuery = `SELECT a.*, b.title AS boardTitle, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor
            FROM article AS a
            LEFT JOIN board AS b
            ON a.article_board_ID = b.id
            LEFT JOIN category AS c
            ON a.article_category_ID = c.id
            WHERE a.article_board_ID = ?
            AND a.status = 1
            AND a.createdAt >= date_format(date_add(NOW(), INTERVAL -1 MONTH), '%Y-%m-%d')
            ${exceptArticlesQuery}
            ORDER BY (a.viewCount * 0.3) + (a.likeCount * 0.7) DESC
            LIMIT ${listCount}`;
          }
          const [monthArticles, ] = await conn.query(monthQuery, [id]);
          monthArticles.forEach(a => {
            articles.push(a);
            exceptArticles.push(a.id);
          });

          // 전체
          let totalQuery = null;
          if (articles.length < listCount) {
            let exceptArticlesQuery = '';
            for (let i = 0; i < exceptArticles.length; i ++) {
              if (i === exceptArticles.length - 1) {
                exceptArticlesQuery += ` AND a.id != ${exceptArticles[i]}`;
              } else {
                exceptArticlesQuery += ` AND a.id != ${exceptArticles[i]}`;
              }
            }
            totalQuery = `SELECT a.*, b.title AS boardTitle, b.slug AS boardSlug, c.title AS category, c.color AS categoryColor
            FROM article AS a
            LEFT JOIN board AS b
            ON a.article_board_ID = b.id
            LEFT JOIN category AS c
            ON a.article_category_ID = c.id
            WHERE a.article_board_ID = ?
            AND a.status = 1
            ${exceptArticlesQuery}
            ORDER BY (a.viewCount * 0.3) + (a.likeCount * 0.7) DESC
            LIMIT ${listCount}`;
          }
          const [totalArticles, ] = await conn.query(totalQuery, [id]);
          totalArticles.forEach(a => {
            articles.push(a);
          });

          // Articles 정리
          articles.forEach(a => {
            a.datetime = datetime(a.createdAt);
          });
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
          const board = {
            id,
            title,
            slug,
            articles,
          };
          return board;
        }
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

const returnBoards = async (res, position) => {
  try {
    const conn = await pool.getConnection();
    try {
      let query = null;
      if (position) {
        query = `SELECT *
        FROM indexBoard
        WHERE position='${position}'
        ORDER BY viewOrder ASC`;
      } else {
        query = `SELECT *
        FROM indexBoard
        ORDER BY viewOrder ASC`;
      }
      const [indexBoards, ] = await conn.query(query);
      let boards = [];
      for (let i = 0; i < indexBoards.length; i ++) {
        if (indexBoards[i].type === 'lately') { // 최근
          if (indexBoards[i].indexBoard_board_ID === 0) { // 전체 게시글
            let query = null;
            let exceptBoardList = null;
            if (indexBoards[i].exceptBoards) {
              exceptBoardList = indexBoards[i].exceptBoards.replace(/\s/ig, '').split(',');
              let exceptQuery = '';
              for (let i = 0; i < exceptBoardList.length; i ++) {
                if (i === exceptBoardList.length - 1) {
                  exceptQuery += ` AND b.id != ${exceptBoardList[i]}`;
                } else {
                  exceptQuery += ` AND b.id != ${exceptBoardList[i]}`;
                }
              }
              query = `SELECT a.*, c.title AS category, c.color AS categoryColor, b.title AS boardTitle, b.id AS bid, b.slug AS boardSlug
              FROM article AS a
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              WHERE a.status=1${exceptQuery}
              ORDER BY a.createdAt DESC
              LIMIT ?`;
            } else {
              query = `SELECT a.*, c.title AS category, c.color AS categoryColor, b.title AS boardTitle, b.id AS bid, b.slug AS boardSlug
              FROM article AS a
              LEFT JOIN category AS c
              ON a.article_category_ID = c.id
              LEFT JOIN board AS b
              ON a.article_board_ID = b.id
              WHERE a.status=1
              ORDER BY a.createdAt DESC
              LIMIT ?`;
            }
            const [articles, ] = await conn.query(query, [indexBoards[i].viewCount]);
            for (let j = 0; j < articles.length; j ++) {
              articles[j].datetime = datetime(articles[j].createdAt);
              const query = `SELECT image
              FROM image
              WHERE image_article_ID=?
              ORDER BY id ASC`;
              const [images, ] = await conn.query(query, [articles[j].id]);
              if (images[0]) {
                articles[j].image = images[0].image;
                articles[j].imageCount = images.length;
              }
            }
            boards.push({
              id: 0,
              title: `${res.__('user_recentPosts')}`,
              slug: 'new',
              articles,
            });
          } else {{ // 개별 게시판
            const query = `SELECT a.*, c.title AS category, c.color AS categoryColor
            FROM article AS a
            LEFT JOIN category AS c
            ON a.article_category_ID = c.id
            WHERE a.article_board_ID=? AND a.status=1
            ORDER BY a.createdAt DESC
            LIMIT ?`;
            const [boardInfo, ] = await conn.query(`SELECT * FROM board WHERE id=?`, [indexBoards[i].indexBoard_board_ID]);
            const [articles, ] = await conn.query(query, [indexBoards[i].indexBoard_board_ID, indexBoards[i].viewCount]);
            for (let j = 0; j < articles.length; j ++) {
              articles[j].datetime = datetime(articles[j].createdAt);
              const query = `SELECT image
              FROM image
              WHERE image_article_ID=?
              ORDER BY id ASC
              LIMIT 1`;
              const [result, ] = await conn.query(query, [articles[j].id]);
              if (result[0]) {
                articles[j].image = result[0].image;
              }
            }
            boards.push({
              id: boardInfo[0].id,
              title: boardInfo[0].title,
              slug: boardInfo[0].slug,
              articles,
            });
          }}
        } else if (indexBoards[i].type === 'best') { // 인기
          if (indexBoards[i].indexBoard_board_ID === 0) { // 전체 게시물
            let exceptBoards = null;
            if (indexBoards[i].exceptBoards) {
              exceptBoards = indexBoards[i].exceptBoards.replace(/\s/ig, '').split(',');
            }
            if (exceptBoards && exceptBoards.length === 1 && exceptBoards[0] === '') {
              exceptBoards = [];
            }
            const board = await getPopularityArticle(null, indexBoards[i].viewCount, exceptBoards);
            const { id, title, slug, articles } = board;
            boards.push({
              id,
              title,
              slug,
              articles,
            });
          } else { // 개별 게시판
            const board = await getPopularityArticle(indexBoards[i].indexBoard_board_ID, indexBoards[i].viewCount);
            const { id, title, slug, articles } = board;
            boards.push({
              id,
              title: `${title} 인기게시글`,
              slug,
              articles,
            });
          }
        }
      }
      return boards;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

module.exports = returnBoards;