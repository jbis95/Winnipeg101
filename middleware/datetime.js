const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);

const datetime = (input) => {
  let output = null;

  const now = moment(new Date());
  const then = moment(input);

  const duration = moment.duration(then.diff(now));
  const year = Math.abs(duration.years());
  const month = Math.abs(duration.months());
  const days = Math.abs(duration.days());
  const hours = Math.abs(duration.hours());
  const minutes = Math.abs(duration.minutes());
  let seconds = Math.abs(duration.seconds());
  
  if (year >= 1) { // 365일 초과
    output = moment(input).tz(timezone).format('YY-MM-DD');
  } else {
    if (month >= 1) {
      output = moment(input).tz(timezone).format('MM-DD');
    } else {
      if (days > 7) {
        output = moment(input).tz(timezone).format('MM-DD');
      } else {
        if (days >= 1) {
          output = moment(input).tz(timezone).format(`${days}일전`);
        } else {
          if (hours >= 1) {
            output = moment(input).tz(timezone).format(`${hours}시간전`);
          } else {
            if (minutes >= 1) {
              output = moment(input).tz(timezone).format(`${minutes}분전`);
            } else {
              if (seconds === 0) seconds = 1;
              output = moment(input).tz(timezone).format(`${seconds}초전`);
            }
          }
        }
      }
    }
  }

  return output;
};

module.exports = datetime;