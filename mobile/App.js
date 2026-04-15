import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    // Bọc AuthProvider ở ngoài cùng để toàn bộ App truy cập được biến 'user'
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}