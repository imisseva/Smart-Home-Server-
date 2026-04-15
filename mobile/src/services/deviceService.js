import client from '../api/client';

const DeviceService = {
  // Lấy danh sách devices của một home
  getHomeDevices: async (homeId) => {
    try {
      const response = await client.get('devices/', {
        params: { home_id: homeId }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },

  // Bật/tắt device
  toggleDevice: async (deviceId) => {
    try {
      const response = await client.post('devices/toggle/', {
        device_id: deviceId
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },

  // Cập nhật intensity (độ sáng, tốc độ...)
  updateIntensity: async (deviceId, intensity) => {
    try {
      const response = await client.post('devices/intensity/', {
        device_id: deviceId,
        intensity: parseInt(intensity)
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Không kết nối được Server' };
    }
  },
};

export default DeviceService;
