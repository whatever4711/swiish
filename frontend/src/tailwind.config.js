const swiishTheme = require('./src/theme/swiish');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic colors - use these throughout your app
        'main': swiishTheme.colors.main.light,
        'main-dark': swiishTheme.colors.main.dark,
        
        'card': swiishTheme.colors.card.light,
        'card-dark': swiishTheme.colors.card.dark,
        
        'surface': swiishTheme.colors.surface.light,
        'surface-dark': swiishTheme.colors.surface.dark,
        
        'action': swiishTheme.colors.action.light,
        'action-dark': swiishTheme.colors.action.dark,
        'action-hover': swiishTheme.colors.actionHover.light,
        'action-hover-dark': swiishTheme.colors.actionHover.dark,
        
        'text-primary': swiishTheme.colors.textPrimary.light,
        'text-primary-dark': swiishTheme.colors.textPrimary.dark,
        
        'text-secondary': swiishTheme.colors.textSecondary.light,
        'text-secondary-dark': swiishTheme.colors.textSecondary.dark,
        
        'text-muted': swiishTheme.colors.textMuted.light,
        'text-muted-dark': swiishTheme.colors.textMuted.dark,
        
        'text-muted-subtle': swiishTheme.colors.textMutedSubtle.light,
        'text-muted-subtle-dark': swiishTheme.colors.textMutedSubtle.dark,
        
        'border': swiishTheme.colors.border.light,
        'border-dark': swiishTheme.colors.border.dark,
        
        'border-subtle': swiishTheme.colors.borderSubtle.light,
        'border-subtle-dark': swiishTheme.colors.borderSubtle.dark,
        
        'success': swiishTheme.colors.success.light,
        'success-dark': swiishTheme.colors.success.dark,
        'success-hover': swiishTheme.colors.successHover.light,
        'success-hover-dark': swiishTheme.colors.successHover.dark,
        'success-bg': swiishTheme.colors.successBg.light,
        'success-bg-dark': swiishTheme.colors.successBg.dark,
        'success-text': swiishTheme.colors.successText.light,
        'success-text-dark': swiishTheme.colors.successText.dark,
        'success-border': swiishTheme.colors.successBorder.light,
        'success-border-dark': swiishTheme.colors.successBorder.dark,
        
        'error': swiishTheme.colors.error.light,
        'error-dark': swiishTheme.colors.error.dark,
        'error-hover': swiishTheme.colors.errorHover.light,
        'error-hover-dark': swiishTheme.colors.errorHover.dark,
        'error-bg': swiishTheme.colors.errorBg.light,
        'error-bg-dark': swiishTheme.colors.errorBg.dark,
        'error-text': swiishTheme.colors.errorText.light,
        'error-text-dark': swiishTheme.colors.errorText.dark,
        'error-border': swiishTheme.colors.errorBorder.light,
        'error-border-dark': swiishTheme.colors.errorBorder.dark,
        
        'info': swiishTheme.colors.info.light,
        'info-dark': swiishTheme.colors.info.dark,
        'info-hover': swiishTheme.colors.infoHover.light,
        'info-hover-dark': swiishTheme.colors.infoHover.dark,
        'info-bg': swiishTheme.colors.infoBg.light,
        'info-bg-dark': swiishTheme.colors.infoBg.dark,
        'info-text': swiishTheme.colors.infoText.light,
        'info-text-dark': swiishTheme.colors.infoText.dark,
        'info-border': swiishTheme.colors.infoBorder.light,
        'info-border-dark': swiishTheme.colors.infoBorder.dark,
        
        'link': swiishTheme.colors.link.light,
        'link-dark': swiishTheme.colors.link.dark,
        'link-bg': swiishTheme.colors.linkBg.light,
        'link-bg-dark': swiishTheme.colors.linkBg.dark,
        'link-border': swiishTheme.colors.linkBorder.light,
        'link-border-dark': swiishTheme.colors.linkBorder.dark,
        'link-hover': swiishTheme.colors.linkHover.light,
        'link-hover-dark': swiishTheme.colors.linkHover.dark,
        
        'input-bg': swiishTheme.colors.inputBg.light,
        'input-bg-dark': swiishTheme.colors.inputBg.dark,
        'input-border': swiishTheme.colors.inputBorder.light,
        'input-border-dark': swiishTheme.colors.inputBorder.dark,
        'input-text': swiishTheme.colors.inputText.light,
        'input-text-dark': swiishTheme.colors.inputText.dark,
        
        'focus-ring': swiishTheme.colors.focusRing.light,
        'focus-ring-dark': swiishTheme.colors.focusRing.dark,
        
        'overlay': swiishTheme.colors.overlay.light,
        'overlay-dark': swiishTheme.colors.overlay.dark,
        
        'confirm': swiishTheme.colors.confirm.light,
        'confirm-dark': swiishTheme.colors.confirm.dark,
        'confirm-hover': swiishTheme.colors.confirmHover.light,
        'confirm-hover-dark': swiishTheme.colors.confirmHover.dark,
        'confirm-text': swiishTheme.colors.confirmText.light,
        'confirm-text-dark': swiishTheme.colors.confirmText.dark,
        'confirm-bg': swiishTheme.colors.confirmBg.light,
        'confirm-bg-dark': swiishTheme.colors.confirmBg.dark,
        'confirm-border': swiishTheme.colors.confirmBorder.light,
        'confirm-border-dark': swiishTheme.colors.confirmBorder.dark,
        
        // Keep existing slate colors for backward compatibility
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      // Border Radius - semantic names for corner radius
      borderRadius: swiishTheme.borderRadius,
      // Border Width - semantic names for border thickness
      borderWidth: swiishTheme.borderWidth,
    },
  },
  plugins: [],
};

