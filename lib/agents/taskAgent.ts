// {{CHENGQI:
// Action: Added; Timestamp: 2025-06-16 11:20:34 +08:00; Reason: P2-AGENT-001 实现TaskAgent核心逻辑; Principle_Applied: SOLID-S(单一职责原则);
// }}

import { Task, WorkDay, TaskAgentInput, TaskAgentOutput } from '../../types/types'
import { format, differenceInDays } from 'date-fns'
import { ModelConfigService } from '../model-config'

/**
 * TaskAgent - 任务分解与分配智能代理
 * 职责：将任务列表分配到工作日中，支持多种分配策略
 */
export class TaskAgent {
  /**
   * 主要处理方法：根据输入参数分配任务
   */
  static async process(input: TaskAgentInput): Promise<TaskAgentOutput> {
    const { tasks, workDays, distributionMode } = input
    
    // 验证输入
    this.validateInput(input)
    
    // 过滤出工作日
    const validWorkDays = workDays.filter(day => day.isWorkday && !day.isHoliday)
    
    // 尝试使用AI进行智能分配
    const modelConfig = ModelConfigService.getActiveConfig()
    if (modelConfig && modelConfig.apiKey) {
      try {
        console.log('使用AI进行智能工时分配...')
        const aiResult = await this.distributeWithAI(tasks, validWorkDays, distributionMode, modelConfig)
        if (aiResult) {
          console.log('AI分配成功，跳过传统分配策略')
          // 仍然使用AI增强工作描述
          try {
            return await this.enhanceWithAI(aiResult, tasks)
          } catch (error) {
            console.warn('AI描述增强失败，使用AI分配结果:', error)
            return aiResult
          }
        }
      } catch (error) {
        console.warn('AI分配失败，使用传统分配策略:', error)
      }
    }
    // 根据分配模式执行不同策略
    let result: TaskAgentOutput
    switch (distributionMode) {
      case 'daily':
        result = this.distributeByDaily(tasks, validWorkDays)
        break
      case 'priority':
        result = this.distributeByPriority(tasks, validWorkDays)
        break
      case 'feature':
        result = this.distributeByFeature(tasks, validWorkDays)
        break
      default:
        result = this.distributeByDaily(tasks, validWorkDays)
    }

    // 使用AI生成更智能的工作描述
    try {
      result = await this.enhanceWithAI(result, tasks)
    } catch (error) {
      console.warn('AI增强失败，使用默认描述:', error)
    }

    return result
  }

