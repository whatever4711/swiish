import { useState, useEffect } from 'react';
const APP_VERSION = require('../../package.json').version;
const GITHUB_URL = 'https://github.com/whatever4711/swiish';

export default function VersionBadge() {
    const [isOutdated, setIsOutdated] = useState(false);
    useEffect(() => {
        fetch('https://api.github.com/repos/whatever4711/swiish/releases/latest')
            .then(res => res.json())
            .then(data => {
                const latest = data.tag_name?.replace(/^v/, '');
                if (latest && latest !== APP_VERSION) setIsOutdated(true);
            })
            .catch(() => {});
    }, []);
    return (
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={`fixed bottom-4 left-4 z-50 text-xs px-2 py-1 rounded shadow-sm bg-card border ${isOutdated ? 'text-error' : ''}`}>
            v{APP_VERSION} {isOutdated && '(Update available)'}
        </a>
    );
}