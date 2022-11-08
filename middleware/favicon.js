const fs = require('fs');
const pngToIco = require('png-to-ico');
const sharp = require('sharp');

const favicon = async (file) => {
  try {
    // console.log(file);
    // 파비콘 생성
    pngToIco('./public/favicon/original.png')
      .then(buf => {
        fs.writeFileSync('./public/favicon.ico', buf);
      })
      .catch(console.error);
    const original = fs.readFileSync('./public/favicon/original.png');
    // apple-icon
    sharp(original).resize(57).toFile('./public/favicon/apple-icon-57x57.png');
    sharp(original).resize(60).toFile('./public/favicon/apple-icon-60x60.png');
    sharp(original).resize(72).toFile('./public/favicon/apple-icon-72x72.png');
    sharp(original).resize(76).toFile('./public/favicon/apple-icon-76x76.png');
    sharp(original).resize(114).toFile('./public/favicon/apple-icon-114x114.png');
    sharp(original).resize(120).toFile('./public/favicon/apple-icon-120x120.png');
    sharp(original).resize(144).toFile('./public/favicon/apple-icon-144x144.png');
    sharp(original).resize(152).toFile('./public/favicon/apple-icon-152x152.png');
    sharp(original).resize(180).toFile('./public/favicon/apple-icon-180x180.png');
    sharp(original).resize(192).toFile('./public/favicon/apple-icon-precomposed.png');
    sharp(original).resize(192).toFile('./public/favicon/apple-icon.png');
    // android-icon
    sharp(original).resize(192).toFile('./public/favicon/android-icon-192x192.png');
    sharp(original).resize(144).toFile('./public/favicon/android-icon-144x144.png');
    sharp(original).resize(96).toFile('./public/favicon/android-icon-96x96.png');
    sharp(original).resize(72).toFile('./public/favicon/android-icon-72x72.png');
    sharp(original).resize(48).toFile('./public/favicon/android-icon-48x48.png');
    sharp(original).resize(36).toFile('./public/favicon/android-icon-36x36.png');
    // favicon
    sharp(original).resize(32).toFile('./public/favicon/favicon-32x32.png');
    sharp(original).resize(96).toFile('./public/favicon/favicon-96x96.png');
    sharp(original).resize(16).toFile('./public/favicon/favicon-16x16.png');
    // ms-icon
    sharp(original).resize(310).toFile('./public/favicon/ms-icon-310x310.png');
    sharp(original).resize(150).toFile('./public/favicon/ms-icon-150x150.png');
    sharp(original).resize(144).toFile('./public/favicon/ms-icon-144x144.png');
    sharp(original).resize(70).toFile('./public/favicon/ms-icon-70x70.png');
  } catch (e) {
    console.log(e);
  }
};

module.exports = favicon;