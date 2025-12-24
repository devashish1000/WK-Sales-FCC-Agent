import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { useAppContext } from '../contexts/AppContext';
import { View, SalesRep } from '../types';

interface AppShellProps {
  currentUser: SalesRep;
  onLogout: () => void;
  onUserSwitch: (user: SalesRep) => void;
  notification: { message: string; type: 'success' | 'info' | 'rank' | 'loading'; subtext?: string } | null;
}

export const AppShell: React.FC<AppShellProps> = ({ currentUser, onLogout, onUserSwitch, notification }) => {
  const { currentView, setCurrentView } = useAppContext();
  const navigate = useNavigate();

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    // Map View to route path
    const pathMap: Record<View, string> = {
      'DASHBOARD': '/',
      'DEALS': '/pipeline',
      'COACH': '/ai-coach',
      'SETTINGS': '/settings',
      'INSIGHTS': '/insights'
    };
    navigate(pathMap[view]);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-white relative w-full">
      <Header 
        currentView={currentView} 
        onNavigate={handleNavigate}
        onLogout={onLogout}
        currentUser={currentUser}
        onUserSwitch={onUserSwitch}
      />

      <main className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full md:p-6 pb-24">
        <Outlet />
      </main>

      <BottomNavigation 
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
      />

      <Sidebar 
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={onLogout}
      />

      {notification && notification.message && (
        <div className="fixed top-24 right-6 z-[200] animate-ios-slide pointer-events-none">
          <div className={`flex flex-col px-7 py-5 rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-3xl border border-white/30 min-w-[360px] transition-all duration-400 ${
            notification.type === 'rank' 
              ? 'bg-amber-400 text-slate-900 border-amber-300' 
              : notification.type === 'success' 
              ? 'bg-emerald-500 text-white border-emerald-400' 
              : notification.type === 'loading'
              ? 'bg-[#FF6B35] text-white border-orange-400'
              : 'bg-white/95 text-slate-900 border-white'
          }`}>
            <div className="flex items-center space-x-4">
              {notification.type === 'rank' ? <span className="text-3xl">🏆</span> : (notification.type === 'success' ? <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : (notification.type === 'loading' ? <svg className="animate-spin h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>))}
              <span className="font-black text-lg tracking-tight">{notification.message}</span>
            </div>
            {notification.subtext && <p className="mt-2 text-[10px] font-black uppercase tracking-[0.15em] opacity-80 pl-11">{notification.subtext}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

