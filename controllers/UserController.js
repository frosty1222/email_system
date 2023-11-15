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
  
    try {
      const user = await pool.query('SELECT * FROM users WHERE fullName = ?', [username]);
  
      if (user[0].length > 0) {
        const storedPassword = user[0][0].password;
  
        if (password === storedPassword) {
          // Set user information in the cookie
          res.cookie('user', user[0][0], { httpOnly: true });
  
          // Redirect to the inbox page
          res.redirect("/inbox/index");
        } else {
          // Incorrect password
          const error = "Incorrect password";
          res.render('user/login', { error });
        }
      } else {
        // User not found
        const error = "Incorrect username";
        res.render('user/login', { error });
      }
    } catch (error) {
      // Handle database query error
      console.error(error);
      res.status(500).send("Internal Server Error");
    } finally {
      // Make sure to release the connection back to the pool
      await pool.end();
    }
  }
  
}
module.exports = new UserController();