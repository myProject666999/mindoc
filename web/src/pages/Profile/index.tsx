import React, { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Tabs,
  Avatar,
  message,
  Typography,
  Divider,
  Tag,
} from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useUserStore } from '@/stores/userStore'
import { userApi } from '@/services/api'
import { User } from '@/types'

const { Title, Text } = Typography
const { TabPane } = Tabs

const Profile: React.FC = () => {
  const { user, setUser, fetchCurrentUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const handleUpdateProfile = async (values: any) => {
    setLoading(true)
    try {
      const updatedUser = await userApi.updateProfile({
        nickname: values.nickname,
        email: values.email,
      })
      setUser(updatedUser as User)
      message.success('更新成功')
      fetchCurrentUser()
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的密码不一致')
      return
    }
    setLoading(true)
    try {
      await userApi.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      })
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      console.error('Failed to change password:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>个人设置</Title>
        <Text type="secondary">管理您的个人资料和账户信息</Text>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} src={user?.avatar} />
          <div style={{ marginLeft: 24 }}>
            <h3 style={{ margin: 0 }}>{user?.nickname || user?.username}</h3>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{user?.role?.display_name || '普通用户'}</Tag>
              <Tag className={user?.status === 1 ? 'status-active' : 'status-disabled'}>
                {user?.status === 1 ? '正常' : '禁用'}
              </Tag>
            </div>
            <div style={{ marginTop: 8, color: '#8c8c8c' }}>
              用户名: {user?.username} | 邮箱: {user?.email}
            </div>
          </div>
        </div>

        <Divider />

        <Tabs defaultActiveKey="profile">
          <TabPane tab="基本资料" key="profile">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={{
                nickname: user?.nickname,
                email: user?.email,
              }}
              style={{ maxWidth: 500 }}
            >
              <Form.Item name="nickname" label="昵称">
                <Input placeholder="请输入昵称" />
              </Form.Item>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ type: 'email', message: '请输入有效的邮箱' }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存更改
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="修改密码" key="password">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              style={{ maxWidth: 500 }}
            >
              <Form.Item
                name="old_password"
                label="原密码"
                rules={[{ required: true, message: '请输入原密码' }]}
              >
                <Input.Password placeholder="请输入原密码" />
              </Form.Item>
              <Form.Item
                name="new_password"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              <Form.Item
                name="confirm_password"
                label="确认密码"
                dependencies={['new_password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default Profile
