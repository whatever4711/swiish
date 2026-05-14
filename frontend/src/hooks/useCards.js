import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useCards() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchCards = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiCall('/api/admin/cards');
            if (res.ok) {
                const data = await res.json();
                setCards(data);
            }
        } catch (e) {
            console.error('Fetch cards failed', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveCard = useCallback(async (slug, cardData, targetUserId = null) => {
        const body = { ...cardData };
        if (targetUserId) body.userId = targetUserId;
        const res = await apiCall(`/api/cards/${slug}`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        if (res.ok) {
            await fetchCards();
            return true;
        }
        throw new Error('Save failed');
    }, [fetchCards]);

    const deleteCard = useCallback(async (slug, userId = null) => {
        let url = `/api/cards/${slug}`;
        if (userId) url += `?userId=${encodeURIComponent(userId)}`;
        const res = await apiCall(url, { method: 'DELETE' });
        if (res.ok) {
            await fetchCards();
            return true;
        }
        throw new Error('Delete failed');
    }, [fetchCards]);

    useEffect(() => {
        if (user) fetchCards();
    }, [user, fetchCards]);

    return { cards, loading, fetchCards, saveCard, deleteCard };
}