/* === Team Report === */
var allResponses = [];

var Q_LABELS = [
  { id: 'divider', label: '基础画像' },
  { id: 'q3_frequency', label: 'AI 使用频率', type: 'text' },
  { id: 'q_coverage', label: '成员覆盖比例', type: 'text' },
  { id: 'q4_tools', label: '使用的 AI 工具', type: 'tags' },
  { id: 'divider', label: '智能办公' },
  { id: 'q5_work_types', label: '办公工作内容', type: 'tags' },
  { id: 'q_office_habits', label: '办公使用方式', type: 'tags' },
  { id: 'divider', label: '智能研发' },
  { id: 'q_rd_tools', label: '研发 AI 工具', type: 'tags' },
  { id: 'q_rd_domains', label: '研发涉及领域', type: 'tags' },
  { id: 'divider', label: '效果评估' },
  { id: 'q6_help_level', label: '帮助程度', type: 'text' },
  { id: 'q7_efficiency', label: '效率提升幅度', type: 'text' },
  { id: 'q_proficiency', label: '掌握程度', type: 'text' },
  { id: 'divider', label: '问题与痛点' },
  { id: 'q8_problems', label: '遇到的问题', type: 'tags' },
  { id: 'q9_core_problem', label: '最大核心问题', type: 'tags' },
  { id: 'q10_weakness', label: '输出内容短板', type: 'tags' },
  { id: 'q11_reduced', label: '是否减少使用', type: 'tags' },
  { id: 'q12_untried_scenarios', label: '未尝试的工作难点', type: 'text' },
  { id: 'divider', label: '期望与建议' },
  { id: 'q13_desired_scenarios', label: '期望赋能的场景', type: 'tags' },
  { id: 'q14_support_needs', label: '期望的部门支持', type: 'tags' },
  { id: 'q_attitude', label: '推广态度', type: 'text' },
  { id: 'q15_suggestions', label: '意见与建议', type: 'text' },
];

function esc(s) {
  var d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

async function init() {
  try {
    var resp = await fetch('/api/responses');
    if (!resp.ok) throw new Error('API error');
    allResponses = await resp.json();
  } catch (e) {
    document.getElementById('reportContent').innerHTML =
      '<div class="empty-state"><h3>加载失败</h3><p>无法连接到服务器。</p></div>';
    return;
  }
  document.getElementById('teamCount').textContent = allResponses.length;
  if (allResponses.length === 0) {
    document.getElementById('reportContent').innerHTML =
      '<div class="empty-state"><h3>暂无提交数据</h3><p>等待团队提交问卷。</p></div>';
    return;
  }
  renderAll();
}

function renderAll() {
  var parts = [];
  allResponses.forEach(function(r, idx) {
    var h = '';
    h += '<div class="team-card">';
    h += '<div class="team-card-header">';
    h += '<h2>' + (idx + 1) + '. ' + esc(r.team) + '</h2>';
    h += '<span class="text-sm text-muted">填写人：' + esc(r.submitter || '') + ' | ' + (r.created_at || '').substring(0, 16) + '</span>';
    h += '</div><div class="team-card-body">';

    Q_LABELS.forEach(function(q) {
      if (q.id === 'divider') {
        h += '<div class="section-divider">' + q.label + '</div>';
        return;
      }
      var val = r[q.id];
      h += '<div class="qa-block">';
      h += '<div class="qa-q">' + q.label + '</div>';
      if (q.type === 'tags') {
        var arr = Array.isArray(val) ? val : [];
        if (arr.length > 0) {
          h += '<div class="qa-a">';
          arr.forEach(function(item) { h += '<span class="qa-tag">' + esc(item) + '</span>'; });
          h += '</div>';
        } else {
          h += '<div class="qa-empty">(未填写)</div>';
        }
      } else {
        h += val ? '<div class="qa-text">' + esc(String(val)) + '</div>' : '<div class="qa-empty">(未填写)</div>';
      }
      h += '</div>';
    });
    h += '</div></div>';
    parts.push(h);
  });
  document.getElementById('reportContent').innerHTML = parts.join('');
}

document.addEventListener('DOMContentLoaded', init);
