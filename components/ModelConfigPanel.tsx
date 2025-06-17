import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ModelConfigService,
  MODEL_PROVIDERS as BASE_MODEL_PROVIDERS,
} from "@/lib/model-config";
import { ModelConfig } from "@/types/types";
import {
  Settings,
  Wifi,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import React, { useState, useEffect } from "react";

// 增加更多主流大模型提供商
const EXTRA_MODEL_PROVIDERS = [
  {
    id: "gemini",
    name: "gemini",
    displayName: "Google Gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    requiresAuth: true,
    models: ["gemini-pro", "gemini-1.5-pro", "gemini-ultra"],
  },
  {
    id: "wenxin",
    name: "wenxin",
    displayName: "百度文心一言",
    baseURL: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop",
    requiresAuth: true,
    models: ["ernie-bot", "ernie-bot-turbo", "ernie-bot-4.0"],
  },
  {
    id: "qwen",
    name: "qwen",
    displayName: "阿里通义千问",
    baseURL:
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    requiresAuth: true,
    models: ["qwen-turbo", "qwen-plus", "qwen-max"],
  },
  {
    id: "minimax",
    name: "minimax",
    displayName: "MiniMax",
    baseURL: "https://api.minimax.chat/v1",
    requiresAuth: true,
    models: ["abab5.5-chat", "abab6-chat"],
  },
  {
    id: "spark",
    name: "spark",
    displayName: "讯飞星火",
    baseURL: "https://spark-api.xf-yun.com/v1.1/chat",
    requiresAuth: true,
    models: ["spark-v3.5", "spark-v3.1"],
  },
  {
    id: "baichuan",
    name: "baichuan",
    displayName: "百川大模型",
    baseURL: "https://api.baichuan-ai.com/v1/chat",
    requiresAuth: true,
    models: ["Baichuan2-Turbo", "Baichuan2-53B"],
  },
];
const MODEL_PROVIDERS = [...BASE_MODEL_PROVIDERS, ...EXTRA_MODEL_PROVIDERS];

export const ModelConfigPanel: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    // 初始化时读取本地存储的 activeProvider
    if (typeof window !== "undefined") {
      try {
        const store = ModelConfigService.getConfig();
        return store.activeProvider || "openai";
      } catch {
        return "openai";
      }
    }
    return "openai";
  });
  const [config, setConfig] = useState<ModelConfig>({
    provider: "openai",
    baseURL: "",
    apiKey: "",
    model: "",
    temperature: 0.7,
    maxTokens: 20000,
    top_p: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);

  const currentProvider = MODEL_PROVIDERS.find(
    (p) => p.id === selectedProvider
  );

  // 只在首次挂载时初始化 config
  useEffect(() => {
    const store = ModelConfigService.getConfig();
    const existingConfig = store.configs[selectedProvider];
    if (existingConfig) {
      setConfig({
        ...existingConfig,
        top_p: existingConfig.top_p ?? 1,
        presence_penalty: existingConfig.presence_penalty ?? 0,
        frequency_penalty: existingConfig.frequency_penalty ?? 0,
      });
    } else {
      const provider = MODEL_PROVIDERS.find((p) => p.id === selectedProvider);
      if (provider) {
        setConfig({
          provider: provider.id,
          baseURL: provider.baseURL,
          apiKey: "",
          model: provider.models[0] || "",
          temperature: 0.7,
          maxTokens: 20000,
          top_p: 1,
          presence_penalty: 0,
          frequency_penalty: 0,
        });
      }
    }
    if (store.lastTestResult) {
      setTestResult(store.lastTestResult);
    }
    // eslint-disable-next-line
  }, []);

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = MODEL_PROVIDERS.find((p) => p.id === providerId);
    if (provider) {
      const store = ModelConfigService.getConfig();
      const existingConfig = store.configs[providerId];
      if (existingConfig) {
        setConfig({
          ...existingConfig,
          top_p: existingConfig.top_p ?? 1,
          presence_penalty: existingConfig.presence_penalty ?? 0,
          frequency_penalty: existingConfig.frequency_penalty ?? 0,
        });
      } else {
        setConfig({
          provider: providerId,
          baseURL: provider.baseURL,
          apiKey: "",
          model: provider.models[0] || "",
          temperature: 0.7,
          maxTokens: 20000,
          top_p: 1,
          presence_penalty: 0,
          frequency_penalty: 0,
        });
      }
    }
    setTestResult(null);
    setSaved(false);
  };

  const updateConfig = (field: keyof ModelConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    ModelConfigService.updateModelConfig(selectedProvider, config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!config.apiKey || !config.baseURL) {
      setTestResult({
        success: false,
        message: "请填写完整的配置信息",
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await ModelConfigService.testConnection(config);
      setTestResult({ ...result, timestamp: new Date().toLocaleString() });
      ModelConfigService.saveTestResult(
        selectedProvider,
        result.success,
        result.message
      );
    } catch (error) {
      setTestResult({
        success: false,
        message: "测试失败，请检查网络连接",
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setTesting(false);
    }
  };

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
            <Select
              value={selectedProvider}
              onValueChange={handleProviderChange}
            >
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
                  onChange={(e) => updateConfig("baseURL", e.target.value)}
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
                  onChange={(e) => updateConfig("apiKey", e.target.value)}
                  placeholder="请输入您的API密钥"
                />
                <p className="text-sm text-muted-foreground">
                  您的API密钥将安全存储在本地浏览器中
                </p>
              </div>
              {/* 模型选择/输入 */}
              <div className="space-y-2">
                <Label htmlFor="model">模型名称/ID</Label>
                <Input
                  id="model"
                  value={config.model}
                  onChange={(e) => updateConfig("model", e.target.value)}
                  placeholder={currentProvider.models[0] || "请输入模型ID"}
                />
                <div className="flex flex-wrap gap-2 mt-1">
                  {currentProvider.models.map((model) => (
                    <Button
                      key={model}
                      size="sm"
                      variant={config.model === model ? "default" : "outline"}
                      onClick={() => updateConfig("model", model)}
                    >
                      {model}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  可手动输入或点击下方推荐模型ID
                </p>
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
                    <>保存</>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 高级设置Card */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">高级参数设置（可选）</CardTitle>
          <CardDescription>
            适用于进阶用户，调整生成效果，绑定于上方模型设置，设置修改后请点击上方"保存"按钮生效
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature 随机性</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) =>
                  updateConfig("temperature", parseFloat(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                控制输出随机性 (0.0-2.0)。数值越高，回复越发散。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens 最大长度</Label>
              <Input
                id="maxTokens"
                type="number"
                min="1"
                max="32000"
                value={config.maxTokens}
                onChange={(e) =>
                  updateConfig("maxTokens", parseInt(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                最大输出长度，越大回复越长，消耗也越多。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="top_p">Top P 采样概率</Label>
              <Input
                id="top_p"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={config.top_p}
                onChange={(e) =>
                  updateConfig("top_p", parseFloat(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                采样概率阈值 (0-1)，与Temperature互斥，建议二选一调整。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="presence_penalty">
                Presence Penalty 新话题惩罚
              </Label>
              <Input
                id="presence_penalty"
                type="number"
                min="-2"
                max="2"
                step="0.01"
                value={config.presence_penalty}
                onChange={(e) =>
                  updateConfig("presence_penalty", parseFloat(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                提升新话题概率，-2~2，越高越鼓励新内容。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency_penalty">
                Frequency Penalty 重复惩罚
              </Label>
              <Input
                id="frequency_penalty"
                type="number"
                min="-2"
                max="2"
                step="0.01"
                value={config.frequency_penalty}
                onChange={(e) =>
                  updateConfig("frequency_penalty", parseFloat(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                降低重复内容概率，-2~2，越高越不重复。
              </p>
            </div>
          </div>
          <div className="space-y-2 mt-6">
            <Label htmlFor="rules">系统级Prompt（定制规则，可选）</Label>
            <textarea
              id="rules"
              className="w-full min-h-[64px] rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={config.rules || ""}
              onChange={e => updateConfig("rules", e.target.value)}
              placeholder="自定义AI输出风格、格式等，如：工作内容返回格式为 【项目】完成***功能"
            />
            <p className="text-xs text-muted-foreground">可输入系统级提示词，定制AI输出风格和内容</p>
          </div>
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
                <p>
                  访问{" "}
                  <code className="bg-muted px-1 rounded">
                    platform.openai.com
                  </code>{" "}
                  → API Keys → Create new secret key
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">Moonshot</Badge>
              <div className="text-sm">
                <p>
                  访问{" "}
                  <code className="bg-muted px-1 rounded">
                    platform.moonshot.cn
                  </code>{" "}
                  → 控制台 → API Keys
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">智谱AI</Badge>
              <div className="text-sm">
                <p>
                  访问{" "}
                  <code className="bg-muted px-1 rounded">
                    open.bigmodel.cn
                  </code>{" "}
                  → API管理 → 创建API Key
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
