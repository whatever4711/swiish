import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

export default function Modal({ isOpen, onClose, type, title, message, onConfirm, confirmText = 'OK', cancelText = 'Cancel' }) {
    if (!isOpen) return null;
    const Icon = type === 'confirm' ? AlertCircle : (type === 'success' ? Check : AlertCircle);
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-card p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <Icon className="w-12 h-12 text-indigo-600 mb-4" />
                    {title && <h3 className="text-xl font-bold mb-2">{title}</h3>}
                    {message && <p className="text-text-muted mb-6">{message}</p>}
                    <div className="flex gap-3 w-full">
                        {(type === 'confirm' || cancelText) && (
                            <button onClick={onClose} className="flex-1 py-2 bg-surface rounded-button">{cancelText}</button>
                        )}
                        <button onClick={() => { onConfirm?.(); onClose(); }} className="flex-1 py-2 bg-action text-white rounded-button font-bold">
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}