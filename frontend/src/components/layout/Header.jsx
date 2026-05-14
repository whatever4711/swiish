import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { Settings, Users, Plus, LogOut, Sun, Moon } from 'lucide-react';

export default function Header({ title, subtitle, showBack = false, onBack }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useDarkMode();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
                {showBack && (
                    <button onClick={onBack} className="p-2 hover:bg-surface dark:hover:bg-surface-dark rounded-full">
                        ←
                    </button>
                )}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary dark:text-text-primary-dark">{title}</h1>
                    {subtitle && <p className="text-sm md:text-base text-text-muted dark:text-text-muted-dark">{subtitle}</p>}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3">
                <button
                    onClick={toggleDarkMode}
                    className="px-3 py-2 md:px-4 md:py-3 rounded-full font-medium text-text-muted dark:text-text-muted-dark bg-card dark:bg-card-dark border border-border dark:border-border-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button onClick={handleLogout} className="px-3 py-2 md:px-4 md:py-3 rounded-full font-medium text-text-muted dark:text-text-muted-dark bg-card dark:bg-card-dark border border-border dark:border-border-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Logout
                </button>

                {user?.role === 'owner' && (
                    <>
                        <button onClick={() => navigate('/settings')} className="px-3 py-2 md:px-4 md:py-3 rounded-full font-medium text-text-secondary dark:text-text-secondary-dark bg-card dark:bg-card-dark border border-border dark:border-border-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors flex items-center gap-2">
                            <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Organisation</span><span className="sm:hidden">Org</span>
                        </button>
                        <button onClick={() => navigate('/users')} className="px-3 py-2 md:px-4 md:py-3 rounded-full font-medium text-text-secondary dark:text-text-secondary-dark bg-card dark:bg-card-dark border border-border dark:border-border-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors flex items-center gap-2">
                            <Users className="w-4 h-4" /> Users
                        </button>
                    </>
                )}

                <button onClick={() => navigate('/people?new=true')} className="bg-action dark:bg-action-dark text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-bold flex items-center gap-2 hover:bg-action-hover dark:hover:bg-action-hover-dark transition-all">
                    <Plus className="w-4 h-4 md:w-5 md:h-5" /> New Person
                </button>
            </div>
        </div>
    );
}