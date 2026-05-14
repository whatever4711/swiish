import { useState, useEffect } from 'react';

export default function DemoBanner() {
    const [isDemo, setIsDemo] = useState(false);
    useEffect(() => {
        fetch('/api/demo/status')
            .then(res => res.json())
            .then(data => setIsDemo(data.demoMode))
            .catch(() => {});
    }, []);
    if (!isDemo) return null;
    return (
        <div className="sticky top-0 z-50 bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-center py-2 text-sm font-semibold">
            🛠️ Demo Mode – Data resets every hour
        </div>
    );
}