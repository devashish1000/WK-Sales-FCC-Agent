
import { Deal, Milestone, EngagementData } from '../types';
import { woltersKluwerReps } from './salesReps';

const accountNames = [
  'UnitedHealth Group', 'Mayo Clinic', 'HCA Healthcare', 'Skadden Arps', 'CVS', 'Baker McKenzie',
  'JPMorgan Chase', 'Goldman Sachs', 'Deloitte', 'PwC', 'EY', 'KPMG', 'White & Case', 'Latham & Watkins',
  'Cravath Swaine', 'DLA Piper', 'Kaiser Permanente', 'Anthem', 'Kirkland & Ellis', 'Sidley Austin',
  'Jones Day', 'Pfizer', 'Microsoft', 'Apple', 'Amazon', 'Citigroup', 'Bank of America', 'Cleveland Clinic',
  'Federal Trade Commission (FTC)', 'Wells Fargo', 'Morgan Stanley', 'Alphabet Inc.', 'Walmart'
];

const dealSuffixes = [
  'Global Tax Solution',
  'Regulatory Compliance Suite',
  'Legal Research Intelligence',
  'Healthcare Risk Manager',
  'Audit & Assurance Platform',
  'Financial Reporting Upgrade',
  'ESG Compliance Audit',
  'Corporate Governance Portal',
  'Internal Audit Cloud',
  'TeamMate+ Implementation',
  'CT Corporation Compliance',
  'CCH Axcess Migration'
];

const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;

const getScoreFromRepId = (repId: string): number => {
  const rank = parseInt(repId.replace('rep', ''), 10);
  if (rank <= 5) return Math.floor(100 - ((rank - 1) * 9 / 4));
  return Math.floor(90 - ((rank - 6) * 40 / 94));
};

export const getDealsForRep = (repId: string): Deal[] => {
  const rep = woltersKluwerReps.find(r => r.id === repId);
  if (!rep) return [];

  const baseScore = getScoreFromRepId(repId);
  const rank = parseInt(repId.replace('rep', ''), 10);
  const isMichael = rep.email === 'michael.thompson@wolterskluwer.com';

  const getSeededRandom = (offset: number) => {
    const x = Math.sin(rank + offset) * 10000;
    return x - Math.floor(x);
  };

  const quota = rep.quota || 400000;
  const targetPipelineValue = (quota * (baseScore + 20)) / 100;
  const dealCount = isMichael ? 35 : 8;
  const avgDealValue = targetPipelineValue / dealCount;

  const deals: Deal[] = [];

  for (let i = 0; i < dealCount; i++) {
    const accountIndex = isMichael ? (i % accountNames.length) : Math.floor(getSeededRandom(i + 1) * accountNames.length);
    const suffixIndex = Math.floor(getSeededRandom(i + 2) * dealSuffixes.length);
    const stageIndex = Math.floor(getSeededRandom(i + 3) * (stages.length - 1));
    const currentStage = stages[stageIndex];
    
    const healthVariance = (getSeededRandom(i + 4) * 10) - 5; 
    let health = Math.floor(baseScore + healthVariance);
    health = Math.max(20, Math.min(100, health)); 

    let status: Deal['status'] = 'Healthy';
    if (health < 40) status = 'Critical';
    else if (health < 60) status = 'Risk';
    else if (health < 80) status = 'Watch';

    const value = Math.floor(avgDealValue * ((getSeededRandom(i + 5) * 0.4) + 0.8));
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + Math.floor(getSeededRandom(i + 6) * 60));

    // Risk and Closure logic
    const riskScore = Math.floor(100 - health + (getSeededRandom(i + 7) * 20));
    const closureProbability = Math.floor(health * 0.8 + (stageIndex * 5));

    // Milestone Generation
    const milestones: Milestone[] = [
      { label: 'First Contact', timestamp: 'Oct 12, 2024', completed: true, actions: ['Intro Email Sent', 'LinkedIn Connection'], type: 'conciseness' },
      { label: 'Qualification', timestamp: 'Oct 28, 2024', completed: stageIndex >= 1, actions: ['BANT Analysis', 'Budget Confirmed'], type: 'qualification' },
      { label: 'Proposal', timestamp: 'Nov 15, 2024', completed: stageIndex >= 2, actions: ['Custom Deck Sent', 'ROI Calculator Provided'], type: 'efficiency' },
      { label: 'Negotiation', timestamp: 'Dec 02, 2024', completed: stageIndex >= 3, actions: ['Legal Review', 'Discount Approval'], type: 'time' },
      { label: 'Close', timestamp: 'TBD', completed: stageIndex >= 4, actions: ['Contract Executed'], type: 'conciseness' },
    ];

    // Engagement Heatmap
    const engagementHeatmap: EngagementData[] = [
      { week: 'W1', frequency: Math.floor(getSeededRandom(i + 8) * 10) },
      { week: 'W2', frequency: Math.floor(getSeededRandom(i + 9) * 10) },
      { week: 'W3', frequency: Math.floor(getSeededRandom(i + 10) * 10) },
      { week: 'W4', frequency: Math.floor(getSeededRandom(i + 11) * 10) },
    ];

    deals.push({
      id: parseInt(`${rank}${i}`),
      name: `${accountNames[accountIndex]} - ${dealSuffixes[suffixIndex]}`,
      account: accountNames[accountIndex],
      value,
      stage: currentStage,
      health,
      closeDate: closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ownerId: rep.id,
      ownerName: `${rep.firstName} ${rep.lastName}`,
      status,
      riskScore: Math.min(100, riskScore),
      closureProbability: Math.min(99, closureProbability),
      milestones,
      engagementHeatmap
    });
  }

  return deals;
};

export const getAllDeals = (): Deal[] => {
    return woltersKluwerReps.flatMap(rep => getDealsForRep(rep.id));
}
