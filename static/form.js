/* === AI Survey Form === */

// 团队列表从后端 API 动态获取，确保与 app.py 同步
let TEAM_NAMES = [];

const formData = {
  team: '', submitter: '',
  q3_frequency: '', q_coverage: '', q4_tools: [],
  q5_work_types: [], q_office_habits: [],
  q_rd_tools: [], q_rd_domains: [],
  q6_help_level: '', q7_efficiency: '',
  q_proficiency: '', q8_problems: [],
  q9_core_problem: [], q10_weakness: [], q11_reduced: [],
  q12_untried_scenarios: '', q13_desired_scenarios: [],
  q14_support_needs: [], q_attitude: '', q15_suggestions: '',
};

let currentStep = 0;
let submittedTeams = [];

const STEPS = [
  {
    title: '基础画像',
    questions: [
      { id: 'team', type: 'select', label: '所属团队', required: true, options: TEAM_NAMES, placeholder: '请选择团队…' },
      { id: 'submitter', type: 'text', label: '填写人姓名', required: true, placeholder: '组长姓名' },
      { id: 'q3_frequency', type: 'radio', label: '团队使用 AI 工具的频率是？', required: true,
        options: ['频繁使用 — 每日都会用到', '经常使用 — 每周多次', '偶尔使用 — 每周 1-3 次', '极少使用 — 每月偶尔用', '从不使用'] },
      { id: 'q_coverage', type: 'radio', label: '团队中约有多少比例的成员在日常工作中使用 AI 工具？', required: true,
        options: ['绝大多数（80% 以上）', '超过一半（50%-80%）', '约一半（30%-50%）', '少部分（10%-30%）', '极少数（不足 10%）', '完全没有人使用'] },
      { id: 'q4_tools', type: 'checkbox-tags', label: '团队目前使用的 AI 工具有哪些？', required: false,
        options: ['AI 对话（通用AI对话）', 'Claude Code（终端编码Agent）', 'Hermes-Agent（自进化通用智能体）',
                  'OpenClaw（AI工作流自动化助手）', '通义灵码（智能编码助手）', 'OpenCode（终端编码Agent）'],
        tagPlaceholder: '输入工具名称，Enter 添加…' },
    ]
  },
  {
    title: '应用现状',
    questions: [
      { type: 'divider', label: '智能办公' },
      { id: 'q5_work_types', type: 'checkbox-tags', label: 'AI 在智能办公方面帮团队完成了哪些工作？', required: false,
        options: ['文案工作：总结、汇报、方案、通知等撰写修改', '办公处理：排版润色、翻译、长文本总结提炼',
                  '会议相关：纪要整理、议题准备、会议复盘与跟进', '邮件处理：起草、回复、总结邮件内容',
                  '信息检索：替代传统搜索，快速查询政策/规范/技术资料', '数据工作：整理、计算、报表、分析、复盘',
                  '展示物料：PPT大纲生成、内容填充、海报/配图素材', '沟通工作：对外话术、对接文案、答疑内容',
                  '合同处理：合同校验、条款比对、风险审查、合规检查', '学习提升：业务知识答疑、工作方法学习、专业内容解读',
                  '流程管理：变更评审、流程管理', '创新工作：活动策划、思路构思、优化方案'],
        tagPlaceholder: '输入其他办公场景，Enter 添加…' },
      { id: 'q_office_habits', type: 'checkbox-tags', label: '在日常办公中，团队成员主要通过哪些方式使用 AI 工具？', required: false,
        options: ['遇到问题先问 AI，替代传统搜索引擎', '用 AI 辅助撰写各类文档（周报/方案/汇报/邮件等）',
                  '用 AI 整理会议纪要、提炼讨论要点', '用 AI 翻译外文资料或进行跨语言沟通',
                  '用 AI 处理 Excel 数据（公式、透视表、图表制作）', '用 AI 润色优化已有文稿',
                  '用 AI 快速生成 PPT 大纲和内容', '用 AI 学习新知识、理解陌生领域',
                  '用 AI 分析业务数据并生成洞察', '用 AI 辅助决策（方案对比、风险分析）',
                  '日常闲聊/随意尝试，尚未固定使用模式'],
        tagPlaceholder: '输入其他使用方式，Enter 添加…' },
      { type: 'divider', label: '智能研发' },
      { id: 'q_rd_tools', type: 'checkbox-tags', label: '团队在研发工作中使用了哪些 AI 编程/开发工具？', required: false,
        options: ['Claude Code（终端编码 Agent）', 'OpenCode（终端编码 Agent）',
                  'Cursor（AI 编辑器）', 'GitHub Copilot（代码补全）',
                  'Windsurf（AI 编辑器）', '通义灵码（智能编码助手）',
                  'Amazon Q Developer', 'Cline（VS Code AI 助手）',
                  'Continue（开源 AI 编码助手）', '未涉及研发工作'],
        tagPlaceholder: '输入其他研发工具，Enter 添加…' },
      { id: 'q_rd_domains', type: 'checkbox-tags', label: '团队的研发工作主要涉及哪些领域？', required: false,
        options: ['前端开发（HTML/CSS/JS/React/Vue/Angular 等）', '后端开发（Python/Java/Go/Node.js/C++ 等）',
                  '脚本与自动化（Shell/Python 脚本、批处理、CI/CD）', '功能设计（需求分析、架构设计、方案设计）',
                  'UI 设计（界面设计、交互设计、视觉设计、原型制作）', '全栈开发',
                  '移动端开发（iOS/Android/Flutter/React Native）', '数据库开发（SQL 优化、存储过程、ETL 等）',
                  '软件测试（单元测试、集成测试、E2E 测试）', '数据分析与 BI（SQL 分析、报表、可视化）',
                  '基础设施即代码（Terraform/Ansible/Docker/K8s 配置）', '未涉及研发工作'],
        tagPlaceholder: '输入其他研发领域，Enter 添加…' },
      { id: 'q6_help_level', type: 'radio', label: 'AI 工具对团队工作的帮助程度如何？', required: true,
        options: ['极大提升 — 大幅节省时间、提升质量、降低压力', '有效提升 — 对部分工作有明显辅助',
                  '一般 — 偶尔有帮助，不明显', '几乎无帮助 — 实用性低', '完全无帮助'] },
      { id: 'q7_efficiency', type: 'radio', label: '使用 AI 后，团队工作效率提升幅度？', required: true,
        options: ['提升 50% 以上', '提升 30%-50%', '提升 10%-30%', '提升不足 10%', '无明显提升'] },
      { id: 'q_proficiency', type: 'radio', label: '团队对 AI 工具的整体掌握程度如何？', required: true,
        options: ['非常熟练 — 能自主开发工作流、调教出高质量输出', '比较熟练 — 能高效提问、持续优化结果',
                  '一般 — 基本使用没问题，但不会高级技巧', '入门 — 只会简单提问，经常得不到想要的结果',
                  '很吃力 — 不知道怎么用，需要大量指导'] },
      { id: 'q8_problems', type: 'checkbox-tags', label: '团队在使用 AI 工具时遇到过哪些问题？', required: false,
        options: ['内容准确性不足：输出存在错误偏差，需要大量核对', '专业性不足：内容通用化、不落地',
                  '信息安全顾虑：担心涉密内容和业务数据泄露', '时效性不足：生成速度慢',
                  '安装问题：安装门槛高，内网环境困难', '操作门槛问题：不会精准提问、调教内容',
                  '工具繁杂混乱：工具太多、切换繁琐', '无明显问题，使用顺畅'],
        tagPlaceholder: '输入其他问题，Enter 添加…' },
    ]
  },
  {
    title: '核心痛点',
    questions: [
      { id: 'q9_core_problem', type: 'radio-tags', label: '遇到的最大核心问题是？', required: false,
        options: ['专业能力不足，无法适配岗位业务场景', '输出幻觉高（内容虚构、数据错误）',
                  '响应/输出速度慢，影响办公效率', '内网安装困难，安装门槛高',
                  '存在数据安全、涉密泄露风险隐患', '无明显核心问题，整体使用良好'],
        tagPlaceholder: '输入其他核心问题，Enter 添加…' },
      { id: 'q10_weakness', type: 'radio-tags', label: '当前 AI 输出内容最大的短板是？', required: false,
        options: ['专业深度不够', '准确性不可靠', '响应速度慢', '无法理解复杂指令',
                  '缺乏业务上下文', '格式/排版质量差', '成本过高（token 消耗、API 费用）'],
        tagPlaceholder: '输入其他短板，Enter 添加…' },
      { id: 'q11_reduced', type: 'checkbox-tags', label: '是否因为各类问题，主动减少或放弃使用 AI 工具？', required: false,
        options: ['因信息安全顾虑减少使用', '因输出质量不可靠减少使用', '因响应速度慢减少使用',
                  '因操作门槛高减少使用', '没有减少，持续使用', '从未大量使用过'],
        tagPlaceholder: '输入其他原因，Enter 添加…' },
      { id: 'q12_untried_scenarios', type: 'textarea', label: '团队有没有 AI 可以解决但尚未尝试的工作难点？', required: false,
        placeholder: '请简要说明…', rows: 3 },
    ]
  },
  {
    title: '期望建议',
    questions: [
      { id: 'q13_desired_scenarios', type: 'checkbox-tags', label: '最希望用 AI 赋能哪些未落地的工作场景？', required: false,
        options: ['高频文案批量生成（周报/月报/复盘/汇报等）', '业务数据智能分析、自动复盘、问题总结',
                  '标准化模板生成（公文/方案/PPT/话术等）', '工作问题智能答疑、业务知识快速查询',
                  '会议全流程辅助（会前准备→纪要→待办跟踪）', '邮件智能处理（自动分类、摘要、辅助回复）',
                  '跨语言沟通（翻译、外文资料解读）', 'Excel 数据处理自动化（报表、图表、分析）',
                  '运维脚本开发、分析', '告警诊断', '功能开发设计、平台优化',
                  '日常巡检、系统分析', '变更评审、变更方案分析、变更风险分析',
                  '素材、配图、可视化展示内容生成', '工作流程优化、创新方案策划辅助',
                  '知识管理（经验沉淀、标准库建设、文档自动生成）'],
        tagPlaceholder: '输入其他场景，Enter 添加…' },
      { id: 'q14_support_needs', type: 'checkbox-tags', label: '希望部门提供哪些 AI 相关支持？', required: false,
        options: ['统一推荐适配部门业务的优质AI工具（合规工具清单）', '开展AI使用技巧、高效提问、场景化应用培训',
                  '搭建部门内部AI共享工具/平台，保障数据安全', '不需要额外支持，自主使用即可'],
        tagPlaceholder: '输入其他支持需求，Enter 添加…' },
      { id: 'q_attitude', type: 'radio', label: '对于部门推广 AI 工具赋能日常工作，团队的态度是？', required: true,
        options: ['非常支持 — 愿意积极参与试点和推广', '支持 — 有需要时会配合使用',
                  '中立 — 观望中，看其他团队效果再说', '不太支持 — 担心影响现有工作节奏',
                  '反对 — 认为不适合团队实际情况'] },
      { id: 'q15_suggestions', type: 'textarea', label: '对部门 AI 工具应用、优化、推广还有哪些宝贵的意见和建议？', required: false,
        placeholder: '请畅所欲言…', rows: 4 },
    ]
  }
];

