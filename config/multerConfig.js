const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    !fs.existsSync(`./public/temp/`) && fs.mkdirSync(`./public/temp/`);
    cb(null, `public/temp`);
  },
  filename: (req, file, cb) => {
    let extension = path.extname(file.originalname);
    if (path.extname(file.originalname) === '.jpeg') extension = '.jpg';
    const str = Math.random().toString(36).substr(2,11);
    cb(null, `${Date.now().toString()}-${str}${extension.toLowerCase()}`);
  }
});

const fileFilter = function (req, file, cb) {
  const typeArray = file.mimetype.split('/');
  const fileType = typeArray[1];
  const availableFileType = ['jpg', 'png', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'heic', 'mp4', 'svg'];

  if (availableFileType.includes(fileType)) {
    cb(null, true);
  } else {
    req.fileValidationError = "jpg,jpeg,png,gif 파일만 업로드 가능합니다.";
    cb(null, false);
  }
};

module.exports = multer({
  storage: storage,
  // fileFilter: fileFilter,
  // limits: {
  //   fileSize: 5 * 1024 * 1024,
  // },
});