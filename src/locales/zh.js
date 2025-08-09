// 中文本地化文件
const zh = {
  app: {
    title: 'StoryFlow',
    subtitle: 'AI驱动的动态UX故事板系统'
  },
  idea: {
    title: '从一个想法开始',
    description: '第一步：描述您的用户场景、痛点或初步想法。StoryFlow 的 AI 将分析您的输入，生成一个可交互的故事画布。',
    placeholder: '例如：一个经常出差的商务人士，希望在旅途中能高效管理发票，但总是因为找不到合适的工具而烦恼...',
    button: '生成故事画布'
  },
  header: {
    storyScript: '故事脚本',
    userRoles: '用户角色',
    generateMap: '生成体验地图'
  },
  sidebar: {
    title: '分镜信息',
    frameTitle: '分镜标题',
    frameDesc: '分镜描述',
    emotions: '情绪标签',
    userRole: '关联用户角色',
    editVisuals: '编辑画面',
    applyChanges: '应用更改',
    whatIf: 'What-if 分支生成',
    prompt: '情境 Prompt',
    advancedSettings: '高级参数设置',
    branchCount: '分支数目',
    framesPerBranch: '每条支线分镜数',
    useAgent: '使用用户Agent行为模拟',
    generateBranch: '生成分支',
    regeneratePath: '重新生成当前路径',
    editScript: '修改原始脚本',
    placeholderTitle: '编辑面板',
    placeholderDescription: '点击画布上的一个分镜来查看和编辑其详细信息。',
    closeAriaLabel: '关闭编辑面板',
    titlePlaceholder: '例如：用户尝试登录失败',
    descriptionPlaceholder: '包含用户行为 / 系统响应 / 情绪变化',
    whatIfPlaceholder: '如果用户此时突然断网？',
    noAgent: '无',
    unnamed: '未命名',
    role: '角色'
  },
  storyTree: {
    mainStory: '主线：主故事流程',
    branch: '分支',
    title: '故事结构',
    expandAriaLabel: '展开侧边栏',
    collapseAriaLabel: '折叠侧边栏',
    branchNameTemplate: '分支 {letter} (what-if)'
  },
  emotions: {
    neutral: '一般',
    frustrated: '沮丧',
    relieved: '开心',
    inspired: '灵感',
    unknown: '未知'
  },
  journeyMap: {
    title: '用户体验地图',
    actions: '行为 (Actions)',
    emotion: '情绪 (Emotion)',
    opportunities: '机会点 (Opportunities)',
    closeAriaLabel: '关闭用户体验地图',
    opportunityList: [
      "提供发票自动归集工具", 
      "优化报销流程的提醒机制", 
      "一键生成报销单", 
      "与企业财务系统打通",
      "实现跨平台同步"
    ]
  },
  userPersonas: {
    title: '用户角色构建',
    createNew: '创建新角色',
    manualCreate: '手动创建角色',
    aiGenerate: 'AI 生成角色',
    importData: '导入用户调研资料',
    importPlaceholder: '粘贴用户访谈记录、问卷结果或其他调研数据...',
    createdRoles: '已创建的角色',
    noRoles: '暂无用户角色',
    selectOrCreate: '选择或创建用户角色',
    leftSideHint: '在左侧创建新的用户角色，或选择已有角色进行编辑',
    name: '姓名',
    age: '年龄',
    occupation: '职业背景',
    goals: '行为目标',
    scenarios: '使用场景',
    frustrations: '痛点与挫折',
    techLevel: '技术熟练度',
    beginner: '初级用户',
    intermediate: '中级用户',
    advanced: '高级用户',
    save: '保存角色',
    delete: '删除',
    confirmDelete: '确定要删除这个用户角色吗？'
  },
  storyScript: {
    title: '故事脚本',
    subtitle: '基于故事板生成的结构化叙事内容',
    userRole: '用户角色',
    behaviorGoals: '行为目标',
    usageScenarios: '使用场景',
    emotionalJourney: '情绪变化',
    plotPoints: '关键情节',
    storyTurns: '故事转折',
    noTurns: '故事发展平稳，无明显转折',
    closeAriaLabel: '关闭故事脚本',
    generator: {
      noData: '暂无故事数据',
      userRole: '用户角色',
      behaviorGoals: '行为目标',
      usageScenarios: '使用场景',
      emotionalJourney: '情绪变化',
      plotPoints: '关键情节',
      storyTurns: '故事转折',
      userRoleTemplate: '主角：{name}，一个面临特定挑战的用户',
      defaultUserRole: '主角：一个需要解决问题的用户',
      goalTemplate: '寻求{action}',
      defaultGoal: '提高效率，解决当前面临的问题',
      defaultScenario: '日常工作和生活场景中',
      unknownEmotion: '未知',
      noTurns: '故事发展平稳，无明显转折',
      actions: {
        manage: '高效管理',
        organize: '自动整理',
        recognize: '智能识别',
        operate: '便捷操作'
      },
      locations: {
        taxi: '出租车内',
        hotel: '酒店房间',
        office: '办公环境',
        home: '家庭环境'
      }
    }
  },
  canvas: {
    styleCartoon: '卡通',
    styleLineart: '线稿',
    userRoleBinding: '用户角色绑定'
  },
  refinement: {
    title: '访谈记录分析与用户画像生成',
    description: '从访谈记录中提取关键信息，生成详细的用户画像。',
    storyTitle: '故事脚本',
    personaTitle: '核心用户画像',
    addPersona: '添加新画像',
    removePersona: '删除此画像',
    personaName: '画像名称',
    personaNamePlaceholder: '例如：张伟',
    personaDescription: '用户特征与目标（一句话描述）',
    personaDescriptionPlaceholder: '例如：一位希望提升工作效率的年轻设计师',
    button: '完成细化，进入故事画布',
    interviewTitle: '访谈记录分析',
    interviewDescription: '从访谈记录中圈选关键信息，提取用户特征、场景和痛点',
    keywordExtraction: '关键词提取',
    keywordTypes: {
      user_traits: '用户特征',
      scenarios: '使用场景',
      pain_points: '痛点问题',
      emotions: '情绪状态',
      goals: '目标动机'
    },
    generatePersona: '生成用户画像',
    personaGenerated: '用户画像已生成',
    viewDetails: '查看详情',
    backToEdit: '返回编辑',
    continueNext: '继续下一步',
    generated: {
      title: '基于您的想法，AI生成了以下故事框架：',
      section1: '## 核心场景',
      placeholder1: '在这里详细描述故事发生的主要场景和背景。',
      section2: '## 用户目标与动机',
      placeholder2: '描述主角想要达成的目标，以及背后的原因。',
      section3: '## 关键挑战与冲突',
      placeholder3: '描述主角在实现目标过程中遇到的主要困难或障碍。'
    }
  },
  initialStory: [
    { id: 1, title: '分镜 1：用户进入登录页', description: '用户打开App，看到登录和注册界面。', emotion: 'neutral', color: 'blue-500', pos: { x: 100, y: 200 }, connections: [2], agentId: null },
    { id: 2, title: '分镜 2：输入错误密码', description: '用户输入账号和密码，但密码错误，无法登录。', emotion: 'frustrated', color: 'red-500', pos: { x: 400, y: 150 }, connections: [3, 'A1'], agentId: null },
    { id: 3, title: '分镜 3：身份验证成功', description: '用户使用"忘记密码"功能重置密码，或输入正确密码后成功登录。', emotion: 'relieved', color: 'green-500', pos: { x: 700, y: 200 }, connections: [4, 'B1'], agentId: null },
    { id: 4, title: '分镜 4：进入主界面', description: '用户成功进入App主界面，开始使用核心功能。', emotion: 'relieved', color: 'green-500', pos: { x: 1000, y: 180 }, connections: [], agentId: null },
    { id: 'A1', title: '分镜 A1：系统提示错误', description: '系统明确提示"密码错误"，并高亮密码输入框。', emotion: 'frustrated', color: 'red-500', pos: { x: 450, y: 350 }, connections: ['A2'], agentId: null },
    { id: 'A2', title: '分镜 A2：用户放弃尝试', description: '用户多次尝试失败后，感到沮丧并暂时关闭了App。', emotion: 'frustrated', color: 'red-500', pos: { x: 450, y: 550 }, connections: [], agentId: null },
    { id: 'B1', title: '分镜 B1：用户网络中断', description: '在验证成功后，页面跳转时网络突然中断。', emotion: 'frustrated', color: 'red-500', pos: { x: 750, y: 400 }, connections: ['B2'], agentId: null },
    { id: 'B2', title: '分镜 B2：用户联系客服', description: '用户重启App无效后，决定寻找客服帮助。', emotion: 'neutral', color: 'yellow-600', pos: { x: 750, y: 600 }, connections: [], agentId: null }
  ],
  noscript: '您需要启用JavaScript来运行此应用。'
};

export default zh; 