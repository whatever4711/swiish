import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useDarkMode } from '../context/DarkModeContext';
import CardDisplay from '../components/CardDisplay';

export default function PublicCard() {
    const { slug, orgSlug, cardSlug } = useParams();
    const { settings, fetchPublicSettings } = useSettings();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const [cardData, setCardData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const fetchedRef = useRef(false);

    useEffect(() => {
        const loadCard = async () => {
            if (fetchedRef.current) return;
            fetchedRef.current = true;
            setLoading(true);
            try {
                let url;
                if (orgSlug && cardSlug) {
                    url = `/api/cards/${orgSlug}/${cardSlug}`;
                    await fetchPublicSettings(orgSlug);
                } else {
                    url = `/api/cards/${slug}`;
                    await fetchPublicSettings();
                }
                const res = await fetch(url);
                if (!res.ok) throw new Error('Card not found');
                const data = await res.json();
                setCardData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadCard();
    }, [slug, orgSlug, cardSlug, fetchPublicSettings]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex flex-col items-center justify-center"><h1>Card not found</h1></div>;
    if (!cardData) return null;

    return (
        <div className="min-h-screen bg-main dark:bg-main-dark flex justify-center items-start lg:items-center p-0 lg:p-8">
            <div className="w-full max-w-md bg-card dark:bg-card-dark min-h-screen lg:min-h-0 lg:h-auto lg:rounded-page shadow-2xl overflow-hidden">
                <CardDisplay data={cardData} settings={settings} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </div>
        </div>
    );
}