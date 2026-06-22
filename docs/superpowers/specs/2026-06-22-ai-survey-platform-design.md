# AI 工具使用情况调研平台 — 设计规格书

**日期**: 2026-06-22  
**状态**: 已确认  
**需求来源**: 基于已有 Excel 调研数据重构

---

## 1. 背景与目标

### 1.1 现状
- 已有 11 个运维相关团队、26 条 Excel 问卷记录
- 数据存在重复、空值、结构混乱等问题
- 现有问卷 16 题，编号混乱，部分题区分度低
- 需要将问卷从"个人填写"改为"组长代表团队填写"

### 1.2 目标
- **诊断现状**: 摸清各团队 AI 使用频率、工具、效果、问题
- **收集需求**: 收集各团队的 AI 场景需求、部门支持需求
- **支撑决策**: 为部门 AI 工具推广、培训规划提供数据依据

### 1.3 约束
- 固定 11 个团队，每个团队限提交 1 份
- 内网部署，浏览器访问，一次性使用
- 数据存储必须健壮（SQLite 事务写入）
- 美观、专业、去 AI 味的 UI 设计

---

## 2. 问卷结构（重构后 15 题）

| 板块 | 题号 | 题目 | 类型 |
|------|------|------|------|
| **一、基础画像** | Q1 | 所属团队 | 下拉单选 |
| | Q2 | 填写人姓名 | 文本 |
| | Q3 | 团队 AI 使用频率 | 单选 |
| | Q4 | 正在使用的 AI 工具 | 多选 + tag 补充 |
| **二、应用现状** | Q5 | AI 辅助的工作内容 | 多选 + tag 补充 |
| | Q6 | AI 对工作的帮助程度 | 单选 |
| | Q7 | 工作效率提升幅度 | 单选 |
| | Q8 | 使用中遇到的问题 | 多选 + tag 补充 |
| **三、核心痛点** | Q9 | 遇到的最大核心问题 | 单选 + tag 补充 |
| | Q10 | AI 输出内容最大短板 | 单选 + tag 补充 |
| | Q11 | 是否减少/放弃使用 | 多选 + tag 补充 |
| | Q12 | 未尝试但有需求的场景 | 长文本 |
| **四、期望建议** | Q13 | 最希望 AI 赋能的场景 | 多选 + tag 补充 |
| | Q14 | 希望部门提供的支持 | 多选 + tag 补充 |
| | Q15 | 意见与建议 | 长文本 |

---

## 3. 系统架构

```
┌──────────────┐     HTTP/REST      ┌──────────────┐     SQL      ┌──────────┐
│  浏览器端     │ ◄──────────────► │  Flask 后端   │ ◄──────────► │ SQLite   │
│  HTML/CSS/JS  │                   │  app.py       │              │ .db      │
└──────────────┘                   └──────────────┘              └──────────┘
```

### 技术选型
- **后端**: Python Flask — 轻量、部署简单（`pip install flask && python app.py`）
- **数据库**: SQLite — 单文件、事务写入、零配置
- **前端**: 纯 HTML/CSS/JS — 无构建工具、无 npm 依赖
- **图表**: Chart.js（内嵌到项目中，不依赖 CDN）
- **字体**: Fira Sans + Fira Code（内嵌或系统降级）

### 项目结构
```
AI使用情况问卷调查/
├── app.py              # Flask 应用入口
├── survey.db           # SQLite 数据库（自动创建）
├── static/
│   ├── form.html       # 填报页面
│   ├── dashboard.html  # 分析页面
│   ├── app.js          # 前端逻辑
│   ├── style.css       # 样式
│   └── chart.min.js    # Chart.js（内嵌）
├── requirements.txt    # flask
└── docs/
```

---

## 4. 页面设计

### 4.1 填报页面 (`/` → `static/form.html`)

#### Header
- Eyebrow: "Internal Survey · 部门内部调研"
- 标题: "AI 工具使用情况调研"（Fira Code 等宽字体）
- 说明文字: 填写要求

#### 进度条
- 4 步指示器，圆形序号 + 连接线
- 状态: active（蓝色填充）、done（绿色边框）、pending（灰色）
- 移动端隐藏标签文字，仅保留序号

#### 表单区
- 左侧 2px 蓝色竖线标识当前板块
- 每个问题独立 section
- **单选**: 卡片式 radio，整行可点击，选中态蓝色边框 + 浅蓝背景
- **多选**: 2 列网格 checkbox，选中态同上
- **Tag 输入组件**: 虚线框输入区，Enter 添加标签，标签显示为蓝色等宽字体 pill
- **长文本**: textarea，自动高度

#### 导航
- 底部固定: "上一步" | "第 N 步 / 共 4 步" | "下一步"
- 最后一步 "下一步" 变为 "提交预览"
- 预览弹窗: 汇总所有回答，确认后提交

#### 成功页
- 简洁确认: "提交成功" + 团队名称 + 提交时间
- 提示: "如需修改请联系管理员"

### 4.2 分析页面 (`/dashboard` → `static/dashboard.html`)

#### Top Bar
- Eyebrow + 标题（与填报页一致）
- 右上角: 数据截止时间 + 提交进度 "8/11"

