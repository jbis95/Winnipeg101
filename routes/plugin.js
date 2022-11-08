const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controllers/plugin');

// Hangul
router.post('/api/domain/getDomain', controller.getDomain);
router.post('/api/domain/getDomainList', controller.getDomainList);
router.post('/api/domain/buy', controller.domainBuy);
router.get('/newDomain', controller.newDomain);
router.get('/domainList', controller.domainList);

module.exports = router;