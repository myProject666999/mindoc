import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Typography, List, Tag, Spin } from 'antd'
import {
  BookOutlined,
  FileTextOutlined,
  TeamOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useUserStore } from '@/stores/userStore'
import { projectApi } from '@/services/api'
import { Project } from '@/types'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

const Dashboard: React.FC = () => {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await projectApi.getList({ page: 1, page_size: 5 })
      setRecentProjects(result.list)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      title: '我的项目',
      value: 0,
      icon: <BookOutlined />,
      color: '#1890ff',
    },
    {
      title: '文档数量',
      value: 0,
      icon: <FileTextOutlined />,
      color: '#52c41a',
    },
    {
      title: '团队成员',
      value: 0,
      icon: <TeamOutlined />,
      color: '#722ed1',
    },
    {
      title: '评论数量',
      value: 0,
      icon: <MessageOutlined />,
      color: '#fa8c16',
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>欢迎回来，{user?.nickname || user?.username}</Title>
        <Text type="secondary">这是您的仪表板概览</Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: stat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 20,
                      }}
                    >
                      {stat.icon}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="最近项目" extra={<a onClick={() => navigate('/projects')}>查看全部</a>}>
              <List
                dataSource={recentProjects}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/projects/${item.id}`)}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          className="project-icon"
                          style={{ background: item.visibility === 1 ? '#1890ff' : '#fa8c16' }}
                        >
                          <BookOutlined />
                        </div>
                      }
                      title={
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.name}
                          <Tag className={item.visibility === 1 ? 'visibility-public' : 'visibility-private'}>
                            {item.visibility === 1 ? '公开' : '私有'}
                          </Tag>
                        </span>
                      }
                      description={item.description || '暂无描述'}
                    />
                  </List.Item>
                )}
                locale={{ emptyText: '暂无项目，点击右上角"查看全部"创建您的第一个项目' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="快速操作">
              <List>
                <List.Item>
                  <List.Item.Meta
                    avatar={<BookOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                    title={<a onClick={() => navigate('/projects')}>创建新项目</a>}
                    description="创建一个新的文档项目"
                  />
                </List.Item>
                <List.Item>
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
                    title={<a onClick={() => navigate('/projects')}>浏览项目</a>}
                    description="查看和管理所有项目"
                  />
                </List.Item>
                <List.Item>
                  <List.Item.Meta
                    avatar={<UserOutlined style={{ fontSize: 20, color: '#722ed1' }} />}
                    title={<a onClick={() => navigate('/profile')}>个人设置</a>}
                    description="编辑您的个人资料"
                  />
                </List.Item>
              </List>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}

export default Dashboard
