import React, { useEffect, useState } from 'react'
import {
  Layout,
  Menu,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Spin,
  Breadcrumb,
  Popconfirm,
  Space,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  FolderOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { projectApi, documentApi } from '@/services/api'
import { Project, Document } from '@/types'

const { Sider, Content } = Layout
const { TextArea } = Input

interface DocTreeItem {
  id: number
  title: string
  parent_id: number
  sort_order: number
  children?: DocTreeItem[]
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [documentTree, setDocumentTree] = useState<DocTreeItem[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [docModalVisible, setDocModalVisible] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [proj, tree] = await Promise.all([
        projectApi.getById(parseInt(id!)),
        documentApi.getTree(parseInt(id!)),
      ])
      setProject(proj)
      setDocumentTree(tree as DocTreeItem[])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocument = async (docId: number) => {
    try {
      const doc = await documentApi.getById(parseInt(id!), docId)
      setSelectedDoc(doc)
      setEditContent(doc.content)
      setEditTitle(doc.title)
      setEditMode(false)
    } catch (error) {
      console.error('Failed to fetch document:', error)
    }
  }

  const handleSave = async () => {
    if (!selectedDoc) return
    try {
      await documentApi.update(parseInt(id!), selectedDoc.id, {
        title: editTitle,
        content: editContent,
      })
      message.success('保存成功')
      setEditMode(false)
      fetchData()
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleCreateDoc = async (values: any) => {
    try {
      await documentApi.create(parseInt(id!), {
        title: values.title,
        parent_id: values.parent_id || 0,
        sort_order: values.sort_order || 0,
        content: values.content || '',
      })
      message.success('创建成功')
      setDocModalVisible(false)
      form.resetFields()
      fetchData()
    } catch (error) {
      console.error('Failed to create:', error)
    }
  }

  const handleDeleteDoc = async (docId: number) => {
    try {
      await documentApi.delete(parseInt(id!), docId)
      message.success('删除成功')
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null)
      }
      fetchData()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const renderMenuItems = (items: DocTreeItem[] | null | undefined): any[] => {
    if (!items || !Array.isArray(items)) {
      return []
    }
    return items.map((item) => ({
      key: item.id.toString(),
      icon: item.children && item.children.length > 0 ? <FolderOutlined /> : <FileTextOutlined />,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>{item.title}</span>
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                fetchDocument(item.id)
              }}
            />
            <Popconfirm
              title="确定要删除这个文档吗？"
              onConfirm={(e) => {
                e?.stopPropagation()
                handleDeleteDoc(item.id)
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        </div>
      ),
      children: item.children && item.children.length > 0 ? renderMenuItems(item.children) : undefined,
    }))
  }

  const menuItems = renderMenuItems(documentTree)

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a onClick={() => navigate('/projects')}>
            <ArrowLeftOutlined style={{ marginRight: 8 }} />项目管理
          </a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{project?.name || '项目详情'}</Breadcrumb.Item>
      </Breadcrumb>

      <Spin spinning={loading}>
        <Layout style={{ background: '#fff', borderRadius: 8 }}>
          <Sider
            width={320}
            theme="light"
            style={{ borderRight: '1px solid #f0f0f0' }}
          >
            <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>文档列表</h4>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setDocModalVisible(true)}
                >
                  新建文档
                </Button>
              </div>
            </div>
            <Menu
              mode="inline"
              selectedKeys={selectedDoc ? [selectedDoc.id.toString()] : []}
              items={menuItems}
              style={{ height: 'calc(100vh - 300px)', overflowY: 'auto' }}
              onClick={({ key }) => fetchDocument(parseInt(key))}
            />
          </Sider>
          <Content style={{ padding: 24, minHeight: 400 }}>
            {selectedDoc ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  {editMode ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{ fontSize: 20, fontWeight: 'bold' }}
                    />
                  ) : (
                    <h2 style={{ margin: 0 }}>{selectedDoc.title}</h2>
                  )}
                  <Space>
                    {editMode ? (
                      <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                        保存
                      </Button>
                    ) : (
                      <Button icon={<EditOutlined />} onClick={() => setEditMode(true)}>
                        编辑
                      </Button>
                    )}
                  </Space>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  {editMode ? (
                    <TextArea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={20}
                      placeholder="请输入文档内容（支持 Markdown）"
                    />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                      {selectedDoc.content || '暂无内容'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 100, color: '#8c8c8c' }}>
                <FileTextOutlined style={{ fontSize: 48 }} />
                <div style={{ marginTop: 16 }}>请选择或创建一个文档</div>
                <Button
                  type="primary"
                  style={{ marginTop: 16 }}
                  icon={<PlusOutlined />}
                  onClick={() => setDocModalVisible(true)}
                >
                  新建文档
                </Button>
              </div>
            )}
          </Content>
        </Layout>
      </Spin>

      <Modal
        title="新建文档"
        open={docModalVisible}
        onCancel={() => setDocModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateDoc}>
          <Form.Item
            name="title"
            label="文档标题"
            rules={[{ required: true, message: '请输入文档标题' }]}
          >
            <Input placeholder="请输入文档标题" />
          </Form.Item>
          <Form.Item name="parent_id" label="父级文档ID">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="留空则为根级文档" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
          </Form.Item>
          <Form.Item name="content" label="初始内容">
            <TextArea rows={6} placeholder="请输入文档初始内容" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setDocModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectDetail
