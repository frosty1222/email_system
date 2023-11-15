const userRouter = require('./user');
const inboxRouter = require('./inbox');
function route(app) {
  app.use('/user',userRouter);
  app.use('/inbox',inboxRouter);
}
module.exports = route;