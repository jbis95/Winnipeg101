const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controllers/index');
const { isLogin, isWorkingUser, isAdmin } = require('../middleware/user');

/* AWS S3 */
const AWS = require('aws-sdk');
let s3 = null;
if (process.env.NODE_ENV === 'development') {
  s3 = require('../config').s3.development;
} else {
  s3 = require('../config').s3.production;
}
const { accessKeyId, secretAccessKey, region, bucket, host, endpoint } = s3;

const photoSpacesEndpoint = new AWS.Endpoint(`${endpoint}/requestPermission`);
const photoS3 = new AWS.S3({
    endpoint: photoSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const multer = require('multer');
const multerS3 = require('multer-s3');

const photoUpload = multer({
  storage: multerS3({
    s3: photoS3,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: function (req, file, cb) {
      let extension = path.extname(file.originalname);
      if (path.extname(file.originalname) === '.jpeg') extension = '.jpg';
      const str = Math.random().toString(36).substr(2,11);
      cb(null, `${Date.now().toString()}-${str}${extension}`);
    },
  }),
});

/* GET home page. */
router.get('/', controller.index);

router.get('/testPage', controller.testPage);

router.get('/search', controller.search);

router.get('/join', controller.join);
router.post('/join', controller.join);

router.get('/login', controller.login);
router.post('/login', controller.login);
router.get('/logout', controller.logout);

// 유저 변경
router.get('/changeUser', isWorkingUser, controller.changeUser);
router.post('/changeUser', isWorkingUser, controller.changeUser);

// 출석체크
router.get('/visitPoint', controller.visitPoint);
router.post('/visitPoint', controller.visitPoint);

// 이메일 입력
router.get('/findId', controller.findId);
router.get('/findId/email', controller.findIdEmail);
router.post('/findId/email', controller.findIdEmail);
router.get('/findId/sms', controller.findIdSms);
router.post('/findId/sms', controller.findIdSms);
router.get('/findId/sms/verify', controller.findIdSmsVerify);
router.post('/findId/sms/verify', controller.findIdSmsVerify);

router.get('/findPassword', controller.findPassword);
router.get('/findPassword/email', controller.findPasswordEmail);
router.post('/findPassword/email', controller.findPasswordEmail); // 코드 생성 발송
router.get('/findPassword/sms', controller.findPasswordSms);
router.post('/findPassword/sms', controller.findPasswordSms);
router.get('/findPassword/sms/verify', controller.findPasswordSmsVerify);
router.post('/findPassword/sms/verify', controller.findPasswordSmsVerify);
router.get('/findPassword/newPassword/:hash', controller.findPasswordComplete); // 새 비밀번호 입력
router.post('/findPassword/newPassword/:hash', controller.findPasswordComplete); // 새 비밀번호 저장

router.get('/robots.txt', controller.robots);
router.get('/sitemap.xml', controller.sitemap);
router.get('/sitemap/board.xml', controller.sitemapBoard);
router.get('/sitemap/article.xml', controller.sitemapArticle);
router.get('/sitemap/page.xml', controller.sitemapPage);

module.exports = router;