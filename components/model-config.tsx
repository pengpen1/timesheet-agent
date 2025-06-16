"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Settings, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { ModelConfigService, MODEL_PROVIDERS } from '@/lib/model-config'
import { ModelConfig, ModelProvider } from '@/lib/types'

export function ModelConfigPage() {
  const [selectedProvider, setSelectedProvider] = useState<string>('openai')
  const [config, setConfig] = useState<ModelConfig>({
    provider: 'openai',
    baseURL: '',
    apiKey: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2048
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    timestamp?: string
  } | null>(null)
  const [saved, setSaved] = useState(false)

  // 获取当前选择的提供商信息
  const currentProvider = MODEL_PROVIDERS.find(p => p.id === selectedProvider)

  // 加载配置
  useEffect(() => {
    const store = ModelConfigService.getConfig()
    setSelectedProvider(store.activeProvider)
    
    const existingConfig = store.configs[store.activeProvider]
    if (existingConfig) {
      setConfig(existingConfig)
    } else if (currentProvider) {
      setConfig({
        provider: currentProvider.id,
        baseURL: currentProvider.baseURL,
        apiKey: '',
        model: currentProvider.models[0] || '',
        temperature: 0.7,
        maxTokens: 2048
      })
    }

    if (store.lastTestResult) {
      setTestResult(store.lastTestResult)
    }
  }, [selectedProvider, currentProvider])

  // 切换提供商
  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId)
    const provider = MODEL_PROVIDERS.find(p => p.id === providerId)
    if (provider) {
      const store = ModelConfigService.getConfig()
      const existingConfig = store.configs[providerId]
      
      if (existingConfig) {
        setConfig(existingConfig)
      } else {
        setConfig({
          provider: providerId,
          baseURL: provider.baseURL,
          apiKey: '',
          model: provider.models[0] || '',
          temperature: 0.7,
          maxTokens: 2048
        })
      }
    }
    setTestResult(null)
    setSaved(false)
  }

  // 更新配置字段
  const updateConfig = (field: keyof ModelConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  // 保存配置
  const handleSave = () => {
    ModelConfigService.updateModelConfig(selectedProvider, config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 测试连接
  const handleTest = async () => {
    if (!config.apiKey || !config.baseURL) {
      setTestResult({
        success: false,
        message: '请填写完整的配置信息'
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const result = await ModelConfigService.testConnection(config)
      setTestResult({
        ...result,
        timestamp: new Date().toLocaleString()
      })
      ModelConfigService.saveTestResult(selectedProvider, result.success, result.message)
    } catch (error) {
      setTestResult({
        success: false,
        message: '测试失败，请检查网络连接',
        timestamp: new Date().toLocaleString()
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">模型配置</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI模型设置</CardTitle>
          <CardDescription>
            配置您的AI模型提供商，让TimesheetAgent真正运作起来
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 提供商选择 */}
          <div className="space-y-2">
            <Label htmlFor="provider">模型提供商</Label>
            <Select value={selectedProvider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择模型提供商" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <span>{provider.displayName}</span>
                      <Badge variant="outline" className="text-xs">
                        {provider.models.length} 模型
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentProvider && (
            <>
              {/* Base URL */}
              <div className="space-y-2">
                <Label htmlFor="baseURL">Base URL</Label>
                <Input
                  id="baseURL"
                  value={config.baseURL}
                  onChange={(e) => updateConfig('baseURL', e.target.value)}
                  placeholder={currentProvider.baseURL}
                />
                <p className="text-sm text-muted-foreground">
                  API端点地址，通常以 /v1 结尾
                </p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => updateConfig('apiKey', e.target.value)}
                  placeholder="请输入您的API密钥"
                />
                <p className="text-sm text-muted-foreground">
                  您的API密钥将安全存储在本地浏览器中
                </p>
              </div>

              {/* 模型选择 */}
              <div className="space-y-2">
                <Label htmlFor="model">模型名称</Label>
                <Select value={config.model} onValueChange={(value) => updateConfig('model', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProvider.models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 高级设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    控制输出随机性 (0.0-2.0)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="32000"
                    value={config.maxTokens}
                    onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    最大输出长度
                  </p>
                </div>
              </div>

              {/* 测试结果 */}
              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <div className="flex flex-col gap-1">
                      <span>{testResult.message}</span>
                      {testResult.timestamp && (
                        <span className="text-xs opacity-70">
                          测试时间: {testResult.timestamp}
                        </span>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleTest}
                  disabled={testing || !config.apiKey || !config.baseURL}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4" />
                      测试连通性
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={!config.apiKey || !config.baseURL}
                  className="flex items-center gap-2"
                >
                  {saved ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      已保存
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4" />
                      保存配置
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 帮助信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">如何获取API密钥？</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline">OpenAI</Badge>
              <div className="text-sm">
                <p>访问 <code className="bg-muted px-1 rounded">platform.openai.com</code> → API Keys → Create new secret key</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">Moonshot</Badge>
              <div className="text-sm">
                <p>访问 <code className="bg-muted px-1 rounded">platform.moonshot.cn</code> → 控制台 → API Keys</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">智谱AI</Badge>
              <div className="text-sm">
                <p>访问 <code className="bg-muted px-1 rounded">open.bigmodel.cn</code> → API管理 → 创建API Key</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 