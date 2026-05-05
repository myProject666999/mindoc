import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useUserStore } from '@/stores/userStore'
import { useEffect } from 'react'

import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/ProjectDetail'
import Users from '@/pages/Users'
import Roles from '@/pages/Roles'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useUserStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useUserStore()
  const isAdmin = user?.role?.name === 'super_admin'

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}

function App() {
  const { fetchCurrentUser, isAuthenticated } = useUserStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser().catch(() => {})
    }
  }, [isAuthenticated])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route
              path="users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
            <Route
              path="roles"
              element={
                <AdminRoute>
                  <Roles />
                </AdminRoute>
              }
            />
            <Route
              path="settings"
              element={
                <AdminRoute>
                  <Settings />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  )
}

export default App
