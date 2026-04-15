import client from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LogService = {
  // Lấy lịch sử truy cập của một home
  getHomeLogs: async (homeId, limit = 50) => {
    try {
      const response = await client.get('logs/', {
        params: { home_id: homeId, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },

  // Tạo log khi truy cập home
  createLog: async (homeId, method = 'remote_app', imageUrl = null) => {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      const user = JSON.parse(userSession);
      const response = await client.post('logs/create/', {
        home_id: homeId,
        user_id: user.id,
        method,
        image_url: imageUrl
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },
};

export default LogService;