// === Helpers ===
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function escAttr(s) { return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function getOpts(id) {
  for (const step of STEPS) for (const q of step.questions) if (q.id === id) return q.options || [];
  return [];
}

// === Init ===
async function init() {
  try {
    const [teamsRes, subsRes] = await Promise.all([
      fetch('/api/teams'),
      fetch('/api/submissions')
    ]);
    const teams = await teamsRes.json();
    TEAM_NAMES.splice(0, TEAM_NAMES.length, ...teams);  // 原地更新，保持引用
    submittedTeams = await subsRes.json();
  } catch (e) {
    showToast('无法加载团队列表，请刷新重试', 'error');
    return;
  }
  renderStep(0);
}

// === Render ===
function renderStep(si) {
  currentStep = si;
  const step = STEPS[si];
  const c = document.getElementById('formContent');
  let h = '';
  let qn = 0;

  step.questions.forEach((q) => {
    // Divider
    if (q.type === 'divider') {
      h += `<div style="border-top:1px solid var(--c-border);margin:8px 0 24px;padding-top:20px;">
        <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:var(--c-primary);font-weight:600;">${q.label}</span>
      </div>`;
      return;
    }

    qn++;
    const v = formData[q.id];
    h += `<div class="section"><div class="section-header"><h3>Q${qn}</h3><p class="q-title">${q.label}${q.required ? ' <span style="color:var(--c-error)">*</span>' : ''}</p></div>`;

    if (q.type === 'select') h += renderSelect(q, v);
    else if (q.type === 'text') h += renderText(q, v);
    else if (q.type === 'radio') h += renderRadio(q, v);
    else if (q.type === 'checkbox-tags') h += renderCheckboxTags(q, v);
    else if (q.type === 'radio-tags') h += renderRadioTags(q, v);
    else if (q.type === 'textarea') h += renderTextarea(q, v);

    h += '</div>';
  });

  h += '<div class="flex-between" style="border-top:1px solid var(--c-border);padding-top:24px;margin-top:32px;">';
  h += si > 0 ? '<button class="btn" onclick="prevStep()">← 上一步</button>' : '<span></span>';
  h += `<span class="text-sm text-muted">第 ${si + 1} 步，共 ${STEPS.length} 步</span>`;
  if (si < STEPS.length - 1) h += '<button class="btn btn-primary" onclick="nextStep()">下一步 →</button>';
  else h += '<button class="btn btn-primary" onclick="previewSubmit()">预览并提交</button>';
  h += '</div>';

  c.innerHTML = h;
  updateProgress(si);
  window.scrollTo(0, 0);
}

function updateProgress(si) {
  document.querySelectorAll('#stepProgress .step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < si) s.classList.add('done');
    else if (i === si) s.classList.add('active');
  });
}

