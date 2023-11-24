const express = require('express');
const router = express.Router();
const except_controller = require('../controllers/ExceptionController');
router.get('/404',except_controller.notfound);
router.get('/access-denied',except_controller.accessDenied);
module.exports = router;