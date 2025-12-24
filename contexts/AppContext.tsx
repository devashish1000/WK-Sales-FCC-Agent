import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { View, SalesRep, MetricAlert, ActionItem } from '../types';
import { woltersKluwerReps } from '../data/salesReps';
import { getRepMetrics } from '../data/repMetrics';
import { getDealsForRep } from '../data/deals';

interface AppContextType {
  // User state
  currentUser: SalesRep;
  setCurrentUser: (user: SalesRep) => void;
  
  // View navigation
  currentView: View;
  setCurrentView: (view: View) => void;
  
  // Actions
  allActions: ActionItem[];
  visibleActions: ActionItem[];
  activeAction: ActionItem | null;
  setActiveAction: (action: ActionItem | null) => void;
  completedActionIds: string[];
  setCompletedActionIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  activeActionId: string | undefined;
  
  // Scoring
  scoreAdjustment: number;
  setScoreAdjustment: (adj: number | ((prev: number) => number)) => void;
  
  // Pipeline
  pipelineContext: { company: string; alert: MetricAlert } | null;
  setPipelineContext: (context: { company: string; alert: MetricAlert } | null) => void;
  
  // Task info
  currentTaskInfo: { current: number; total: number } | null;
  isValidating: boolean;
  lastCompletionMessage: string | null;
  
  // Handlers
  handleFixAction: (action: ActionItem) => void;
  handleCompleteAction: () => Promise<void>;
  handleCancelAction: () => void;
  handleMetricDealClick: (company: string, alertType: MetricAlert['type']) => void;
  