// === Render helpers ===
function renderSelect(q, v) {
  let h = `<select class="form-select" id="${q.id}" onchange="updateField('${q.id}', this.value)">`;
  h += `<option value="">${q.placeholder || '请选择…'}</option>`;
  q.options.forEach(opt => {
    const disabled = q.id === 'team' && submittedTeams.includes(opt);
    h += `<option value="${escAttr(opt)}" ${v === opt ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${escHtml(opt)}${disabled ? ' (已提交)' : ''}</option>`;
  });
  h += '</select>';
  return h;
}

function renderText(q, v) {
  return `<input class="form-input" id="${q.id}" type="text" placeholder="${escAttr(q.placeholder || '')}" value="${escAttr(v || '')}" onchange="updateField('${q.id}', this.value)">`;
}

function renderRadio(q, v) {
  let h = '<div class="option-group">';
  q.options.forEach(opt => {
    const sel = v === opt;
    h += `<div class="option-card${sel ? ' selected' : ''}" onclick="selectRadio('${q.id}', this)">`;
    h += `<input type="radio" name="${q.id}" ${sel ? 'checked' : ''}>${escHtml(opt)}</div>`;
  });
  h += '</div>';
  return h;
}

function renderCheckboxTags(q, v) {
  const arr = Array.isArray(v) ? v : [];
  const preset = arr.filter(x => q.options.includes(x));
  const custom = arr.filter(x => !q.options.includes(x));

  let h = '<div class="option-grid">';
  q.options.forEach(opt => {
    const ck = preset.includes(opt);
    h += `<div class="option-card${ck ? ' selected' : ''}" onclick="toggleCheckbox('${q.id}', this)">`;
    h += `<input type="checkbox" value="${escAttr(opt)}" ${ck ? 'checked' : ''}>${escHtml(opt)}</div>`;
  });
  h += '</div>';
  h += renderTagArea(q, custom);
  return h;
}

