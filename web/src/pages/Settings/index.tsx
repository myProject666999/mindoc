import React, { useEffect, useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  message,
  Typography,
  Tabs,
  Divider,
  Descriptions,
} from 'antd'
import { configApi } from '@/services/api'
import { SiteConfig } from '@/types'

const { Title, Text } = Typography
const { TabPane } = Tabs

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [languages, setLanguages] = useState<{ code: string; name: string }[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    fetchConfig()
    fetchLanguages()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const data = await configApi.getSiteConfig()
      setConfig(data)
      form.setFieldsValue(data)
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLanguages = async () => {
    try {
      const data = await configApi.getLanguages()
      setLanguages(data)
    } catch (error) {
      console.error('Failed to fetch languages:', error)
    }
  }

  const handleSave = async (values: any) => {
    setSaving(true)
    try {
      await configApi.updateSiteConfig({
        name: values.name,
        language: values.language,
        anonymous_access: values.anonymous_access,
        enable_captcha: values.enable_captcha,
      })
      message.success('配置保存成功')
      fetchConfig()
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>站点配置</Title>
        <Text type="secondary">管理系统全局配置</Text>
      </div>

      <Tabs defaultActiveKey="basic">
        <TabPane tab="基本配置" key="basic">
          <Card loading={loading}>
            <Descriptions bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="站点名称">{config?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前语言">
                {languages.find((l) => l.code === config?.language)?.name || config?.language || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="匿名注册">
                {config?.anonymous_access ? (
                  <span style={{ color: '#52c41a' }}>已开启</span>
                ) : (
                  <span style={{ color: '#ff4d4f' }}>已关闭</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="验证码">
                {config?.enable_captcha ? (
                  <span style={{ color: '#52c41a' }}>已开启</span>
                ) : (
                  <span style={{ color: '#ff4d4f' }}>已关闭</span>
                )}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              style={{ maxWidth: 600 }}
            >
              <Form.Item
                name="name"
                label="站点名称"
                rules={[{ required: true, message: '请输入站点名称' }]}
              >
                <Input placeholder="请输入站点名称" />
              </Form.Item>
              <Form.Item name="language" label="默认语言">
                <Select placeholder="请选择语言">
                  {languages.map((lang) => (
                    <Select.Option key={lang.code} value={lang.code}>
                      {lang.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="anonymous_access"
                label="匿名注册"
                valuePropName="checked"
                extra="开启后允许用户自行注册账户"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="enable_captcha"
                label="验证码"
                valuePropName="checked"
                extra="开启后登录和注册需要验证码验证"
              >
                <Switch />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={saving}>
                  保存配置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="关于系统" key="about">
          <Card>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="系统名称">MinDoc 在线文档管理系统</Descriptions.Item>
              <Descriptions.Item label="版本">1.0.0</Descriptions.Item>
              <Descriptions.Item label="技术栈">
                <div>
                  <div>后端: Golang + Gin + GORM</div>
                  <div>前端: React + TypeScript + Ant Design</div>
                  <div>数据库: SQLite / MySQL</div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="功能特性">
                <div>
                  <div>✓ 项目管理（创建、编辑、成员管理、排序）</div>
                  <div>✓ 文档管理（Markdown 支持）</div>
                  <div>✓ 评论管理</div>
                  <div>✓ 用户管理（添加、禁用、角色分配）</div>
                  <div>✓ 权限管理（角色、权限分配）</div>
                  <div>✓ 项目加密（公开/私有、Token 访问）</div>
                  <div>✓ 站点配置（多语言、匿名访问、验证码）</div>
                </div>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Settings
