const path = require('path');
const multer = require('multer');
const secret = process.env.SECRET_KEY;
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const destinationPath = path.join(__dirname, '..', 'public', 'user');
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const fileName = `${file.originalname}`;
      cb(null, fileName);
    }
  });
const upload = multer({ storage }).single('image');
const User = require('../models/User');
const db = require('../dbconnect');
const pool = db.connect();
class InboxController{
    async inbox(req,res){
      const userCookie = req.cookies.user;
      console.log(userCookie)
        res.render('layouts/main',{user:userCookie,page:'inbox'})
    }
}
module.exports = new InboxController();