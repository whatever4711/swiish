import React, { useState, useEffect } from 'react';
import {
    User, MapPin, Briefcase, Mail, Phone, Save, Share2, Download,
    ExternalLink, Globe, Linkedin, Twitter, Instagram, Github,
    Sun, Moon, Eye, MessageCircle, Check, X
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import flags from 'country-flag-icons/react/3x2';
import DOMPurify from 'dompurify';

// Helper functions (same as original)
const sanitizeText = (text) => {
    if (!text) return '';
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

const sanitizeHTML = (html) => {
    if (!html) return '';
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'] });
};

const getThemeGradient = (colorName, settings) => {
    if (!settings?.theme_colors) return 'linear-gradient(135deg, #4f46e5, #7c3aed)';
    const color = settings.theme_colors.find(c => c.name === colorName);
    return color?.gradientStyle || 'linear-gradient(135deg, #4f46e5, #7c3aed)';
};

const getButtonColor = (colorName, settings) => {
    if (!settings?.theme_colors) return '#4f46e5';
    const color = settings.theme_colors.find(c => c.name === colorName);
    return color?.buttonStyle || '#4f46e5';
};

const getLinkColor = (colorName, settings) => {
    if (!settings?.theme_colors) return '#4f46e5';
    const color = settings.theme_colors.find(c => c.name === colorName);
    return color?.linkStyle || '#4f46e5';
};

const getTextColor = (colorName, settings) => {
    if (!settings?.theme_colors) return '#4f46e5';
    const color = settings.theme_colors.find(c => c.name === colorName);
    return color?.textStyle || '#4f46e5';
};

const darkenHex = (hex, percent) => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0,2),16);
    const g = parseInt(hex.substring(2,4),16);
    const b = parseInt(hex.substring(4,6),16);
    const factor = 1 - percent/100;
    const newR = Math.max(0, Math.floor(r * factor));
    const newG = Math.max(0, Math.floor(g * factor));
    const newB = Math.max(0, Math.floor(b * factor));
    const toHex = (n) => n.toString(16).padStart(2,'0');
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

const ICON_MAP = {
    link: (props) => <Globe {...props} />,
    download: (props) => <Download {...props} />,
    file: (props) => <FileText {...props} />,
    calendar: (props) => <Calendar {...props} />,
    video: (props) => <Video {...props} />,
    music: (props) => <Music {...props} />,
    shop: (props) => <ShoppingCart {...props} />,
    youtube: (props) => <Youtube {...props} />,
    facebook: (props) => <Facebook {...props} />,
    whatsapp: (props) => <MessageCircle {...props} />,
    globe: (props) => <Globe {...props} />
};

// vCard builder
const buildVCardString = (personal, contact) => {
    const { firstName='', middleName='', lastName='', prefix='', suffix='', title='', company='', bio='' } = personal;
    const { email='', phone='', website='' } = contact;
    const fullName = [prefix, firstName, middleName, lastName, suffix].filter(Boolean).join(' ').trim();
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    if (fullName) vcard += `FN:${fullName}\n`;
    vcard += `N:${lastName};${firstName};${middleName};${prefix};${suffix}\n`;
    if (company) vcard += `ORG:${company}\n`;
    if (title) vcard += `TITLE:${title}\n`;
    if (phone) vcard += `TEL;TYPE=CELL:${phone}\n`;
    if (email) vcard += `EMAIL;TYPE=WORK:${email}\n`;
    if (website) vcard += `URL:${website}\n`;
    if (bio) vcard += `NOTE:${bio}\n`;
    vcard += 'END:VCARD';
    return vcard;
};

