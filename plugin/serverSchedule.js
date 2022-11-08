const path = require('path');

const serverSchedule = async (app) => {
  try {
    app.use('*', (req, res, next) => {
      console.log('all');
      next();
    });

    app.use('/index', (req, res, next) => {
      console.log('index');
      next();
    });
  } catch (e) {
    console.log(e);
  }
};

module.exports = serverSchedule;