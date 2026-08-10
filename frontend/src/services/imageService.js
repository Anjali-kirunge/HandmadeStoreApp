import api from './api';

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
