const User = require('../models/userModel');
const crypto = require('crypto');
const { sendOTPEmail } = require('../services/emailService');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
 
// Configure email transporter
const transporter = nodemailer.createTransport({
 
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'projectinvitemailer@gmail.com',
    pass: process.env.EMAIL_PASS || 'fnbs yvbt weie qite'
  }
});
 
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
   
    // Validate email exists in request
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }
 
    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if email doesn't exist
      return res.status(200).json({ msg: 'If this email exists, a reset link has been sent' });
    }
 
    // Generate and save reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 300000; // 1 hour
    await user.save();
 
    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password/${resetToken}`;
   
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_FROM || 'projectinvitemailer@gmail.com',
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset for your account.</p>
        <p>Click <a href="${resetUrl}">here</a> to reset your password (expires in 5 minutes).</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
 
    // Add validation for email
    if (!mailOptions.to) {
      throw new Error('No recipient email address found');
    }
 
    await transporter.sendMail(mailOptions);
   
    res.status(200).json({ msg: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      msg: 'Error processing password reset request',
      ...(process.env.NODE_ENV === 'development' && { debug: error.message })
    });
  }
};
 
// Add the missing resetPassword function
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
 
    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({ msg: 'Token and new password are required' });
    }
 
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
 
    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }
 
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
   
    // Update user and clear token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
 
    res.status(200).json({ msg: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      msg: 'Error resetting password',
      ...(process.env.NODE_ENV === 'development' && { debug: error.message })
    });
  }
};