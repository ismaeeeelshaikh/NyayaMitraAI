import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { SessionProvider } from './context/SessionContext';
import { StealthProvider } from './context/StealthContext';
import AppLayout from './components/layout/AppLayout';
import EntryPage from './pages/EntryPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import TimelinePage from './pages/TimelinePage';
import ComplaintGeneratorPage from './pages/ComplaintGeneratorPage';
import NoticeScannerPage from './pages/NoticeScannerPage';
import LegalAidPage from './pages/LegalAidPage';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <SessionProvider>
          <StealthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/entry" replace />} />
              <Route path="/entry" element={<EntryPage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/timeline" element={<TimelinePage />} />
                <Route path="/complaint-generator" element={<ComplaintGeneratorPage />} />
                <Route path="/notice-scanner" element={<NoticeScannerPage />} />
                <Route path="/legal-aid" element={<LegalAidPage />} />
              </Route>
            </Routes>
          </StealthProvider>
        </SessionProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
