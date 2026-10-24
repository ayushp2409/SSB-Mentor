import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { DashboardPage } from './pages/dashboard/DashboardPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

import { PsychologyIndexPage } from './pages/tests/PsychologyIndexPage';
import { WATRunnerPage } from './pages/tests/WATRunnerPage';
import { TATRunnerPage } from './pages/tests/TATRunnerPage';
import { SRTRunnerPage } from './pages/tests/SRTRunnerPage';
import { PPDTRunnerPage } from './pages/tests/PPDTRunnerPage';

import { LecturettePage } from './pages/lecturette/LecturettePage';
import { GTOPage } from './pages/gto/GTOPage';
import { InterviewPage } from './pages/interview/InterviewPage';
import { JournalPage } from './pages/journal/JournalPage';
import { ProgressPage } from './pages/progress/ProgressPage';
import { AdminPage } from './pages/admin/AdminPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/signup" element={<RegisterPage />} />

          {/* Protected Application Routes wrapped in AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/psychology" element={<PsychologyIndexPage />} />
            <Route path="/psychology/wat" element={<WATRunnerPage />} />
            <Route path="/psychology/tat" element={<TATRunnerPage />} />
            <Route path="/psychology/srt" element={<SRTRunnerPage />} />
            <Route path="/psychology/ppdt" element={<PPDTRunnerPage />} />

            <Route path="/lecturette" element={<LecturettePage />} />
            <Route path="/gto" element={<GTOPage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
