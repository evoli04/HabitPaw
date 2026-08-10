import { apiRequest } from './apiClient';

const habitPath = (id) => `/habits/${encodeURIComponent(id)}`;

export const getHabits = () => apiRequest('/habits');
export const getTodayHabits = () => apiRequest('/habits/today');
export const getHabitById = (id) => apiRequest(habitPath(id));
export const createHabit = (payload) =>
  apiRequest('/habits', { method: 'POST', body: payload });
export const updateHabit = (id, payload) =>
  apiRequest(habitPath(id), { method: 'PATCH', body: payload });
export const deleteHabit = (id) => apiRequest(habitPath(id), { method: 'DELETE' });
export const completeHabit = (id) =>
  apiRequest(`${habitPath(id)}/complete`, { method: 'POST' });
export const uncompleteHabit = (id) =>
  apiRequest(`${habitPath(id)}/complete`, { method: 'DELETE' });
