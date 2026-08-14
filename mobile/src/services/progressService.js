import { apiRequest } from './apiClient';

export const getProgress = (range = 'week') =>
  apiRequest(`/progress?range=${encodeURIComponent(range)}`);