function renderRadioTags(q, v) {
  const arr = Array.isArray(v) ? v : [];
  const preset = arr.find(x => q.options.includes(x)) || '';
  const custom = arr.filter(x => !q.options.includes(x));

  let h = '<div class="option-group">';
  q.options.forEach(opt => {
    const sel = preset === opt;
    h += `<div class="option-card${sel ? ' selected' : ''}" onclick="selectRadioTag('${q.id}', this)">`;
    h += `<input type="radio" name="${q.id}" ${sel ? 'checked' : ''}>${escHtml(opt)}</div>`;
  });
  h += '</div>';
  h += renderTagArea(q, custom);
  return h;
}

function renderTagArea(q, customTags) {
  let h = `<div class="tag-area" data-field="${q.id}">`;
  h += '<div class="tag-list">';
  customTags.forEach(tag => {
    h += `<span class="tag">${escHtml(tag)}<button class="tag-remove" onclick="removeCustomTag('${q.id}', this)">&times;</button></span>`;
  });
  h += '</div>';
  h += '<div class="tag-input-row">';
  h += `<input type="text" placeholder="${escAttr(q.tagPlaceholder || '输入后按 Enter 添加…')}" onkeydown="handleTagKey(event, '${q.id}')">`;
  h += '<span class="tag-hint">Enter ↵</span>';
  h += '</div></div>';
  return h;
}

function renderTextarea(q, v) {
  return `<textarea class="form-textarea" id="${q.id}" placeholder="${escAttr(q.placeholder || '')}" rows="${q.rows || 4}" onchange="updateField('${q.id}', this.value)">${escHtml(v || '')}</textarea>`;
}

// === Field updates ===
function updateField(id, value) { formData[id] = value; }

function selectRadio(id, el) {
  el.parentElement.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
  formData[id] = el.textContent.trim();
}

function selectRadioTag(id, el) {
  el.parentElement.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
  const opts = getOpts(id);
  const arr = Array.isArray(formData[id]) ? formData[id].filter(x => !opts.includes(x)) : [];
  formData[id] = [el.textContent.trim(), ...arr];
}

