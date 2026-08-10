import api from './api';

export const sendChatMessage = (payload) => {
  return api.post('/chat', payload);
};
