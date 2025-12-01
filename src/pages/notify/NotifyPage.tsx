import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifyApi, NotifyChannel } from '@/api/notify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import {
  Bell,
  Plus,
  RefreshCw,
  Trash2,
  Settings,
  Send,
  MessageSquare,
  Mail,
  Webhook,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'

const channelTypeIcons: Record<string, React.ReactNode> = {
  dingtalk: <MessageSquare className="h-4 w-4 text-blue-500" />,
  feishu: <MessageSquare className="h-4 w-4 text-purple-500" />,
  wechat: <MessageSquare className="h-4 w-4 text-green-500" />,
  email: <Mail className="h-4 w-4 text-orange-500" />,
  webhook: <Webhook className="h-4 w-4 text-gray-500" />,
}

const channelTypeLabels: Record<string, string> = {
  dingtalk: '钉钉',
  feishu: '飞书',
  wechat: '企业微信',
  email: '邮件',
  webhook: 'WebHook',
}

export default function NotifyPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('channels')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  
  // 新建渠道表单
  const [newChannel, setNewChannel] = useState({
    name: '',
    type: 'dingtalk' as NotifyChannel['type'],
    webhook: '',
    secret: '',
  })

  // 获取渠道列表
  const { data: channelsData, isLoading: channelsLoading, refetch: refetchChannels } = useQuery({
    queryKey: ['notify-channels'],
    queryFn: notifyApi.getChannels,
  })

  // 获取通知历史
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['notify-history', historyPage],
    queryFn: () => notifyApi.getHistory({ page: historyPage, pageSize: 10 }),
    enabled: activeTab === 'history',
  })

  // 创建渠道
  const createMutation = useMutation({
    mutationFn: notifyApi.createChannel,
    onSuccess: () => {
      toast({ title: '创建成功' })
      queryClient.invalidateQueries({ queryKey: ['notify-channels'] })
      setShowAddDialog(false)
      setNewChannel({ name: '', type: 'dingtalk', webhook: '', secret: '' })
    },
    onError: () => {
      toast({ title: '创建失败', variant: 'destructive' })
    },
  })

  // 删除渠道
  const deleteMutation = useMutation({
    mutationFn: notifyApi.deleteChannel,
    onSuccess: () => {
      toast({ title: '删除成功' })
      queryClient.invalidateQueries({ queryKey: ['notify-channels'] })
    },
  })

  // 切换渠道状态
  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      notifyApi.toggleChannel(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notify-channels'] })
    },
  })

  // 测试渠道
  const testMutation = useMutation({
    mutationFn: notifyApi.testChannel,
    onSuccess: (res) => {
      if (res.data?.success) {
        toast({ title: '测试成功', description: '通知已发送' })
      } else {
        toast({ title: '测试失败', description: res.data?.message, variant: 'destructive' })
      }
    },
    onError: () => {
      toast({ title: '测试失败', variant: 'destructive' })
    },
  })

  const channels = channelsData?.data?.list || []
  const history = historyData?.data?.list || []
  const historyTotal = historyData?.data?.total || 0
  const historyTotalPages = Math.ceil(historyTotal / 10)

  const handleCreate = () => {
    if (!newChannel.name || !newChannel.webhook) {
      toast({ title: '请填写完整信息', variant: 'destructive' })
      return
    }
    
    const config: Record<string, unknown> = { webhook: newChannel.webhook }
    if (newChannel.secret) {
      config.secret = newChannel.secret
    }
    
    createMutation.mutate({
      name: newChannel.name,
      type: newChannel.type,
      config: config as unknown as NotifyChannel['config'],
      enabled: true,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />已发送</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />失败</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />待发送</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">通知管理</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchChannels()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加渠道
          </Button>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="channels">通知渠道</TabsTrigger>
          <TabsTrigger value="history">发送历史</TabsTrigger>
        </TabsList>

        {/* 渠道列表 */}
        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channelsLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : channels.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                暂无通知渠道，点击"添加渠道"创建
              </div>
            ) : (
              channels.map((channel) => (
                <Card key={channel.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {channelTypeIcons[channel.type]}
                        <CardTitle className="text-base">{channel.name}</CardTitle>
                      </div>
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: channel.id, enabled: checked })
                        }
                      />
                    </div>
                    <CardDescription>
                      {channelTypeLabels[channel.type]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        创建于 {formatDate(channel.createdAt)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => testMutation.mutate(channel.id)}
                          disabled={testMutation.isPending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="设置"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(channel.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* 发送历史 */}
        <TabsContent value="history">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>渠道</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>级别</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>发送时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      暂无发送记录
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>{msg.channelName}</TableCell>
                      <TableCell className="max-w-xs truncate">{msg.title}</TableCell>
                      <TableCell>
                        <Badge variant={msg.level === 'error' ? 'destructive' : 'outline'}>
                          {msg.level}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(msg.status)}</TableCell>
                      <TableCell>{formatDate(msg.sentAt || msg.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {historyTotalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={historyPage === 1}
                onClick={() => setHistoryPage(historyPage - 1)}
              >
                上一页
              </Button>
              <span className="py-2 px-4 text-sm">
                {historyPage} / {historyTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={historyPage === historyTotalPages}
                onClick={() => setHistoryPage(historyPage + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 添加渠道对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加通知渠道</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>渠道名称</Label>
              <Input
                placeholder="输入渠道名称"
                value={newChannel.name}
                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>渠道类型</Label>
              <Select
                value={newChannel.type}
                onValueChange={(value) => setNewChannel({ ...newChannel, type: value as NotifyChannel['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dingtalk">钉钉</SelectItem>
                  <SelectItem value="feishu">飞书</SelectItem>
                  <SelectItem value="wechat">企业微信</SelectItem>
                  <SelectItem value="email">邮件</SelectItem>
                  <SelectItem value="webhook">WebHook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Webhook 地址</Label>
              <Input
                placeholder="输入 Webhook URL"
                value={newChannel.webhook}
                onChange={(e) => setNewChannel({ ...newChannel, webhook: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>签名密钥 (可选)</Label>
              <Input
                placeholder="输入签名密钥"
                value={newChannel.secret}
                onChange={(e) => setNewChannel({ ...newChannel, secret: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