function toggleCheckbox(id, el) {
  const val = el.querySelector('input').value;
  let arr = Array.isArray(formData[id]) ? [...formData[id]] : [];
  if (arr.includes(val)) {
    arr = arr.filter(x => x !== val);
    el.classList.remove('selected');
    el.querySelector('input').checked = false;
  } else {
    arr.push(val);
    el.classList.add('selected');
    el.querySelector('input').checked = true;
  }
  formData[id] = arr;
}

// === Tag Input ===
function handleTagKey(event, fieldId) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const val = event.target.value.trim();
    if (!val) return;
    let arr = Array.isArray(formData[fieldId]) ? [...formData[fieldId]] : [];
    if (!arr.includes(val)) arr.push(val);
    formData[fieldId] = arr;
    event.target.value = '';
    renderStep(currentStep);
  } else if (event.key === 'Backspace' && event.target.value === '') {
    const opts = getOpts(fieldId);
    let arr = Array.isArray(formData[fieldId]) ? [...formData[fieldId]] : [];
    const custom = arr.filter(x => !opts.includes(x));
    if (custom.length > 0) {
      arr = arr.filter(x => x !== custom[custom.length - 1]);
      formData[fieldId] = arr;
      renderStep(currentStep);
    }
  }
}

function removeCustomTag(fieldId, btn) {
  const tagText = btn.parentElement.textContent.replace('×', '').trim();
  let arr = Array.isArray(formData[fieldId]) ? [...formData[fieldId]] : [];
  formData[fieldId] = arr.filter(x => x !== tagText);
  renderStep(currentStep);
}

// === Navigation ===
function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < STEPS.length - 1) renderStep(currentStep + 1);
}

function prevStep() { if (currentStep > 0) renderStep(currentStep - 1); }

function validateStep(si) {
  const errs = [];
  STEPS[si].questions.forEach(q => {
    if (q.type === 'divider' || !q.required) return;
    const v = formData[q.id];
    if (!v || (Array.isArray(v) && v.length === 0)) errs.push(`"${q.label}" 为必填项`);
  });
  if (errs.length > 0) { showToast(errs.join('<br>'), 'error'); return false; }
  return true;
}

// === Preview & Submit ===
function previewSubmit() {
  if (!validateStep(currentStep)) return;
  let h = '';
  STEPS.forEach((step, si) => {
    h += `<h3 style="margin-top:16px;">${si + 1}. ${step.title}</h3>`;
    step.questions.forEach(q => {
      if (q.type === 'divider') return;
      const v = formData[q.id];
      const d = Array.isArray(v) ? v.join('、') || '(未填写)' : (v || '(未填写)');
      h += `<p style="margin:4px 0;"><strong>${q.label}</strong><br><span style="color:var(--c-text-secondary);">${escHtml(d)}</span></p>`;
    });
  });
  document.getElementById('reviewContent').innerHTML = h;
  document.getElementById('reviewModal').style.display = 'flex';
  document.getElementById('confirmSubmit').onclick = async () => { await submitForm(); closeReview(); };
}

function closeReview() { document.getElementById('reviewModal').style.display = 'none'; }

async function submitForm() {
  const btn = document.getElementById('confirmSubmit');
  btn.disabled = true; btn.textContent = '提交中…';
  try {
    const res = await fetch('/api/submit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData) });
    const data = await res.json();
    if (res.ok) showSuccess(data.team);
    else showToast(data.error || '提交失败', 'error');
  } catch (e) {
    showToast('网络错误，请检查连接后重试', 'error');
  } finally { btn.disabled = false; btn.textContent = '确认提交'; }
}

function showSuccess(team) {
  document.getElementById('formContent').style.display = 'none';
  document.getElementById('stepProgress').style.display = 'none';
  const v = document.getElementById('successView');
  v.style.display = 'block';
  v.innerHTML = `<div class="empty-state">
    <svg width="64" height="64" viewBox="0 0 64 64" style="margin-bottom:16px;">
      <circle cx="32" cy="32" r="30" fill="none" stroke="var(--c-success)" stroke-width="2"/>
      <path d="M20 32 L28 40 L44 24" fill="none" stroke="var(--c-success)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <h2 style="color:var(--c-success);">提交成功</h2>
    <p>团队「${escHtml(team)}」的调研数据已保存。</p>
    <p class="text-sm text-muted mt-16">如需修改数据，请联系管理员重新提交。</p>
    <a href="/dashboard" class="btn btn-primary mt-24" style="display:inline-flex;">查看数据分析 →</a>
  </div>`;
  window.scrollTo(0, 0);
}

function showToast(msg, type) {
  const old = document.querySelector('.toast'); if (old) old.remove();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`; t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// === Keyboard ===
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeReview();
});

// Boot
document.addEventListener('DOMContentLoaded', init);
