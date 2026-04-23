import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import HomeDetailScreen from '../screens/HomeDetailScreen';
import CreateHomeScreen from '../screens/CreateHomeScreen';
import JoinHomeScreen from '../screens/JoinHomeScreen';
import FaceScanScreen from '../screens/FaceScanScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FaceLoginScreen from '../screens/FaceLoginScreen';
import FaceManagementScreen from '../screens/FaceManagementScreen';
import FaceLogScreen from '../screens/FaceLogScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // Nếu ĐÃ Login -> Các màn hình chính
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="HomeDetail"
              component={HomeDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateHome"
              component={CreateHomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="JoinHome"
              component={JoinHomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                headerShown: false,
                title: 'Chỉnh sửa hồ sơ'
              }}
            />
            <Stack.Screen
              name="FaceManagement"
              component={FaceManagementScreen}
              options={{
                headerShown: false,
                title: 'Quản lý Face ID'
              }}
            />
            <Stack.Screen
              name="FaceScanScreen"
              component={FaceScanScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="FaceLog"
              component={FaceLogScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Nếu CHƯA Login -> Hiện form Login
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="FaceLogin"
              component={FaceLoginScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}