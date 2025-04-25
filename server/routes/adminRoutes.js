// adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/profile/:admin_id', adminController.getAdminProfile);

module.exports = router;