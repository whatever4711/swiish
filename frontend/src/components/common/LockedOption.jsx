import React from 'react';
import { Lock } from 'lucide-react';

export default function LockedOption({ message }) {
    return (
        <div className="relative">
            <div className="opacity-50 pointer-events-none">
                {/* Children would be passed, but we show a simple box */}
            </div>
            <div className="bg-surface/80 dark:bg-card-dark/80 rounded-container border-thick border-dashed border-border dark:border-border-dark p-4 text-center">
                <Lock className="w-5 h-5 mx-auto mb-2 text-text-muted" />
                <p className="text-sm text-text-secondary dark:text-text-muted-dark">{message}</p>
            </div>
        </div>
    );
}