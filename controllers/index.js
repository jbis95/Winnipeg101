const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const bcrypt = require('bcrypt');
const pool = require('../middleware/database');
const { site } = require('../config');
const flash = require('../middleware/flash');
const { emptyCheck } = require('../middleware/emptyCheck');
const pagination = require('../middleware/pagination');
const hashCreate = require('../middleware/hash');
const { addLog } = require('../middleware/addlog');
const { domain } = require('../config');
const nodemailer = require('nodemailer');
const { sendMessage } = require('../middleware/sendMessage');
const returnBoards = require('../middleware/returnBoards');
const youtube = require('../middleware/youtube');
const datetime = require('../middleware/datetime');

const saltCount = 10;

exports.testPage = async (req, res, next) => {
  try {
    res.render('test');
  } catch (e) {
    console.log(e);
  }
};

exports.index = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const boards = await returnBoards(res, 'index');
      addLog(req, `/`);
      if (res.locals.plugin && res.locals.plugin.filter(p => p.slug === 'landing' && p.status === 1).length) {
        const [landingResult, ] = await conn.query(`SELECT * FROM plugin_landing ORDER BY id DESC LIMIT 1`);
        const landing = landingResult[0];
        const [landingBanners, ] = await conn.query(`SELECT * FROM plugin_landingBanner WHERE status=1 ORDER BY viewOrder ASC`);
        if (landing.content) landing.content = landing.content.replace(/\n/ig, '<br>');
        if (landing.tags) landing.tags = landing.tags.replaceAll(/([^,]+)/ig, '#$1 ').replaceAll(',', '');
        if (landing.targetUrl) landing.targetUrlRaw = landing.targetUrl.replace('https://', '').replace('http://', '');
        res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
          type: 'index',
          pageTitle: `${res.locals.setting.siteName}`,
          boards,
          landing,
          landingBanners,
        });
      } else if (res.locals.plugin && res.locals.plugin.filter(p => p.slug === 'cast' && p.status === 1).length) {
        const youtubeLive = await youtube.getYoutubeLive();
        res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
          type: 'index',
          pageTitle: `${res.locals.setting.siteName}`,
          boards,
          youtubeLive,
        });
      } else if (res.locals.plugin && res.locals.plugin.filter(p => p.slug === 'serverSchedule' && p.status === 1).length) {
        let moveDate = req.query.moveDate || 0;
        if (moveDate === 'today') {
          moveDate = 0;
        } else {
          moveDate = Number(moveDate);
        }
        let day1 = null, day2 = null;
        day1 = -6;
        day2 = 7
        let query = null;
        if (moveDate === undefined || moveDate === null || moveDate === 0) {
          day1 = -6;
          day2 = 7;
          query = `SELECT *, date_format(openDate, '%Y-%m-%d') AS datetime
          FROM plugin_serverSchedule
          WHERE openDate BETWEEN NOW() - INTERVAL 7 DAY AND NOW() + INTERVAL 7 DAY
          ORDER BY openDate ASC, score DESC, id DESC`;
        } else {
          day1 = -6 + Number(moveDate);
          day2 = 7 + Number(moveDate);
          if (Math.sign(day1) === 1 && Math.sign(day2) === 1) {
            query = `SELECT *, date_format(openDate, '%Y-%m-%d') AS datetime
            FROM plugin_serverSchedule
            WHERE openDate BETWEEN NOW() - INTERVAL ${7 + day1 * -1} DAY AND NOW() + INTERVAL ${7 + Math.abs(day2)} DAY
            ORDER BY openDate ASC, score DESC, id DESC`;
          } else {
            query = `SELECT *, date_format(openDate, '%Y-%m-%d') AS datetime
            FROM plugin_serverSchedule
            WHERE openDate BETWEEN NOW() - INTERVAL ${7 + Math.abs(day1)} DAY AND NOW() + INTERVAL ${7 + day2 * -1} DAY
            ORDER BY openDate ASC, score DESC, id DESC`;
          }
        }
        const days = [];
        let range = null;
        for (let i = day1; i <= day2; i ++) {
          days.push({
            datetime: moment(Date.now()).add(i, 'days').format('YYYY-MM-DD'),
            day: moment(Date.now()).add(i, 'days').format('D'),
            week: moment(Date.now()).locale('ko').add(i, 'days').format('dddd').replace('요일', ''),
          })
        }
        const today = moment(Date.now()).format('YYYY-MM-DD');
        range = {
          start: moment(Date.now()).add(day1, 'days').format('YYYY.MM.DD'),
          end: moment(Date.now()).add(day2, 'days').format('YYYY.MM.DD'),
        }
        const [serverScheduleOrigin, ] = await conn.query(query);
        const serverSchedule = [];
        let temp = null;
        for (let i = 0; i < serverScheduleOrigin.length; i ++) {
          if (temp === serverScheduleOrigin[i].datetime) {
            serverSchedule[serverSchedule.length-1].push(serverScheduleOrigin[i]);
          } else {
            serverSchedule.push([
              serverScheduleOrigin[i],
            ]);
          }
          temp = serverScheduleOrigin[i].datetime;
        }
        res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
          type: 'index',
          pageTitle: `${res.locals.setting.siteName}`,
          boards,
          today,
          range,
          days,
          moveDate,
          serverSchedule,
        });
      } else if (res.locals.plugin && res.locals.plugin.filter(p => p.slug === 'domain' && p.status === 1).length) {
        const [premiumDomain, ] = await conn.query(`SELECT * FROM plugin_domainSell WHERE type='premium' ORDER BY id DESC LIMIT 6`);
        const [paidDomain, ] = await conn.query(`SELECT * FROM plugin_domainSell WHERE type='paid' ORDER BY id DESC LIMIT 6`);
        const [freeDomain, ] = await conn.query(`SELECT * FROM plugin_domainSell WHERE type='free' ORDER BY id DESC LIMIT 6`);
        res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
          type: 'index',
          pageTitle: `${res.locals.setting.siteName}`,
          boards,
          premiumDomain,
          paidDomain,
          freeDomain,
        });
      } else {
        res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
          type: 'index',
          pageTitle: `${res.locals.setting.siteName}`,
          boards,
        });
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.changeUser = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { method } = req;
      if (method === 'GET') {
        const query = `SELECT *
        FROM user
        WHERE workingUser = 1`;
        const [users, ] = await conn.query(query);
        if (users.length) {
          const existingUser = res.locals.user;
          let random = Math.floor(Math.random() * users.length);
          let newUser = null;
          do {
            random = Math.floor(Math.random() * users.length);
            newUser = users[random];
          } while (existingUser.id === newUser.id);
          req.session.user = users[random];
          req.session.save();
        }
      } else if (method === 'POST') {
        const { user } = req.body;
        const query = `SELECT *
        FROM user
        WHERE workingUser = 1 AND uId LIKE CONCAT('%',?,'%')
        OR permission = 10 AND uId LIKE CONCAT('%',?,'%')
        OR workingUser = 1 AND nickName LIKE CONCAT('%',?,'%')
        OR permission = 10 AND nickName LIKE CONCAT('%',?,'%')`;
        const [users,] = await conn.query(query, [user, user, user, user]);
        console.log(users);
        if (users.length) {
          const user = users[0];
          res.locals.user = user;
          req.session.user = user;
          req.session.save();
        }
      }
      res.redirect(req.headers.referer);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.search = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { searchType, keyword, page } = req.query;
      let pnQuery = null, pn = null, query = null;
      let articles = null;
      if (searchType === 'titleAndContent') {
        pnQuery = `SELECT count(*) AS count
        FROM article
        WHERE status=1
        AND title LIKE CONCAT('%','${keyword}','%')
        OR status=1 AND
        content LIKE CONCAT('%','${keyword}','%')
        ORDER BY notice DESC, id DESC`;
        pn = await pagination(pnQuery, req.query, 'page', 24, 5);
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
        WHERE a.status=1
        AND a.title LIKE CONCAT('%',?,'%')
        OR a.status=1 AND
        a.content LIKE CONCAT('%',?,'%')
        ORDER BY notice DESC, id DESC
        ${pn.queryLimit}`;
        [articles, ] = await conn.query(query, [keyword, keyword]);
      } else if (searchType === 'title') {
        pnQuery = `SELECT count(*) AS count
        FROM article
        WHERE status=1
        AND title LIKE CONCAT('%','${keyword}','%')
        ORDER BY notice DESC, id DESC`;
        pn = await pagination(pnQuery, req.query, 'page', 24, 5);
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
        WHERE a.status=1
        AND a.title LIKE CONCAT('%',?,'%')
        ORDER BY notice DESC, id DESC
        ${pn.queryLimit}`;
        [articles, ] = await conn.query(query, keyword);
      } else if (searchType === 'nickName') {
        pnQuery = `SELECT count(*) AS count
        FROM article AS a
        LEFT JOIN user AS u
        ON article_user_ID = u.id
        WHERE a.status=1
        AND u.nickName LIKE CONCAT('%','${keyword}','%')
        ORDER BY a.notice DESC, a.id DESC`;
        pn = await pagination(pnQuery, req.query, 'page', 24, 5);
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
        WHERE a.status=1
        AND u.nickName LIKE CONCAT('%',?,'%')
        ORDER BY a.notice DESC, a.id DESC
        ${pn.queryLimit}`;
        [articles, ] = await conn.query(query, [keyword]);
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
      if (articles.length) {
        res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
          type: `search`,
          pageTitle: `${keyword} - 검색결과 - ${res.locals.setting.siteName}`,
          articles,
          page,
          searchType,
          keyword,
          pn,
        });
      } else {
        res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
          type: `search`,
          pageTitle: `${keyword} - 검색결과 - ${res.locals.setting.siteName}`,
          articles: null,
          keyword,
          pn,
        });
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
}

exports.login = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      if (res.locals.user) {
        res.redirect('/');
      } else {
        res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
          type: 'login',
          pageTitle: `${res.__('user_join')} - ${res.locals.setting.siteName}`,
        });
      }
    } else if (method === 'POST') {
      const conn = await pool.getConnection();
      try {
        const { id, password } = req.body;
        const query = `SELECT *
        FROM user
        WHERE uId=? OR email=?`;
        const [users, ] = await conn.query(query, [id, id]);
        if (users.length) {
          const user = users[0];
          const result = bcrypt.compareSync(password, user.password);
          if (result) { // 로그인 성공
            req.session.user = user;
            req.session.save(() => {
              res.redirect(`${req.headers.referer}`);
            });
          } else { // 로그인 실패
            flash.create({
              status: 402,
              message: `${res.__('user_wrongPassword')}`,
              data: { id }
            });
            res.redirect('/login');
          }
        } else { // 로그인 실패
          flash.create({
            status: 401,
            message: `${res.__('user_memberDoesNotExist')}`,
          });
          res.redirect('/login');
        }
      } finally {
        conn.release();
      }
    }
  } catch (e) {
    console.log(e);
  }
};

exports.logout = async (req, res, next) => {
  try {
    req.session.destroy(() => {
      if (req.headers.referer) {
        res.redirect(`${req.headers.referer}`);
      } else {
        res.redirect(`/`);
      }
    });
  } catch (e) {
    console.log(e);
  }
}

exports.join = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      const conn = await pool.getConnection();
      try {
        const [settings, ] = await conn.query(`SELECT * FROM setting`);
        const setting = settings[0];
        res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
          type: 'join',
          pageTitle: `${res.__('user_join')} - ${res.locals.setting.siteName}`,
        });
      } finally {
        conn.release();
      }
    } else if (method === 'POST') {
      const conn = await pool.getConnection();
      try {
        const { uId, password, passwordCheck, nickName, email, inviteId } = req.body;
        if (emptyCheck(uId, password, passwordCheck, nickName, email)) {
          if (password === passwordCheck) {
            const salt = bcrypt.genSaltSync(saltCount);
            const hash = bcrypt.hashSync(password, salt);
            const userHash = hashCreate(8);
            const query = `INSERT INTO user (hash, uId, password, nickName, email) VALUES (?, ?, ?, ?, ?)`;
            const [result, ] = await conn.query(query, [userHash, uId, hash, nickName, email]);
            if (result) {
              const query = `SELECT * FROM user WHERE uId=?`;
              const [users, ] = await conn.query(query, [uId]);
              if (users.length) {
                const user = users[0];
                req.session.user = user;
                req.session.save(() => {
                  res.redirect('/');
                });

                // 초대 포인트 지급
                const [inviteUsers, ] = await conn.query(`SELECT * FROM user WHERE uId=? OR nickName=?`, [inviteId, inviteId]);
                if (inviteUsers.length) {
                  const inviteUser = inviteUsers[0];
                  const invitePoint = res.locals.setting.invitePoint;
                  if (invitePoint !== 0) {
                    conn.query(`UPDATE user SET point=point+? WHERE id=?`, [invitePoint, inviteUser.id]);
                    conn.query(`INSERT INTO point (point_user_ID, type, point) VALUES (?, ?, ?)`, [inviteUser.id, 'invite', invitePoint]);
                  }
                }
              }
            }
          } else {
            res.redirect('/join');
          }
        } else {
          res.redirect('/join');
        }
      } finally {
        conn.release();
      }
    }
  } catch (e) {
    const { uId, password, passwordCheck, nickName } = req.body;
    if (e.errno === 1062 && e.message.match(/user.email/)) { // 이메일 중복

    } else if (e.errno === 1062 && e.message.match(/user.nickName/)) { // 닉네임 중복
      flash.create({
        message: `${res.__('user_nickNameAlreadyExists')}`,
        data: {
          uId,
          password,
          passwordCheck,
          nickName,
        }
      });
    } else {
      console.log(e);
    }
    res.redirect('/join');
  }
};

// 출석체크
exports.visitPoint = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const { method } = req;
      if (method === 'GET') {
        const query = `SELECT p.*, u.nickName AS nickName
        FROM point AS p
        JOIN user AS u
        ON p.point_user_ID = u.id
        WHERE p.type='visit' AND date_format(CONVERT_TZ(p.createdAt,@@session.time_zone,'+09:00'), '%Y-%m-%d') = ? AND u.permission != 10
        ORDER BY p.id ASC`;
        const now = moment(Date.now()).format('YYYY-MM-DD');
        let [visitList, ] = await conn.query(query, [now]);

        let rank = 1;
        visitList.forEach(l => {
          l.datetime = moment(l.createdAt).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
          l.rank = rank;
          rank ++;
        });
        visitList = visitList.reverse();
        res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
          type: 'visitPoint',
          pageTitle: `출석체크 - ${res.locals.setting.siteName}`,
          visitList,
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

exports.findId = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'findId',
        url: 'findId',
        pageTitle: `${res.__('user_findId')} - ${res.locals.setting.siteName}`,
      });
    }
  } catch (e) {
    console.log(e);
  }
};

exports.findIdEmail = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'findId-email',
        url: 'findId/email',
        pageTitle: `${res.__('user_findId')} - ${res.locals.setting.siteName}`,
      });
    } else if (method === 'POST') {
      const conn = await pool.getConnection();
      try {
        const [settings, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
        if (settings.length) {
          const setting = settings[0];
          const { emailService, emailUser, emailPassword } = setting;
          const transporter = nodemailer.createTransport({
            service: emailService,
            auth: {
              user: emailUser,
              pass: emailPassword,
            }
          });
          const { email } = req.body;
          // const salt = bcrypt.genSaltSync(saltCount);
          // const hash = bcrypt.hashSync(email, salt);
          const hash = hashCreate(8);
          const [users, ] = await conn.query(`SELECT * FROM user WHERE email=?`, [email]);
          if (users.length) {
            const user = users[0];
            const query = `INSERT INTO certification
            (certification_user_ID, type, target, hash)
            VALUES (?, ?, ?, ?)`;
            await conn.query(query, [user.id, 'id', 'email', hash]);
            const mailOption = {
              from: 'No Reply <noreply@noreply.com>',
              replyTo: 'noreply@noreply.com',
              to: `${email}`,
              subject: `아이디 찾기 - ${res.locals.setting.siteName}`,
              html: `<p>${user.nickName} 님 가입 된 아이디</p><p>${user.uId}</p>`,
            };
            transporter.sendMail(mailOption, (err, info) => {
              if (err) {
                console.error('Send Mail error: ', err);
              } else {{
                // console.log('Message send: ', info);
              }}
            });
            flash.create({
              status: 200,
              message: '이메일이 발송되었습니다',
            });
            res.redirect('/login');
          } else {
            // 이메일이 존재하지 않습니다.
            flash.create({
              status: 400,
              message: '이메일이 존재하지 않습니다',
            })
            res.redirect('/findPassword');
          }
        } else {
          next();
        }
      } finally {
        conn.release();
      }
    }
  } catch (e) {
    console.log(e);
  }
};

exports.findIdSms = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'findId-sms',
        url: 'findId/sms',
        pageTitle: `아이디 찾기 - ${res.locals.setting.siteName}`,
      });
    } else if (method === 'POST') {
      const conn = await pool.getConnection();
      try {
        const phoneNumberRaw = req.body.phoneNumber;
        const phoneNumber = phoneNumberRaw.replace(/\-/ig, '');
        const [users, ] = await conn.query(`SELECT * FROM user WHERE phone=?`, [phoneNumber]);
        if (users.length) {
          const user = users[0];
          const verifyNumber = Math.random().toString().slice(3, 7);
          const query = `INSERT INTO certification
          (certification_user_ID, type, target, hash)
          VALUES (?, ?, ?, ?)`;
          await conn.query(query, [user.id, 'id', 'sms', verifyNumber]);
          sendMessage(phoneNumber, `[${res.locals.setting.siteName}] 인증번호는 ${verifyNumber} 입니다`);
          res.redirect('/findId/sms/verify');
        } else {
          flash.create({
            status: 400,
            message: '휴대폰 번호가 없습니다',
          });
          res.redirect('/findId/sms');
        }
      } finally {
        conn.release();
      }
    }
  } catch (e) {
    console.log(e);
  }
};

exports.findIdSmsVerify = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'findId-sms-verify',
        url: `findId/sms/verify`,
        pageTitle: `아이디 찾기 - ${res.locals.setting.siteName}`,
      });
    } else if (method === 'POST') {
      const conn = await pool.getConnection();
      try {
        const { verifyNumber } = req.body;
        const query = `SELECT c.*, u.nickName AS nickName, u.id AS id, u.uId AS uId
        FROM certification AS c
        JOIN user AS u
        ON certification_user_ID = u.id
        WHERE c.hash=?`;
        const [results, ] = await conn.query(query, [verifyNumber]);
        if (results.length) {
          const result = results[0];
          await conn.query(`DELETE FROM certification WHERE certification_user_ID=?`, [result.id]);
          res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
            type: 'findId-sms-complete',
            pageTitle: `아이디 찾기 - ${res.locals.setting.siteName}`,
            result,
          });
        } else {
          flash.create({
            status: 400,
            message: `인증번호가 틀립니다`,
          });
          res.redirect('/findId/sms/verify');
        }
      } finally {
        conn.release();
      }
    }
  } catch (e) {
    console.log(e);
  }
};

exports.findPassword = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'findPassword',
        url: 'findPassword',
        pageTitle: `${res.__('user_findPassword')} - ${res.locals.setting.siteName}`,
      });
    }
  } catch (e) {
    console.log(e);
  }
};

exports.findPasswordEmail = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'findPassword-email',
        url: 'findPassword/email',
        pageTitle: `${res.__('user_findPassword')} - ${res.locals.setting.siteName}`,
      });
    } else if (method === 'POST') {
      const conn = await pool.getConnection();
      try {
        const [settings, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
        if (settings.length) {
          const setting = settings[0];
          const { emailService, emailUser, emailPassword } = setting;
          const transporter = nodemailer.createTransport({
            service: emailService,
            auth: {
              user: emailUser,
              pass: emailPassword,
            }
          });
          const { email } = req.body;
          // const salt = bcrypt.genSaltSync(saltCount);
          // const hash = bcrypt.hashSync(email, salt);
          const hash = hashCreate(8);
          const [users, ] = await conn.query(`SELECT * FROM user WHERE email=?`, [email]);
          if (users.length) {
            const user = users[0];
            const query = `INSERT INTO certification
            (certification_user_ID, type, target, hash)
            VALUES (?, ?, ?, ?)`;
            await conn.query(query, [user.id, 'password', 'email', hash]);
            const mailOption = {
              from: 'No Reply <noreply@noreply.com>',
              replyTo: 'noreply@noreply.com',
              to: `${email}`,
              subject: `${res.__('user_newPassword')} - ${res.locals.setting.siteName}`,
              html: `<a href="${res.locals.setting.siteDomain}/findPassword/newPassword/${hash}">새 비밀번호 생성</a>`,
            };
            transporter.sendMail(mailOption, (err, info) => {
              if (err) {
                console.error('Send Mail error: ', err);
              } else {{
                // console.log('Message send: ', info);
              }}
            });
            flash.create({
              status: 200,
              message: '이메일이 발송되었습니다.',
            })
            res.redirect('/');
          } else {
            // 이메일이 존재하지 않습니다.
            flash.create({
              status: 400,
              message: '이메일이 존재하지 않습니다',
            })
            res.redirect('/findPassword/email');
          }
        } else {
          next();
        }
      } finally {
        conn.release();
      }
    }
  } catch (e) {
    console.log(e);
  }
};

exports.findPasswordSms = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'findPassword-sms',
        url: 'findPassword/sms',
        pageTitle: `비밀번호 찾기 - ${res.locals.setting.siteName}`,
      });
    } else if (method === 'POST') {
      const conn = await pool.getConnection();
      try {
        const phoneNumberRaw = req.body.phoneNumber;
        const phoneNumber = phoneNumberRaw.replace(/\-/ig, '');
        const [users, ] = await conn.query(`SELECT * FROM user WHERE phone=?`, [phoneNumber]);
        if (users.length) {
          const user = users[0];
          const verifyNumber = Math.random().toString().slice(3, 7);
          const query = `INSERT INTO certification
          (certification_user_ID, type, target, hash)
          VALUES (?, ?, ?, ?)`;
          await conn.query(query, [user.id, 'id', 'sms', verifyNumber]);
          // console.log(verifyNumber);
          sendMessage(phoneNumber, `[${res.locals.setting.siteName}] 인증번호는 ${verifyNumber} 입니다`);
          res.redirect('/findPassword/sms/verify');
        } else {
          flash.create({
            status: 400,
            message: '휴대폰 번호가 없습니다',
          });
          res.redirect('/findPassword/sms');
        }
      } finally {
        conn.release();
      }
    }
  } catch (e) {
    console.log(e);
  }
};

exports.findPasswordSmsVerify = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'findPassword-sms-verify',
        url: 'findPassword/sms/verify',
        pageTitle: `비밀번호 찾기 - ${res.locals.setting.siteName}`,
      });
    } else if (method === 'POST') {
      const conn = await pool.getConnection();
      try {
        const { verifyNumber } = req.body;
        const query = `SELECT c.*, u.nickName AS nickName, u.id AS id, u.uId AS uId
        FROM certification AS c
        JOIN user AS u
        ON certification_user_ID = u.id
        WHERE c.hash=?`;
        const [results, ] = await conn.query(query, [verifyNumber]);
        if (results.length) {
          const result = results[0];
          res.redirect(`/findPassword/newPassword/${result.hash}`);
        } else {
          flash.create({
            status: 400,
            message: `인증번호가 틀립니다`,
          });
          res.redirect('/findPassword/sms/verify');
        }
      } finally {
        conn.release();
      }
    }
  } catch (e) {
    console.log(e);
  }
}

exports.findPasswordComplete = async (req, res, next) => {
  try {
    const { method } = req;
    if (method === 'GET') {
      const { hash } = req.params;
      res.render(`mainLayout/${res.locals.setting.mainLayout}`, {
        type: 'newPassword',
        url: 'findPassword/newPassword',
        pageTitle: `${res.__('user_newPassword')} - ${res.locals.siteName}`,
        hash,
      });
    } else if (method === 'POST') {
      const conn = await pool.getConnection();
      try {
        const { password, passwordCheck } = req.body;
        if (password === passwordCheck) {
          const salt = bcrypt.genSaltSync(saltCount);
          const passwordHash = bcrypt.hashSync(password, salt);
          const { hash } = req.params;
          const [result, ] = await conn.query(`SELECT * FROM certification WHERE hash=?`, [hash]);
          if (result.length) {
            const userId = result[0].certification_user_ID;
            await conn.query(`UPDATE user SET password=? WHERE id=?`, [passwordHash, userId]);
            await conn.query(`DELETE FROM certification WHERE certification_user_ID=?`, [userId]);
          }
        }
        res.redirect('/');
      } finally {
        conn.release();
      }
    }
  } catch (e) {
    console.log(e);
  }
};

exports.robots = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT siteDomain FROM setting`);
      res.set('Content-Type', 'text/plain').render('robots', {
        host: `${result[0].siteDomain}`,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.sitemap = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT siteDomain FROM setting`);
      res.set('Content-Type', 'text/xml').render('sitemap', {
        host: `${result[0].siteDomain}`,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.sitemapBoard = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `SELECT b.*, date_format(b.updatedAt,'%Y-%m-%dT%H:%i:%s+09:00') AS datetime
      FROM board AS b
      WHERE b.status=1
      ORDER BY id DESC`;
      const [boards, ] = await conn.query(query);
      const [result, ] = await conn.query(`SELECT siteDomain FROM setting`);
      res.set('Content-Type', 'text/xml').render('sitemap/board', {
        host: `${result[0].siteDomain}`,
        boards,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.sitemapArticle = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `SELECT a.*, date_format(a.updatedAt,'%Y-%m-%dT%H:%i:%s+09:00') AS datetime, b.slug AS board
      FROM article AS a
      LEFT JOIN board AS b
      ON a.article_board_ID = b.id
      WHERE a.status=1
      ORDER BY id DESC`;
      const [articles, ] = await conn.query(query);
      const [result, ] = await conn.query(`SELECT siteDomain FROM setting`);
      res.set('Content-Type', 'text/xml').render('sitemap/article', {
        host: `${result[0].siteDomain}`,
        articles,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

exports.sitemapPage = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      const query = `SELECT p.*, date_format(p.updatedAt,'%Y-%m-%dT%H:%i:%s+09:00') AS datetime
      FROM page AS p
      WHERE p.status=1
      ORDER BY id DESC`;
      const [pages, ] = await conn.query(query);
      const [result, ] = await conn.query(`SELECT siteDomain FROM setting`);
      res.set('Content-Type', 'text/xml').render('sitemap/page', {
        host: `${result[0].siteDomain}`,
        pages,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};