const pool = require('./database');

const plugin = async (app) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [plugins, ] = await conn.query(`SELECT * FROM plugin WHERE status=1`);
      if (plugins.length) {
        plugins.forEach(p => {
          require(`../plugin/${p.slug}`)(app);
        });
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

module.exports = plugin;