function SocialIcon({ url, icon: Icon, label, themeColor, settings }) {
    if (!url) return null;
    const hoverColor = themeColor?.buttonStyle || getButtonColor(themeColor?.name || 'indigo', settings);
    return (
        <a href={url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group">
            <div className="w-full aspect-square rounded-card bg-surface dark:bg-surface-dark border border-border-subtle flex items-center justify-center text-text-secondary group-hover:scale-105 transition-transform group-hover:shadow-md group-hover:text-white" style={{ '--hover-bg': hoverColor }}>
                <style>{`.group:hover div { background-color: ${hoverColor}; border-color: ${hoverColor}; }`}</style>
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted-subtle">{label}</span>
        </a>
    );
}

export default function CardDisplay({ data, settings, darkMode, toggleDarkMode, showAlert }) {
    const { personal = {}, contact = {}, social = {}, images = {}, theme = { color: 'indigo' }, links = [], privacy = {} } = data;
    const [showQR, setShowQR] = useState(false);
    const [qrMode, setQrMode] = useState(() => (typeof navigator !== 'undefined' ? (navigator.onLine ? 'simple' : 'rich') : 'simple'));
    const [qrSimpleDataUrl, setQrSimpleDataUrl] = useState('');
    const [qrRichDataUrl, setQrRichDataUrl] = useState('');
    const [offlineQrPayload, setOfflineQrPayload] = useState(null);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [qrError, setQrError] = useState(null);
    const [contactRevealed, setContactRevealed] = useState(false);
    const [showSendOptions, setShowSendOptions] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isPwaInstalled, setIsPwaInstalled] = useState(false);

    const ownerPhone = contact.phone || '';
    const ownerEmail = contact.email || '';
    const ownerPhoneDigits = ownerPhone.replace(/\D/g, '');
    const whatsappLink = ownerPhoneDigits && ownerPhoneDigits.length >= 8
        ? `https://wa.me/${ownerPhoneDigits}?text=${encodeURIComponent('Hi, we met via your Swiish card. My name is ...')}`
        : null;
    const emailLink = ownerEmail
        ? `mailto:${ownerEmail}?subject=${encodeURIComponent('My details from Swiish')}&body=${encodeURIComponent('Hi, we met via your Swiish card.\nMy name is ...\nMy phone number is ...\nMy email address is ...')}`
        : null;
    const dropCallLink = ownerPhone ? `tel:${ownerPhone}` : null;

    const downloadPdf = async (layout = 'single') => {
        try {
            let shortCode = data._shortCode;
            if (!shortCode) {
                const pathParts = window.location.pathname.substring(1).split('/').filter(p => p);
                const isShortCodeRoute = pathParts.length === 1 && /^[a-zA-Z0-9]{7}$/.test(pathParts[0]);
                shortCode = isShortCodeRoute ? pathParts[0] : null;
            }
            if (!shortCode) {
                if (showAlert) showAlert('Unable to generate PDF: missing short code', 'error');
                return;
            }
            const response = await fetch(`/api/cards/${shortCode}/export-pdf?layout=${layout}`, { method: 'POST' });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = layout === 'a4' ? `cards_${shortCode}_a4.pdf` : `card_${shortCode}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[PDF] Download failed:', err);
            if (showAlert) showAlert('Failed to generate PDF. Please try again.', 'error');
        }
    };

    const obfuscateContact = (value) => value ? btoa(value) : '';
    const deobfuscateContact = (obfuscated) => {
        try { return atob(obfuscated); } catch(e) { return ''; }
    };

    // Set title
    useEffect(() => {
        const prefix = personal.prefix ? personal.prefix + ' ' : '';
        const suffix = personal.suffix ? ' ' + personal.suffix : '';
        const middleName = personal.middleName ? ' ' + personal.middleName : '';
        const fullName = sanitizeText(`${prefix}${personal.firstName || ''}${middleName}${personal.lastName || ''}${suffix}`).trim();
        if (fullName) document.title = fullName;
    }, [personal]);

    // Robots meta tag
    useEffect(() => {
        const metaRobots = document.querySelector('meta[name="robots"]');
        if (privacy.blockRobots) {
            if (!metaRobots) {
                const meta = document.createElement('meta');
                meta.setAttribute('name', 'robots');
                document.head.appendChild(meta);
            }
            document.querySelector('meta[name="robots"]').setAttribute('content', 'noindex, nofollow');
        } else if (metaRobots) {
            metaRobots.remove();
        }
        return () => {
            const mr = document.querySelector('meta[name="robots"]');
            if (mr) mr.remove();
        };
    }, [privacy.blockRobots]);

    // PWA install
    useEffect(() => {
        const handleBeforeInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
        const handleAppInstalled = () => { setIsPwaInstalled(true); setDeferredPrompt(null); };
        const checkStandalone = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
            if (isStandalone) setIsPwaInstalled(true);
        };
        checkStandalone();
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Online/offline
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // QR code fetching
    useEffect(() => {
        if (!showQR) return;
        const pathParts = window.location.pathname.substring(1).split('/').filter(p => p);
        const isShortCodeRoute = pathParts.length === 1 && /^[a-zA-Z0-9]{7}$/.test(pathParts[0]);
        const shortCode = data._shortCode || (isShortCodeRoute ? pathParts[0] : null);
        const qrIdentifier = shortCode || (pathParts.length > 0 ? pathParts[pathParts.length-1] : '');
        const payload = buildVCardString(personal, contact);
        const savePayload = () => {
            try {
                localStorage.setItem('swiish:lastQrPayload', JSON.stringify({ payload, savedAt: new Date().toISOString() }));
            } catch(e) {}
        };
        savePayload();

        if (!isOnline) {
            if (qrMode === 'rich') {
                const cached = localStorage.getItem('swiish:lastQrPayload');
                if (cached) setOfflineQrPayload(JSON.parse(cached).payload);
            }
            return;
        }

        if (qrMode === 'simple' && !qrSimpleDataUrl) {
            fetch(`/api/qr/${qrIdentifier}`)
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(data => setQrSimpleDataUrl(data.qrCode))
                .catch(err => setQrError('Unable to load link QR'));
        } else if (qrMode === 'rich' && !qrRichDataUrl) {
            fetch(`/api/qr/${qrIdentifier}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload })
            })
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(data => setQrRichDataUrl(data.qrCode))
                .catch(() => {
                    const cached = localStorage.getItem('swiish:lastQrPayload');
                    if (cached) setOfflineQrPayload(JSON.parse(cached).payload);
                    setQrError('Unable to load rich QR, using cached');
                });
        }
    }, [showQR, qrMode, qrSimpleDataUrl, qrRichDataUrl, personal, contact, data._shortCode, isOnline]);

    const generateVCard = () => {
        const vcard = buildVCardString(personal, contact);
        const blob = new Blob([vcard], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${personal.firstName || 'card'}_${personal.lastName || ''}.vcf`.replace(/\s/g, '_');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const currentQrDataUrl = qrMode === 'simple' ? qrSimpleDataUrl : qrRichDataUrl;
    const shortCode = data._shortCode || (() => {
        const parts = window.location.pathname.split('/').filter(p => p);
        return parts.length === 1 && /^[a-zA-Z0-9]{7}$/.test(parts[0]) ? parts[0] : null;
    })();
    const shortUrl = shortCode ? `${window.location.origin}/${shortCode}` : '';
    const cardName = [personal.prefix, personal.firstName, personal.middleName, personal.lastName, personal.suffix].filter(Boolean).join(' ').trim();

    // QR fullscreen modal
    if (showQR) {
        return (
            <div className="fixed inset-0 bg-card dark:bg-card-dark flex flex-col text-center overflow-hidden lg:rounded-[22px] z-50 min-h-screen lg:min-h-0 lg:h-auto">
                <div className="flex flex-col items-center justify-start pt-8 px-4 pb-8">
                    <div className="w-[90%]">
                        <div className="w-full bg-input-bg p-3 rounded-input border border-border flex items-center justify-center overflow-hidden">
                            {currentQrDataUrl ? (
                                <img src={currentQrDataUrl} className="w-full aspect-square mix-blend-multiply dark:mix-blend-normal" alt="QR" />
                            ) : qrMode === 'rich' && offlineQrPayload ? (
                                <div className="w-full aspect-square flex flex-col items-center justify-center text-text-muted text-xs">
                                    <span>{isOnline ? 'Saved details' : 'Offline mode'}</span>
                                    <span>Code includes your contact info</span>
                                </div>
                            ) : (
                                <div className="w-full aspect-square flex items-center justify-center text-text-muted">
                                    {qrError || 'Loading QR...'}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-6 space-y-2 px-4">
                        {cardName && <h2 className="text-xl font-bold">{cardName}</h2>}
                        {personal.company && <div className="text-text-muted text-sm">{personal.company}</div>}
                        {shortUrl && <div className="text-xs font-mono break-all text-text-muted-subtle">{shortUrl}</div>}
                    </div>
                    {!isOnline && offlineQrPayload && (
                        <p className="text-xs text-text-muted mt-4">Using last saved QR (offline)</p>
                    )}
                </div>
                <div className="mt-auto pb-4 px-4 space-y-3">
                    <div className="flex gap-1 bg-surface rounded-full p-1 text-xs max-w-md mx-auto">
                        <button onClick={() => setQrMode('simple')} className={`flex-1 px-2.5 py-1 rounded-full ${qrMode === 'simple' ? 'bg-card shadow-sm' : 'text-text-muted'}`}>Link only</button>
                        <button onClick={() => setQrMode('rich')} className={`flex-1 px-2.5 py-1 rounded-full ${qrMode === 'rich' ? 'bg-card shadow-sm' : 'text-text-muted'}`}>Full details</button>
                    </div>
                    <button onClick={() => setShowQR(false)} className="w-full max-w-md mx-auto py-3 bg-surface text-text-primary font-bold rounded-input">Close</button>
                    <div className="flex justify-center py-4">
                        <img src="/graphics/Swiish_Logo.svg" alt="Swiish" className="h-4 w-auto dark:hidden" />
                        <img src="/graphics/Swiish_Logo_DarkBg.svg" alt="Swiish" className="h-4 w-auto hidden dark:block" />
                    </div>
                </div>
            </div>
        );
    }

    // Normal card display
    return (
        <div className="flex flex-col h-full bg-card dark:bg-card-dark">
            {/* Banner */}
            <div className="h-44 w-full relative bg-surface">
                {images.banner ? (
                    <img src={images.banner} className="w-full h-full object-cover" alt="banner" />
                ) : (
                    <div className="w-full h-full opacity-90" style={{ background: getThemeGradient(theme.color, settings) }} />
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={toggleDarkMode} className="bg-white/30 dark:bg-black/30 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/40 transition-all">
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={() => setShowQR(true)} className="bg-white/30 dark:bg-black/30 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/40 transition-all">
                        <Share2 size={20} />
                    </button>
                    {!isPwaInstalled && deferredPrompt && (
                        <button onClick={async () => { await deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') setIsPwaInstalled(true); setDeferredPrompt(null); }} className="bg-white/30 dark:bg-black/30 backdrop-blur-md p-2.5 rounded-full text-white">
                            <Download size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Avatar & info */}
            <div className="px-6 pb-6 -mt-16 relative flex-1 flex flex-col min-h-0">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-card-dark shadow-xl overflow-hidden bg-card mb-4">
                    {images.avatar ? <img src={images.avatar} className="w-full h-full object-cover" alt="avatar" /> : <div className="w-full h-full bg-surface flex items-center justify-center"><User size={48} /></div>}
                </div>

                <div className="space-y-1 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">{cardName || 'Untitled'}</h1>
                    <div className="text-lg font-medium" style={{ color: getTextColor(theme.color, settings) }}>{sanitizeText(personal.title || '')}</div>
                    <div className="flex items-center text-text-muted text-sm gap-2"><Briefcase size={16} /><span>{sanitizeText(personal.company || '')}</span></div>
                    {personal.location && <div className="flex items-center text-text-muted-subtle text-sm gap-2"><MapPin size={16} /><span>{sanitizeText(personal.location)}</span></div>}
                </div>

                {personal.bio && (
                    <div className="mb-8">
                        <p className="text-text-secondary leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHTML(personal.bio) }} />
                    </div>
                )}

                {/* Contact actions */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {(() => {
                        const requireInteraction = privacy.requireInteraction ?? true;
                        const shouldShowVCF = !requireInteraction || contactRevealed;
                        if (shouldShowVCF) {
                            const btnColor = getButtonColor(theme.color, settings);
                            const hoverColor = darkenHex(btnColor, 10);
                            return (
                                <button onClick={generateVCard} className="col-span-2 flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-white shadow-lg transition-all active:scale-[0.98]" style={{ backgroundColor: btnColor }} onMouseEnter={e => e.target.style.backgroundColor = hoverColor} onMouseLeave={e => e.target.style.backgroundColor = btnColor}>
                                    <Save size={20} /> Save Contact
                                </button>
                            );
                        }
                        return null;
                    })()}
                    {(() => {
                        const requireInteraction = privacy.requireInteraction ?? true;
                        const useObfuscation = privacy.clientSideObfuscation ?? false;
                        const hasEmail = contact.email;
                        const hasPhone = contact.phone;
                        if (requireInteraction && !contactRevealed && (hasEmail || hasPhone)) {
                            return (
                                <button onClick={() => setContactRevealed(true)} className="col-span-2 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold bg-surface text-text-primary hover:bg-surface transition-colors border border-border">
                                    <Eye size={20} /> See my details
                                </button>
                            );
                        }
                        const emailValue = hasEmail ? contact.email : '';
                        const phoneValue = hasPhone ? contact.phone : '';
                        const emailData = useObfuscation && emailValue ? btoa(emailValue) : '';
                        const phoneData = useObfuscation && phoneValue ? btoa(phoneValue) : '';
                        return (
                            <>
                                {hasEmail && (
                                    <a href={useObfuscation ? '#' : `mailto:${emailValue}`} data-email={emailData} onClick={e => { if (useObfuscation) { e.preventDefault(); window.location.href = `mailto:${atob(e.currentTarget.dataset.email)}`; } }} className="flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold bg-surface hover:bg-surface border border-border">
                                        <Mail size={20} /> Email
                                    </a>
                                )}
                                {hasPhone && (
                                    <a href={useObfuscation ? '#' : `tel:${phoneValue}`} data-phone={phoneData} onClick={e => { if (useObfuscation) { e.preventDefault(); window.location.href = `tel:${atob(e.currentTarget.dataset.phone)}`; } }} className="flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold bg-surface hover:bg-surface border border-border">
                                        <Phone size={20} /> Call
                                    </a>
                                )}
                            </>
                        );
                    })()}
                </div>

                {/* PDF buttons */}
                <div className="mb-8">
                    <button onClick={() => downloadPdf('single')} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold bg-surface hover:bg-surface border border-border">
                        <Download size={20} /> Download Card as PDF (Single)
                    </button>
                </div>
                <div className="mb-8">
                    <button onClick={() => downloadPdf('a4')} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold bg-surface hover:bg-surface border border-border">
                        <Download size={20} /> Print 10 Cards on A4 Sheet
                    </button>
                </div>

                {/* Send your details */}
                <div className="mb-8">
                    <button onClick={() => setShowSendOptions(!showSendOptions)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold bg-confirm text-confirm-text shadow-lg">
                        <MessageCircle size={20} /> {showSendOptions ? 'Hide send options' : 'Send your details'}
                    </button>
                    {showSendOptions && (
                        <div className="mt-3 space-y-2 rounded-card border bg-surface/60 p-3">
                            {whatsappLink && (
                                <a href={whatsappLink} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold bg-success text-white hover:bg-success-hover">
                                    <MessageCircle size={20} /> WhatsApp me your number
                                </a>
                            )}
                            {emailLink && (
                                <a href={emailLink} className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold bg-surface border border-border">
                                    <Mail size={20} /> Email me your details
                                </a>
                            )}
                            {dropCallLink && (
                                <a href={dropCallLink} className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold bg-surface border border-border">
                                    <Phone size={20} /> Drop call me your number
                                </a>
                            )}
                            <p className="mt-1 text-[11px] text-text-muted text-center">Only shared with me, never sold.</p>
                        </div>
                    )}
                </div>

                {/* Custom links */}
                {links.length > 0 && (
                    <div className="flex flex-col gap-3 mb-8">
                        {links.map(link => {
                            const linkColor = getLinkColor(theme.color, settings);
                            const IconComp = ICON_MAP[link.icon] || ICON_MAP.globe;
                            return (
                                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center p-4 rounded-input border transition-all" style={{ color: linkColor, backgroundColor: linkColor + '15', borderColor: linkColor + '30' }}>
                                    <div className="mr-4 p-2 bg-input-bg rounded-container shadow-sm"><IconComp size={20} /></div>
                                    <span className="font-semibold text-sm flex-1">{sanitizeText(link.title)}</span>
                                    <ExternalLink size={16} className="opacity-50" />
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* Social icons */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                    <SocialIcon url={contact.website} icon={Globe} label="Web" themeColor={settings?.theme_colors?.find(c => c.name === theme.color)} settings={settings} />
                    <SocialIcon url={social.linkedin} icon={Linkedin} label="LinkedIn" themeColor={settings?.theme_colors?.find(c => c.name === theme.color)} settings={settings} />
                    <SocialIcon url={social.twitter} icon={Twitter} label="X" themeColor={settings?.theme_colors?.find(c => c.name === theme.color)} settings={settings} />
                    <SocialIcon url={social.instagram} icon={Instagram} label="Insta" themeColor={settings?.theme_colors?.find(c => c.name === theme.color)} settings={settings} />
                    <SocialIcon url={social.github} icon={Github} label="Git" themeColor={settings?.theme_colors?.find(c => c.name === theme.color)} settings={settings} />
                </div>

                {/* Logo */}
                <div className="pb-4 text-center mt-auto">
                    <img src="/graphics/Swiish_Logo.svg" alt="Swiish" className="h-4 w-auto mx-auto dark:hidden" />
                    <img src="/graphics/Swiish_Logo_DarkBg.svg" alt="Swiish" className="h-4 w-auto mx-auto hidden dark:block" />
                </div>
            </div>
        </div>
    );
}

// Missing icon imports used in ICON_MAP (add these at top)
import { FileText, Calendar, Video, Music, ShoppingCart, Youtube, Facebook } from 'lucide-react';