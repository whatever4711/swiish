import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { apiCall } from '../services/api';
import { Settings, Save, Check, RefreshCw } from 'lucide-react';
import VersionBadge from '../components/VersionBadge';

export default function SetupWizard() {
    const [organisationName, setOrganisationName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [error, setError] = useState('');
    const { checkAuth } = useAuth();
    const { showAlert } = useModal();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSettingUp(true);
        setError('');
        try {
            const res = await apiCall('/api/setup/initialize', {
                method: 'POST',
                body: JSON.stringify({ organisationName, adminEmail, adminPassword })
            });
            if (res.ok) {
                showAlert('Setup completed successfully!', 'success');
                await checkAuth();
                navigate('/people');
            } else {
                const data = await res.json();
                setError(data.error || 'Setup failed');
            }
        } catch (err) {
            setError('Setup failed. Please try again.');
        } finally {
            setIsSettingUp(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-main-dark flex items-center justify-center p-4">
            <div className="bg-card dark:bg-card-dark max-w-md w-full rounded-page shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">Initial Setup</h1>
                    <p className="text-sm text-text-muted mt-2">Configure your organisation and create the first admin user</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={organisationName}
                        onChange={(e) => setOrganisationName(e.target.value)}
                        placeholder="Organisation Name"
                        className="w-full px-5 py-3 rounded-input border border-border dark:border-border-dark bg-input-bg dark:bg-input-bg-dark"
                        required
                        autoFocus
                    />
                    <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="Admin Email"
                        className="w-full px-5 py-3 rounded-input border border-border dark:border-border-dark bg-input-bg dark:bg-input-bg-dark"
                        required
                    />
                    <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Password (min 8 characters)"
                        className="w-full px-5 py-3 rounded-input border border-border dark:border-border-dark bg-input-bg dark:bg-input-bg-dark"
                        required
                        minLength={8}
                    />
                    {error && <div className="text-error-text text-sm">{error}</div>}
                    <button
                        type="submit"
                        disabled={isSettingUp}
                        className="w-full py-3.5 rounded-full bg-action dark:bg-action-dark text-white font-bold hover:bg-action-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSettingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSettingUp ? 'Setting up...' : 'Complete Setup'}
                    </button>
                </form>
                <div className="text-center mt-8">
                    <img src="/graphics/Swiish_Logo.svg" alt="Swiish" className="h-4 w-auto mx-auto dark:hidden" />
                    <img src="/graphics/Swiish_Logo_DarkBg.svg" alt="Swiish" className="h-4 w-auto mx-auto hidden dark:block" />
                </div>
            </div>
            <VersionBadge />
        </div>
    );
}