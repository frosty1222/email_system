const express = require('express');
const router = express.Router();
const inbox_controller = require('../controllers/InboxController');
const {TokenCheckMiddleware} = require('../util/middleware');
router.get('/index',TokenCheckMiddleware,inbox_controller.inbox);
router.get('/compose',TokenCheckMiddleware,inbox_controller.compose);
router.get('/outbox',TokenCheckMiddleware,inbox_controller.outbox);
router.post('/compose',TokenCheckMiddleware,inbox_controller.postCompose);
router.get('/in-out-box/detail/:id/:type',TokenCheckMiddleware,inbox_controller.inOutBoxDetail);
router.get('/in-out-box/delete/:id/:type',TokenCheckMiddleware,inbox_controller.deleteEmail);
router.get('/download-file/:filename',TokenCheckMiddleware,inbox_controller.downloadFile)
module.exports = router;