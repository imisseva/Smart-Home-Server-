import client from '../api/client'; 
const AuthService = {
  login: async (username, password) => {
    try {
   
      const response = await client.post('/auth/login/', { username, password });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Lỗi kết nối' };
    }
  },

  register: async (userData) => {
    try {
      const response = await client.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Lỗi kết nối' };
    }
  },
  updateProfile: async (payload) => {
    try {
      // Dùng chung cấu hình client đã có sẵn base_url và timeout
      const response = await client.put('/auth/profile/update/', payload);
      return response.data; 
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Lỗi kết nối server' };
    }
  },
  loginWithFace: async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('face_image', {
        uri: imageUri,
        name: 'login_face.jpg',
        type: 'image/jpeg'
      });

      // API Backend mà lát nữa chúng ta sẽ viết
      const response = await client.post('/auth/face-login/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Lỗi kết nối server' };
    }
  },
};

export default AuthService;