const colorMap = {
    indigo: '#4f46e5', blue: '#2563eb', rose: '#e11d48', emerald: '#059669',
    slate: '#475569', purple: '#7c3aed', cyan: '#0891b2', teal: '#0d9488',
    orange: '#ea580c', pink: '#db2777', violet: '#7c3aed', fuchsia: '#c026d3',
    amber: '#d97706', lime: '#65a30d', green: '#16a34a', yellow: '#ca8a04', red: '#dc2626'
};

function getThemeColorHex(colorName) {
    if (!colorName || typeof colorName !== 'string') return '#4f46e5';
    const normalized = colorName.toLowerCase().trim();
    return colorMap[normalized] || '#4f46e5';
}

module.exports = { getThemeColorHex };