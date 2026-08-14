import { apiRequest } from './apiClient';

export const getShopItems = () => apiRequest('/shop/items');

export const purchaseShopItem = (itemId) =>
  apiRequest(`/shop/items/${encodeURIComponent(itemId)}/purchase`, { method: 'POST' });

export const setEquippedShopItem = (itemId) =>
  apiRequest('/shop/equipped', { method: 'PUT', body: { itemId } });