#### 统计区（非对称布局，3 列不等宽）
- **左列 (2fr)** — Hero 卡片: SVG 环形提交进度图 + 数量 + 未提交团队列表
- **中列 (1fr)** — 有效率卡片: "82% 认为有效/极大提升"
- **右列 (1fr)** — 工具多样性卡片: "4 类主流 AI 工具"

#### 图表区（2 列网格）
- **左**: 使用频率分布 — 水平条形图
- **右**: 遇到的问题 — 水平条形图（红色=高频问题）
- 后续可切换: 帮助程度、效率提升、期望场景等

#### 团队对比表
- 表格: 团队 × (频率、工具数、帮助度、核心问题、期望支持)
- 问题列使用语义色标签（红=严重、黄=中等、绿=轻微）
- 支持表头排序

#### 操作栏
- "导出 Excel"（主按钮）
- "导出 PDF"
- "查看原始数据"（展开/折叠原始 JSON 表格）

---

## 5. 数据模型

### 5.1 responses 表
```sql
CREATE TABLE responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team TEXT NOT NULL UNIQUE,       -- 团队名称（唯一约束）
    submitter TEXT NOT NULL,         -- 填写人姓名
    q3_frequency TEXT,               -- AI使用频率
    q4_tools TEXT,                   -- JSON: ["AI对话","Claude Code","custom:opencode"]
    q5_work_types TEXT,              -- JSON
    q6_help_level TEXT,
    q7_efficiency TEXT,
    q8_problems TEXT,                -- JSON
    q9_core_problem TEXT,            -- JSON
    q10_weakness TEXT,               -- JSON
    q11_reduced TEXT,                -- JSON
    q12_untried_scenarios TEXT,      -- 文本
    q13_desired_scenarios TEXT,      -- JSON
    q14_support_needs TEXT,          -- JSON
    q15_suggestions TEXT,            -- 长文本
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 设计要点
- 多选字段统一存 JSON 数组: `["预设选项","custom:自定义标签"]`
- 自定义标签以 `custom:` 前缀区分，便于统计时分离
- `team` 设 UNIQUE 约束，重复提交触发 UPDATE
- 所有写入在一个事务内完成

---

## 6. API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/` | 返回填报页面 |
| `GET` | `/dashboard` | 返回分析页面 |
| `GET` | `/api/teams` | 返回 11 个团队列表 |
| `GET` | `/api/submissions` | 返回已提交的团队列表 |
| `POST` | `/api/submit` | 提交/更新问卷 |
| `GET` | `/api/responses` | 返回所有响应（仪表盘用） |
| `GET` | `/api/export` | 导出 Excel |
| `GET` | `/api/stats` | 返回预计算的统计数据 |
| `DELETE` | `/api/responses/<id>` | 删除某条记录（管理用） |

### 提交接口校验
- `team` 必填，且必须在 11 个团队列表中
- `submitter` 必填
- 所有必答题前端 + 后端双重校验
- 返回 201（新建）或 200（更新）

---

## 7. UI 设计规范

### 7.1 颜色
| 变量 | 值 | 用途 |
|------|-----|------|
| `--c-primary` | `#1E40AF` | 主色、按钮、选中态 |
| `--c-secondary` | `#3B82F6` | 次要蓝 |
| `--c-accent` | `#D97706` | 强调、警告 |
| `--c-bg` | `#F8FAFC` | 页面背景 |
| `--c-surface` | `#FFFFFF` | 卡片、表格背景 |
| `--c-text` | `#0F172A` | 主文字 |
| `--c-text-secondary` | `#64748B` | 次要文字 |
| `--c-border` | `#E2E8F0` | 边框 |
| `--c-error` | `#DC2626` | 错误/严重 |
| `--c-success` | `#16A34A` | 成功 |

### 7.2 字体
- **标题 / 数据**: `Fira Code`, monospace
- **正文**: `Fira Sans`, system-ui, sans-serif
- 降级方案: 系统等宽字体 + 系统无衬线字体

### 7.3 间距
- 基础单位: 4px
- 组件内 padding: 8-12px
- Section margin: 24-36px
- 页面 padding: 32px

### 7.4 边框
- 默认: `1px solid #E2E8F0`
- 激活: `1px solid #1E40AF`（蓝色）
- 错误: `1px solid #DC2626`（红色）
- 虚线: `1px dashed #CBD5E1`（自定义输入区）
- 圆角: 6px（卡片）、4px（标签）、50%（步骤圆）

### 7.5 防 AI 味原则
- ❌ 不使用 emoji 作为图标
- ❌ 不使用渐变色
- ❌ 不使用 box-shadow 卡片
- ❌ 不使用紫色系
- ❌ 避免 4 个等宽卡片排列
- ✅ 细线边框替代阴影
- ✅ SVG 图标
- ✅ 非对称布局
- ✅ 语义色（红=问题、蓝=常态、琥珀=强调）

---

## 8. 待确认项
- 无。所有设计决策已确认。

---

## 9. 实施计划概要
1. 创建 Flask 项目骨架 + SQLite 初始化
2. 实现后端 API（提交 + 查询 + 导出）
3. 实现填报页面（含 tag-input 组件 + 分步表单）
4. 实现分析页面（含 Chart.js 图表 + 团队对比表）
5. 内网部署测试
6. 导入现有 Excel 数据作为初始数据（可选）
