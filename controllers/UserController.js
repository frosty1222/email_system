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
class UserController{
  async login(req,res){
    try {
      const getAllUser = await User.getAllUsers();
      res.render('user/login', { user: getAllUser });
    } catch (error) {
       console.log(error)
    }
  }
}
module.exports = new UserController();