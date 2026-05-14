import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { apiCall } from '../services/api';
import { ArrowLeft, Plus, Edit3, Trash2, Mail, RefreshCw, User, Check } from 'lucide-react';

export default function UserManagement() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [users, setUsers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newInvite, setNewInvite] = useState({ email: '', role: 'member' });
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'member' });
    const [editingUserId, setEditingUserId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, invitesRes] = await Promise.all([
                apiCall('/api/admin/users'),
                apiCall('/api/admin/invitations')
            ]);
            if (usersRes.ok) setUsers(await usersRes.json());
            if (invitesRes.ok) {
                const data = await invitesRes.json();
                setInvitations(data.invitations);
            }
            const meRes = await apiCall('/api/auth/me');
            if (meRes.ok) {
                const me = await meRes.json();
                setCurrentUserId(me.id);
            }
        } catch (err) {
            showAlert('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'owner') fetchData();
    }, [user]);

    const handleUpdateRole = async (userId, newRole) => {
        try {
            const res = await apiCall(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                showAlert('Role updated', 'success');
                fetchData();
                setEditingUserId(null);
            } else {
                const err = await res.json();
                showAlert(err.error || 'Failed to update role', 'error');
            }
        } catch (err) {
            showAlert('Error updating role', 'error');
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        showConfirm(`Delete ${userEmail} permanently?`, async () => {
            const res = await apiCall(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                showAlert('User deleted', 'success');
                fetchData();
            } else {
                showAlert('Delete failed', 'error');
            }
        }, 'Delete User', 'Delete', 'Cancel');
    };

    const handleSendInvitation = async () => {
        if (!newInvite.email) return showAlert('Email required', 'error');
        setIsSaving(true);
        const res = await apiCall('/api/admin/invitations', {
            method: 'POST',
            body: JSON.stringify(newInvite)
        });
        setIsSaving(false);
        if (res.ok) {
            showAlert('Invitation sent', 'success');
            setShowInviteModal(false);
            setNewInvite({ email: '', role: 'member' });
            fetchData();
        } else {
            const err = await res.json();
            showAlert(err.error || 'Failed to send invitation', 'error');
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password) return showAlert('Email and password required', 'error');
        if (newUser.password.length < 8) return showAlert('Password min 8 characters', 'error');
        setIsSaving(true);
        const res = await apiCall('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify(newUser)
        });
        setIsSaving(false);
        if (res.ok) {
            showAlert('User created', 'success');
            setShowCreateModal(false);
            setNewUser({ email: '', password: '', role: 'member' });
            fetchData();
        } else {
            const err = await res.json();
            showAlert(err.error || 'Failed to create user', 'error');
        }
    };

    const handleRetryInvitation = async (invId) => {
        const res = await apiCall(`/api/admin/invitations/${invId}/retry`, { method: 'POST' });
        if (res.ok) {
            showAlert('Retry sent', 'success');
            fetchData();
        } else {
            showAlert('Retry failed', 'error');
        }
    };

    const handleDeleteInvitation = async (invId) => {
        showConfirm('Delete invitation?', async () => {
            const res = await apiCall(`/api/admin/invitations/${invId}`, { method: 'DELETE' });
            if (res.ok) {
                showAlert('Invitation deleted', 'success');
                fetchData();
            } else {
                showAlert('Delete failed', 'error');
            }
        });
    };

    if (user?.role !== 'owner') {
        return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
    }

    if (loading) return <div className="p-12 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-main dark:bg-main-dark">
            <div className="bg-card border-b p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/people')} className="p-2 hover:bg-surface rounded-full"><ArrowLeft size={20} /></button>
                    <h1 className="text-xl font-bold">User Management</h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowInviteModal(true)} className="px-4 py-2 bg-action text-white rounded-full flex items-center gap-2"><Plus size={16} /> Invite</button>
                    <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-confirm text-confirm-text rounded-full flex items-center gap-2"><Plus size={16} /> Create User</button>
                </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-card rounded-card border mb-8">
                    <div className="p-4 border-b font-semibold">Current Users</div>
                    {users.map(u => (
                        <div key={u.id} className="p-4 border-b flex justify-between items-center">
                            <div>
                                <div className="font-medium">{u.email}</div>
                                <div className="text-sm text-text-muted">
                                    {u.role === 'owner' ? 'Owner' : 'Member'} • Joined {new Date(u.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {u.id === currentUserId ? (
                                    <span className="text-xs text-text-muted">(You)</span>
                                ) : editingUserId === u.id ? (
                                    <>
                                        <select value={u.role} onChange={e => handleUpdateRole(u.id, e.target.value)} className="px-2 py-1 rounded border">
                                            <option value="member">Member</option>
                                            <option value="owner">Owner</option>
                                        </select>
                                        <button onClick={() => setEditingUserId(null)} className="px-2 py-1 bg-surface rounded">Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setEditingUserId(u.id)} className="p-1"><Edit3 size={16} /></button>
                                        <button onClick={() => handleDeleteUser(u.id, u.email)} className="p-1 text-error"><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-card rounded-card border">
                    <div className="p-4 border-b font-semibold">Pending Invitations</div>
                    {invitations.filter(i => !i.accepted_at).map(inv => (
                        <div key={inv.id} className="p-4 border-b flex justify-between items-center">
                            <div>
                                <div>{inv.email}</div>
                                <div className="text-sm text-text-muted">
                                    Role: {inv.role} • {inv.status} • Expires {new Date(inv.expires_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {(inv.status === 'failed' || inv.status === 'pending') && (
                                    <button onClick={() => handleRetryInvitation(inv.id)} className="px-2 py-1 bg-surface rounded text-xs"><RefreshCw size={12} /> Retry</button>
                                )}
                                <button onClick={() => handleDeleteInvitation(inv.id)} className="p-1 text-error"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-card p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Invite User</h3>
                        <input type="email" placeholder="Email" value={newInvite.email} onChange={e => setNewInvite({...newInvite, email: e.target.value})} className="w-full p-2 rounded-input border mb-3" />
                        <select value={newInvite.role} onChange={e => setNewInvite({...newInvite, role: e.target.value})} className="w-full p-2 rounded-input border mb-4">
                            <option value="member">Member</option>
                            <option value="owner">Owner</option>
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setShowInviteModal(false)} className="flex-1 p-2 bg-surface rounded">Cancel</button>
                            <button onClick={handleSendInvitation} disabled={isSaving} className="flex-1 p-2 bg-action text-white rounded font-bold">Send</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-card p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Create User</h3>
                        <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-2 rounded-input border mb-3" />
                        <input type="password" placeholder="Password (min 8)" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-2 rounded-input border mb-3" />
                        <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full p-2 rounded-input border mb-4">
                            <option value="member">Member</option>
                            <option value="owner">Owner</option>
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 p-2 bg-surface rounded">Cancel</button>
                            <button onClick={handleCreateUser} disabled={isSaving} className="flex-1 p-2 bg-confirm text-confirm-text rounded font-bold">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}