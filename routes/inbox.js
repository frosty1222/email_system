const express = require('express');
const router = express.Router();
const inbox_controller = require('../controllers/InboxController');
const {TokenCheckMiddleware} = require('../util/middleware');
router.get('/index',TokenCheckMiddleware,inbox_controller.inbox);
module.exports = router;