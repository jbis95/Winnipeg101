const pool = require('../middleware/database');

const pagination = async (pnQuery, queryData, queryKeyName, contentSize, pnSizeInput) => {
  const conn = await pool.getConnection();
  try {
    let pnNum = 0, pnTotal = 0, offset = 0, pnStart = 0, pnEnd = 0, queryLimit = '';
    let pnSize = pnSizeInput || 10;
    if (Object.keys(queryData).filter(key => key === queryKeyName)) {
      pnNum = Number(queryData[`${queryKeyName}`]) || 1;
    }
    pnStart = (Math.ceil(pnNum / pnSize) - 1) * pnSize + 1;
    pnEnd = (pnStart + pnSize) - 1;
    const [countResult, ] = await conn.query(pnQuery);
    const totalCount = countResult[0].count;
    if (contentSize !== 0 && contentSize !== null) {
      pnTotal = Math.ceil(totalCount / contentSize);
      if (pnEnd > pnTotal) pnEnd = pnTotal;
      offset = (pnNum - 1) * contentSize || 0;
      queryLimit = `LIMIT ${offset}, ${contentSize}`;
    }
    return {
      pnNum,
      pnStart,
      pnEnd,
      pnTotal,
      queryLimit,
      pnSize,
      totalCount,
    };
  } finally {
    conn.release();
  }
};

module.exports = pagination;