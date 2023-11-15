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
class UserController{
  async login(req,res){
    try {
      res.render('user/login', {error:""});
    } catch (error) {
       console.log(error)
    }
  }
  async postLogin(req, res) {
    const pool = await db.connect();
    const { username, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE fullName = ?', [username]);
    let error = "";
    if (user[0].length > 0) {
        const storedPassword = user[0][0].password;
        if (password === storedPassword) {
            res.redirect("/inbox/index");
        } else {
            // Incorrect password
            error = "Incorrect password";
            res.render('user/login', { error: error });
        }
    } else {
        // User not found
        error = "Incorrect username";
        res.render('user/login', { error: error });
    }
  }
}
module.exports = new UserController();