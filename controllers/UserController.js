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
const db = require('../db');
class UserController{
  async login(req,res){
    try {
      res.render('user/login', {error:""});
    } catch (error) {
       console.log(error)
    }
  }
  async postLogin(req, res) {
    const pool = await db.connectDb();
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
  // sign up 
  async signUp(req,res){
      res.render("user/sign-up",{
        emailErr:"",
        nameErr:"",
        passWordErr:"",
        rePassErr:"",
        err_message:""
      })
  }
  async postSignUp(req, res) {
    const { fullName, email, password, repassword } = req.body;
    const pool = await db.connectDb();
    let emailErr = "";
    let nameErr = "";
    let passWordErr = "";
    let rePassErr = "";
    let err_message = "";

    try {
        const checkFullName = await pool.query('SELECT * FROM users WHERE fullName = ?', [fullName]);
        const checkEmail = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (checkEmail[0].length > 0) {
            emailErr = "This email has been taken. Please try another one.";
        }

        if (checkFullName[0].length > 0) {
            nameErr = "This name has been taken. Please try another one.";
        }

        if (emailErr !== "" || nameErr !== "" || passWordErr !== "" || rePassErr !== "") {
            return res.render("user/sign-up", {
                emailErr,
                nameErr,
                passWordErr,
                rePassErr,
                err_message
            });
        }

        if (password.length > 6 && repassword.length > 6 && password === repassword) {
            const createUser = await pool.query('INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)', [fullName, email, password]);
            if (createUser[0].affectedRows > 0) {
              let error = "";
              return res.redirect('/user/login')
            } else {
                err_message = "An error occurred while saving the user. Please try again later.";
            }
        } else {
            err_message = "Invalid password or passwords do not match.";
        }
    } catch (error) {
        console.error("Database error:", error);
        err_message = "An error occurred while processing your request. Please try again later.";
    }finally {
      await pool.end();
    }

    return res.render("user/sign-up", {
        emailErr,
        nameErr,
        passWordErr,
        rePassErr,
        err_message
    });
}
/// logout 
logout(req,res){
  res.cookie('user', '', { expires: new Date(0) });
  res.redirect("/user/login")
}
}
module.exports = new UserController();