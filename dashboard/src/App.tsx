import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/components/login'
import ProtectedRoute from '@/components/protected-route'
import AdminProtectedRoute from '@/components/admin-protected-route'
import UserProfile from '@/components/user-profile'
import AdminProfile from '@/components/admin-profile'

function App() {
  console.log("APP VERSION CHECK: ROUTER LOADED")
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={<AdminProtectedRoute />} />
        <Route path="/admin/profile" element={
          <AdminProtectedRoute>
            <AdminProfile />
          </AdminProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
