const userRouter = require('./user');
const inboxRouter = require('./inbox');
const exceptionRouter = require('./exception');
function route(app) {
  app.use('/user',userRouter);
  app.use('/inbox',inboxRouter);
  app.use('/exception',exceptionRouter);
  app.use((req, res) => {
     if(res.status(404)){
        res.redirect('/exception/404')
     }
  });
}
module.exports = route;