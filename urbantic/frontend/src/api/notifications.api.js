import api from './client.js';

export async function list() {
  const response = await api.get('/notifications');
  return response.data.data;
}

export async function markAsRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllAsRead() {
  const response = await api.patch('/notifications/read-all');
  return response.data;
}
