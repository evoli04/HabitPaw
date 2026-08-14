import { apiRequest } from './apiClient';

export const getWallet = () => apiRequest('/coins');

export const claimHabitReward = (habitId) =>
  apiRequest(`/habits/${encodeURIComponent(habitId)}/claim-reward`, { method: 'POST' });
