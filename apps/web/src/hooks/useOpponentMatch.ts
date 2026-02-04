// useOpponentMatch Hook
// React hook for opponent matching with WebSocket support

import { useEffect } from 'react';
import { useOpponentMatchStore } from '@/stores/opponent-match.store';
import { getSocket } from '@/lib/socket';
import { OpponentMatch } from '@/lib/opponent-match-api';

export function useOpponentMatch() {
  const store = useOpponentMatchStore();

  // Subscribe to WebSocket events
  useEffect(() => {
    const socket = getSocket();

    // Match created
    socket.on('opponent-match:created', (match: OpponentMatch) => {
      store.addMatch(match);
    });

    // Player joined
    socket.on('opponent-match:player-joined', (match: OpponentMatch) => {
      store.updateMatch(match);
    });

    // Player left
    socket.on('opponent-match:player-left', (match: OpponentMatch) => {
      store.updateMatch(match);
    });

    // Match cancelled
    socket.on('opponent-match:cancelled', (match: OpponentMatch) => {
      store.updateMatch(match);
    });

    // Match completed (fully matched)
    socket.on('opponent-match:completed', (match: OpponentMatch) => {
      store.updateMatch(match);
    });

    // Cleanup
    return () => {
      socket.off('opponent-match:created');
      socket.off('opponent-match:player-joined');
      socket.off('opponent-match:player-left');
      socket.off('opponent-match:cancelled');
      socket.off('opponent-match:completed');
    };
  }, [store]);

  return {
    // State
    matches: store.matches,
    selectedMatch: store.selectedMatch,
    loading: store.loading,
    createLoading: store.createLoading,
    joinLoading: store.joinLoading,
    leaveLoading: store.leaveLoading,
    cancelLoading: store.cancelLoading,
    error: store.error,

    // Actions
    fetchMatches: store.fetchMatches,
    fetchMatchById: store.fetchMatchById,
    createMatch: store.createMatch,
    joinMatch: store.joinMatch,
    leaveMatch: store.leaveMatch,
    cancelMatch: store.cancelMatch,
    setSelectedMatch: store.setSelectedMatch,
    clearError: store.clearError,
  };
}
