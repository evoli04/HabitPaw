import { apiRequest } from './apiClient';

export const suggestHabits = (payload) =>
  apiRequest('/ai/habit-suggestions', {
    method: 'POST',
    body: payload,
    timeout: 45_000,
  });

export const acceptHabitSuggestions = (recommendationId, indexes) =>
  apiRequest(`/ai/habit-suggestions/${encodeURIComponent(recommendationId)}/accept`, {
    method: 'POST',
    body: { indexes },
  });
