import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../services/api';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        default_organisation: 'My Organisation',
        theme_variant: 'swiish',
        theme_colors: [],
        allow_theme_customisation: true,
        allow_image_customisation: true,
        allow_links_customisation: true,
        allow_privacy_customisation: true
    });

    const fetchPublicSettings = async (orgSlug = 'default') => {
        try {
            const url = orgSlug ? `/api/settings?orgSlug=${orgSlug}` : '/api/settings';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, ...data }));
                applyTheme(data.theme_variant || 'swiish');
            }
        } catch (err) {
            console.error('Failed to fetch public settings', err);
        }
    };

    const fetchAdminSettings = async () => {
        try {
            const res = await apiCall('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, ...data }));
                applyTheme(data.theme_variant || 'swiish');
            }
        } catch (err) {
            console.error('Failed to fetch admin settings', err);
        }
    };

    const applyTheme = (variant) => {
        document.body.classList.remove('theme-swiish', 'theme-minimal', 'theme-custom');
        document.body.classList.add(`theme-${variant}`);
        // Also apply CSS vars if needed
    };

    return (
        <SettingsContext.Provider value={{ settings, setSettings, fetchPublicSettings, fetchAdminSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}