import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Spin,
  InputNumber,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  BookOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import { projectApi } from '@/services/api'
import { Project } from '@/types'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Title } = Typography
const { TextArea } = Input

const Projects: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [memberModalVisible, setMemberModalVisible] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const result = await projectApi.getList({ page: 1, page_size: 100 })
      setProjects(result.list)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditProject(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (project: Project) => {
    setEditProject(project)
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      visibility: project.visibility,
      sort_order: project.sort_order,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await projectApi.delete(id)
      message.success('删除成功')
      fetchProjects()
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editProject) {
        await projectApi.update(editProject.id, values)
        message.success('更新成功')
      } else {
        await projectApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchProjects()
    } catch (error) {
      console.error('Failed to submit:', error)
    }
  }

  const handleRegenerateToken = async (project: Project) => {
    try {
      const result = await projectApi.regenerateToken(project.id)
      message.success('Token已重置')
      fetchProjects()
    } catch (error) {
      console.error('Failed to regenerate token:', error)
    }
  }

  const openMemberModal = (project: Project) => {
    setSelectedProject(project)
    setMemberModalVisible(true)
  }

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <Title level={3} style={{ margin: 0 }}>项目管理</Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建项目
        </Button>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {projects.map((project) => (
            <Col xs={24} sm={12} lg={8} key={project.id}>
              <Card
                className="project-card"
                onClick={() => navigate(`/projects/${project.id}`)}
                actions={[
                  <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); handleEdit(project) }} />,
                  <TeamOutlined key="members" onClick={(e) => { e.stopPropagation(); openMemberModal(project) }} />,
                  <Popconfirm
                    title="确定要删除这个项目吗？"
                    onConfirm={(e) => { e?.stopPropagation(); handleDelete(project.id) }}
                    okText="确定"
                    cancelText="取消"
                  >
                    <DeleteOutlined key="delete" onClick={(e) => e.stopPropagation()} />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  avatar={
                    <div
                      className="project-icon"
                      style={{ background: project.visibility === 1 ? '#1890ff' : '#fa8c16' }}
                    >
                      <BookOutlined />
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="text-ellipsis" style={{ maxWidth: 150 }}>
                        {project.name}
                      </span>
                      <Tag
                        className={project.visibility === 1 ? 'visibility-public' : 'visibility-private'}
                      >
                        {project.visibility === 1 ? <UnlockOutlined /> : <LockOutlined />}
                        {project.visibility === 1 ? '公开' : '私有'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 8 }}>
                      <div className="text-ellipsis" style={{ color: '#8c8c8c' }}>
                        {project.description || '暂无描述'}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                        创建于 {dayjs(project.created_at).format('YYYY-MM-DD')}
                        {project.access_token && (
                          <span style={{ marginLeft: 16 }}>
                            Token: <code>{project.access_token.slice(0, 8)}...</code>
                            <Button
                              type="link"
                              size="small"
                              onClick={(e) => { e.stopPropagation(); handleRegenerateToken(project) }}
                            >
                              重置
                            </Button>
                          </span>
                        )}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        {projects.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <BookOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
            <div style={{ marginTop: 16, fontSize: 16, color: '#8c8c8c' }}>
              暂无项目
            </div>
            <Button type="primary" style={{ marginTop: 16 }} onClick={handleCreate}>
              创建第一个项目
            </Button>
          </div>
        )}
      </Spin>

      <Modal
        title={editProject ? '编辑项目' : '新建项目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <TextArea rows={4} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item name="visibility" label="可见性">
            <Select>
              <Select.Option value={1}>公开项目</Select.Option>
              <Select.Option value={2}>私有项目（需要Token访问）</Select.Option>
            </Select>
          </Form.Item>
          {editProject && (
            <Form.Item name="sort_order" label="排序">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
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

      <MemberModal
        visible={memberModalVisible}
        project={selectedProject}
        onClose={() => setMemberModalVisible(false)}
        onRefresh={fetchProjects}
      />
    </div>
  )
}

interface MemberModalProps {
  visible: boolean
  project: Project | null
  onClose: () => void
  onRefresh: () => void
}

const MemberModal: React.FC<MemberModalProps> = ({ visible, project, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible && project) {
      fetchMembers()
    }
  }, [visible, project])

  const fetchMembers = async () => {
    if (!project) return
    setLoading(true)
    try {
      const result = await projectApi.getMembers(project.id)
      setMembers(result)
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (values: { user_id: number; role: number }) => {
    if (!project) return
    try {
      await projectApi.addMember(project.id, { user_id: values.user_id, role: values.role || 1 })
      message.success('添加成功')
      form.resetFields()
      fetchMembers()
      onRefresh()
    } catch (error) {
      console.error('Failed to add member:', error)
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!project) return
    try {
      await projectApi.removeMember(project.id, memberId)
      message.success('移除成功')
      fetchMembers()
      onRefresh()
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const handleUpdateRole = async (memberId: number, role: number) => {
    if (!project) return
    try {
      await projectApi.updateMemberRole(project.id, memberId, { role })
      message.success('更新成功')
      fetchMembers()
      onRefresh()
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  return (
    <Modal
      title="项目成员管理"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form form={form} layout="inline" onFinish={handleAddMember} style={{ marginBottom: 16 }}>
        <Form.Item
          name="user_id"
          label="用户ID"
          rules={[{ required: true, message: '请输入用户ID' }]}
        >
          <InputNumber min={1} style={{ width: 150 }} placeholder="用户ID" />
        </Form.Item>
        <Form.Item name="role" label="角色">
          <Select style={{ width: 120 }} defaultValue={1}>
            <Select.Option value={1}>成员</Select.Option>
            <Select.Option value={2}>管理员</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            添加成员
          </Button>
        </Form.Item>
      </Form>

      <Spin spinning={loading}>
        {members.map((member) => (
          <div
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>{member.user?.username || `用户 ${member.user_id}`}</span>
              <Tag color={member.role === 2 ? 'blue' : 'default'}>
                {member.role === 2 ? '管理员' : '成员'}
              </Tag>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Select
                value={member.role}
                style={{ width: 100 }}
                onChange={(role) => handleUpdateRole(member.id, role)}
              >
                <Select.Option value={1}>成员</Select.Option>
                <Select.Option value={2}>管理员</Select.Option>
              </Select>
              <Popconfirm
                title="确定要移除该成员吗？"
                onConfirm={() => handleRemoveMember(member.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button danger size="small">移除</Button>
              </Popconfirm>
            </div>
          </div>
        ))}
        {members.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
            暂无成员
          </div>
        )}
      </Spin>
    </Modal>
  )
}

export default Projects
