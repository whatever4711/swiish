import React from 'react';

export default function Input({ label, icon: Icon, value, onChange, type = 'text', placeholder }) {
    return (
        <div className="space-y-1">
            {label && <label className="text-sm font-medium">{label}</label>}
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-3 w-4 h-4 text-text-muted" />}
                <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full ${Icon ? 'pl-9' : 'px-4'} py-2 rounded-input border border-border bg-input-bg focus:outline-none focus:ring-2 focus:ring-focus-ring`} />
            </div>
        </div>
    );
}