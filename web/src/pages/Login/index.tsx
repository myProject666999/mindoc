import React, { useEffect } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { LoginRequest } from '@/types'

const Login: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { login, loading, isAuthenticated } = useUserStore()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (values: LoginRequest) => {
    try {
      await login(values)
      message.success('登录成功')
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-title">
          <h1 style={{ marginBottom: 8 }}>MinDoc</h1>
          <p style={{ color: '#8c8c8c' }}>在线文档管理系统</p>
        </div>
        <Form
          form={form}
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名或邮箱' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名或邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            没有账户？ <Link to="/register">立即注册</Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, color: '#999', fontSize: 12 }}>
            默认管理员: admin / admin123
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login