  // Notifications
  notification: { message: string; type: 'success' | 'info' | 'rank' | 'loading'; subtext?: string } | null;
  showNotification: (message: string, type?: 'success' | 'info' | 'rank' | 'loading', subtext?: string) => void;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultUser = woltersKluwerReps.find(rep => rep.email === 'michael.thompson@wolterskluwer.com') || woltersKluwerReps[49];
  const [currentUser, setCurrentUser] = useState<SalesRep>(defaultUser);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [pipelineContext, setPipelineContext] = useState<{ company: string; alert: MetricAlert } | null>(null);
  const [scoreAdjustment, setScoreAdjustment] = useState(0);
  const [completedActionIds, setCompletedActionIds] = useState<string[]>([]);
  const [activeAction, setActiveAction] = useState<ActionItem | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'rank' | 'loading', subtext?: string} | null>(null);
  const [lastCompletionMessage, setLastCompletionMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Sync view with route - listen to pathname changes
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') {
      setCurrentView('DASHBOARD');
    } else if (path === '/pipeline') {
      setCurrentView('DEALS');
    } else if (path === '/ai-coach') {
      setCurrentView('COACH');
    } else if (path === '/settings') {
      setCurrentView('SETTINGS');
    } else if (path === '/insights') {
      setCurrentView('INSIGHTS');
    }
  }, [location.pathname]);

  const allActions: ActionItem[] = useMemo(() => {
    const deals = getDealsForRep(currentUser.id);
    const actions: ActionItem[] = [];

    if (currentUser.email === 'michael.thompson@wolterskluwer.com') {
      actions.push({
        id: `act-risk-1`,
        label: 'Verify Regulatory Jurisdiction',
        dealName: deals[0]?.name || 'Primary Deal',
        points: 10,
        type: 'missing_field'
      });
      actions.push({
        id: `act-risk-2`,
        label: 'Confirm Compliance Thresholds',
        dealName: deals[1]?.name || 'Secondary Deal',
        points: 10,
        type: 'missing_field'
      });
      actions.push({
        id: `act-pot-1`,
        label: 'Schedule Legal Tech Review',
        dealName: deals[2]?.name || 'Third Deal',
        points: 15,
        type: 'potential'
      });
    } else {
      deals.forEach((deal, idx) => {
        if (deal.health < 75) {
          actions.push({
            id: `act-risk-${deal.id}`,
            label: idx % 2 === 0 ? 'Verify Regulatory Jurisdiction' : 'Confirm Compliance Thresholds',
            dealName: deal.name,
            points: 10,
            type: 'missing_field'
          });
        }

        if (deal.stage === 'Qualification' || deal.stage === 'Proposal') {
          actions.push({
            id: `act-pot-${deal.id}`,
            label: idx % 3 === 0 ? 'Submit Audit Recovery Plan' : 'Schedule Legal Tech Review',
            dealName: deal.name,
            points: 15,
            type: 'potential'
          });
        }
      });
    }

    return actions.sort((a, b) => b.points - a.points);
  }, [currentUser.id]);

  const visibleActions = useMemo(() => 
    allActions.filter(a => !completedActionIds.includes(a.id)), 
    [allActions, completedActionIds]
  );

  const currentTaskInfo = useMemo(() => {
    if (!activeAction) return null;
    return {
      current: (allActions.length - visibleActions.length) + 1,
      total: allActions.length
    };
  }, [activeAction, visibleActions, allActions]);

  const calculateCurrentRank = (userId: string, currentAdj: number) => {
    const scores = woltersKluwerReps.map(rep => {
      const base = getRepMetrics(rep.id).dealHealthScore;
      return { id: rep.id, score: rep.id === userId ? base + currentAdj : base };
    }).sort((a, b) => b.score - a.score);
    return scores.findIndex(s => s.id === userId) + 1;
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'rank' | 'loading' = 'success', subtext?: string) => {
    // Don't show notifications with empty messages
    if (!message || message.trim() === '') {
      setNotification(null);
      return;
    }
    
    if (type === 'rank') {
      setNotification({ message, type, subtext });
      setTimeout(() => setNotification(prev => prev?.message === message ? null : prev), 4000);
    } else if (type === 'loading' || type === 'info') {
      setNotification({ message, type, subtext });
      if (type === 'info') {
        setTimeout(() => setNotification(prev => prev?.message === message ? null : prev), 4000);
      }
    }
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const handleFixAction = (action: ActionItem) => {
    setLastCompletionMessage(null);
    setActiveAction(action);
    setCurrentView('DEALS');
    navigate('/pipeline');
    showNotification(`Navigating to ${action.dealName}...`, 'info');
  };

  const handleMetricDealClick = (company: string, alertType: MetricAlert['type']) => {
    const alerts: Record<MetricAlert['type'], MetricAlert> = {
      coverage: {
        type: 'coverage',
        company,
        title: "COVERAGE ALERT",
        icon: "📊",
        message: "$45k gap to quota • Focus whitespace",
        color: 'blue',
        actions: [
          { label: "View Gap", icon: "💰" },
          { label: "Add Pipeline", icon: "🎯", points: 15 }
        ]
      },
      multiple: {
        type: 'multiple',
        company,
        title: "MULTIPLE ALERT",
        icon: "⚠️",
        message: "0.9x coverage (need 3x) • Add pipeline",
        color: 'orange',
        actions: [
          { label: "Add Deals", icon: "📈" },
          { label: "Focus Here", icon: "🎯", points: 20 }
        ]
      },
      velocity: {
        type: 'velocity',
        company,
        title: "VELOCITY ALERT",
        icon: "⏱️",
        message: "18 days in Discovery • Speed up closes",
        color: 'yellow',
        actions: [
          { label: "Accelerate", icon: "⚡" },
          { label: "Review", icon: "📋", points: 10 }
        ]
      },
      adherence: {
        type: 'adherence',
        company,
        title: "ADHERENCE ALERT",
        icon: "🚨",
        message: "23 days stale • No next step scheduled",
        color: 'red',
        actions: [
          { label: "Schedule Call", icon: "📞" },
          { label: "Add Task", icon: "✓", points: 5 }
        ]
      }
    };

    setPipelineContext({ company, alert: alerts[alertType] });
    setCurrentView('DEALS');
    navigate('/pipeline');
  };

  const handleCompleteAction = async () => {
    if (!activeAction || isValidating) return;
    
    setIsValidating(true);
    showNotification('Validating completion...', 'loading');

    await new Promise(resolve => setTimeout(resolve, 1500));

    const baseScore = getRepMetrics(currentUser.id).dealHealthScore;
    const oldScore = baseScore + scoreAdjustment;
    const prevRank = calculateCurrentRank(currentUser.id, scoreAdjustment);
    
    const points = activeAction.points;
    const newScoreAdj = scoreAdjustment + points;
    const newScore = Math.min(100, baseScore + newScoreAdj);
    const newRank = calculateCurrentRank(currentUser.id, newScoreAdj);
    
    const justCompletedId = activeAction.id;
    setScoreAdjustment(newScoreAdj);
    setCompletedActionIds(prev => [...prev, justCompletedId]);
    
    setIsValidating(false);
    setNotification(null);

    // Calculate remaining items based on the new state (accounting for the action we just completed)
    // visibleActions is memoized and won't update until next render, so calculate directly
    const newCompletedCount = completedActionIds.length + 1; // +1 for the action we just completed
    const remainingCount = allActions.length - newCompletedCount;
    const completionMsg = `Action verified. ${remainingCount} items remaining.`;
    setLastCompletionMessage(completionMsg);

    if (newRank < prevRank) {
      showNotification(
        `🎉 NEW RANK: #${newRank}!`, 
        'rank',
        `Score updated from ${oldScore} to ${newScore}`
      );
    }

    const currentIndex = visibleActions.findIndex(a => a.id === justCompletedId);
    const nextActionCandidate = visibleActions[currentIndex + 1] || null;

    if (nextActionCandidate) {
      setTimeout(() => {
        setLastCompletionMessage(null);
        setActiveAction(nextActionCandidate);
      }, 2000);
    } else {
      setTimeout(() => {
        setLastCompletionMessage(null);
        setActiveAction(null);
        setCurrentView('DASHBOARD');
        navigate('/');
      }, 2500);
    }
  };

  const handleCancelAction = () => {
    setActiveAction(null);
    showNotification('Action deferred', 'info');
  };

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
    currentView,
    setCurrentView,
    allActions,
    visibleActions,
    activeAction,
    setActiveAction,
    completedActionIds,
    setCompletedActionIds,
    activeActionId: activeAction?.id,
    scoreAdjustment,
    setScoreAdjustment,
    pipelineContext,
    setPipelineContext,
    currentTaskInfo,
    isValidating,
    lastCompletionMessage,
    handleFixAction,
    handleCompleteAction,
    handleCancelAction,
    handleMetricDealClick,
    notification,
    showNotification,
    clearNotification
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

