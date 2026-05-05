import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Transfer,
  message,
  Typography,
  Space,
  Tag,
  Popconfirm,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyOutlined } from '@ant-design/icons'
import { roleApi } from '@/services/api'
import { Role, Permission } from '@/types'

const { Title, Text } = Typography
const { TextArea } = Input

const Roles: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [permissionModalVisible, setPermissionModalVisible] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rolesData, permissionsData] = await Promise.all([
        roleApi.getList(),
        roleApi.getPermissions(),
      ])
      setRoles(rolesData)
      setPermissions(permissionsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditRole(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (role: Role) => {
    setEditRole(role)
    form.setFieldsValue({
      name: role.name,
      display_name: role.display_name,
      description: role.description,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await roleApi.delete(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('Failed to delete role:', error)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editRole) {
        await roleApi.update(editRole.id, {
          display_name: values.display_name,
          description: values.description,
        })
        message.success('更新成功')
      } else {
        await roleApi.create({
          name: values.name,
          display_name: values.display_name,
          description: values.description,
        })
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Failed to submit:', error)
    }
  }

  const openPermissionModal = (role: Role) => {
    setSelectedRole(role)
    setSelectedPermissions(role.permissions?.map((p) => p.id) || [])
    setPermissionModalVisible(true)
  }

  const handleUpdatePermissions = async () => {
    if (!selectedRole) return
    try {
      await roleApi.updatePermissions(selectedRole.id, selectedPermissions)
      message.success('权限更新成功')
      setPermissionModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Failed to update permissions:', error)
    }
  }

  const transferDataSource = permissions.map((p) => ({
    key: p.id.toString(),
    title: `${p.module} - ${p.display_name}`,
    description: p.name,
  }))

  const isSystemRole = (role: Role) => {
    return ['super_admin', 'user', 'guest'].includes(role.name)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Tag color="blue">{name}</Tag>
      ),
    },
    {
      title: '显示名称',
      dataIndex: 'display_name',
      key: 'display_name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || '-',
    },
    {
      title: '权限数量',
      key: 'permissions_count',
      render: (_: any, record: Role) => (
        <Tag>{record.permissions?.length || 0} 个权限</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: Role) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<SafetyOutlined />}
            onClick={() => openPermissionModal(record)}
          >
            权限配置
          </Button>
          {!isSystemRole(record) && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个角色吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <Title level={3} style={{ margin: 0 }}>权限管理</Title>
          <Text type="secondary">管理系统角色和权限分配</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建角色
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editRole ? '编辑角色' : '新建角色'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editRole && (
            <Form.Item
              name="name"
              label="角色标识"
              rules={[{ required: true, message: '请输入角色标识' }]}
            >
              <Input placeholder="例如: editor, manager 等" />
            </Form.Item>
          )}
          <Form.Item
            name="display_name"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="请输入显示名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>
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

      <Modal
        title={`权限配置 - ${selectedRole?.display_name}`}
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPermissionModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleUpdatePermissions}>
            保存
          </Button>,
        ]}
        width={700}
      >
        <Transfer
          dataSource={transferDataSource}
          titles={['可选权限', '已选权限']}
          targetKeys={selectedPermissions.map((id) => id.toString())}
          onChange={(targetKeys) => setSelectedPermissions(targetKeys.map((k) => parseInt(k)))}
          listStyle={{ width: '100%', height: 400 }}
          render={(item) => (
            <div>
              <span>{item.title}</span>
              <div style={{ color: '#999', fontSize: 12 }}>{item.description}</div>
            </div>
          )}
          showSearch
          filterOption={(input, item) =>
            item.title.toLowerCase().includes(input.toLowerCase())
          }
        />
      </Modal>
    </div>
  )
}

export default Roles
