
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SalesRep, Deal, MetricAlert } from '../types';
import { getAllDeals } from '../data/deals';
import { ActionItem } from '../App';
import { DealTimeline } from './DealTimeline';
import { RiskPredictor } from './RiskPredictor';

interface DealPipelineProps {
    currentUser: SalesRep;
    activeAction?: ActionItem | null;
    visibleActions?: ActionItem[];
    onCompleteAction?: () => void;
    onCancelAction?: () => void;
    isSubmitting?: boolean;
    progress?: { current: number, total: number } | null;
    completionMessage?: string | null;
    searchQuery?: string;
    pipelineContext?: { company: string; alert: MetricAlert } | null;
    onClearContext?: () => void;
}

interface ClientGroup {
    name: string;
    domain: string;
    deals: Deal[];
}

const STAGE_MAP: Record<string, number> = {
  'Discovery': 0,
  'Qualification': 1,
  'Proposal': 2,
  'Negotiation': 3,
  'Closed Won': 4,
  'Closed Lost': 4
};

const BADGE_CONFIG: Record<string, { initials: string, color: string }> = {
  'UnitedHealth Group': { initials: 'UG', color: 'bg-[#00529b]' },
  'Mayo Clinic': { initials: 'MC', color: 'bg-[#14B8A6]' },
  'HCA Healthcare': { initials: 'HH', color: 'bg-[#22C55E]' },
  'Skadden Arps': { initials: 'SA', color: 'bg-[#e31837]' },
  'CVS': { initials: 'CVS', color: 'bg-[#cc0000]' },
  'Baker McKenzie': { initials: 'B', color: 'bg-[#F97316]' },
  'JPMorgan Chase': { initials: 'JPM', color: 'bg-[#1e3a8a]' },
  'Goldman Sachs': { initials: 'GS', color: 'bg-[#73b9ee] text-black' },
  'Deloitte': { initials: 'D', color: 'bg-[#86bc25]' },
  'PwC': { initials: 'P', color: 'bg-[#db532d]' },
  'EY': { initials: 'EY', color: 'bg-[#ffe600] text-black' },
  'KPMG': { initials: 'K', color: 'bg-[#00338d]' },
  'White & Case': { initials: 'WC', color: 'bg-[#111827]' },
  'Latham & Watkins': { initials: 'LW', color: 'bg-[#800000]' },
  'DLA Piper': { initials: 'DLA', color: 'bg-[#333333]' },
  'Kaiser Permanente': { initials: 'KP', color: 'bg-[#007cc3]' },
  'Pfizer': { initials: 'PF', color: 'bg-[#007abc]' },
  'Microsoft': { initials: 'MS', color: 'bg-[#737373]' },
  'Apple': { initials: 'AP', color: 'bg-[#000000]' },
  'Anthem': { initials: 'A', color: 'bg-[#005596]' },
  'Cravath Swaine': { initials: 'CS', color: 'bg-[#1e293b]' },
  'Kirkland & Ellis': { initials: 'KE', color: 'bg-[#be123c]' },
  'Alphabet Inc.': { initials: 'G', color: 'bg-[#4285f4]' },
  'Walmart': { initials: 'W', color: 'bg-[#0071ce]' },
  'Amazon': { initials: 'AM', color: 'bg-[#ff9900] text-black' },
  'Citigroup': { initials: 'C', color: 'bg-[#00b0f0] text-black' },
  'Bank of America': { initials: 'BO', color: 'bg-[#003a70]' },
  'Cleveland Clinic': { initials: 'CC', color: 'bg-[#66ccff] text-black' },
  'Federal Trade Commission (FTC)': { initials: 'FT', color: 'bg-[#0d9488]' },
  'Wells Fargo': { initials: 'WF', color: 'bg-[#d97706]' },
  'Morgan Stanley': { initials: 'MS', color: 'bg-[#002f5d]' },
  'Sidley Austin': { initials: 'SID', color: 'bg-[#002244]' },
  'Jones Day': { initials: 'JD', color: 'bg-[#2d3748]' },
};

