const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const { sendMail } = require('../services/emailService');
const env = require('../config/env');
const crypto = require('crypto');

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid email or password' });
        const token = jwt.sign(
            { user_id: user.id, organisation_id: user.organisation_id, role: user.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.logout = (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true });
};

exports.me = async (req, res, next) => {
    try {
        if (!req.user.id) return res.status(401).json({ error: 'Unauthorized' });
        const user = await db.getAsync(
            `SELECT u.id, u.email, u.organisation_id, u.role, u.email_verified, o.slug as org_slug
       FROM users u LEFT JOIN organisations o ON u.organisation_id = o.id
       WHERE u.id = ?`,
            [req.user.id]
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user.id,
            email: user.email,
            organisationId: user.organisation_id,
            role: user.role,
            emailVerified: user.email_verified === 1,
            orgSlug: user.org_slug
        });
    } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.json({ success: true, message: 'If account exists, reset link sent' });
        await PasswordResetToken.deleteOldForUser(user.id);
        const token = await PasswordResetToken.create(user.id);
        const resetUrl = `${env.APP_URL}/reset-password/${token}`;
        const html = `<h2>Reset Password</h2><p><a href="${resetUrl}">Click here</a> to reset your password. Expires in 1 hour.</p>`;
        await sendMail({ to: email, subject: 'Reset your Swiish password', text: `Reset: ${resetUrl}`, html });
        res.json({ success: true, message: 'If account exists, reset link sent' });
    } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const resetToken = await PasswordResetToken.findByToken(token);
        if (!resetToken || resetToken.used_at || new Date(resetToken.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await User.updatePassword(resetToken.user_id, passwordHash);
        await PasswordResetToken.markUsed(resetToken.id);
        res.json({ success: true, message: 'Password reset successful' });
    } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Current password incorrect' });
        const newHash = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(req.user.id, newHash);
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.sendVerificationEmail = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.email_verified) return res.status(400).json({ error: 'Already verified' });
        const token = await EmailVerificationToken.create(req.user.id);
        const verifyUrl = `${env.APP_URL}/verify-email/${token}`;
        const html = `<h2>Verify Email</h2><p><a href="${verifyUrl}">Click here</a> to verify your email.</p>`;
        const sent = await sendMail({ to: user.email, subject: 'Verify your Swiish email', text: `Verify: ${verifyUrl}`, html });
        if (!sent) return res.status(500).json({ error: 'Failed to send email' });
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const verifToken = await EmailVerificationToken.findByToken(token);
        if (!verifToken || verifToken.verified_at || new Date(verifToken.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        await User.verifyEmail(verifToken.user_id);
        await EmailVerificationToken.markVerified(verifToken.id);
        res.json({ success: true });
    } catch (err) { next(err); }
};