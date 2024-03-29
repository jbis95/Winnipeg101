(async () => {
  const fs = require('fs');
  const http = require('http');
  const express = require('express');
  const path = require('path');
  const cookieParser = require('cookie-parser');
  const session = require('express-session');
  const { sessionSecret } = require('./config');
  // const MemoryStore = require('memorystore')(session);
  const pool = require('./middleware/database');
  const logger = require('morgan');
  const timeout = require('connect-timeout');
  const rateLimit = require('express-rate-limit');
  const cache = require('./services/cache');

  // Moment
  const { timezone } = require('./config');
  const moment = require('moment');
  require('moment-timezone');
  moment.tz.setDefault(timezone);

  let sql = null;
  if (process.env.NODE_ENV === 'development') {
    sql = require('./config').sql.development;
  } else {
    sql = require('./config').sql.production;
  }
  let s3 = null;
  if (process.env.NODE_ENV === 'development') {
    s3 = require('./config').s3.development;
  } else {
    s3 = require('./config').s3.production;
  }
  const s3Host = s3.host;
  const lang = require('./config.json').language;
  const { menuArrayAlign } = require('./middleware/func');
  const i18n = require('i18n');

  const returnBoards = require('./middleware/returnBoards');

  const indexRouter = require('./routes/index');
  const userRouter = require('./routes/user');
  const adminRouter = require('./routes/admin');
  const apiRouter = require('./routes/api');
  const boardRouter = require('./routes/board');

  const app = express();

  const port = process.env.PORT || 3000;

  const chat = require('./middleware/chat');

  // Chat
  app.io = require('socket.io')();
  const server = http.createServer(app);
  app.io.attach(server);

  app.io.on('connection', (socket) => {
    // console.log('접속');
    app.io.sockets.emit('userCount', app.io.engine.clientsCount);

    socket.on('disconnect', () => {
      // console.log('접속 해제');
      app.io.sockets.emit('userCount', app.io.engine.clientsCount);
    });
    socket.on('sendMessage', async (data) => {
      app.io.sockets.emit('updateMessage', data);
      await chat.add(data);
    });
  });

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  const options = {
    host: sql.host,
    port: sql.port,
    user: sql.user,
    password: sql.password,
    database: sql.database,
  };

  if (process.env.NODE_ENV === 'development') {
    // app.use(logger('dev'));
  } else {
    app.use(logger('dev'));
  }
  app.use(timeout('10s'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(session({
    key: sessionSecret,
    secret: sessionSecret,
    // store: new MemoryStore({
    //   checkPeriod: 1000 * 60 * 60 * 24 * 1,
    // }),
    resave: false,
    saveUninitialized: true,
  }));

  // i18n
  i18n.configure({
    locales: [`${lang}`],
    cookie: 'lang',
    defaultLocale: `${lang}`,
    directory: path.join(__dirname + '/locales'),
  });
  app.use(i18n.init);

  const limiter = rateLimit({
    windowMs: 1000 * 10,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: async (req, res) => {
      console.error(`잦은 요청 : ${getIp(req)} - ${req.method} - ${req.originalUrl}`.red);
      return '너무 많은 요청을 하였습니다. 잠시 후 다시 시도해주세요';
    },
  });
  app.use(limiter);


  // Clear temp folder
  const clearTempFolder = () => {
    const tempFolderPath = path.join(__dirname, 'public/temp');
    fs.readdir(tempFolderPath, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlink(path.join(tempFolderPath, file), (err) => {
            if (err) throw err;
          });
        }
      }
    });
  }
  setInterval(clearTempFolder, 1000 * 60 * 10);

  // Counter
  const setCounter = async () => {
    const conn = await pool.getConnection();
    try {
      const todayQuery = `SELECT count(distinct viewIp) AS today
      FROM log
      WHERE viewDate >= date_format(CONVERT_TZ(NOW(),@@session.time_zone,'+09:00'), '%Y-%m-%d');`;
      const yesterdayQuery = `SELECT count(distinct viewIp) AS yesterday
      FROM log
      WHERE viewDate >= date_format(date_add(CONVERT_TZ(NOW(),@@session.time_zone,'+09:00'), interval -1 day), '%Y-%m-%d')
      AND viewDate < date_format(CONVERT_TZ(NOW(),@@session.time_zone,'+09:00'), '%Y-%m-%d');`;
      const monthQuery = `SELECT count(distinct viewIp) AS month
      FROM log
      WHERE viewDate >= date_format(date_add(CONVERT_TZ(NOW(),@@session.time_zone,'+09:00'), interval -1 month), '%Y-%m-%d');`;
      const [today, ] = await conn.query(todayQuery);
      const [yesterday, ] = await conn.query(yesterdayQuery);
      const [month, ] = await conn.query(monthQuery);
      cache.counter = {
        today: today[0].today,
        yesterday: yesterday[0].yesterday,
        month: month[0].month,
      }
    } finally {
      conn.release();
    }
  };
  setInterval(setCounter, 1000 * 60 * 10);
  setCounter();

  // User
  app.use('*', async (req, res, next) => {
    if (req.session.user) {
      const conn = await pool.getConnection();
      try {
        const query = `SELECT u.*, p.permission AS permission, p.title AS permissionName, p.isAdmin AS isAdmin
        FROM user AS u
        JOIN permission AS p
        ON u.permission = p.permission
        WHERE u.id=?
        `;
        const [result, ] = await conn.query(query, [req.session.user.id]);
        if (result.length) {
          res.locals.user = result[0];
        } else {
          next();
        }
      } catch(e) {
        console.log(e);
      } finally {
        conn.release();
      }
    }
    next();
  });

  // Setting
  app.use('*', async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
      const [menusOrigin, ] = await conn.query(`SELECT * FROM menu WHERE type='top' ORDER BY parentId ASC, viewOrder ASC, id ASC`);
      const [banners, ] = await conn.query(`SELECT * FROM banner ORDER BY viewOrder ASC`);
      const [permission, ] = await conn.query(`SELECT * FROM permission ORDER BY id ASC`);
      const [setting, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      const sideBoards = await returnBoards(res, 'side');
      res.locals.topMenus = menuArrayAlign(menusOrigin);
      res.locals.banners = banners;
      res.locals.s3Host = s3Host;
      res.locals.permission = permission;
      res.locals.setting = setting[0];
      res.locals.sideBoards = sideBoards;
      res.locals.lang = lang;
      res.locals.count = cache.counter;

      // Permission Image
      if (res.locals.user) {
        const permissionImage = res.locals.permission.find(p => p.permission === res.locals.user.permission).image;
        if (permissionImage) {
          res.locals.user.permissionImage = `${res.locals.s3Host}/permission/${permissionImage}`;
        } else {
          res.locals.user.permissionImage = `/permission/${res.locals.user.permission}.svg`;
        }
      }

      if (res.locals.user) {
        // 출석 포인트
        conn.beginTransaction();
        const query = `SELECT *
        FROM point
        WHERE type='visit'
        AND point_user_ID = ?
        AND DATE_FORMAT(CONVERT_TZ(createdAt,@@session.time_zone,'+09:00'), '%Y-%m-%d') = CURDATE()`;
        const [result, ] = await conn.query(query, [res.locals.user.id]);
        // 출석 등록 & 포인트 지급
        if (!result.length) {
          // 포인트 내역 등록
          const insertQuery = `INSERT INTO point
          (point_user_ID, type, point)
          VALUES (?, ?, ?)`;
          await conn.query(insertQuery, [res.locals.user.id, 'visit', res.locals.setting.visitPoint]);

          // 포인트 지급
          const updateQuery = `UPDATE user
          SET point=?
          WHERE id=?`;
          await conn.query(updateQuery, [res.locals.user.point + res.locals.setting.visitPoint, res.locals.user.id]);
        }

        // 커밋
        await conn.commit();

        // 자동 등업 체크
        const [permission, ] = await conn.query(`SELECT * FROM permission`);
        const user = res.locals.user;
        const point = res.locals.user.point;
        if (!user.isAdmin && !user.permission === 0) {
          if (user.permission !== 9 && point >= permission[8].pointBaseline && point < permission[9].pointBaseline && permission[8].pointBaseline !== 0) {
            await conn.query(`UPDATE user SET permission=? WHERE id=?`, [9, user.id]);
          } else if (user.permission !== 8 && point >= permission[7].pointBaseline && point < permission[8].pointBaseline && permission[7].pointBaseline !== 0) {
            await conn.query(`UPDATE user SET permission=? WHERE id=?`, [8, user.id]);
          } else if (user.permission !== 7 && point >= permission[6].pointBaseline && point < permission[7].pointBaseline && permission[6].pointBaseline !== 0) {
            await conn.query(`UPDATE user SET permission=? WHERE id=?`, [7, user.id]);
          } else if (user.permission !== 6 && point >= permission[5].pointBaseline && point < permission[6].pointBaseline && permission[5].pointBaseline !== 0) {
            await conn.query(`UPDATE user SET permission=? WHERE id=?`, [6, user.id]);
          } else if (user.permission !== 5 && point >= permission[4].pointBaseline && point < permission[5].pointBaseline && permission[4].pointBaseline !== 0) {
            await conn.query(`UPDATE user SET permission=? WHERE id=?`, [5, user.id]);
          } else if (user.permission !== 4 && point >= permission[3].pointBaseline && point < permission[4].pointBaseline && permission[3].pointBaseline !== 0) {
            await conn.query(`UPDATE user SET permission=? WHERE id=?`, [4, user.id]);
          } else if (user.permission !== 3 && point >= permission[2].pointBaseline && point < permission[3].pointBaseline && permission[2].pointBaseline !== 0) {
            await conn.query(`UPDATE user SET permission=? WHERE id=?`, [3, user.id]);
          } else if (user.permission !== 2 && point >= permission[1].pointBaseline && point < permission[2].pointBaseline && permission[1].pointBaseline !== 0) {
            await conn.query(`UPDATE user SET permission=? WHERE id=?`, [2, user.id]);
          } else if (user.permission !== 1 && point >= permission[0].pointBaseline&& point < permission[1].pointBaseline ) {
            await conn.query(`UPDATE user SET permission=? WHERE id=?`, [1, user.id]);
          }
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      conn.release();
    }
    next();
  });

  // Message
  app.use('*', async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
      if (res.locals.user) {
        const userId = res.locals.user.id;
        const query = `SELECT *
        FROM message
        WHERE message_recipient_ID = ?`;
        const [messages, ] = await conn.query(query, [userId]);
        res.locals.messages = messages;
      }
    } finally {
      conn.release();
    }
    next();
  });

  // Flash Message
  require('./middleware/flash').init(app);

  const { isLogin, isAdmin } = require('./middleware/user');

  app.use('/', indexRouter);
  app.use('/', userRouter);
  app.use('/admin', isAdmin, adminRouter);
  app.use('/api', apiRouter);
  app.use('/', boardRouter);

  // Error Handling
  app.use('*', (req, res, next) => {
    // res.status(404).render('404');
    res.status(404).render(`mainLayout/${res.locals.setting.mainLayout}`, {
      type: '404',
      pageTitle: `404 Not Found`,
    });
  });

  server.listen(port, () => console.log('Server is running... http://localhost:' + port));

  module.exports = app;
})();