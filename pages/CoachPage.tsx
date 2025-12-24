import React from 'react';
import { DealCoach } from '../components/DealCoach';
import { useAppContext } from '../contexts/AppContext';

export const CoachPage: React.FC = () => {
  const { currentUser } = useAppContext();
  return <DealCoach currentUser={currentUser} />;
};

