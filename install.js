const bcrypt =  require('bcrypt');
const colors = require('colors');
const mysql = require('mysql2/promise');
const sql = require('./config.json').sql.production;

const pool = mysql.createPool({
  host: sql.host,
  user: sql.user,
  password: sql.password,
  port: sql.port,
});

const saltCount = 10;

const DATABASE_NAME = process.argv[2] || 'cms';

const main = async () => {
  try {
    await start();
    await article();
    await banner();
    await board();
    await category();
    await certification();
    await chat();
    await comment();
    await image();
    await indexBoard();
    await log();
    await menu();
    await message();
    await page();
    await permission();
    await point();
    await pointWithdraw();
    await setting();
    await user();
    await userArticleLike();
    await userCommentLike();
    await whitelist();
    await userGroup();
    await adminColumn();
    await settingColumn();
    await end();
  } catch (e) {
    console.log(e);
  }
};

const start = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SHOW DATABASES LIKE '${DATABASE_NAME}'`);
      if (result.length === 0) {
        await conn.query(`CREATE DATABASE ${DATABASE_NAME};`);
      }
      await conn.query(`USE ${DATABASE_NAME};`);
      await conn.query(`set FOREIGN_KEY_CHECKS = 0;`);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

const article = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE article (
        id int unsigned NOT NULL AUTO_INCREMENT,
        article_board_ID int unsigned DEFAULT NULL,
        article_category_ID int unsigned DEFAULT NULL,
        article_user_ID int unsigned DEFAULT NULL,
        notice tinyint NOT NULL DEFAULT '0',
        anonymous tinyint NOT NULL DEFAULT '0',
        title varchar(200) NOT NULL,
        content longtext NOT NULL,
        tags varchar(800) DEFAULT NULL,
        likeCount int unsigned DEFAULT '0',
        viewCount int unsigned DEFAULT '0',
        commentCount int unsigned DEFAULT '0',
        link varchar(400) DEFAULT NULL,
        file varchar(400) DEFAULT NULL,
        status tinyint NOT NULL DEFAULT '1',
        customField01 varchar(400) DEFAULT NULL,
        customField02 varchar(400) DEFAULT NULL,
        customField03 varchar(400) DEFAULT NULL,
        customField04 varchar(400) DEFAULT NULL,
        customField05 varchar(400) DEFAULT NULL,
        customField06 varchar(400) DEFAULT NULL,
        customField07 varchar(400) DEFAULT NULL,
        customField08 varchar(400) DEFAULT NULL,
        customField09 varchar(400) DEFAULT NULL,
        customField10 varchar(400) DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY article_board_ID (article_board_ID),
        KEY article_category_ID (article_category_ID),
        KEY article_user_ID (article_user_ID),
        CONSTRAINT article_board_ID FOREIGN KEY (article_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT article_category_ID FOREIGN KEY (article_category_ID) REFERENCES category (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT article_user_ID FOREIGN KEY (article_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=537 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'article' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'article' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const banner = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE banner (
        id int unsigned NOT NULL AUTO_INCREMENT,
        position varchar(200) NOT NULL,
        image varchar(200) NOT NULL,
        link varchar(200) NOT NULL,
        viewOrder int unsigned DEFAULT '100',
        newPage tinyint DEFAULT '0',
        mobileHide tinyint DEFAULT '0',
        status tinyint unsigned DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'banner' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'banner' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const board = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE board (
        id int unsigned NOT NULL AUTO_INCREMENT,
        title varchar(200) NOT NULL,
        slug varchar(200) NOT NULL,
        type varchar(45) DEFAULT NULL,
        listCount int NOT NULL DEFAULT '12',
        viewOrder int unsigned DEFAULT '100',
        listPermission int DEFAULT '0',
        readPermission int DEFAULT '0',
        writePermission int DEFAULT '1',
        commentPermission int DEFAULT '1',
        writePoint int NOT NULL DEFAULT '0',
        commentPoint int NOT NULL DEFAULT '0',
        readPoint int NOT NULL DEFAULT '0',
        useThumbnail tinyint DEFAULT '1',
        thumbnailSize varchar(45) DEFAULT 'cover',
        useLink tinyint DEFAULT '0',
        useFileUpload tinyint DEFAULT '0',
        status tinyint DEFAULT '1',
        customFieldUse01 tinyint DEFAULT '0',
        customFieldUse02 tinyint DEFAULT '0',
        customFieldUse03 tinyint DEFAULT '0',
        customFieldUse04 tinyint DEFAULT '0',
        customFieldUse05 tinyint DEFAULT '0',
        customFieldUse06 tinyint DEFAULT '0',
        customFieldUse07 tinyint DEFAULT '0',
        customFieldUse08 tinyint DEFAULT '0',
        customFieldUse09 tinyint DEFAULT '0',
        customFieldUse10 tinyint DEFAULT '0',
        customFieldTitle01 varchar(45) DEFAULT NULL,
        customFieldTitle02 varchar(45) DEFAULT NULL,
        customFieldTitle03 varchar(45) DEFAULT NULL,
        customFieldTitle04 varchar(45) DEFAULT NULL,
        customFieldTitle05 varchar(45) DEFAULT NULL,
        customFieldTitle06 varchar(45) DEFAULT NULL,
        customFieldTitle07 varchar(45) DEFAULT NULL,
        customFieldTitle08 varchar(45) DEFAULT NULL,
        customFieldTitle09 varchar(45) DEFAULT NULL,
        customFieldTitle10 varchar(45) DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY title (title),
        UNIQUE KEY slug (slug)
      ) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'board' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'board' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const category = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE category (
        id int unsigned NOT NULL AUTO_INCREMENT,
        category_board_ID int unsigned DEFAULT NULL,
        title varchar(200) NOT NULL,
        viewOrder int DEFAULT '100',
        color varchar(45) DEFAULT NULL,
        image varchar(200) DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY category_board_ID (category_board_ID),
        KEY title (title),
        CONSTRAINT category_board_ID FOREIGN KEY (category_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'category' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'category' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const certification = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE certification (
        id int unsigned NOT NULL AUTO_INCREMENT,
        certification_user_ID int unsigned DEFAULT NULL,
        type varchar(200) NOT NULL,
        target varchar(200) NOT NULL,
        hash varchar(200) NOT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY certification_user_ID (certification_user_ID),
        CONSTRAINT certification_user_ID FOREIGN KEY (certification_user_ID) REFERENCES user (id)
      ) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'category' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'category' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const chat = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE chat (
        id int unsigned NOT NULL AUTO_INCREMENT,
        chat_user_ID int unsigned NOT NULL,
        isLogin tinyint(1) NOT NULL,
        isAdmin tinyint(1) NOT NULL,
        message varchar(200) NOT NULL,
        fixed tinyint DEFAULT '0',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY chat_user_ID (chat_user_ID),
        CONSTRAINT chat_user_ID FOREIGN KEY (chat_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'chat' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'chat' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const comment = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE comment (
        id int unsigned NOT NULL AUTO_INCREMENT,
        comment_user_ID int unsigned DEFAULT NULL,
        comment_article_ID int unsigned DEFAULT NULL,
        comment_parent_id int unsigned DEFAULT NULL,
        comment_group_id int unsigned DEFAULT NULL,
        anonymous tinyint DEFAULT '0',
        content longtext,
        status tinyint DEFAULT '1',
        likeCount int unsigned DEFAULT '0',
        replyCount int unsigned DEFAULT '0',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY status (status),
        KEY comment_user_ID (comment_user_ID),
        KEY comment_article_ID (comment_article_ID),
        CONSTRAINT comment_article_ID FOREIGN KEY (comment_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT comment_user_ID FOREIGN KEY (comment_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=507 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'comment' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'comment' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const image = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE image (
        id int unsigned NOT NULL AUTO_INCREMENT,
        image_article_ID int unsigned DEFAULT NULL,
        image_page_ID int unsigned DEFAULT NULL,
        image varchar(200) NOT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY image_UNIQUE (image),
        KEY image_page_ID (image_page_ID),
        KEY image_article_ID (image_article_ID),
        CONSTRAINT image_article_ID FOREIGN KEY (image_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT image_page_ID FOREIGN KEY (image_page_ID) REFERENCES page (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=358 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'image' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'image' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const indexBoard = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE indexBoard (
        id int unsigned NOT NULL AUTO_INCREMENT,
        indexBoard_board_ID int unsigned NOT NULL,
        type varchar(45) NOT NULL DEFAULT 'lately',
        style varchar(45) NOT NULL DEFAULT 'simple',
        position varchar(45) DEFAULT 'index',
        exceptBoards varchar(200) DEFAULT NULL,
        boardGroup varchar(45) DEFAULT NULL,
        viewCount int unsigned DEFAULT '5',
        viewOrder int unsigned DEFAULT '100',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'indexBoard' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'indexBoard' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const log = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE log (
        id int unsigned NOT NULL AUTO_INCREMENT,
        log_article_ID int unsigned DEFAULT NULL,
        location varchar(200) DEFAULT NULL,
        viewDate datetime DEFAULT CURRENT_TIMESTAMP,
        viewIp varchar(200) DEFAULT NULL,
        referer varchar(800) DEFAULT NULL,
        userAgent varchar(800) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY log_article_ID (log_article_ID),
        CONSTRAINT log_article_ID FOREIGN KEY (log_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=138 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'log' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'log' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const menu = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE menu (
        id int unsigned NOT NULL AUTO_INCREMENT,
        type varchar(45) NOT NULL DEFAULT 'top',
        title varchar(200) NOT NULL,
        target varchar(200) NOT NULL,
        parentId int DEFAULT NULL,
        viewOrder int unsigned DEFAULT '100',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'menu' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'menu' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const message = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE message (
        id int unsigned NOT NULL AUTO_INCREMENT,
        message_sender_ID int unsigned DEFAULT NULL,
        message_recipient_ID int unsigned DEFAULT NULL,
        content longtext,
        status tinyint DEFAULT '1',
        updated_at datetime DEFAULT CURRENT_TIMESTAMP,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY message_recipient_ID (message_recipient_ID),
        KEY message_sender_ID (message_sender_ID),
        CONSTRAINT message_recipient_ID FOREIGN KEY (message_recipient_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT message_sender_ID FOREIGN KEY (message_sender_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=209 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'menu' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'menu' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const page = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE page (
        id int unsigned NOT NULL AUTO_INCREMENT,
        type varchar(45) NOT NULL DEFAULT 'editor',
        title varchar(200) NOT NULL,
        slug varchar(200) NOT NULL,
        content longtext,
        html longtext,
        css longtext,
        js longtext,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY title (title),
        UNIQUE KEY slug (slug)
      ) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'page' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'page' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const permission = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE permission (
        id int unsigned NOT NULL AUTO_INCREMENT,
        title varchar(200) DEFAULT NULL,
        permission int unsigned DEFAULT NULL,
        viewOrder int unsigned DEFAULT NULL,
        pointBaseline int DEFAULT '0',
        isAdmin tinyint DEFAULT '0',
        image varchar(200) DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY permission_UNIQUE (permission)
      ) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'plugin' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'plugin' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const plugin = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE plugin (
        id int unsigned NOT NULL AUTO_INCREMENT,
        slug varchar(200) NOT NULL,
        status tinyint(1) DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY slug (slug)
      ) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'plugin' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'plugin' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const point = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE point (
        id int unsigned NOT NULL AUTO_INCREMENT,
        point_user_ID int unsigned DEFAULT NULL,
        point_board_ID int unsigned DEFAULT NULL,
        point_article_ID int unsigned DEFAULT NULL,
        point_comment_ID int unsigned DEFAULT NULL,
        type varchar(200) NOT NULL,
        point int DEFAULT NULL,
        comment varchar(200) DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY type (type),
        KEY point_article_ID (point_article_ID),
        KEY point_board_ID (point_board_ID),
        KEY point_comment_ID (point_comment_ID),
        KEY point_user_ID (point_user_ID),
        CONSTRAINT point_article_ID FOREIGN KEY (point_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT point_board_ID FOREIGN KEY (point_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT point_comment_ID FOREIGN KEY (point_comment_ID) REFERENCES comment (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT point_user_ID FOREIGN KEY (point_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=752 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'plugin' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'plugin' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const pointWithdraw = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE pointWithdraw (
        id int unsigned NOT NULL AUTO_INCREMENT,
        pointWithdraw_user_ID int unsigned DEFAULT NULL,
        type varchar(45) NOT NULL,
        point int unsigned NOT NULL,
        comment varchar(800) DEFAULT NULL,
        status int unsigned NOT NULL DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY pointWithdraw_user_ID (pointWithdraw_user_ID),
        CONSTRAINT pointWithdraw_user_ID FOREIGN KEY (pointWithdraw_user_ID) REFERENCES user (id)
      ) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'plugin' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'plugin' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const setting = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE setting (
        id int unsigned NOT NULL AUTO_INCREMENT,
        siteName varchar(200) NOT NULL DEFAULT '사이트명',
        siteDescription varchar(200) NOT NULL DEFAULT '사이트 설명',
        siteDomain varchar(200) NOT NULL DEFAULT 'https://사이트주소.com',
        emailService varchar(200) NOT NULL DEFAULT 'google.com',
        emailUser varchar(200) NOT NULL DEFAULT 'user@user.com',
        emailPassword varchar(200) NOT NULL DEFAULT 'password',
        logoType varchar(45) NOT NULL DEFAULT 'text',
        logoImage varchar(45) DEFAULT NULL,
        logoImageSize int DEFAULT '200',
        headerLayout varchar(45) NOT NULL DEFAULT 'basic',
        footerLayout varchar(45) NOT NULL DEFAULT 'basic',
        mainLayout varchar(45) NOT NULL DEFAULT 'basic',
        indexLayout varchar(45) NOT NULL DEFAULT 'basic',
        headerFontColor varchar(45) NOT NULL DEFAULT '#000',
        headerBackgroundColor varchar(45) NOT NULL DEFAULT '#fff',
        bodyFontColor varchar(45) NOT NULL DEFAULT '#000',
        bodyBackgroundColor varchar(45) DEFAULT NULL,
        pointColor varchar(45) NOT NULL DEFAULT '#FF9602',
        pointBackgroundColor varchar(45) NOT NULL DEFAULT '#FAEFE0',
        copyright longtext,
        language varchar(45) NOT NULL DEFAULT 'ko',
        license tinyint NOT NULL DEFAULT '1',
        joinMethod varchar(45) NOT NULL DEFAULT 'simple',
        smsCallerId varchar(45) DEFAULT NULL,
        smsServiceId varchar(45) DEFAULT NULL,
        smsAccessKeyId varchar(45) DEFAULT NULL,
        smsSecretKeyId varchar(45) DEFAULT NULL,
        naverSiteVerification varchar(200) DEFAULT NULL,
        metaTagKeyword varchar(200) DEFAULT NULL,
        adsenseSide varchar(400) DEFAULT NULL,
        adsenseTop varchar(400) DEFAULT NULL,
        adsenseBottom varchar(400) DEFAULT NULL,
        adsenseCustom varchar(400) DEFAULT NULL,
        useTermsAndPrivacy tinyint DEFAULT '0',
        useArticleViewCount tinyint DEFAULT '0',
        useVisitCount tinyint DEFAULT '1',
        useWorkingUser tinyint DEFAULT '1',
        useChat tinyint DEFAULT '1',
        useSMS tinyint DEFAULT '0',
        usePermissionImage tinyint DEFAULT '1',
        usePointWithdraw tinyint DEFAULT '0',
        pointWithdrawLimit int unsigned DEFAULT '0',
        visitPoint int DEFAULT '0',
        invitePoint int DEFAULT '0',
        bannerRowsHeader int DEFAULT '2',
        bannerRowsIndexTop int DEFAULT '2',
        bannerRowsArticleTop int DEFAULT '2',
        bannerRowsIndexBottom int DEFAULT '2',
        bannerRowsSideTop int DEFAULT '2',
        bannerRowsSideBottom int DEFAULT '2',
        bannerRowsArticleBottom int DEFAULT '2',
        bannerRowsCustom int DEFAULT '2',
        bannerGapDesktop varchar(45) DEFAULT '20',
        bannerGapMobile varchar(45) DEFAULT '10',
        bannerBorderRounding tinyint DEFAULT '1',
        testMode tinyint NOT NULL DEFAULT '0',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY siteName_UNIQUE (siteName)
      ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'setting' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'setting' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const user = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE user (
        id int unsigned NOT NULL AUTO_INCREMENT,
        user_group_ID int unsigned DEFAULT NULL,
        hash varchar(45) NOT NULL DEFAULT '0',
        uId varchar(200) NOT NULL,
        password varchar(200) NOT NULL,
        nickName varchar(45) NOT NULL,
        email varchar(200) DEFAULT NULL,
        permission int DEFAULT '1',
        workingUser tinyint unsigned DEFAULT '0',
        point int DEFAULT '0',
        realName varchar(45) DEFAULT NULL,
        phone varchar(45) DEFAULT NULL,
        image varchar(200) DEFAULT NULL,
        marketingAgreement tinyint DEFAULT '0',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY cid (uId),
        UNIQUE KEY hash_UNIQUE (hash),
        UNIQUE KEY nickName_UNIQUE (nickName),
        KEY user_group_ID_idx (user_group_ID),
        CONSTRAINT user_group_ID FOREIGN KEY (user_group_ID) REFERENCES userGroup (id) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'user' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'user' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const userArticleLike = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE userArticleLike (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userArticleLike_user_ID int unsigned DEFAULT NULL,
        userArticleLike_article_ID int unsigned DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userArticleLike_user_ID (userArticleLike_user_ID),
        KEY userArticleLike_article_ID (userArticleLike_article_ID),
        CONSTRAINT userArticleLike_article_ID FOREIGN KEY (userArticleLike_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userArticleLike_user_ID FOREIGN KEY (userArticleLike_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=247 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userArticleLike' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userArticleLike' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const userCommentLike = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE userCommentLike (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userCommentLike_user_ID int unsigned DEFAULT NULL,
        userCommentLike_comment_ID int unsigned DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userCommentLike_comment_ID (userCommentLike_comment_ID),
        KEY userCommentLike_user_ID (userCommentLike_user_ID),
        CONSTRAINT userCommentLike_comment_ID FOREIGN KEY (userCommentLike_comment_ID) REFERENCES comment (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userCommentLike_user_ID FOREIGN KEY (userCommentLike_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userCommentLike' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userCommentLike' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const userGroup = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE userGroup (
        id int unsigned NOT NULL AUTO_INCREMENT,
        title varchar(200) NOT NULL,
        slug varchar(200) NOT NULL,
        viewOrder int unsigned DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY title (title),
        UNIQUE KEY slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userCommentLike' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userCommentLike' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const whitelist = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `CREATE TABLE whitelist (
        id int unsigned NOT NULL AUTO_INCREMENT,
        ip varchar(200) DEFAULT NULL,
        userAgent varchar(200) DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'whitelist' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'whitelist' 테이블이 있습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const adminColumn = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `INSERT INTO user (uId, password, nickName, email, permission)
      VALUES (?, ?, ?, ?, ?)`;
      const password = 'admin';
      const salt = bcrypt.genSaltSync(saltCount);
      const hash = bcrypt.hashSync(password, salt);
      const [rows, ] = await conn.query(query, ['admin', hash, 'admin', 'admin@admin.com', 10]);
      if (rows && rows.serverStatus === 2) {
        console.log(`'admin' 컬럼 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno == '1062') {
      console.log(`이미 'admin' 컬럼이 생성되었습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const settingColumn = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `INSERT INTO setting (siteName)
      VALUES (?)`;
      const [rows, ] = await conn.query(query, ['사이트명']);
      if (rows && rows.serverStatus === 2) {
        console.log(`'setting' 컬럼 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno == '1062') {
      console.log(`이미 'setting' 컬럼이 생성되었습니다.`.red);
    } else {
      console.log(e);
    }
  }
};

const end = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(`set FOREIGN_KEY_CHECKS = 1;`);
      console.log('Complete');
      process.exit(1);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

main();