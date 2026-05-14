import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall, fetchCsrfToken } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const checkAuth = async () => {
        try {
            const res = await apiCall('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setIsAuthenticated(true);
                return true;
            }
            setUser(null);
            setIsAuthenticated(false);
            return false;
        } catch (e) {
            setUser(null);
            setIsAuthenticated(false);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await apiCall('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (res.ok) {
            await checkAuth();
            return true;
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Login failed');
    };

    const logout = async () => {
        await apiCall('/api/logout', { method: 'POST' });
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
    };

    useEffect(() => {
        fetchCsrfToken();
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}