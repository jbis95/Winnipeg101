const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controllers/board');

/* AWS S3 */
const AWS = require('aws-sdk');
let s3 = null;
if (process.env.NODE_ENV === 'development') {
  s3 = require('../config').s3.development;
} else {
  s3 = require('../config').s3.production;
}
const { accessKeyId, secretAccessKey, region, bucket, host, endpoint } = s3;

const fileSpacesEndpoint = new AWS.Endpoint(`${endpoint}/file`);
const fileS3 = new AWS.S3({
    endpoint: fileSpacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const multer = require('multer');
const multerS3 = require('multer-s3');

const fileUpload = multer({
  storage: multerS3({
    s3: fileS3,
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
router.get('/:boardSlug/new', controller.new);
router.post('/:boardSlug/new', fileUpload.single('file'), controller.new);

router.post('/:boardSlug/:id/edit', controller.edit);
router.post('/:boardSlug/:id/update', fileUpload.single('file'), controller.update);
router.get('/:boardSlug/:id', controller.read);
router.get('/:boardSlug', controller.list);

router.get('/:page', controller.page);

module.exports = router;