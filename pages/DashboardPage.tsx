import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DealHealthDashboard } from '../components/DealHealthDashboard';
import { useAppContext } from '../contexts/AppContext';
import { View } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    setCurrentView,
    handleFixAction,
    handleMetricDealClick,
    completedActionIds,
    activeActionId,
    scoreAdjustment,
    allActions
  } = useAppContext();

  // Navigation handler that updates both context state and React Router
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
    <DealHealthDashboard
      currentUser={currentUser}
      onNavigate={handleNavigate}
      onFixAction={handleFixAction}
      onMetricDealClick={handleMetricDealClick}
      completedActionIds={completedActionIds}
      activeActionId={activeActionId}
      scoreAdjustment={scoreAdjustment}
      allActions={allActions}
    />
  );
};

