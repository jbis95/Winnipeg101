const pool = require('./middleware/database');

const update = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const [articles, ] = await conn.query(`SELECT * FROM article`);
      for (let article of articles) {
        const content = article.content.replace(/serve-powerball/ig, 'serve-cast');
        await conn.query(`UPDATE article SET content=? WHERE id=?`, [content, article.id]);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

update();