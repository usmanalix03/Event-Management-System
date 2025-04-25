// userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/profile/:user_id', userController.getUserProfile);
router.get('/:user_id/events', userController.getUserRegisteredEvents);
router.put('/profile', userController.updateUserProfile);

module.exports = router;