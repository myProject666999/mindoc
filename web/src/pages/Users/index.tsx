import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  InputNumber,
  Typography,
  Space,
  Avatar,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { userApi, roleApi } from '@/services/api'
import { User, Role } from '@/types'

const { Title } = Typography

const Users: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    fetchRoles()
    fetchUsers()
  }, [])

  const fetchRoles = async () => {
    try {
      const result = await roleApi.getList()
      setRoles(result)
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const result = await userApi.getList({ page, page_size: pageSize })
      setUsers(result.list)
      setPagination({
        ...pagination,
        current: page,
        pageSize,
        total: result.total,
      })
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (user: User) => {
    setEditUser(user)
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      role_id: user.role_id,
      status: user.status,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await userApi.delete(id)
      message.success('删除成功')
      fetchUsers(pagination.current, pagination.pageSize)
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editUser) {
        await userApi.update(editUser.id, {
          nickname: values.nickname,
          email: values.email,
          role_id: values.role_id,
          status: values.status,
        })
        message.success('更新成功')
      } else {
        await userApi.create({
          username: values.username,
          email: values.email,
          password: values.password,
          nickname: values.nickname,
          role_id: values.role_id,
        })
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchUsers(pagination.current, pagination.pageSize)
    } catch (error) {
      console.error('Failed to submit:', error)
    }
  }

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 1 ? 0 : 1
    try {
      await userApi.update(user.id, { status: newStatus })
      message.success(newStatus === 1 ? '用户已启用' : '用户已禁用')
      fetchUsers(pagination.current, pagination.pageSize)
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string) => <Avatar icon={<UserOutlined />} src={avatar} />,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: Role) => (
        <Tag color="blue">{role?.display_name || '普通用户'}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number, record: User) => (
        <Tag className={status === 1 ? 'status-active' : 'status-disabled'}>
          {status === 1 ? <UnlockOutlined /> : <LockOutlined />}
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => toggleStatus(record)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <Title level={3} style={{ margin: 0 }}>用户管理</Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建用户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => fetchUsers(page, pageSize),
        }}
      />

      <Modal
        title={editUser ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editUser && (
            <>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </>
          )}
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
          <Form.Item name="role_id" label="角色">
            <Select placeholder="请选择角色">
              {roles.map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.display_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {editUser && (
            <Form.Item name="status" label="状态">
              <Select>
                <Select.Option value={1}>启用</Select.Option>
                <Select.Option value={0}>禁用</Select.Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
