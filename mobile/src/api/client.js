import axios from 'axios';
import { API_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cấu hình Axios client
const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Interceptor để thêm user_id vào request nếu cần
client.interceptors.request.use(async (config) => {
  try {
    const userSession = await AsyncStorage.getItem('user_session');
    if (userSession) {
      const user = JSON.parse(userSession);
      
      if (config.method === 'get') {
        config.params = { ...config.params, user_id: user.id };
      } else {
        // KIỂM TRA: Nếu data là FormData thì dùng hàm append
        if (config.data instanceof FormData) {
          config.data.append('user_id', user.id);
        } else {
          // Nếu là JSON bình thường thì mới dùng spread {...}
          config.data = { ...config.data, user_id: user.id };
        }
      }
    }
  } catch (error) {
    console.log('Error getting user session:', error);
  }
  return config;
});

export default client;
