import client from '../api/client';

const FaceService = {
  checkPose: async (image, expected_angle) => {
    try {
      // Vì baseURL đã có sẵn /api, nên hãy dùng đường dẫn tương đối khớp với backend
      const response = await client.post('/auth/check-pose/', {
        image,
        expected_angle
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Lỗi kết nối server' };
    }
  },

  // HÀM MỚI: Đóng gói và gửi 5 ảnh
  uploadFaceImages: async (userId, capturedImages) => {
    try {
      const formData = new FormData();
      formData.append('user_id', userId);

      capturedImages.forEach((img) => {
        const filename = `${userId}_${img.angle}.jpg`;
        formData.append('face_images', {
          uri: img.uri,
          name: filename,
          type: 'image/jpeg'
        });
        formData.append('angles', img.angle);
      });

      // Ghi đè Content-Type thành multipart/form-data
      const response = await client.post('/auth/face-register/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout : 80000 // Tăng timeout vì upload nhiều ảnh có thể mất thời gian
      });
      
      return response.data;
    } catch (error) {
      // THÊM 2 DÒNG LOG NÀY ĐỂ BẮT ĐÚNG BỆNH:
      console.log("=== LỖI AXIOS CHI TIẾT ===");
      console.log(error.message); 

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw { error: 'Máy chủ phản hồi quá lâu (Timeout). Vui lòng kiểm tra lại mạng hoặc Server AI.' };
      }
      
      throw error.response ? error.response.data : { error: 'Lỗi mạng: ' + error.message };
    }
  },
  checkFaceStatus: async (userId) => {
    try {
      const response = await client.get('/auth/face-status/', {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Lỗi kết nối server' };
    }
  },

  // HÀM MỚI: Xóa dữ liệu Face ID
  deleteFaceData: async (userId) => {
    try {
      const response = await client.delete('/auth/face-status/', {
        data: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Lỗi kết nối server' };
    }
  }
};

export default FaceService;