import client from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeService = {
  // Lấy danh sách homes của user
  getUserHomes: async () => {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      const user = JSON.parse(userSession);
      const response = await client.get('homes/', {
        params: { user_id: user.id }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },

  // Tạo home mới
  createHome: async (namehome) => {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      const user = JSON.parse(userSession);
      const response = await client.post('homes/create/', {
        namehome,
        user_id: user.id
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },

  // Tìm homes theo tên
  searchHomes: async (namehome) => {
    try {
      const response = await client.get('homes/search/', {
        params: { namehome }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },

  // Gửi request join home
  joinHome: async (homeId) => {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      const user = JSON.parse(userSession);
      const response = await client.post('homes/join/', {
        home_id: homeId,
        user_id: user.id
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },

  // Lấy danh sách requests của một home
  getHomeRequests: async (homeId, status = 'pending') => {
    try {
      const response = await client.get('homes/requests/', {
        params: { home_id: homeId, status }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },

  // Duyệt request
  approveRequest: async (requestId) => {
    try {
      const response = await client.post('homes/requests/approve/', {
        request_id: requestId
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },

  // Từ chối request
  rejectRequest: async (requestId) => {
    try {
      const response = await client.post('homes/requests/reject/', {
        request_id: requestId
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },
};

export default HomeService;