const ACCOUNT_RECOMMENDATIONS: Record<string, { label: string; action: string }> = {
  'UnitedHealth Group': { label: 'Schedule renewal call - 3 entities expiring Q1', action: 'CREATE TASK' },
  'Baker McKenzie': { label: 'Verify tax compliance status for EMEA regional office', action: 'RUN AUDIT' },
  'JPMorgan Chase': { label: 'Identify expansion opportunities for Asset Management wing', action: 'GENERATE PLAN' },
  'Goldman Sachs': { label: 'Review CCH Axcess migration for investment banking team', action: 'START SYNC' },
  'Deloitte': { label: 'Finalize enterprise licensing for global audit workflow', action: 'SEND PROPOSAL' },
  'PwC': { label: 'Schedule VitalLaw demo for cross-border tax practice', action: 'BOOK DEMO' },
  'Kaiser Permanente': { label: 'Update healthcare compliance thresholds for Pacific Northwest', action: 'UPDATE SPECS' },
  'Microsoft': { label: 'Coordinate with Legal Operations for global entity management', action: 'SYNC OPS' }
};

const IconPhone = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);

const IconTrendUp = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
);

const IconAlert = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);

interface ClientAvatarProps {
    client: ClientGroup;
    isActive: boolean;
    onClick: () => void;
}

const ClientAvatar: React.FC<ClientAvatarProps> = ({ client, isActive, onClick }) => {
    const config = BADGE_CONFIG[client.name] || { 
        initials: client.name.split(' ').map(n => n[0]).join('').slice(0, 2), 
        color: 'bg-white/10' 
    };

    return (
        <button
            onClick={onClick}
            className={`group shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border overflow-hidden shadow-lg ${
                isActive 
                ? `${config.color} ring-4 ring-white/30 scale-110 border-white text-white` 
                : `${config.color} opacity-60 hover:opacity-100 border-white/5 text-white/90`
            } ${config.color.includes('text-black') ? 'text-black' : 'text-white'}`}
        >
            <span className="text-[13px] font-black uppercase tracking-tighter leading-none">
                {config.initials}
            </span>
        </button>
    );
};

