import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Login } from './components/Login';
import { AppShell } from './components/AppShell';
import { AppContextProvider, useAppContext, RouterContextBridge } from './contexts/AppContext';
import { DashboardPage } from './pages/DashboardPage';
import { PipelinePage } from './pages/PipelinePage';
import { CoachPage } from './pages/CoachPage';
import { SettingsPage } from './pages/SettingsPage';
import { InsightsPage } from './pages/InsightsPage';
import { woltersKluwerReps } from './data/salesReps';

const ProtectedRoutes: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { currentUser, notification, setCurrentUser, setScoreAdjustment, setCompletedActionIds, setActiveAction, clearNotification, setPipelineContext } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Reset all state
    const defaultUser = woltersKluwerReps.find(rep => rep.email === 'michael.thompson@wolterskluwer.com') || woltersKluwerReps[49];
    setCurrentUser(defaultUser);
    setScoreAdjustment(0);
    setCompletedActionIds([]);
    setActiveAction(null);
    setPipelineContext(null);
    clearNotification(); // Clear notification properly
    // Use localStorage to persist login state
    localStorage.removeItem('isLoggedIn');
    // Update parent App component's isLoggedIn state
    onLogout();
    navigate('/login');
  };

  const handleUserSwitch = (user: typeof currentUser) => {
    setCurrentUser(user);
    setScoreAdjustment(0);
    setCompletedActionIds([]);
    setActiveAction(null);
    setPipelineContext(null);
    clearNotification(); // Clear notification properly
  };

  return (
    <AppShell
      currentUser={currentUser}
      onLogout={handleLogout}
      onUserSwitch={handleUserSwitch}
      notification={notification}
    />
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check localStorage for login state
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const handleLogin = (role: 'rep' | 'manager') => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  return (
    <BrowserRouter>
      <AppContextProvider>
        {!isLoggedIn ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={
              <RouterContextBridge>
                <ProtectedRoutes onLogout={() => setIsLoggedIn(false)} />
              </RouterContextBridge>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="ai-coach" element={<CoachPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        )}
      </AppContextProvider>
    </BrowserRouter>
  );
};

export default App;
