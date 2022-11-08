const fs = require('fs');
const path = require('path')
const express = require('express');
const router = express.Router();
const controller = require('../controllers/api');
const upload = require('../config/multerConfig');

/* AWS S3 */
const AWS = require('aws-sdk');
let s3 = null;
if (process.env.NODE_ENV === 'development') {
  s3 = require('../config').s3.development;
} else {
  s3 = require('../config').s3.production;
}
const { accessKeyId, secretAccessKey, region, bucket, host, endpoint } = s3;

const userImageSpacesEndpoint = new AWS.Endpoint(`${endpoint}/userImage`);
const userImageS3 = new AWS.S3({
    endpoint: userImageSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const multer = require('multer');
const multerS3 = require('multer-s3');

const userImageUpload = multer({
  storage: multerS3({
    s3: userImageS3,
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

// CKEditor5
router.post('/image/upload', upload.single('image'), (req, res, next) => {
  res.status(200).send({
    url: '/temp/' + req.file.filename,
  });
});

router.post('/userImage', userImageUpload.single('userImage'), controller.userImage);

router.post('/idCheck', controller.idCheck);
router.post('/nickNameCheck', controller.nickNameCheck);

router.post('/phoneVerify', controller.phoneVerify);
router.post('/phoneVerify/complete', controller.phoneVerifyComplete);

router.get('/getLink', controller.getLink);

router.get('/getLang', controller.getLang);
router.get('/getCountryCode', controller.getCountryCode);
router.get('/usePermissionImage', controller.usePermissionImage);

router.get('/getChat', controller.getChat);
router.post('/getCategories', controller.getCategories);
router.post('/getUser', controller.getUser);

router.post('/like', controller.like);

router.post('/getContent', controller.getContent);
router.post('/getContentPage', controller.getContentPage);

router.post('/article/delete', controller.deleteArticle);

router.post('/comment/get', controller.getComment);
router.post('/comment/new', controller.newComment);
router.post('/comment/reply', controller.replyComment);
router.post('/comment/edit', controller.editComment);
router.post('/comment/delete', controller.deleteComment);
router.post('/comment/like', controller.likeComment);

module.exports = router;