import React from 'react';
import { AnalysisResult, TranscriptionItem, Scenario, SalesRep } from '../types';

interface ReportProps {
  analysis: AnalysisResult;
  transcripts: TranscriptionItem[];
  onRestart: () => void;
  scenario: Scenario | null;
  currentUser: SalesRep;
}

// Map specific skills to brand colors as per requirement
const SKILL_COLOR_MAP: Record<string, string> = {
  'Time Management': '#3B82F6', // blue
  'Efficiency': '#22D3EE',      // cyan
  'Core Qualification': '#F97316', // orange
  'Conciseness': '#10B981',     // green
};

const DEFAULT_COLORS = ['#3B82F6', '#22D3EE', '#F97316', '#10B981', '#EC4899', '#F59E0B', '#6366F1', '#8B5CF6', '#EF4444', '#00BFA5'];

export const Report: React.FC<ReportProps> = ({ analysis, transcripts, onRestart, scenario, currentUser }) => {
  const overall = analysis.scores.overall;
  
  const getInterpretation = (score: number) => {
    if (score < 40) return "Needs Improvement";
    if (score < 70) return "Developing";
    return "Proficient";
  };

  const getThermometerColor = (score: number) => {
    if (score < 40) return "bg-rose-500";
    if (score < 70) return "bg-amber-400";
    return "bg-emerald-500";
  };

  const breakdownData = analysis.scores.breakdown.map((item, index) => ({
    ...item,
    fill: SKILL_COLOR_MAP[item.label] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    initial: item.label.charAt(0)
  }));

  const totalBreakdownPoints = breakdownData.reduce((sum, item) => sum + item.score, 0);

  const handleDownloadTranscript = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const transcriptHtml = transcripts.map(t => `
      <div style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">
          ${t.speaker === 'user' ? `SALES REP (${currentUser.firstName})` : 'PROSPECT AI'}
        </div>
        <div style="font-size: 13px; color: #1e293b; line-height: 1.6; font-weight: 500;">
          ${t.text}
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>WK AI Coach Transcript - ${currentUser.firstName} ${currentUser.lastName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
            body { 
              font-family: 'Inter', -apple-system, sans-serif; 
              color: #1e293b; 
              margin: 0; 
              padding: 40px; 
              line-height: 1.5;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              border-bottom: 2px solid #f1f5f9; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .logo-section { display: flex; flex-direction: column; }
            .logo-img { height: 32px; object-fit: contain; }
            .date { font-size: 12px; font-weight: 700; color: #64748b; }
            
            .main-title { font-size: 28px; font-weight: 900; margin-bottom: 24px; color: #0f172a; }
            
            .metadata-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 40px; 
              background: #f8fafc; 
              padding: 24px; 
              border-radius: 16px; 
            }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
            .meta-value { font-size: 14px; font-weight: 700; color: #334155; }
            
            .transcript-section { border-top: 1px solid #f1f5f9; padding-top: 30px; }
            .footer { 
              margin-top: 50px; 
              padding-top: 20px; 
              border-top: 1px solid #f1f5f9; 
              display: flex; 
              justify-content: space-between; 
              font-size: 10px; 
              color: #94a3b8; 
              font-weight: 500;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Wolters_Kluwer_logo.svg/320px-Wolters_Kluwer_logo.svg.png" class="logo-img" alt="Wolters Kluwer">
            </div>
            <div class="date">${dateStr}</div>
          </div>
          
          <h1 class="main-title">AI Coach Session Transcript</h1>
          
          <div class="metadata-grid">
            <div class="meta-item">
              <span class="meta-label">Sales Rep</span>
              <span class="meta-value">${currentUser.firstName} ${currentUser.lastName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date</span>
              <span class="meta-value">${dateStr}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Duration</span>
              <span class="meta-value">${scenario?.duration || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Overall Score</span>
              <span class="meta-value" style="color: #00BFA5">${analysis.scores.overall}/100</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Prospect Profile</span>
              <span class="meta-value">${scenario?.prospectRole || 'Unknown'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Target Product</span>
              <span class="meta-value">${scenario?.product || 'Unknown'}</span>
            </div>
            <div class="meta-item" style="grid-column: span 2">
              <span class="meta-label">Difficulty</span>
              <span class="meta-value">${scenario?.difficulty || 'Medium'}</span>
            </div>
          </div>
          
          <div class="transcript-section">
            ${transcriptHtml}
          </div>
          
          <div class="footer">
            <span>© 2025 Wolters Kluwer N.V.</span>
            <span>AI Sales Simulation Record</span>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-3 animate-ios-slide pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Simulation Complete</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Performance Analysis</h2>
        </div>
        <button 
            onClick={onRestart}
            className="w-full md:w-auto px-8 py-4 bg-[#FF6B35] hover:bg-[#FF8B60] text-white font-black text-[10px] uppercase tracking-[0.25em] rounded-[20px] shadow-2xl shadow-orange-500/30 transition-all active:scale-95"
        >
            Restart Sandbox
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Score Card - Redesigned Competency Matrix */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/40 pt-6 pb-6 px-6 rounded-[32px] shadow-2xl lg:col-span-1 flex flex-col items-center max-h-[420px]">
          <h3 className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1 w-full text-center">Competency Matrix</h3>
          
          {/* Big Score Display */}
          <div className="text-center mt-2 mb-2">
            <span className="text-[64px] font-black text-slate-900 tracking-tighter leading-none">{overall}</span>
            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">OVERALL SCORE</div>
          </div>

          {/* 1. Overall Thermometer Bar - 12px below score */}
          <div className="w-full mt-[12px] px-1">
            <div className="h-2.5 w-full bg-slate-100 rounded-full relative mb-1.5 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out shadow-sm ${getThermometerColor(overall)}`}
                style={{ width: `${overall}%` }}
              />
            </div>
            
            {/* Scale Markers */}
            <div className="flex justify-between w-full text-[8px] font-black text-slate-400 uppercase tracking-widest px-0.5">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>

            <div className="mt-3 text-center">
              <p className="text-[11px] font-black text-slate-900 tracking-tight leading-none mb-1.5">
                Overall competency score: {overall} / 100
              </p>
              <div className="flex flex-col items-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-relaxed max-w-[280px]">
                  <span className={overall < 40 ? 'text-rose-600' : 'opacity-60'}>0–39 = Needs Imp.</span> • 
                  <span className={(overall >= 40 && overall < 70) ? 'text-amber-500' : 'opacity-60'}> 40–69 = Dev.</span> • 
                  <span className={overall >= 70 ? 'text-emerald-500' : 'opacity-60'}> 70–100 = Prof.</span>
                </p>
              </div>
            </div>
          </div>

          {/* 2. Stacked Contribution Bar - 16px below thermometer */}
          <div className="w-full mt-[16px] px-1">
            <div className="h-3 w-full bg-slate-100 rounded-md flex overflow-hidden shadow-sm border border-slate-200/50">
              {breakdownData.map((item, idx) => {
                const proportion = totalBreakdownPoints > 0 ? (item.score / totalBreakdownPoints) * 100 : 0;
                return (
                  <div 
                    key={idx}
                    className="h-full"
                    style={{ 
                      width: `${proportion}%`,
                      backgroundColor: item.fill
                    }}
                  />
                );
              })}
            </div>
            
            {/* Legend for Stacked Bar - 10px uppercase tracking-wide 60% opacity */}
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 w-full opacity-60">
              {breakdownData.map((item, idx) => {
                const proportion = totalBreakdownPoints > 0 ? Math.round((item.score / totalBreakdownPoints) * 100) : 0;
                // Get short label if long
                const shortLabel = item.label.length > 12 ? item.label.split(' ')[0] : item.label;
                return (
                  <div key={idx} className="flex items-center space-x-1">
                    <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: item.fill }}>{item.initial}</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
                      = {shortLabel} ({proportion}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="lg:col-span-2 space-y-3">
            <div className="bg-white/95 backdrop-blur-xl border border-white/40 p-5 rounded-[32px] shadow-2xl h-full">
                <h3 className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-3">Executive Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                        <h4 className="text-teal-600 font-black text-[9px] uppercase tracking-widest flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-2"></div> Key Strengths
                        </h4>
                        <div className="space-y-2.5">
                            {analysis.feedback.strengths.map((s, i) => (
                                <div key={i} className="p-3.5 bg-teal-50/70 rounded-[18px] border border-teal-100/50">
                                    <p className="text-slate-900 text-[13px] font-bold leading-snug">{s.point}</p>
                                    {s.quote && <p className="mt-1.5 text-[11px] text-teal-600 italic font-medium leading-relaxed">"{s.quote}"</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-orange-600 font-black text-[9px] uppercase tracking-widest flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"></div> Growth Areas
                        </h4>
                        <div className="space-y-2.5">
                            {analysis.feedback.improvements.map((s, i) => (
                                <div key={i} className="p-3.5 bg-orange-50/70 rounded-[18px] border border-orange-100/50">
                                    <p className="text-slate-900 text-[13px] font-bold leading-snug">{s.point}</p>
                                    {s.quote && <p className="mt-1.5 text-[11px] text-orange-600 italic font-medium leading-relaxed">"{s.quote}"</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-50">
                    <p className="text-slate-500 text-[12px] leading-relaxed font-medium italic">"{analysis.feedback.summary}"</p>
                </div>
            </div>
        </div>
      </div>

      {/* Download Action */}
      <div className="flex justify-center pt-2">
        <button 
          onClick={handleDownloadTranscript}
          className="flex items-center space-x-3.5 bg-white/95 backdrop-blur-xl border border-white/40 px-8 py-4 rounded-[12px] shadow-xl hover:shadow-2xl hover:opacity-90 transition-all active:scale-[0.98] group"
        >
          <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <span className="text-slate-800 font-semibold text-[16px]">Download Transcript</span>
        </button>
      </div>
    </div>
  );
};
