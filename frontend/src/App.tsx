import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { SessionProvider } from './context/SessionContext';
import { StealthProvider } from './context/StealthContext';
import ProtectedAppLayout from './components/auth/ProtectedAppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import TimelinePage from './pages/TimelinePage';
import ComplaintGeneratorPage from './pages/ComplaintGeneratorPage';
import NoticeScannerPage from './pages/NoticeScannerPage';
import LegalAidPage from './pages/LegalAidPage';

import AuthCallbackPage from './pages/AuthCallbackPage';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <SessionProvider>
          <StealthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route path="/callback" element={<AuthCallbackPage />} />

              {/* Authenticated routes (inside AppLayout with bottom navbar) */}
              <Route element={<ProtectedAppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/timeline" element={<TimelinePage />} />
                <Route path="/complaint-generator" element={<ComplaintGeneratorPage />} />
                <Route path="/notice-scanner" element={<NoticeScannerPage />} />
                <Route path="/legal-aid" element={<LegalAidPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </StealthProvider>
        </SessionProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
