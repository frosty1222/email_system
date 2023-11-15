const createError = require('http-errors');

module.exports = {
  TokenCheckMiddleware: (req, res, next) => {
    const userCookie = req.cookies.user;

    if (!userCookie) {
      return res.redirect('/user/login');
    }

    const userId = userCookie.id;
    const fullName = userCookie.fullName;
    req.payload = { userId, fullName };

    next();
  }
};