  /**
   * 使用AI增强工作描述
   */
  private static async enhanceWithAI(result: TaskAgentOutput, originalTasks: Task[]): Promise<TaskAgentOutput> {
    const modelConfig = ModelConfigService.getActiveConfig()
    
    if (!modelConfig || !modelConfig.apiKey) {
      console.log('未配置AI模型，使用默认工作描述')
      return result
    }

    try {
      // 构建提示词
      const prompt = this.buildPrompt(result, originalTasks)
      // 构建 system prompt
      let systemPrompt = '你是一个专业的工时管理助手，擅长生成简洁、专业的工作内容描述。请根据任务信息生成符合企业工时表标准的工作描述。\n\n特别注意：\n1. 如果任务包含Git提交记录，请参考具体的提交信息生成更准确的工作描述\n2. 如果任务包含附件内容，请结合附件信息优化描述的专业性\n3. 对于图片附件，请根据文件名和上下文推测工作内容\n4. 参考信息任务(0小时)不应出现在最终工时分配中\n5. 生成的描述要体现实际技术工作内容';
      if (modelConfig.rules && modelConfig.rules.trim()) {
        systemPrompt = systemPrompt + '\n' + modelConfig.rules.trim();
      }
      // 智能参数适配
      const provider = modelConfig.provider;
      // 支持全部参数的主流大模型
      const fullSupportProviders = [
        'openai', 'moonshot', 'azure', 'anyscale', 'deepseek', 'zhipu', 'baichuan', 'minimax', 'spark', 'qwen'
      ];
      // 只支持基础参数的模型
      const basicSupportProviders = ['gemini', 'wenxin'];
      // 构建请求体
      const requestBody: any = {
        model: modelConfig.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: modelConfig.temperature ?? 0.7,
        max_tokens: modelConfig.maxTokens ?? 20000,
      };
      if (fullSupportProviders.includes(provider)) {
        if (typeof modelConfig.top_p === 'number') requestBody.top_p = modelConfig.top_p;
        if (typeof modelConfig.presence_penalty === 'number') requestBody.presence_penalty = modelConfig.presence_penalty;
        if (typeof modelConfig.frequency_penalty === 'number') requestBody.frequency_penalty = modelConfig.frequency_penalty;
      }
      // 调用AI模型
      const response = await fetch(`${modelConfig.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${modelConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`AI API调用失败: ${response.status}`)
      }

      const data = await response.json()
      // 多格式兼容
      let aiResponse = '';
      // 1. OpenAI Chat Completions 格式
      if (data.choices?.[0]?.message?.content) {
        aiResponse = data.choices[0].message.content;
      }
      // 2. Gemini (Google) 格式
      else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiResponse = data.candidates[0].content.parts[0].text;
      }
      // 3. 百度文心一言 result 字段
      else if (typeof data.result === 'string') {
        aiResponse = data.result;
      }
      // 4. 通义千问 output.text
      else if (typeof data.output?.text === 'string') {
        aiResponse = data.output.text;
      }
      // 5. 百川/讯飞/Minimax 等 output[0].content[0].text
      else if (Array.isArray(data.output) && data.output[0]?.content?.[0]?.text) {
        aiResponse = data.output[0].content[0].text;
      }
      // 6. /v1/responses 格式
      else if (Array.isArray(data.output) && data.output[0]?.text) {
        aiResponse = data.output[0].text;
      }

      if (aiResponse && typeof aiResponse === 'string' && aiResponse.trim()) {
        return this.parseAIResponse(result, aiResponse)
      } else {
        throw new Error('AI返回格式错误')
      }
    } catch (error) {
      console.error('AI增强失败:', error)
      return result
    }
  }

  /**
   * 构建AI提示词
   */
  private static buildPrompt(result: TaskAgentOutput, originalTasks: Task[]): string {
    // 构建增强的任务信息，包含源数据详情
    const taskSummary = originalTasks.map(task => {
      let taskInfo = `- ${task.name} (${task.totalHours}h, 优先级: ${task.priority}`;
      
      if (task.description) {
        taskInfo += `, 描述: ${task.description}`;
      }
      
      // 根据任务来源添加详细信息
      if (task.source && task.sourceData) {
        switch (task.source) {
          case 'gitlog':
            if (task.sourceData.gitCommits && task.sourceData.gitCommits.length > 0) {
              taskInfo += `\n  Git提交详情:`;
              task.sourceData.gitCommits.forEach(commit => {
                taskInfo += `\n    - ${commit.hash.substring(0, 7)}: ${commit.message} (${commit.author}, ${new Date(commit.date).toLocaleDateString()})`;
              });
            } else if (task.sourceData.rawContent) {
              taskInfo += `\n  Git日志内容:\n${task.sourceData.rawContent.split('\n').map(line => `    ${line}`).join('\n')}`;
            }
            break;
            
          case 'attachment':
            if (task.sourceData.rawContent) {
              // 检查是否是图片类型
              const isImage = task.sourceData.rawContent.startsWith('data:image/') || 
                            task.sourceData.fileType === 'image' ||
                            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(task.name);
              
              if (isImage) {
                taskInfo += `\n  附件信息: 图片文件 - ${task.name}`;
                taskInfo += `\n  注意: 图片内容无法直接读取，请根据文件名和上下文推测工作内容`;
              } else {
                // 文本类型附件，包含详细内容
                const content = task.sourceData.rawContent;
                if (content.length > 500) {
                  taskInfo += `\n  附件内容摘要:\n${content.substring(0, 500).split('\n').map(line => `    ${line}`).join('\n')}...`;
                } else {
                  taskInfo += `\n  附件内容:\n${content.split('\n').map(line => `    ${line}`).join('\n')}`;
                }
              }
            }
            break;
            
          case 'manual':
          default:
            // 手动任务不需要额外信息
            break;
        }
      }
      
      taskInfo += ')';
      return taskInfo;
    }).join('\n\n');

    const assignmentSummary = result.dailyAssignments.map(day => 
      `${day.date}: ${day.tasks.map(t => `${t.taskName}(${t.allocatedHours}h)`).join(', ')}`
    ).join('\n')

    // 检查是否有参考信息
    const hasGitReference = originalTasks.some(task => task.source === 'gitlog');
    const hasAttachmentReference = originalTasks.some(task => task.source === 'attachment');
    
    let additionalInstructions = '';
    if (hasGitReference || hasAttachmentReference) {
      additionalInstructions += '\n\n参考信息使用说明：';
      if (hasGitReference) {
        additionalInstructions += '\n- 包含Git提交记录，请参考提交信息生成更准确的工作描述';
      }
      if (hasAttachmentReference) {
        additionalInstructions += '\n- 包含附件内容，请结合附件信息优化工作描述的专业性和准确性';
      }
    }

    return `
任务列表:
${taskSummary}

工时分配:
${assignmentSummary}

请为每一天的每个任务生成简洁、专业的工作内容描述，要求：
1. 描述要具体且专业
2. 体现实际工作内容
3. 符合软件开发工时表标准
4. 每个描述不超过30字
5. 充分利用提供的Git提交记录和附件信息
6. 参考信息会统一处理成0小时任务，${additionalInstructions}

请按以下JSON格式返回：
{
  "assignments": [
    {
      "date": "2024-01-01",
      "tasks": [
        {
          "taskName": "任务名称",
          "workDescription": "具体工作描述"
        }
      ]
    }
  ]
}
`
  }

  /**
   * 解析AI响应
   */
  private static parseAIResponse(result: TaskAgentOutput, aiResponse: string): TaskAgentOutput {
    try {
      // 提取JSON部分
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到JSON格式的响应')
      }

      const aiData = JSON.parse(jsonMatch[0])
      
      if (!aiData.assignments || !Array.isArray(aiData.assignments)) {
        throw new Error('AI响应格式错误')
      }

      // 更新工作描述
      const enhancedAssignments = result.dailyAssignments.map(assignment => {
        const aiAssignment = aiData.assignments.find((ai: any) => ai.date === assignment.date)
        
        if (aiAssignment && aiAssignment.tasks) {
          const enhancedTasks = assignment.tasks.map(task => {
            const aiTask = aiAssignment.tasks.find((ai: any) => ai.taskName === task.taskName)
            if (aiTask && aiTask.workDescription) {
              return {
                ...task,
                workDescription: aiTask.workDescription
              }
            }
            return task
          })
          
          return {
            ...assignment,
            tasks: enhancedTasks
          }
        }
        
        return assignment
      })

      return {
        dailyAssignments: enhancedAssignments
      }
    } catch (error) {
      console.error('解析AI响应失败:', error)
      return result
    }
  }

  /**
   * 输入验证
   */
  private static validateInput(input: TaskAgentInput): void {
    if (!input.tasks || input.tasks.length === 0) {
      throw new Error('任务列表不能为空')
    }
    
    if (!input.workDays || input.workDays.length === 0) {
      throw new Error('工作日列表不能为空')
    }
    
    const totalHours = input.tasks.reduce((sum, task) => sum + task.totalHours, 0)
    const availableHours = input.workDays
      .filter(day => day.isWorkday && !day.isHoliday)
      .reduce((sum, day) => sum + day.plannedHours, 0)
    
    if (totalHours > availableHours) {
      console.warn(`任务总工时(${totalHours}h)超过可用工时(${availableHours}h)`)
    }
  }

  /**
   * 按日均分策略
   */
  private static distributeByDaily(tasks: Task[], workDays: WorkDay[]): TaskAgentOutput {
    const totalTaskHours = tasks.reduce((sum, task) => sum + task.totalHours, 0)
    const totalWorkingDays = workDays.length
    const averageHoursPerDay = totalTaskHours / totalWorkingDays

    const dailyAssignments = workDays.map((workDay) => {
      const dayHours = Math.min(averageHoursPerDay, workDay.plannedHours)
      
      // 按比例分配各任务
      const dayTasks = tasks.map(task => {
        const taskRatio = task.totalHours / totalTaskHours
        const allocatedHours = Math.round((dayHours * taskRatio) * 100) / 100
        
        return {
          taskId: task.id,
          taskName: task.name,
          allocatedHours,
          workDescription: this.generateWorkDescription(task, allocatedHours)
        }
      }).filter(t => t.allocatedHours > 0)

      return {
        date: workDay.date,
        tasks: dayTasks,
        totalHours: dayTasks.reduce((sum, t) => sum + t.allocatedHours, 0)
      }
    })

    return { dailyAssignments }
  }

  /**
   * 按优先级策略
   */
  private static distributeByPriority(tasks: Task[], workDays: WorkDay[]): TaskAgentOutput {
    // 按优先级排序任务
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const sortedTasks = [...tasks].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    
    const dailyAssignments = []
    let remainingTasks = [...sortedTasks]
    
    for (const workDay of workDays) {
      const dayTasks = []
      let remainingDayHours = workDay.plannedHours
      
      // 优先分配高优先级任务
      for (let i = 0; i < remainingTasks.length && remainingDayHours > 0; i++) {
        const task = remainingTasks[i]
        const allocatedHours = Math.min(task.totalHours, remainingDayHours)
        
        if (allocatedHours > 0) {
          dayTasks.push({
            taskId: task.id,
            taskName: task.name,
            allocatedHours,
            workDescription: this.generateWorkDescription(task, allocatedHours)
          })
          
          remainingDayHours -= allocatedHours
          task.totalHours -= allocatedHours
          
          // 如果任务完成，从列表中移除
          if (task.totalHours <= 0) {
            remainingTasks.splice(i, 1)
            i-- // 调整索引
          }
        }
      }
      
      dailyAssignments.push({
        date: workDay.date,
        tasks: dayTasks,
        totalHours: dayTasks.reduce((sum, t) => sum + t.allocatedHours, 0)
      })
    }

    return { dailyAssignments }
  }

  /**
   * 按功能模块策略
   */
  private static distributeByFeature(tasks: Task[], workDays: WorkDay[]): TaskAgentOutput {
    // 尝试将相关任务分配到连续的天数
    const dailyAssignments = []
    let taskIndex = 0
    
    for (const workDay of workDays) {
      const dayTasks = []
      let remainingDayHours = workDay.plannedHours
      
      // 专注于当前任务直到完成或当天工时用完
      while (taskIndex < tasks.length && remainingDayHours > 0) {
        const task = tasks[taskIndex]
        const allocatedHours = Math.min(task.totalHours, remainingDayHours)
        
        dayTasks.push({
          taskId: task.id,
          taskName: task.name,
          allocatedHours,
          workDescription: this.generateWorkDescription(task, allocatedHours)
        })
        
        remainingDayHours -= allocatedHours
        task.totalHours -= allocatedHours
        
        // 如果任务完成，移动到下一个任务
        if (task.totalHours <= 0) {
          taskIndex++
        }
      }
      
      dailyAssignments.push({
        date: workDay.date,
        tasks: dayTasks,
        totalHours: dayTasks.reduce((sum, t) => sum + t.allocatedHours, 0)
      })
    }

    return { dailyAssignments }
  }

  /**
   * 生成工作描述
   */
  private static generateWorkDescription(task: Task, hours: number): string {
    const templates = [
      `开发${task.name}功能模块`,
      `优化${task.name}相关逻辑`,
      `实现${task.name}核心功能`,
      `调试${task.name}模块问题`,
      `完善${task.name}功能细节`
    ]
    
    const baseDescription = templates[Math.floor(Math.random() * templates.length)]
    
    if (task.description) {
      return `${baseDescription}，${task.description}`
    }
    
    return baseDescription
  }

  /**
   * 使用AI进行智能工时分配
   */
  private static async distributeWithAI(
    tasks: Task[], 
    workDays: WorkDay[], 
    distributionMode: string,
    modelConfig: any
  ): Promise<TaskAgentOutput | null> {
    try {
      // 构建AI分配提示词
      const prompt = this.buildDistributionPrompt(tasks, workDays, distributionMode)
      
      // 构建system prompt
      let systemPrompt = `你是一个专业的工时分配助手，擅长根据任务特点和分配策略，制定合理的每日工作安排。

请根据提供的任务信息、工作日信息和分配策略，智能分配每日工时。

分配策略说明：
- 按天平均分配(daily)：将任务工时尽量均匀分布到每个工作日，保持工作负荷平衡
- 按优先级分配(priority)：优先安排高优先级任务，确保重要工作优先完成
- 按功能分配(feature)：将相关功能的任务集中安排，提高工作连贯性和效率

🔧 Git日志分析指导：
当任务包含Git提交记录时，请充分利用这些信息优化工时分配：
1. **提交密度分析**：提交密度高(>2次/天)的任务通常需要更多时间和更细致的安排
2. **工作节奏参考**：根据历史提交的日期分布，模拟相似的工作节奏
3. **复杂度评估**：复杂的提交信息(长消息、多文件)暗示更高的开发难度
4. **时间分配优化**：将复杂任务安排在工作效率较高的时段

📄 附件内容分析：
当任务包含附件时，根据内容复杂度和类型调整工时安排

输出要求：
1. 每天的总工时不应超过对应工作日的plannedHours
2. 所有任务的总工时应该被合理分配完毕
3. 分配结果要符合人类工作习惯，避免频繁切换任务
4. 充分利用Git提交记录等参考信息，让工时分配更贴近实际开发情况
5. 严格按照指定的JSON格式输出`;
      
      if (modelConfig.rules && modelConfig.rules.trim()) {
        systemPrompt = systemPrompt + '\n\n用户自定义规则：\n' + modelConfig.rules.trim();
      }
      
      // 智能参数适配
      const provider = modelConfig.provider;
      const fullSupportProviders = [
        'openai', 'moonshot', 'azure', 'anyscale', 'deepseek', 'zhipu', 'baichuan', 'minimax', 'spark', 'qwen'
      ];
      
      const requestBody: any = {
        model: modelConfig.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: modelConfig.temperature ?? 0.7,
        max_tokens: modelConfig.maxTokens ?? 4000,
      };
      
      if (fullSupportProviders.includes(provider)) {
        if (typeof modelConfig.top_p === 'number') requestBody.top_p = modelConfig.top_p;
        if (typeof modelConfig.presence_penalty === 'number') requestBody.presence_penalty = modelConfig.presence_penalty;
        if (typeof modelConfig.frequency_penalty === 'number') requestBody.frequency_penalty = modelConfig.frequency_penalty;
      }
      
      // 调用AI模型
      const response = await fetch(`${modelConfig.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${modelConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        throw new Error(`AI API调用失败: ${response.status}`)
      }
      
      const data = await response.json()
      
      // 多格式兼容解析AI响应
      let aiResponse = '';
      if (data.choices?.[0]?.message?.content) {
        aiResponse = data.choices[0].message.content;
      } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiResponse = data.candidates[0].content.parts[0].text;
      } else if (typeof data.result === 'string') {
        aiResponse = data.result;
      } else if (typeof data.output?.text === 'string') {
        aiResponse = data.output.text;
      } else if (Array.isArray(data.output) && data.output[0]?.content?.[0]?.text) {
        aiResponse = data.output[0].content[0].text;
      } else if (Array.isArray(data.output) && data.output[0]?.text) {
        aiResponse = data.output[0].text;
      }
      
      if (aiResponse && typeof aiResponse === 'string' && aiResponse.trim()) {
        return this.parseAIDistributionResponse(aiResponse)
      } else {
        throw new Error('AI返回格式错误')
      }
      
    } catch (error) {
      console.error('AI工时分配失败:', error)
      return null
    }
  }

  /**
   * 构建AI分配提示词
   */
  private static buildDistributionPrompt(tasks: Task[], workDays: WorkDay[], distributionMode: string): string {
    // 构建增强的任务信息，包含Git日志和附件详情
    const taskSummary = tasks.map(task => {
      let taskInfo = `- ${task.name} (${task.totalHours}h, 优先级: ${task.priority}`;
      
      if (task.description) {
        taskInfo += `, 描述: ${task.description}`;
      }
      
      // 根据任务来源添加详细信息用于工时分配参考
      if (task.source && task.sourceData) {
        switch (task.source) {
          case 'gitlog':
            if (task.sourceData.gitCommits && task.sourceData.gitCommits.length > 0) {
              taskInfo += `\n  📊 Git提交分析:`;
              const commits = task.sourceData.gitCommits;
              taskInfo += `\n    - 提交数量: ${commits.length}个`;
              
              // 分析提交时间分布
              const commitDates = commits.map(c => new Date(c.date).toDateString());
              const uniqueDates = Array.from(new Set(commitDates));
              taskInfo += `\n    - 工作日分布: ${uniqueDates.length}天`;
              
              // 提交密度分析
              if (uniqueDates.length > 0) {
                const avgCommitsPerDay = (commits.length / uniqueDates.length).toFixed(1);
                taskInfo += `\n    - 平均提交密度: ${avgCommitsPerDay}次/天`;
              }
              
              // 详细提交记录
              taskInfo += `\n  📝 提交详情:`;
              commits.forEach((commit, index) => {
                if (index < 3) { // 只显示前3个提交
                  taskInfo += `\n    - ${commit.hash.substring(0, 7)}: ${commit.message} (${new Date(commit.date).toLocaleDateString()})`;
                } else if (index === 3) {
                  taskInfo += `\n    - ... 还有${commits.length - 3}个提交`;
                }
              });
            } else if (task.sourceData.rawContent) {
              taskInfo += `\n  📝 Git日志参考:\n${task.sourceData.rawContent.split('\n').slice(0, 5).map(line => `    ${line}`).join('\n')}`;
              if (task.sourceData.rawContent.split('\n').length > 5) {
                taskInfo += `\n    ...`;
              }
            }
            break;
            
          case 'attachment':
            if (task.sourceData.rawContent) {
              const isImage = task.sourceData.rawContent.startsWith('data:image/') || 
                            task.sourceData.fileType === 'image' ||
                            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(task.name);
              
              if (isImage) {
                taskInfo += `\n  🖼️ 附件参考: 图片文件 - ${task.name}`;
              } else {
                const content = task.sourceData.rawContent;
                if (content.length > 200) {
                  taskInfo += `\n  📄 附件参考:\n${content.substring(0, 200).split('\n').map(line => `    ${line}`).join('\n')}...`;
                } else {
                  taskInfo += `\n  📄 附件参考:\n${content.split('\n').map(line => `    ${line}`).join('\n')}`;
                }
              }
            }
            break;
        }
      }
      
      taskInfo += ')';
      return taskInfo;
    }).join('\n\n');
    
    const workDaysSummary = workDays.map(day => 
      `- ${day.date} (${day.plannedHours}h)`
    ).join('\n')
    
    const modeDescription = {
      'daily': '按天平均分配：将任务工时尽量均匀分布到每个工作日',
      'priority': '按优先级分配：优先安排高优先级任务，确保重要工作优先完成', 
      'feature': '按功能分配：将相关功能的任务集中安排在连续的时间内'
    }[distributionMode] || '按天平均分配'
    
    // 检查是否有Git日志参考
    const hasGitReference = tasks.some(task => task.source === 'gitlog');
    const hasAttachmentReference = tasks.some(task => task.source === 'attachment');
    
    let gitAnalysisInstructions = '';
    if (hasGitReference) {
      gitAnalysisInstructions = `

🔍 Git日志工时分配建议：
1. 根据提交密度调整工时分配 - 提交密度高的任务可能需要更多时间
2. 参考历史工作日分布 - 按照实际开发节奏安排工时
3. 考虑提交复杂度 - 复杂提交信息暗示需要更长开发时间
4. 模拟真实开发流程 - 根据Git记录推测开发难度和时间需求`;
    }
    
    return `
任务列表：
${taskSummary}

工作日列表：
${workDaysSummary}

分配策略：${modeDescription}${gitAnalysisInstructions}

请根据上述信息，智能分配每日工时。要求：
1. 每个任务的总工时必须被完全分配
2. 每天的分配工时不能超过该天的plannedHours
3. 分配要符合所选策略的特点
4. 考虑实际工作习惯，避免每天任务过于分散
5. 充分利用Git提交记录来优化工时分配的合理性
6. 根据提交密度和复杂度调整任务的工时分布

请按以下JSON格式返回分配结果：
{
  "dailyAssignments": [
    {
      "date": "2025-06-01",
      "tasks": [
        {
          "taskId": "task_id",
          "taskName": "任务名称",
          "allocatedHours": 4.0,
          "workDescription": "具体工作描述"
        }
      ],
      "totalHours": 8.0
    }
  ]
}
`
  }

  /**
   * 解析AI分配响应
   */
  private static parseAIDistributionResponse(aiResponse: string): TaskAgentOutput | null {
    try {
      // 提取JSON部分
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到JSON格式的响应')
      }
      
      const aiData = JSON.parse(jsonMatch[0])
      
      if (!aiData.dailyAssignments || !Array.isArray(aiData.dailyAssignments)) {
        throw new Error('AI响应格式错误：缺少dailyAssignments字段')
      }
      
      // 验证和转换数据格式
      const dailyAssignments = aiData.dailyAssignments.map((assignment: any) => {
        if (!assignment.date || !assignment.tasks || !Array.isArray(assignment.tasks)) {
          throw new Error('AI响应格式错误：每日分配格式不正确')
        }
        
        const tasks = assignment.tasks.map((task: any) => {
          return {
            taskId: task.taskId || '',
            taskName: task.taskName || '',
            allocatedHours: Number(task.allocatedHours) || 0,
            workDescription: task.workDescription || `${task.taskName}相关工作`
          }
        })
        
        return {
          date: assignment.date,
          tasks,
          totalHours: tasks.reduce((sum: number, t: any) => sum + t.allocatedHours, 0)
        }
      })
      
      return { dailyAssignments }
      
    } catch (error) {
      console.error('解析AI分配响应失败:', error)
      return null
    }
  }
} 