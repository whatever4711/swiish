import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCards } from '../hooks/useCards';
import { Plus, Users, Settings, Edit3, Trash2, ExternalLink, User, Sun, Moon } from 'lucide-react';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user, logout, darkMode, toggleDarkMode } = useAuth(); // assume darkMode from context
    const { cards, loading, deleteCard } = useCards();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [newInvitation, setNewInvitation] = useState({ email: '', role: 'member' });

    // Group cards by user (simplified)
    const userMap = new Map();
    cards.forEach(card => {
        const key = card.userId || card.userEmail;
        if (!userMap.has(key)) {
            userMap.set(key, {
                userId: card.userId,
                userEmail: card.userEmail,
                userRole: card.userRole,
                userCreatedAt: card.userCreatedAt,
                cards: []
            });
        }
        userMap.get(key).cards.push(card);
    });
    const groupedUsers = Array.from(userMap.values());

    return (
        <div className="min-h-screen bg-main dark:bg-main-dark p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">People</h1>
                        <p className="text-sm md:text-base text-text-muted">Manage your people</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={toggleDarkMode} className="px-3 py-2 rounded-full bg-card border border-border">
                            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button onClick={logout} className="px-3 py-2 rounded-full bg-card border border-border">Logout</button>
                        {user?.role === 'owner' && (
                            <button onClick={() => navigate('/settings')} className="px-3 py-2 rounded-full bg-card border border-border flex items-center gap-2">
                                <Settings size={16} /> Org
                            </button>
                        )}
                        <button onClick={() => setShowInviteModal(true)} className="bg-action text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                            <Plus size={16} /> New Person
                        </button>
                    </div>
                </div>
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                    {groupedUsers.map(userGroup => (
                        <div key={userGroup.userId || userGroup.userEmail} className="bg-card rounded-card p-4 mb-6 break-inside-avoid">
                            {user?.role === 'owner' && userGroup.userEmail && (
                                <div className="mb-4 p-3 bg-surface/50 rounded text-xs">
                                    <div className="font-medium">{userGroup.userEmail}</div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px]">{userGroup.userRole === 'owner' ? 'Owner' : 'Member'}</span>
                                        <span className="text-[10px]">{new Date(userGroup.userCreatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-4">
                                {userGroup.cards.filter(c => c.slug).map(card => (
                                    <div key={card.slug} className="bg-surface rounded-badge p-4">
                                        <div className="flex gap-3">
                                            <div className="w-16 h-16 rounded-full bg-surface overflow-hidden">
                                                {card.avatar ? <img src={card.avatar} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-3" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold">{card.name}</div>
                                                <div className="text-xs text-text-muted">{card.title}</div>
                                                <div className="text-[10px] font-mono mt-1">/{card.shortCode || card.slug}</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => navigate(`/people/edit/${card.slug}`)} className="p-1"><Edit3 size={14} /></button>
                                                <button onClick={() => deleteCard(card.slug, card.userId)} className="p-1"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <a href={`/${card.shortCode || `${card.orgSlug}/${card.slug}`}`} target="_blank" className="flex-1 text-center py-1 text-xs bg-card rounded-button">View</a>
                                            <button onClick={() => navigate(`/people/edit/${card.slug}`)} className="flex-1 text-center py-1 text-xs bg-card rounded-button">Edit</button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => navigate(`/people/edit/new?userId=${userGroup.userId || ''}`)} className="w-full py-2 text-sm bg-action text-white rounded-button">+ Create Card</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}