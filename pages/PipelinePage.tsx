import React from 'react';
import { DealPipeline } from '../components/DealPipeline';
import { useAppContext } from '../contexts/AppContext';

export const PipelinePage: React.FC = () => {
  const {
    currentUser,
    activeAction,
    visibleActions,
    handleCompleteAction,
    handleCancelAction,
    isValidating,
    currentTaskInfo,
    lastCompletionMessage,
    pipelineContext,
    setPipelineContext
  } = useAppContext();

  return (
    <DealPipeline
      currentUser={currentUser}
      activeAction={activeAction}
      visibleActions={visibleActions}
      onCompleteAction={handleCompleteAction}
      onCancelAction={handleCancelAction}
      isSubmitting={isValidating}
      progress={currentTaskInfo}
      completionMessage={lastCompletionMessage}
      pipelineContext={pipelineContext}
      onClearContext={() => setPipelineContext(null)}
    />
  );
};

