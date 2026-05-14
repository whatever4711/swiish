import React from 'react';

export default function SocialIcon({ url, icon: Icon, label, themeColor, settings }) {
    if (!url) return null;

    const getButtonColor = (colorName, settings) => {
        if (!settings?.theme_colors) return '#4f46e5';
        const color = settings.theme_colors.find(c => c.name === colorName);
        return color?.buttonStyle || '#4f46e5';
    };

    const hoverColor = themeColor?.buttonStyle || getButtonColor(themeColor?.name || 'indigo', settings);

    return (
        <a href={url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group">
            <div
                className="w-full aspect-square rounded-card bg-surface dark:bg-surface-dark border border-border-subtle dark:border-border-dark flex items-center justify-center text-text-secondary dark:text-text-secondary-dark group-hover:scale-105 transition-transform group-hover:shadow-md group-hover:text-white"
                style={{ '--hover-bg': hoverColor }}
            >
                <style>{`.group:hover div { background-color: ${hoverColor}; border-color: ${hoverColor}; }`}</style>
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted-subtle dark:text-text-muted-dark">{label}</span>
        </a>
    );
}