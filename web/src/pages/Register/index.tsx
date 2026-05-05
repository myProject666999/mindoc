import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { configApi } from '@/services/api'

interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  nickname?: string
}

const Register: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { register, loading, isAuthenticated } = useUserStore()
  const [anonymousAccess, setAnonymousAccess] = useState(true)

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const config = await configApi.getSiteConfig()
        if (!config.anonymous_access) {
          setAnonymousAccess(false)
          message.warning('注册功能已关闭，请联系管理员')
          setTimeout(() => navigate('/login'), 2000)
        }
      } catch (error) {
        console.error('Failed to get config:', error)
      }
    }
    checkConfig()
  }, [navigate])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (values: RegisterFormData) => {
    const { confirmPassword, ...registerData } = values
    try {
      await register(registerData)
      message.success('注册成功')
      navigate('/dashboard')
    } catch (error) {
      console.error('Register failed:', error)
    }
  }

  if (!anonymousAccess) {
    return (
      <div className="login-container">
        <Card className="login-card">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <h3>注册功能已关闭</h3>
            <p style={{ color: '#8c8c8c', marginTop: 16 }}>
              请联系管理员获取账户
            </p>
            <Button type="primary" onClick={() => navigate('/login')} style={{ marginTop: 24 }}>
              返回登录
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-title">
          <h1 style={{ marginBottom: 8 }}>注册账户</h1>
          <p style={{ color: '#8c8c8c' }}>创建您的MinDoc账户</p>
        </div>
        <Form
          form={form}
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="nickname"
          >
            <Input prefix={<UserOutlined />} placeholder="昵称（可选）" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            已有账户？ <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Register
