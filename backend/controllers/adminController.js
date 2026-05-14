const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Organisation = require('../models/Organisation');
const Card = require('../models/Card');
const { sendMail } = require('../services/emailService');
const bcrypt = require('bcrypt');
const env = require('../config/env');
const { logAudit } = require('../services/auditService');
const slugify = require('../utils/slugify');

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findByOrganisation(req.user.organisationId);
        res.json(users);
    } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;
        const existing = await User.findByEmail(email);
        if (existing) return res.status(400).json({ error: 'User already exists' });
        const activeInvitation = await Invitation.findByEmailAndOrg(email, req.user.organisationId);
        if (activeInvitation) return res.status(400).json({ error: 'Active invitation exists for this email' });
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ email, passwordHash, organisationId: req.user.organisationId, role, emailVerified: 0 });
        await logAudit('user_created', 'user', user.id, { email, role }, req.user.id, req.user.organisationId);
        res.json({ success: true, userId: user.id, email, role });
    } catch (err) { next(err); }
};

exports.updateUserRole = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        if (userId === req.user.id) return res.status(400).json({ error: 'Cannot change own role' });
        const db = require('../config/database');
        const user = await db.getAsync("SELECT id, role FROM users WHERE id = ? AND organisation_id = ?", [userId, req.user.organisationId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.role === 'owner' && role === 'member') {
            const ownerCount = await db.getAsync("SELECT COUNT(*) as count FROM users WHERE organisation_id = ? AND role = 'owner'", [req.user.organisationId]);
            if (ownerCount.count === 1) return res.status(400).json({ error: 'Cannot remove last owner' });
        }
        await User.updateRole(userId, role);
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (userId === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
        const db = require('../config/database');
        const user = await db.getAsync("SELECT id, email, role FROM users WHERE id = ? AND organisation_id = ?", [userId, req.user.organisationId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.role === 'owner') {
            const ownerCount = await db.getAsync("SELECT COUNT(*) as count FROM users WHERE organisation_id = ? AND role = 'owner'", [req.user.organisationId]);
            if (ownerCount.count === 1) return res.status(400).json({ error: 'Cannot delete last owner' });
        }
        await logAudit('user_deleted', 'user', userId, { email: user.email }, req.user.id, req.user.organisationId);
        await User.delete(userId);
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.listInvitations = async (req, res, next) => {
    try {
        const invitations = await Invitation.listByOrganisation(req.user.organisationId);
        res.json({ invitations });
    } catch (err) { next(err); }
};

exports.createInvitation = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const existingUser = await User.findByEmail(email);
        if (existingUser) return res.status(400).json({ error: 'User already exists' });
        const activeInvitation = await Invitation.findByEmailAndOrg(email, req.user.organisationId);
        if (activeInvitation) return res.status(400).json({ error: 'Active invitation exists' });
        const { id, token, expiresAt } = await Invitation.create({ organisationId: req.user.organisationId, email, role, invitedBy: req.user.id });
        const org = await Organisation.findById(req.user.organisationId);
        const inviteUrl = `${env.APP_URL}/invite/${token}`;
        const html = `<h2>Invitation to join ${org.name}</h2><p><a href="${inviteUrl}">Accept invitation</a></p>`;
        const emailSent = await sendMail({ to: email, subject: `Join ${org.name} on Swiish`, text: `Accept: ${inviteUrl}`, html });
        const status = emailSent ? 'sent' : 'failed';
        await Invitation.updateStatus(id, status);
        await logAudit('invitation_created', 'invitation', id, { email, role, status }, req.user.id, req.user.organisationId);
        res.json({ success: true, invitationId: id, expiresAt, status });
    } catch (err) { next(err); }
};

exports.retryInvitation = async (req, res, next) => {
    try {
        const { invitationId } = req.params;
        const db = require('../config/database');
        const invitation = await db.getAsync(`
      SELECT i.*, o.name as org_name
      FROM invitations i
      JOIN organisations o ON i.organisation_id = o.id
      WHERE i.id = ? AND i.organisation_id = ?
    `, [invitationId, req.user.organisationId]);
        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
        if (invitation.status !== 'failed' && invitation.status !== 'pending') {
            return res.status(400).json({ error: `Cannot retry invitation with status: ${invitation.status}` });
        }
        const inviteUrl = `${env.APP_URL}/invite/${invitation.token}`;
        const html = `<h2>Invitation to join ${invitation.org_name}</h2><p><a href="${inviteUrl}">Accept invitation</a></p>`;
        const emailSent = await sendMail({ to: invitation.email, subject: `Join ${invitation.org_name} on Swiish`, text: `Accept: ${inviteUrl}`, html });
        const status = emailSent ? 'sent' : 'failed';
        await Invitation.updateStatus(invitationId, status);
        res.json({ success: emailSent, status });
    } catch (err) { next(err); }
};

exports.deleteInvitation = async (req, res, next) => {
    try {
        const { invitationId } = req.params;
        const db = require('../config/database');
        const invitation = await db.getAsync("SELECT id FROM invitations WHERE id = ? AND organisation_id = ?", [invitationId, req.user.organisationId]);
        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
        await Invitation.delete(invitationId);
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.getLogs = (req, res, next) => {
    try {
        const { getLogs } = require('../middleware/requestLogger');
        const logs = getLogs();
        res.json({ logs, totalLines: logs.length });
    } catch (err) { next(err); }
};