const axios = require('axios').default;
const io = require('socket.io-client');

const USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15`;

const socketOption = {};
socketOption['reconnect'] = true;
socketOption['force new connection'] = true;
socketOption['sync disconnect on unload'] = true;
socketOption['transports'] = ['websocket'];

class powerBallGameClass {
  constructor() {
    this.socket = null;
  }
  async getRemainTime() {
    try {
      const result = await axios.get(`https://powerballgame.co.kr`, {
        headers: {
          'User-Agent': USER_AGENT,
        },
        params: {
          view: 'action',
          action: 'ajaxPowerballLog',
          actionType: 'remainTime',
          type: 'powerball',
        },
      });
      if (result.data && result.data.remainTime) {
        return result.data.remainTime;
      } else {
        return null;
      }
    } catch (e) {
      console.log(e);
    }
  }
  async connect() {
    try {
      if (this.socket === null) {
        const socket = io.connect('https://ws.powerballgame.co.kr/miniview', socketOption);
        socket.on('connect',function(){
          console.log('connect');
        });
        socket.on('receive', ({ body }) => {
          // console.log(body);
          const round = body.round;

          // 숫자를 2자리씩 자른다.
          const ballArr = body.number.match(/.{1,2}/g);
          ballArr.push(body.powerball);
          ballArr.push(body.numberSum);

          const msg = `현재 라운드: ${round}, 결과: ${ballArr.join(',')}`;
          console.log(msg);
        });
        socket.on('reconnect', () => {
          console.log('reconnect');
          setTimeout(() => {
            this.connect();
          }, 3000);
        });
        socket.on('error', () => {
          console.log('error');
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
}

const pawerBallGame = new powerBallGameClass();

module.exports = pawerBallGame;