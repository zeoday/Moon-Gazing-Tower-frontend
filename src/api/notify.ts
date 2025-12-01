import api, { ApiResponse } from '@/lib/api'

// 通知渠道类型
export interface NotifyChannel {
  id: string
  name: string
  type: 'dingtalk' | 'feishu' | 'wechat' | 'email' | 'webhook'
  enabled: boolean
  config: DingTalkConfig | FeishuConfig | WechatConfig | EmailConfig | WebhookConfig
  createdAt: string
  updatedAt: string
}

export interface DingTalkConfig {
  webhook: string
  secret?: string
  keywords?: string[]
}

export interface FeishuConfig {
  webhook: string
  secret?: string
}

export interface WechatConfig {
  webhook: string
}

export interface EmailConfig {
  host: string
  port: number
  username: string
  password: string
  from: string
  to: string[]
  ssl: boolean
}

export interface WebhookConfig {
  url: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  secret?: string
}

// 通知消息
export interface NotifyMessage {
  id: string
  channelId: string
  channelName: string
  title: string
  content: string
  level: 'info' | 'warning' | 'error' | 'success'
  status: 'pending' | 'sent' | 'failed'
  error?: string
  createdAt: string
  sentAt?: string
}

// 通知类型
export interface NotifyType {
  id: string
  name: string
  description: string
}

export const notifyApi = {
  // 获取通知渠道列表
  getChannels: (): Promise<ApiResponse<{ list: NotifyChannel[]; total: number }>> =>
    api.get('/notify/channels'),

  // 获取单个渠道
  getChannel: (id: string): Promise<ApiResponse<NotifyChannel>> =>
    api.get(`/notify/channels/${id}`),

  // 创建渠道
  createChannel: (data: Partial<NotifyChannel>): Promise<ApiResponse<NotifyChannel>> =>
    api.post('/notify/channels', data),

  // 更新渠道
  updateChannel: (id: string, data: Partial<NotifyChannel>): Promise<ApiResponse<NotifyChannel>> =>
    api.put(`/notify/channels/${id}`, data),

  // 删除渠道
  deleteChannel: (id: string): Promise<ApiResponse<null>> =>
    api.delete(`/notify/channels/${id}`),

  // 测试渠道
  testChannel: (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    api.post(`/notify/channels/${id}/test`),

  // 切换渠道状态
  toggleChannel: (id: string, enabled: boolean): Promise<ApiResponse<null>> =>
    api.put(`/notify/channels/${id}/toggle`, { enabled }),

  // 获取通知历史
  getHistory: (params: { page: number; pageSize: number; channelId?: string; status?: string }): Promise<ApiResponse<{ list: NotifyMessage[]; total: number }>> =>
    api.get('/notify/history', { params }),

  // 获取通知类型
  getTypes: (): Promise<ApiResponse<NotifyType[]>> =>
    api.get('/notify/types'),

  // 发送测试通知
  sendTest: (data: { channelId: string; title: string; content: string; level: string }): Promise<ApiResponse<null>> =>
    api.post('/notify/send', data),
}
