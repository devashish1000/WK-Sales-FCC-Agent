
import React from 'react';
import { motion } from 'framer-motion';
import { Deal, EngagementData } from '../types';

interface RiskPredictorProps {
  deal: Deal;
}

export const RiskPredictor: React.FC<RiskPredictorProps> = ({ deal }) => {
  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-emerald-400';
    if (prob >= 40) return 'text-amber-400';
    return 'text-rose-500';
  };

  const getHeatmapColor = (freq: number) => {
    if (freq > 7) return 'bg-emerald-500';
    if (freq > 4) return 'bg-amber-400';
    if (freq > 0) return 'bg-rose-500';
    return 'bg-white/5';
  };

  const getNextStepSuggestion = (health: number) => {
    if (health < 40) return { title: "NEEDS IMPROVEMENT", action: "Immediate C-level outreach required. Review budget misalignment." };
    if (health < 70) return { title: "DEVELOPING", action: "Schedule follow-up demo within 72 hours. Map additional stakeholders." };
    return { title: "PROFICIENT", action: "Maintain momentum. Send final ROI summary and draft contract." };
  };

  const suggestion = getNextStepSuggestion(deal.health);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Closure Forecast */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Closure Forecast</p>
              <h4 className="text-2xl font-black text-white">{deal.closureProbability}%</h4>
            </div>
            <div className={`text-xs font-black uppercase ${getProbabilityColor(deal.closureProbability)}`}>
               {deal.closureProbability > 60 ? 'Likely Close' : 'Watch Close'}
            </div>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${deal.closureProbability}%` }}
              className={`h-full ${deal.closureProbability > 60 ? 'bg-emerald-500' : 'bg-amber-400'}`}
            />
          </div>
          <p className="text-[9px] text-white/50 mt-3 font-medium leading-tight">
            Based on historical win patterns at {deal.account} and current velocity metrics.
          </p>
        </div>

        {/* Engagement Heatmap */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Stakeholder Engagement</p>
          <div className="flex items-end justify-between h-16 gap-2">
            {deal.engagementHeatmap.map((e, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(e.frequency / 10) * 100}%` }}
                  className={`w-full rounded-t-lg transition-colors ${getHeatmapColor(e.frequency)}`}
                />
                <span className="text-[8px] font-bold text-white/40">{e.week}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-[8px] font-black text-white/30 uppercase tracking-widest">
            <span>Low Engagement</span>
            <span>High Engagement</span>
          </div>
        </div>
      </div>

      {/* AI Suggestion Alert */}
      <div className={`rounded-2xl border p-4 flex items-center space-x-4 ${
        deal.health < 40 ? 'bg-rose-500/10 border-rose-500/20' : 
        deal.health < 70 ? 'bg-amber-400/10 border-amber-400/20' : 
        'bg-emerald-500/10 border-emerald-500/20'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
          deal.health < 40 ? 'bg-rose-500 text-white' : 
          deal.health < 70 ? 'bg-amber-400 text-slate-900' : 
          'bg-emerald-500 text-white'
        }`}>
          {deal.health < 40 ? '⚠️' : deal.health < 70 ? '⏳' : '🚀'}
        </div>
        <div className="flex-1">
          <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${
            deal.health < 40 ? 'text-rose-400' : 
            deal.health < 70 ? 'text-amber-400' : 
            'text-emerald-400'
          }`}>Next Step Suggestion • {suggestion.title}</p>
          <p className="text-[12px] text-white font-bold leading-tight">{suggestion.action}</p>
        </div>
      </div>
      
      {/* Risk Alert Banner */}
      {deal.riskScore > 50 && (
        <div className="bg-blue-600/90 backdrop-blur-md rounded-2xl border border-white/20 px-5 py-3 flex items-center justify-between shadow-2xl overflow-hidden">
          <div className="flex items-center space-x-4">
             <span className="text-2xl drop-shadow-md">🚨</span>
             <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none text-white/80">Velocity Risk Detected</span>
                  <span className="text-[12px] font-bold text-white leading-tight mt-1">
                    Similar deals at {deal.account} have only 12% close rate when stalled &gt;18 days in Discovery.
                  </span>
             </div>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-white/10 transition-all active:scale-95">
             Speed Up
          </button>
        </div>
      )}
    </div>
  );
};
