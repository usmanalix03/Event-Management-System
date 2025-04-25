const express = require('express');
const router = express.Router();  // Initialize router FIRST
const authController = require('../controllers/authController');

// All routes should come AFTER router initialization
// User Registration
router.post('/register', authController.registerUser);

// Admin Registration
router.post('/admins/register', authController.registerAdmin);

// Update Admin
router.put('/admins/:adminId', authController.updateAdmin);

// Admin Forgot Password
router.post('/admins/forgot-password', authController.forgotPasswordAdmin);

// Admin Reset Password
router.post('/admins/reset-password', authController.resetPasswordAdmin);

// User Login
router.post('/login', authController.loginUser);

// Forgot Password
router.post('/forgot-password', authController.forgotPassword);

// Reset Password
router.post('/reset-password', authController.resetPassword);

router.get('/departments', authController.getDepartmentOptions);

module.exports = router;