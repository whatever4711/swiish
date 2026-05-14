import React, { createContext, useContext, useState } from 'react';
import Modal from '../components/Modal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
    const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null, onClose: null });

    const showAlert = (message, type = 'info', title = '', onClose = null) => {
        setModal({ isOpen: true, type, title, message, onConfirm: null, onClose, confirmText: 'OK', cancelText: 'Cancel' });
    };

    const showConfirm = (message, onConfirm, title = 'Confirm', confirmText = 'Confirm', cancelText = 'Cancel') => {
        setModal({ isOpen: true, type: 'confirm', title, message, onConfirm, onClose: null, confirmText, cancelText });
    };

    const closeModal = () => {
        const current = modal;
        setModal(prev => ({ ...prev, isOpen: false }));
        if (current.onClose) setTimeout(current.onClose, 0);
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, closeModal }}>
            {children}
            <Modal
                isOpen={modal.isOpen}
                onClose={closeModal}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                confirmText={modal.confirmText}
                cancelText={modal.cancelText}
            />
        </ModalContext.Provider>
    );
}

export function useModal() {
    return useContext(ModalContext);
}