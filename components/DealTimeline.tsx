
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Milestone } from '../types';

interface DealTimelineProps {
  milestones: Milestone[];
  currentStageIndex: number;
}

const SKILL_COLOR_MAP: Record<string, string> = {
  'time': '#3B82F6',
  'efficiency': '#22D3EE',
  'qualification': '#F97316',
  'conciseness': '#10B981',
};

export const DealTimeline: React.FC<DealTimelineProps> = ({ milestones, currentStageIndex }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="w-full py-8 px-2">
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2" />
        <motion.div 
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-teal-500 to-blue-500 -translate-y-1/2"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStageIndex / (milestones.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        <div className="relative flex justify-between">
          {milestones.map((m, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const color = SKILL_COLOR_MAP[m.type] || '#FFF';

            return (
              <div key={idx} className="relative flex flex-col items-center">
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  className={`w-4 h-4 rounded-full border-2 transition-all z-10 shadow-lg ${
                    isCompleted ? 'bg-white border-white scale-110' : 'bg-[#020617] border-white/20'
                  }`}
                  style={{ 
                    boxShadow: isCompleted ? `0 0 12px ${color}` : 'none',
                    borderColor: isCompleted ? color : 'rgba(255,255,255,0.2)'
                  }}
                />
                
                <div className="absolute top-6 flex flex-col items-center min-w-[80px]">
                  <span className={`text-[8px] font-black uppercase tracking-widest text-center leading-tight ${isCompleted ? 'text-white' : 'text-white/30'}`}>
                    {m.label}
                  </span>
                  {m.completed && (
                    <span className="text-[7px] text-white/40 mt-0.5 font-bold">{m.timestamp}</span>
                  )}
                </div>

                {/* Detail Popover */}
                <AnimatePresence>
                  {expandedIndex === idx && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-8 z-50 bg-slate-900 border border-white/20 p-4 rounded-2xl shadow-2xl min-w-[180px]"
                    >
                      <h5 className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color }}>{m.label} Actions</h5>
                      <ul className="space-y-1.5">
                        {m.actions.map((action, ai) => (
                          <li key={ai} className="flex items-center space-x-2">
                            <div className="w-1 h-1 rounded-full bg-teal-400" />
                            <span className="text-[10px] text-white/80 font-medium">{action}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center">
                         <span className="text-[7px] font-black text-white/40 uppercase">Focus Area:</span>
                         <span className="text-[7px] font-black uppercase" style={{ color }}>{m.type}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
