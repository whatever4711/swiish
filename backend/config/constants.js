module.exports = {
    SHORT_CODE_LENGTH: 7,
    SHORT_CODE_CHARS: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    MAX_LOG_LINES: 1000,
    PREVIEW_CACHE_MAX_AGE: 24 * 60 * 60 * 1000,
    PREVIEW_CACHE_MAX_SIZE_MB: 100,
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    DEFAULT_THEME_COLORS: [
        { name: "indigo", colorType: "standard", baseColor: "indigo", hexBase: "#4f46e5", hexSecondary: "#7c3aed", gradientStyle: "linear-gradient(135deg, #4f46e5, #7c3aed)", buttonStyle: "#4f46e5", linkStyle: "#4f46e5", textStyle: "#4f46e5" },
        { name: "blue", colorType: "standard", baseColor: "blue", hexBase: "#2563eb", hexSecondary: "#0891b2", gradientStyle: "linear-gradient(135deg, #2563eb, #0891b2)", buttonStyle: "#2563eb", linkStyle: "#2563eb", textStyle: "#2563eb" },
        { name: "rose", colorType: "standard", baseColor: "rose", hexBase: "#e11d48", hexSecondary: "#ea580c", gradientStyle: "linear-gradient(135deg, #e11d48, #ea580c)", buttonStyle: "#e11d48", linkStyle: "#e11d48", textStyle: "#e11d48" },
        { name: "emerald", colorType: "standard", baseColor: "emerald", hexBase: "#059669", hexSecondary: "#0d9488", gradientStyle: "linear-gradient(135deg, #059669, #0d9488)", buttonStyle: "#059669", linkStyle: "#059669", textStyle: "#059669" },
        { name: "slate", colorType: "standard", baseColor: "slate", hexBase: "#475569", hexSecondary: "#475569", gradientStyle: "linear-gradient(135deg, #475569, #475569)", buttonStyle: "#475569", linkStyle: "#475569", textStyle: "#475569" }
    ]
};