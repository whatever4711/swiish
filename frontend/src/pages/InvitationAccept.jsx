import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../services/api';
import { useModal } from '../context/ModalContext';

export default function InvitationAccept() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useModal();
    const [invitation, setInvitation] = useState(null);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const res = await apiCall(`/api/invitations/${token}`);
                if (!res.ok) throw new Error('Invalid or expired invitation');
                const data = await res.json();
                setInvitation(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInvite();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        setSubmitting(true);
        try {
            const res = await apiCall(`/api/invitations/${token}/accept`, {
                method: 'POST',
                body: JSON.stringify({ password })
            });
            if (res.ok) {
                showAlert('Account created! You are now logged in.', 'success');
                navigate('/people');
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to accept invitation');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-error">{error}</div>;
    if (!invitation) return null;

    return (
        <div className="min-h-screen bg-surface dark:bg-main-dark flex items-center justify-center p-4">
            <div className="bg-card rounded-card p-8 max-w-md w-full shadow-xl">
                <h1 className="text-2xl font-bold mb-2">Join {invitation.organisationName}</h1>
                <p className="text-text-muted mb-6">You've been invited as a {invitation.role}.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" value={invitation.email} disabled className="w-full p-3 rounded-input bg-surface text-text-muted" />
                    <input type="password" placeholder="Password (min 8 characters)" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-input border" required />
                    <input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full p-3 rounded-input border" required />
                    {error && <div className="text-error text-sm">{error}</div>}
                    <button type="submit" disabled={submitting} className="w-full py-3 bg-action text-white rounded-full font-bold">
                        {submitting ? 'Creating account...' : 'Accept Invitation'}
                    </button>
                </form>
            </div>
        </div>
    );
}