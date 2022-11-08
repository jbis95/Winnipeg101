const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const rimraf = require('rimraf');
const controller = require('../controllers/admin');

/* AWS S3 */
const AWS = require('aws-sdk');
let s3 = null;
if (process.env.NODE_ENV === 'development') {
  s3 = require('../config').s3.development;
} else {
  s3 = require('../config').s3.production;
}
const { accessKeyId, secretAccessKey, region, bucket, host, endpoint } = s3;

const bannerSpacesEndpoint = new AWS.Endpoint(`${endpoint}/banner`);
const bannerS3 = new AWS.S3({
    endpoint: bannerSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const categorySpacesEndpoint = new AWS.Endpoint(`${endpoint}/category`);
const categoryS3 = new AWS.S3({
    endpoint: categorySpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const permissionSpacesEndpoint = new AWS.Endpoint(`${endpoint}/permission`);
const permissionS3 = new AWS.S3({
    endpoint: permissionSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const landingSpacesEndpoint = new AWS.Endpoint(`${endpoint}/landing`);
const landingS3 = new AWS.S3({
    endpoint: landingSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const landingBannerSpacesEndpoint = new AWS.Endpoint(`${endpoint}/landingBanner`);
const landingBannerS3 = new AWS.S3({
    endpoint: landingBannerSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const multer = require('multer');
const multerS3 = require('multer-s3');

const bannerUpload = multer({
  storage: multerS3({
    s3: bannerS3,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: function (req, file, cb) {
      let extension = path.extname(file.originalname);
      if (path.extname(file.originalname) === '.jpeg') extension = '.jpg';
      const str = Math.random().toString(36).substr(2,11);
      cb(null, `${Date.now().toString()}-${str}${extension.toLowerCase()}`);
    },
  }),
});

const categoryUpload = multer({
  storage: multerS3({
    s3: categoryS3,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: function (req, file, cb) {
      let extension = path.extname(file.originalname);
      if (path.extname(file.originalname) === '.jpeg') extension = '.jpg';
      const str = Math.random().toString(36).substr(2,11);
      cb(null, `${Date.now().toString()}-${str}${extension.toLowerCase()}`);
    },
  }),
});

const permissionUpload = multer({
  storage: multerS3({
    s3: permissionS3,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: function (req, file, cb) {
      let extension = path.extname(file.originalname);
      if (path.extname(file.originalname) === '.jpeg') extension = '.jpg';
      const str = Math.random().toString(36).substr(2,11);
      cb(null, `${Date.now().toString()}-${str}${extension.toLowerCase()}`);
    },
  }),
});

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      !fs.existsSync(`./public/logo/`) && fs.mkdirSync(`./public/logo/`);
      cb(null, 'public/logo/');
    },
    filename: (req, file, cb) => {
      cb(null, `logo${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
});

const faviconUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      !fs.existsSync(`./public/favicon/`) && fs.mkdirSync(`./public/favicon/`);
      cb(null, 'public/favicon/');
    },
    filename: (req, file, cb) => {
      cb(null, `original${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
});

// Plugin
const landingUpload = multer({
  storage: multerS3({
    s3: landingS3,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: function (req, file, cb) {
      let extension = path.extname(file.originalname);
      if (path.extname(file.originalname) === '.jpeg') extension = '.jpg';
      const str = Math.random().toString(36).substr(2,11);
      cb(null, `${Date.now().toString()}-${str}${extension.toLowerCase()}`);
    },
  }),
});

const landingBannerUpload = multer({
  storage: multerS3({
    s3: landingBannerS3,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: function (req, file, cb) {
      let extension = path.extname(file.originalname);
      if (path.extname(file.originalname) === '.jpeg') extension = '.jpg';
      const str = Math.random().toString(36).substr(2,11);
      cb(null, `${Date.now().toString()}-${str}${extension.toLowerCase()}`);
    },
  }),
});

/* GET home page. */
router.get('/', controller.index);

router.get('/log', controller.log);

router.get('/user', controller.user);
router.post('/user/new', controller.userNew);
router.post('/user/edit/:id', controller.userEdit);

router.get('/menu', controller.menu);
router.post('/menu/new', controller.menuNew);
router.post('/menu/edit/:id', controller.menuEdit);

router.get('/board', controller.board);
router.post('/board/new', controller.boardNew);
router.post('/board/edit/:id', controller.boardEdit);
router.get('/board/detail/:id', controller.boardDetail);
router.post('/board/detail/:id', controller.boardDetail);

router.post('/category/new', controller.categoryNew);
router.post('/category/edit/:id', categoryUpload.single('file'), controller.categoryEdit);

router.get('/article', controller.article);
router.get('/article/edit/:id', controller.articleEdit);
router.post('/article/edit/:id', controller.articleEdit);

router.get('/comment', controller.comment);
router.post('/comment/edit/:id', controller.commentEdit);

router.get('/chat', controller.chat);
router.post('/chat/edit/:id', controller.chatEdit);

router.get('/pointWithdraw', controller.pointWithdraw);
router.post('/pointWithdraw/:id', controller.pointWithdraw);

router.get('/page', controller.page);
router.get('/page/new', controller.pageNew);
router.post('/page/new', controller.pageNew);
router.post('/page/edit/:id', controller.pageEdit);
router.post('/page/edit/:id/complete', controller.pageEditComplete);

router.get('/banner', controller.banner);
router.post('/banner/new', bannerUpload.single('image'), controller.bannerNew);
router.post('/banner/edit/:id', controller.bannerEdit);

router.get('/message', controller.message);
router.post('/message/sendMessage', controller.sendMessage);
router.post('/message/sendEmail', controller.sendEmail);

router.get('/indexBoard', controller.indexBoard);
router.post('/indexBoard/edit/:id', controller.indexBoardEdit);
router.post('/indexBoard/new', controller.indexBoardNew);

router.get('/permission', controller.permission);
router.post('/permission/edit/:id', permissionUpload.single('image'), controller.permissionEdit);

router.get('/plugin', controller.plugin);
router.post('/plugin/edit/:id', controller.pluginEdit);
router.post('/plugin/new', controller.pluginNew);

router.get('/update', controller.update);
router.post('/update', controller.update);

router.get('/setting', controller.setting);
router.post('/setting/basic', controller.settingBasic);
router.post('/setting/email', controller.settingEmail);
router.post('/setting/design', logoUpload.single('logo'), controller.settingDesign);
router.post('/setting/etcdesign', faviconUpload.single('favicon'), controller.settingEtcDesign);
router.post('/setting/banner', controller.settingBanner);
router.post('/setting/sms', controller.sms);
router.post('/setting/seo', controller.seo);
router.post('/setting/adsense', controller.adsense);
router.post('/setting/etc', controller.etc);

// Plugin
router.get('/broadcast', controller.castBroadcast);
router.post('/broadcast', controller.castBroadcast);
router.post('/broadcast/edit', controller.castBroadcastEdit);
router.get('/powerball', controller.castPowerball);
router.post('/powerball', controller.castPowerball);
router.post('/bot/status', controller.botStatus);

router.get('/landing', controller.landing);
router.post('/landing', landingUpload.fields([{ name: 'logoImage' }, { name: 'backgroundVideo' }]), controller.landing);
router.post('/landing/banner/new', landingBannerUpload.single('image'), controller.landingBannerNew);
router.post('/landing/banner/edit/:id', controller.landingBannerEdit);

router.get('/serverSchedule', controller.serverSchedule);
router.post('/serverSchedule/new', controller.serverScheduleNew);
router.post('/serverSchedule/edit', controller.serverScheduleEdit);

router.get('/domain/sell', controller.domainSell);
router.post('/domain/sell', controller.domainSell);
router.post('/domain/sell/new', controller.domainSellNew);
router.post('/domain/sell/edit/:id', controller.domainSellEdit);
router.get('/domain/buy', controller.domainBuy);
router.post('/domain/buy', controller.domainBuy);

module.exports = router;