export const DealPipeline: React.FC<DealPipelineProps> = ({ 
    currentUser, 
    activeAction, 
    visibleActions = [],
    onCompleteAction, 
    isSubmitting,
    searchQuery = '',
    pipelineContext,
    onClearContext
}) => {
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [expandedDealId, setExpandedDealId] = useState<number | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const fieldRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allDeals = useMemo(() => getAllDeals(), []);

  const filteredDeals = useMemo(() => {
      const query = searchQuery.toLowerCase().trim();
      return allDeals.filter(deal => {
          if (deal.ownerId !== currentUser.id) return false;
          return query ? (deal.name.toLowerCase().includes(query) || deal.account.toLowerCase().includes(query)) : true;
      });
  }, [allDeals, searchQuery, currentUser.id]);

  const clientGroups = useMemo(() => {
      const groups: Record<string, ClientGroup> = {};
      filteredDeals.forEach(deal => {
          if (!groups[deal.account]) {
              groups[deal.account] = { name: deal.account, domain: '', deals: [] };
          }
          groups[deal.account].deals.push(deal);
      });
      return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredDeals]);

  useEffect(() => {
    if (pipelineContext) {
        setSelectedClientName(pipelineContext.company);
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else if (activeAction) {
        const accountPart = activeAction.dealName.split(' - ')[0];
        setSelectedClientName(accountPart);
        setFieldValue('');
        setTimeout(() => fieldRef.current?.focus(), 400);
    } else if (clientGroups.length > 0 && !selectedClientName) {
        setSelectedClientName(clientGroups[0].name);
    }
  }, [activeAction, clientGroups, pipelineContext]);

  const selectedGroup = useMemo(() => 
      clientGroups.find(c => c.name === selectedClientName) || clientGroups[0],
      [clientGroups, selectedClientName]
  );

  const hasIncompleteTasks = useMemo(() => {
    if (!selectedGroup) return false;
    return visibleActions.some(action => action.dealName.startsWith(selectedGroup.name));
  }, [selectedGroup, visibleActions]);

  const getStageStyle = (stage: string) => {
      switch(stage) {
          case 'Discovery': return 'bg-purple-600 text-white';
          case 'Qualification': return 'bg-blue-600 text-white';
          case 'Proposal': return 'bg-orange-600 text-white';
          case 'Negotiation': return 'bg-amber-600 text-white';
          case 'Closed Won': return 'bg-emerald-600 text-white';
          default: return 'bg-white/20 text-white';
      }
  };

  const getAlertColor = (color: string) => {
    switch(color) {
      case 'blue': return 'bg-blue-600';
      case 'orange': return 'bg-orange-600';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-rose-600';
      default: return 'bg-slate-700';
    }
  }

  const recommendation = selectedGroup ? ACCOUNT_RECOMMENDATIONS[selectedGroup.name] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 pb-32 overflow-x-hidden mesh-bg animate-ios-slide p-4 md:p-8 w-full flex flex-col space-y-6">
      
      {/* Contextual Alert Banner */}
      <AnimatePresence>
        {pipelineContext?.alert && (
          <motion.div 
            initial={{ height: 0, opacity: 0, scale: 0.98 }}
            animate={{ height: 'auto', opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.98 }}
            className={`mb-4 rounded-[28px] ${getAlertColor(pipelineContext.alert.color)} border border-white/20 p-5 flex flex-col md:flex-row items-center md:items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative gap-4`}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50"></div>
            
            <div className="flex items-center space-x-4 relative z-10 w-full md:w-auto">
               <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner border border-white/10">
                 {pipelineContext.alert.icon}
               </div>
               <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/80 mb-0.5">{pipelineContext.alert.title}</span>
                  <span className="text-[14px] font-bold text-white tracking-tight leading-tight line-clamp-2">{pipelineContext.alert.message}</span>
               </div>
            </div>

            <div className="flex items-center space-x-2 relative z-10 w-full md:w-auto justify-end overflow-hidden">
               <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {pipelineContext.alert.actions.map(a => (
                      <button key={a.label} className="whitespace-nowrap bg-white text-slate-900 text-[9px] font-black uppercase tracking-widest px-4 py-3 rounded-xl shadow-xl hover:bg-slate-100 flex items-center gap-2 transition-all active:scale-95 border border-white shrink-0">
                        <span>{a.icon}</span> {a.label}
                      </button>
                  ))}
               </div>
               <button onClick={onClearContext} className="ml-1 w-9 h-9 shrink-0 rounded-full bg-black/15 flex items-center justify-center hover:bg-black/25 text-white transition-all border border-white/10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} strokeLinecap="round" /></svg>
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="bg-[oklch(1_0_0_/_0.18)] backdrop-blur-[32px] saturate-[150%] border border-[oklch(1_0_0_/_0.25)] rounded-[24px] p-4 shadow-2xl overflow-hidden">
          <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar scroll-smooth px-2 py-2">
              {clientGroups.map((client) => (
                  <ClientAvatar 
                    key={client.name} 
                    client={client} 
                    isActive={selectedClientName === client.name} 
                    onClick={() => {
                        if (pipelineContext?.company !== client.name) onClearContext?.();
                        setSelectedClientName(client.name);
                        setExpandedDealId(null);
                    }} 
                  />
              ))}
          </div>
      </section>

      <AnimatePresence>
        {activeAction && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[oklch(1_0_0_/_0.2)] backdrop-blur-[32px] rounded-[24px] border border-orange-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-4 overflow-hidden"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-[14px] bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/20">
                            <IconAlert />
                        </div>
                        <div>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-1 leading-none">Intervention Required</p>
                            <h3 className="text-white font-bold text-base leading-none">{activeAction.label}</h3>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-1 max-w-xl">
                        <input 
                            ref={fieldRef}
                            type="text"
                            value={fieldValue}
                            onChange={(e) => setFieldValue(e.target.value)}
                            placeholder="Complete required field..."
                            className="bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white/10 transition-all flex-1"
                        />
                        <button 
                            onClick={onCompleteAction}
                            disabled={!fieldValue.trim() || isSubmitting}
                            className={`rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest transition-all ${
                                fieldValue.trim() ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-xl' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            {isSubmitting ? 'Syncing...' : 'Resolve'}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
          {selectedGroup && (
              <motion.section 
                  key={selectedGroup.name} 
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="space-y-4"
                  ref={scrollRef}
              >
                  <div className="bg-[oklch(1_0_0_/_0.18)] backdrop-blur-[32px] saturate-[150%] border border-[oklch(1_0_0_/_0.25)] rounded-[32px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
                      <div className="px-6 md:px-8 py-6 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center space-x-6 min-w-0 flex-1">
                              <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border border-white/20 shadow-2xl shrink-0 overflow-hidden ${BADGE_CONFIG[selectedGroup.name]?.color || 'bg-white/10'}`}>
                                  <span className={`font-black text-2xl uppercase ${BADGE_CONFIG[selectedGroup.name]?.color?.includes('text-black') ? 'text-black' : 'text-white'}`}>
                                      {BADGE_CONFIG[selectedGroup.name]?.initials || selectedGroup.name[0]}
                                  </span>
                              </div>
                              <div className="min-w-0 flex flex-col justify-center">
                                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                      <h3 className="text-white font-black text-[22px] md:text-[28px] tracking-tight leading-none truncate">
                                          {selectedGroup.name}
                                      </h3>
                                      <AnimatePresence mode="wait">
                                          {!hasIncompleteTasks ? (
                                              <motion.span 
                                                  key="healthy"
                                                  initial={{ opacity: 0, scale: 0.9 }}
                                                  animate={{ opacity: 1, scale: 1 }}
                                                  exit={{ opacity: 0, scale: 0.9 }}
                                                  className="bg-emerald-500/15 border border-emerald-500/30 rounded-full px-4 py-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm flex items-center gap-2 whitespace-nowrap self-start md:self-center"
                                              >
                                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
                                                  STATUS: HEALTHY
                                              </motion.span>
                                          ) : (
                                              <motion.span 
                                                  key="risk"
                                                  initial={{ opacity: 0, scale: 0.9 }}
                                                  animate={{ opacity: 1, scale: 1 }}
                                                  exit={{ opacity: 0, scale: 0.9 }}
                                                  className="bg-[#FF6B35]/15 border border-[#FF6B35]/30 rounded-full px-4 py-1.5 text-[#FF6B35] text-[10px] font-black uppercase tracking-[0.15em] shadow-sm flex items-center gap-2 whitespace-nowrap self-start md:self-center"
                                              >
                                                  <div className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse shadow-[0_0_10px_rgba(255,107,53,1)]"></div>
                                                  STATUS: AT RISK
                                              </motion.span>
                                          )}
                                      </AnimatePresence>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="md:text-right md:min-w-[200px] shrink-0">
                              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-1.5">TOTAL PORTFOLIO VALUE</p>
                              <div className="flex items-center md:justify-end gap-4">
                                  <span className="text-[13px] font-black text-emerald-400 flex items-center gap-2">
                                      <IconTrendUp /> +{(Math.random() * 20).toFixed(1)}%
                                  </span>
                                  <p className="text-white font-black text-[28px] md:text-[34px] tracking-tighter leading-none whitespace-nowrap">
                                      ${selectedGroup.deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                                  </p>
                              </div>
                          </div>
                      </div>

                      <div className="divide-y divide-white/10">
                          {selectedGroup.deals.map((deal) => {
                              const isAtRisk = deal.health < 65;
                              const riskColor = isAtRisk ? 'bg-[#FF6B35]' : 'bg-emerald-500';
                              const isExpanded = expandedDealId === deal.id;
                              
                              return (
                                  <div key={deal.id} className="relative flex flex-col group hover:bg-white/[0.04] transition-all duration-300">
                                      <div className="flex cursor-pointer" onClick={() => setExpandedDealId(isExpanded ? null : deal.id)}>
                                        <div className={`w-[6px] shrink-0 self-stretch ${riskColor} my-4 ml-1.5 rounded-full shadow-[0_0_12px_rgba(255,107,53,0.3)]`} />
                                        <div className="flex-1 p-6 flex flex-col gap-5">
                                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-black text-[17px] md:text-[19px] tracking-tight mb-4 leading-snug whitespace-normal">
                                                        {deal.name}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-4">
                                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-xl ${getStageStyle(deal.stage)}`}>{deal.stage}</span>
                                                        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-3">
                                                            <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">Expected Close:</span>
                                                            <span className="text-white font-black text-[11px] uppercase">{deal.closeDate}</span>
                                                        </div>
                                                        <p className="text-white font-black text-[18px] md:text-[20px] tracking-tight shrink-0 pl-1">${deal.value.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-10 shrink-0 xl:text-right">
                                                    <div className="flex flex-col xl:items-end min-w-[160px]">
                                                        <div className="flex items-center justify-between w-full mb-2.5">
                                                            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Health Score</p>
                                                            <span className={`text-[15px] font-black ${isAtRisk ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>{deal.health}%</span>
                                                        </div>
                                                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden shadow-inner border border-white/5">
                                                            <div className={`h-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.25)] ${isAtRisk ? 'bg-[#FF6B35]' : 'bg-emerald-500'}`} style={{ width: `${deal.health}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                      </div>

                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-6 pb-6 overflow-hidden"
                                          >
                                            <div className="border-t border-white/5 pt-6 space-y-8">
                                              {/* Interactive Timeline */}
                                              <div>
                                                <h5 className="text-[11px] font-black text-white/40 uppercase tracking-[0.25em] mb-5">Milestone Progression</h5>
                                                <DealTimeline 
                                                  milestones={deal.milestones} 
                                                  currentStageIndex={STAGE_MAP[deal.stage] || 0} 
                                                />
                                              </div>

                                              {/* Risk & Engagement Predictor */}
                                              <div>
                                                <h5 className="text-[11px] font-black text-white/40 uppercase tracking-[0.25em] mb-5">Risk & Engagement Analysis</h5>
                                                <RiskPredictor deal={deal} />
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                  </div>
                              );
                          })}
                      </div>

                      {recommendation && (
                        <div className="bg-[#0F172A]/80 backdrop-blur-[32px] border-t border-white/20 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-center justify-between gap-8 mt-4">
                            <div className="flex items-center space-x-5 flex-1 min-w-0">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-[20px] bg-blue-500/30 flex items-center justify-center text-white border border-white/25 shadow-2xl shrink-0">
                                    <IconPhone />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h5 className="text-white font-black text-[16px] md:text-[18px] tracking-tight leading-tight truncate">{recommendation.label}</h5>
                                    <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-[9px] mt-2">RECOMMENDED ACTION</p>
                                </div>
                            </div>
                            <button className="w-full md:w-auto bg-white text-[#0F172A] font-black text-[12px] md:text-[13px] uppercase tracking-[0.2em] py-3.5 px-6 md:px-8 rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.3)] hover:bg-slate-100 hover:scale-[1.02] transition-all active:scale-95 border border-white shrink-0">
                                {recommendation.action}
                            </button>
                        </div>
                      )}
                  </div>
              </motion.section>
          )}
      </AnimatePresence>
    </div>
  );
};
