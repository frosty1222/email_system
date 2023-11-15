const express = require('express');
const router = express.Router();
const inbox_controller = require('../controllers/InboxController');
router.get('/index',inbox_controller.inbox);
module.exports = router;