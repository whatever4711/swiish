import React, { useState, useEffect } from 'react';
import { buildVCardString } from '../../utils/vcard';
import Logo from '../layout/Logo';

export default function QrModal({ isOpen, onClose, cardData, shortCode, personal, contact, showAlert }) {
    const [qrMode, setQrMode] = useState(() => (typeof navigator !== 'undefined' ? (navigator.onLine ? 'simple' : 'rich') : 'simple'));
    const [qrSimpleDataUrl, setQrSimpleDataUrl] = useState('');
    const [qrRichDataUrl, setQrRichDataUrl] = useState('');
    const [offlineQrPayload, setOfflineQrPayload] = useState(null);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [qrError, setQrError] = useState(null);
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        if (!isOpen) return;
        const qrIdentifier = shortCode;
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

        setLoading(true);
        if (qrMode === 'simple' && !qrSimpleDataUrl) {
            fetch(`/api/qr/${qrIdentifier}`)
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(data => setQrSimpleDataUrl(data.qrCode))
                .catch(err => setQrError('Unable to load link QR'))
                .finally(() => setLoading(false));
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
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isOpen, qrMode, qrSimpleDataUrl, qrRichDataUrl, shortCode, personal, contact, isOnline]);

    if (!isOpen) return null;

    const currentQrDataUrl = qrMode === 'simple' ? qrSimpleDataUrl : qrRichDataUrl;
    const cardName = [personal.prefix, personal.firstName, personal.middleName, personal.lastName, personal.suffix].filter(Boolean).join(' ').trim();
    const shortUrl = shortCode ? `${window.location.origin}/${shortCode}` : '';

    return (
        <div className="fixed inset-0 bg-card dark:bg-card-dark flex flex-col text-center overflow-hidden lg:rounded-[22px] z-50 min-h-screen lg:min-h-0 lg:h-auto">
            <div className="flex flex-col items-center justify-start pt-8 px-4 pb-8">
                <div className="w-[90%]">
                    <div className="w-full bg-input-bg dark:bg-input-bg-dark p-3 rounded-input border-thick border-border-subtle dark:border-border-dark flex items-center justify-center overflow-hidden">
                        {loading ? (
                            <div className="w-full aspect-square flex items-center justify-center">Loading...</div>
                        ) : currentQrDataUrl ? (
                            <img src={currentQrDataUrl} className="w-full aspect-square mix-blend-multiply dark:mix-blend-normal" alt="QR code" />
                        ) : qrMode === 'rich' && offlineQrPayload ? (
                            <div className="w-full aspect-square flex flex-col items-center justify-center text-text-muted-subtle text-xs space-y-1">
                                <span>{isOnline ? 'Saved details' : 'Offline mode'}</span>
                                <span className="text-[10px]">Code includes your contact info and card link</span>
                            </div>
                        ) : (
                            <div className="w-full aspect-square flex items-center justify-center text-text-muted text-xs">
                                {qrError || 'Unable to load QR'}
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-6 space-y-2 px-4">
                    {cardName && <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">{cardName}</h2>}
                    {personal.company && <div className="text-text-muted dark:text-text-muted-dark text-sm">{personal.company}</div>}
                    {shortUrl && <div className="text-text-muted-subtle dark:text-text-secondary-dark text-xs font-mono break-all">{shortUrl}</div>}
                </div>
                {!isOnline && offlineQrPayload && (
                    <p className="text-xs text-text-muted dark:text-text-muted-dark mt-4 px-4">Using last saved QR details (offline).</p>
                )}
            </div>

            <div className="mt-auto pb-4 px-4 space-y-3">
                <div className="flex w-full items-center justify-center gap-1 bg-surface dark:bg-surface-dark rounded-full p-1 text-[11px] max-w-md mx-auto">
                    <button onClick={() => setQrMode('simple')} className={`flex-1 px-2.5 py-1 rounded-full font-medium transition-colors ${qrMode === 'simple' ? 'bg-card dark:bg-main-dark text-text-primary shadow-sm' : 'text-text-muted'}`}>
                        Link only
                    </button>
                    <button onClick={() => setQrMode('rich')} className={`flex-1 px-2.5 py-1 rounded-full font-medium transition-colors ${qrMode === 'rich' ? 'bg-card dark:bg-main-dark text-text-primary shadow-sm' : 'text-text-muted'}`}>
                        Full details
                    </button>
                </div>
                <button onClick={onClose} className="w-full max-w-md mx-auto py-3 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark font-bold rounded-input hover:bg-surface transition-colors text-sm">
                    Close
                </button>
                <div className="bg-card dark:bg-card-dark text-center space-y-2 mt-[24px] mb-[12px]">
                    <Logo />
                </div>
            </div>
        </div>
    );
}