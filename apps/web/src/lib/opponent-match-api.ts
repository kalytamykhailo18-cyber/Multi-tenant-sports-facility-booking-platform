// Opponent Match API Client
// Frontend API functions for opponent matching

import { apiClient } from './api';

// ============================================
// Types
// ============================================

export interface CreateOpponentMatchDto {
  facilityId: string;
  requestedDate: string; // YYYY-MM-DD
  requestedTime: string; // HH:mm
  courtId?: string;
  sportType: 'SOCCER' | 'PADEL' | 'TENNIS' | 'MULTI';
  playersNeeded: number;
  skillLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ANY';
  notes?: string;
}

export interface JoinOpponentMatchDto {
  notes?: string;
}

export interface GetOpponentMatchesQuery {
  facilityId?: string;
  date?: string;
  sportType?: 'SOCCER' | 'PADEL' | 'TENNIS' | 'MULTI';
  skillLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ANY';
  status?: 'OPEN' | 'MATCHED' | 'EXPIRED' | 'CANCELLED';
}

export interface Player {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  joinedAt: Date;
}

export interface OpponentMatch {
  id: string;
  facilityId: string;
  facilityName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  requestedDate: string;
  requestedTime: string;
  courtId?: string;
  courtName?: string;
  sportType: 'SOCCER' | 'PADEL' | 'TENNIS' | 'MULTI';
  playersNeeded: number;
  currentPlayers: number;
  spotsRemaining: number;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ANY';
  status: 'OPEN' | 'MATCHED' | 'EXPIRED' | 'CANCELLED';
  notes?: string;
  expiresAt: Date;
  bookingId?: string;
  joinedPlayers: Player[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OpponentMatchListResponse {
  matches: OpponentMatch[];
  total: number;
}

// ============================================
// API Functions
// ============================================

export const opponentMatchApi = {
  /**
   * Create a new opponent match request
   */
  async create(data: CreateOpponentMatchDto): Promise<OpponentMatch> {
    return apiClient.post<OpponentMatch>('/opponent-matches', data);
  },

  /**
   * Get all opponent matches with filters
   */
  async getAll(query?: GetOpponentMatchesQuery): Promise<OpponentMatchListResponse> {
    return apiClient.get<OpponentMatchListResponse>('/opponent-matches', { params: query });
  },

  /**
   * Get opponent match by ID
   */
  async getById(id: string): Promise<OpponentMatch> {
    return apiClient.get<OpponentMatch>(`/opponent-matches/${id}`);
  },

  /**
   * Join an opponent match
   */
  async join(id: string, data?: JoinOpponentMatchDto): Promise<OpponentMatch> {
    return apiClient.post<OpponentMatch>(`/opponent-matches/${id}/join`, data || {});
  },

  /**
   * Leave an opponent match
   */
  async leave(id: string): Promise<OpponentMatch> {
    return apiClient.delete<OpponentMatch>(`/opponent-matches/${id}/leave`);
  },

  /**
   * Cancel an opponent match (creator only)
   */
  async cancel(id: string): Promise<OpponentMatch> {
    return apiClient.delete<OpponentMatch>(`/opponent-matches/${id}`);
  },
};
