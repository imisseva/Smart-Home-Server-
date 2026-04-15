import React, { createContext, useState } from 'react';
import AuthService from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- HÀM CẬP NHẬT AVATAR MỚI ---
  const updateUserAvatar = async (newAvatarUrl) => {
    if (user) {
      const updatedUser = { ...user, avatar_url: newAvatarUrl };
      setUser(updatedUser);
      await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
    }
  };

  // --- 1. HÀM ĐĂNG NHẬP ---
  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const result = await AuthService.login(username, password);
      const userData = result.data;
      setUser(userData);
      await AsyncStorage.setItem('user_session', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.error || "Đăng nhập thất bại" };
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. HÀM ĐĂNG KÝ (MỚI THÊM) ---
  const register = async (userData) => {
    setIsLoading(true);
    try {
      // userData bao gồm: { username, password, fullname, email, phone }
      await AuthService.register(userData);
      return { success: true };
    } catch (error) {
      // Xử lý lỗi trả về từ Serializer (VD: username trùng, thiếu pass...)
      let msg = "Đăng ký thất bại";
      if (error.username) msg = error.username[0];
      else if (error.error) msg = error.error;
      
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. HÀM ĐĂNG XUẤT ---
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user_session');
  };
  // --- HÀM ĐĂNG NHẬP BẰNG KHUÔN MẶT (MỚI THÊM) ---
  const loginWithFace = async (imageUri) => {
    setIsLoading(true);
    try {
      const result = await AuthService.loginWithFace(imageUri);
      
      // Giả sử Backend trả về: { message: "Thành công", data: { id, username, fullname... } }
      const userData = result.data; 
      setUser(userData);
      await AsyncStorage.setItem('user_session', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.error || error.message || "Không nhận diện được khuôn mặt" };
    } finally {
      setIsLoading(false);
    }
  };

  // Nhớ return loginWithFace ở dưới cùng
  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, loginWithFace, updateUserAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};