import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { Lock } from 'lucide-react';
import VersionBadge from '../components/VersionBadge';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { showAlert } = useModal();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/people');
        } catch (err) {
            setError(err.message);
            showAlert(err.message, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-main-dark flex items-center justify-center p-4">
            <div className="bg-card dark:bg-card-dark max-w-sm w-full rounded-page shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">Login</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full px-5 py-3 rounded-input border border-border dark:border-border-dark bg-input-bg dark:bg-input-bg-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-focus-ring"
                        autoFocus
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-5 py-3 rounded-input border border-border dark:border-border-dark bg-input-bg dark:bg-input-bg-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    />
                    {error && <div className="text-error-text text-sm">{error}</div>}
                    <button
                        type="submit"
                        className="w-full py-3.5 rounded-full bg-confirm dark:bg-confirm-dark text-confirm-text dark:text-confirm-text-dark font-bold hover:bg-confirm-hover transition-colors"
                    >
                        Login
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