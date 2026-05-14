const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Organisation = require('../models/Organisation');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { logAudit } = require('../services/auditService');

exports.getInvitation = async (req, res, next) => {
    try {
        const { token } = req.params;
        const invitation = await Invitation.findByToken(token);
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }
        if (invitation.accepted_at) {
            return res.status(400).json({ error: 'Invitation already accepted' });
        }
        if (new Date(invitation.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invitation expired' });
        }
        const org = await Organisation.findById(invitation.organisation_id);
        res.json({
            email: invitation.email,
            role: invitation.role,
            organisationName: org.name,
            expiresAt: invitation.expires_at
        });
    } catch (err) { next(err); }
};

exports.acceptInvitation = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const invitation = await Invitation.findByToken(token);
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }
        if (invitation.accepted_at) {
            return res.status(400).json({ error: 'Invitation already accepted' });
        }
        if (new Date(invitation.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invitation expired' });
        }
        const existingUser = await User.findByEmail(invitation.email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = require('crypto').randomUUID();
        await User.create({
            id: userId,
            email: invitation.email,
            passwordHash,
            organisationId: invitation.organisation_id,
            role: invitation.role,
            emailVerified: 0
        });
        await Invitation.markAccepted(invitation.id);
        await logAudit('invitation_accepted', 'invitation', invitation.id, { email: invitation.email, role: invitation.role }, userId, invitation.organisation_id);
        const tokenJwt = jwt.sign(
            { user_id: userId, organisation_id: invitation.organisation_id, role: invitation.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );
        res.cookie('authToken', tokenJwt, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ success: true, userId, email: invitation.email, role: invitation.role });
    } catch (err) { next(err); }
};