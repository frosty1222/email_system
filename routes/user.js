const express = require('express');
const router = express.Router();
const user_controller = require('../controllers/UserController');
router.get('/login',user_controller.login);
router.post('/login',user_controller.postLogin);
module.exports = router;