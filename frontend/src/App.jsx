import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ModalProvider } from './context/ModalContext';
import { DarkModeProvider } from './context/DarkModeContext';

// Pages
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
import AdminDashboard from './pages/AdminDashboard';
import CardEditor from './pages/CardEditor';
import OrganisationSettings from './pages/OrganisationSettings';
import UserManagement from './pages/UserManagement';
import InvitationAccept from './pages/InvitationAccept';
import PublicCard from './pages/PublicCard';

// Components
import DemoBanner from './components/DemoBanner';

function App() {
    return (
        <BrowserRouter>
            <DarkModeProvider>
                <AuthProvider>
                    <SettingsProvider>
                        <ModalProvider>
                            <DemoBanner />
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/setup" element={<SetupWizard />} />
                                <Route path="/people" element={<AdminDashboard />} />
                                <Route path="/people/edit/:slug" element={<CardEditor />} />
                                <Route path="/settings" element={<OrganisationSettings />} />
                                <Route path="/users" element={<UserManagement />} />
                                <Route path="/invite/:token" element={<InvitationAccept />} />
                                <Route path="/:orgSlug/:cardSlug" element={<PublicCard />} />
                                <Route path="/:slug" element={<PublicCard />} />
                                <Route path="/" element={<AdminDashboard />} />
                            </Routes>
                        </ModalProvider>
                    </SettingsProvider>
                </AuthProvider>
            </DarkModeProvider>
        </BrowserRouter>
    );
}

export default App;