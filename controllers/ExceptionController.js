class ExceptionController{
    notfound(req,res){
       res.render('main-view/404');
    }
    accessDenied(req,res){
       res.render('main-view/access-denied');
    }
}
module.exports = new ExceptionController();