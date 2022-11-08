const request = require('request');
const CryptoJS = require('crypto-js');
const SHA256 = require('crypto-js/sha256');
const Base64 = require('crypto-js/enc-base64');
const pool = require('./database');

const sendMessage = async (userPhoneNumber, message) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [settings, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
      const setting = settings[0];
      // let userAuthNumber = Math.random().toString(36).slice(2);
      let resultCode = 404;
      
      const date = Date.now().toString();
      // Service ID
      const uri = setting.smsServiceId;
      // Access Key ID
      const accessKey = setting.smsAccessKeyId;
      // Secret Key ID
      const secretKey = setting.smsSecretKeyId;
      const method = 'POST';
      const space = ' ';
      const newLine = '\n';
      const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`
      const url2 = `/sms/v2/services/${uri}/messages`;

      const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);

      hmac.update(method);
      hmac.update(space);
      hmac.update(url2);
      hmac.update(newLine);
      hmac.update(date);
      hmac.update(newLine);
      hmac.update(accessKey);

      const hash = hmac.finalize();
      const signature = hash.toString(CryptoJS.enc.Base64);

      request(
        {
          method: method,
          json: true,
          uri: url,
          headers: {
            "Content-type": "application/json; charset=utf-8",
            "x-ncp-iam-access-key": accessKey,
            "x-ncp-apigw-timestamp": date,
            "x-ncp-apigw-signature-v2": signature,
          },
          body: {
            type: 'SMS',
            countryCode: '82',
            from: setting.smsCallerId,
            content: message,
            // content: `인증번호는 ${userAuthNumber} 입니다`,
            messages: [
              {
                to: `${userPhoneNumber}`,
              },
            ],
          },
        },
        function (err, res, html) {
          if (err) console.log(err);
          else {
            resultCode = 200;
            // console.log(html);
          }
        },
      );
      return {
        resultCode,
      };
    } finally {
      conn.release();
    }
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  sendMessage,
};