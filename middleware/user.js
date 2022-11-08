exports.isLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    if (process.env.NODE_ENV === 'development') {
      req.session.user.permission = 10;
      req.session.save(() => {
        next();
      });
    } else {
      res.redirect('/login');
    }
  }
};

exports.isWorkingUser = (req, res, next) => {
  if (req.session.user && req.session.user.workingUser || req.session.user && req.session.user.permission === 10) {
    next();
  } else {
    res.redirect('/login');
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.permission === 10) {
    next();
  } else {
    res.redirect('/login');
  }
};