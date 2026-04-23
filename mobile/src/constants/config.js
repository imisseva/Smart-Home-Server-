// ================================================================
// CẤU HÌNH URL API SERVER
// ================================================================
// Chọn 1 trong 2 dòng dưới đây (comment dòng không dùng):

// --- Production (Render) ---
// export const API_URL = 'https://smarthome-server.onrender.com/api/';

// --- Local Dev ---
// Lưu ý: Nếu dùng Android Emulator thì IP là 10.0.2.2
// Nếu dùng điện thoại thật thì dùng IP LAN của máy tính (VD: 192.168.1.X)
export const API_URL = 'http://172.20.10.6:8000/api/';