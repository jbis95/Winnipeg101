const express = require('express');
const router = express.Router();
const controller = require('../controllers/user');

/* GET home page. */
router.get('/mypage', controller.mypage);
router.post('/mypage', controller.mypage);

router.get('/message', controller.message);

router.get('/mypage/pointWithdraw', controller.pointWithdraw);
router.post('/mypage/pointWithdraw/:userId', controller.pointWithdraw);

module.exports = router;