const io = require('socket.io-client');

const socketOption = {};
socketOption['reconnect'] = true;
socketOption['force new connection'] = true;
socketOption['sync disconnect on unload'] = true;
socketOption['transports'] = ['websocket'];

let socket;
function connect() {
  try {
    if(socket == null) {
      socket = io('https://ws.powerballgame.co.kr/miniview', socketOption);
      socket.on('receive',function({body}){
        const round = body.round;

        // 숫자를 2자리씩 자른다.
        const ballArr = body.number.match(/.{1,2}/g);
        ballArr.push(body.powerball);
        ballArr.push(body.numberSum);

        const msg = `현재 라운드: ${round}, 결과: ${ballArr.join(',')}`;
        console.log(msg);
      });

      socket.on('reconnect',function(){
        console.log('reconnect');
        setTimeout(function(){
          connect();
        },3000);
      });

      socket.on('connect',function(){
        console.log('connect');
      });

      socket.on('error',function(){
        console.log('error');
      });
    }
  } catch(e) {
    console.error(e);
  }
}

connect();

