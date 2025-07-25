import { ModelProvider, ModelConfig, ModelConfigStore } from '../types/types'

// 预定义的模型提供商
export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    requiresAuth: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  {
    id: 'moonshot',
    name: 'moonshot',
    displayName: 'Moonshot AI',
    baseURL: 'https://api.moonshot.cn/v1',
    requiresAuth: true,
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  },
  {
    id: 'azure',
    name: 'azure',
    displayName: 'Azure OpenAI',
    baseURL: 'https://your-resource.openai.azure.com',
    requiresAuth: true,
    models: ['gpt-4', 'gpt-35-turbo']
  },
  {
    id: 'anyscale',
    name: 'anyscale',
    displayName: 'Anyscale',
    baseURL: 'https://api.endpoints.anyscale.com/v1',
    requiresAuth: true,
    models: ['meta-llama/Llama-2-7b-chat-hf', 'meta-llama/Llama-2-13b-chat-hf', 'mistralai/Mistral-7B-Instruct-v0.1']
  },
  {
    id: 'deepseek',
    name: 'deepseek',
    displayName: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    requiresAuth: true,
    models: ['deepseek-chat', 'deepseek-coder']
  },
  {
    id: 'zhipu',
    name: 'zhipu',
    displayName: '智谱AI',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    requiresAuth: true,
    models: ['glm-4', 'glm-4-0520', 'glm-3-turbo']
  }
]

export class ModelConfigService {
  private static readonly STORAGE_KEY = 'timesheet-agent-model-config'

  // 获取配置
  static getConfig(): ModelConfigStore {
    if (typeof window === 'undefined') {
      return {
        configs: {},
        activeProvider: 'openai'
      }
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('读取模型配置失败:', error)
    }

    return {
      configs: {},
      activeProvider: 'openai'
    }
  }

  // 保存配置
  static saveConfig(config: ModelConfigStore): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      console.error('保存模型配置失败:', error)
    }
  }

  // 更新模型配置
  static updateModelConfig(provider: string, config: ModelConfig): void {
    const store = this.getConfig()
    store.configs[provider] = config
    store.activeProvider = provider
    this.saveConfig(store)
  }

  // 获取当前激活的模型配置
  static getActiveConfig(): ModelConfig | null {
    const store = this.getConfig()
    const activeConfig = store.configs[store.activeProvider]
    return activeConfig || null
  }

  // 测试模型连通性
  static async testConnection(config: ModelConfig): Promise<{ success: boolean; message: string }> {
    try {
      // 先尝试 /models 请求
      try {
        const modelsResponse = await fetch(`${config.baseURL}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10秒超时
        })

        if (modelsResponse.ok) {
          const data = await modelsResponse.json()
          
          // 检查是否包含指定的模型
          if (data.data && Array.isArray(data.data)) {
            const hasModel = data.data.some((model: any) => 
              model.id === config.model || model.model === config.model
            )
            
            if (hasModel) {
              return {
                success: true,
                message: `连接成功，模型 ${config.model} 可用`
              }
            } else {
              return {
                success: false,
                message: `连接成功，但模型 ${config.model} 不可用`
              }
            }
          }

          return {
            success: true,
            message: '连接成功'
          }
        }
      } catch (modelsError) {
        console.log('/models 请求失败，尝试 /chat/completions 验证:', modelsError)
      }

      // 如果 /models 失败，尝试 /chat/completions 请求
      const chatResponse = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'user',
              content: 'test'
            }
          ],
          max_tokens: 1
        }),
        signal: AbortSignal.timeout(10000) // 10秒超时
      })

      if (chatResponse.ok) {
        return {
          success: true,
          message: `连接成功，模型 ${config.model} 可用`
        }
      } else if (chatResponse.status === 401) {
        return {
          success: false,
          message: 'API密钥无效，请检查配置'
        }
      } else if (chatResponse.status === 404) {
        return {
          success: false,
          message: `模型 ${config.model} 不存在或不可用`
        }
      } else {
        throw new Error(`HTTP ${chatResponse.status}: ${chatResponse.statusText}`)
      }

    } catch (error) {
      console.error('测试连接失败:', error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            message: '连接超时，请检查网络或baseURL'
          }
        }
        return {
          success: false,
          message: `连接失败: ${error.message}`
        }
      }
      
      return {
        success: false,
        message: '连接失败，请检查配置'
      }
    }
  }

  // 保存测试结果
  static saveTestResult(provider: string, success: boolean, message: string): void {
    const store = this.getConfig()
    store.lastTestResult = {
      provider,
      success,
      message,
      timestamp: new Date().toISOString()
    }
    this.saveConfig(store)
  }

  // 获取提供商信息
  static getProvider(id: string): ModelProvider | undefined {
    return MODEL_PROVIDERS.find(p => p.id === id)
  }
} 