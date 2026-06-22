/* === Team Report — detailed per-team responses === */
var allResponses = [];

function esc(s) {
  var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}

/* Color mapping for key indicators */
function freqPill(v) {
  if (!v) return '<span class="pill pill-gray">—</span>';
  if (v.indexOf('频繁') !== -1) return '<span class="pill pill-green">频繁使用</span>';
  if (v.indexOf('经常') !== -1) return '<span class="pill pill-blue">经常使用</span>';
  if (v.indexOf('偶尔') !== -1) return '<span class="pill pill-amber">偶尔使用</span>';
  return '<span class="pill pill-red">极少使用</span>';
}

function helpPill(v) {
  if (!v) return '<span class="pill pill-gray">—</span>';
  if (v.indexOf('极大') !== -1) return '<span class="pill pill-green">极大提升</span>';
  if (v.indexOf('有效') !== -1) return '<span class="pill pill-blue">有效提升</span>';
  if (v.indexOf('一般') !== -1) return '<span class="pill pill-amber">一般</span>';
  return '<span class="pill pill-red">几乎无帮助</span>';
}

function profPill(v) {
  if (!v) return '<span class="pill pill-gray">—</span>';
  if (v.indexOf('非常熟练') !== -1) return '<span class="pill pill-green">非常熟练</span>';
  if (v.indexOf('比较熟练') !== -1) return '<span class="pill pill-blue">比较熟练</span>';
  if (v.indexOf('一般') !== -1) return '<span class="pill pill-amber">一般</span>';
  return '<span class="pill pill-red">入门/吃力</span>';
}

function attPill(v) {
  if (!v) return '<span class="pill pill-gray">—</span>';
  if (v.indexOf('非常支持') !== -1) return '<span class="pill pill-green">非常支持</span>';
  if (v.indexOf('支持') !== -1) return '<span class="pill pill-blue">支持</span>';
  if (v.indexOf('中立') !== -1) return '<span class="pill pill-amber">中立</span>';
  return '<span class="pill pill-red">不太支持/反对</span>';
}

function problemPill(v) {
  if (!v) return '<span class="pill pill-gray">—</span>';
  var s = v.join('；').toLowerCase();
  if (s.indexOf('安全') !== -1 || s.indexOf('泄露') !== -1) return '<span class="pill pill-red">安全风险</span>';
  if (s.indexOf('幻觉') !== -1 || s.indexOf('准确') !== -1 || s.indexOf('专业') !== -1) return '<span class="pill pill-amber">质量问题</span>';
  if (s.indexOf('速度') !== -1 || s.indexOf('响应') !== -1) return '<span class="pill pill-amber">效率问题</span>';
  if (s.indexOf('安装') !== -1 || s.indexOf('门槛') !== -1) return '<span class="pill pill-blue">门槛问题</span>';
  if (s.indexOf('良好') !== -1 || s.indexOf('无') !== -1) return '<span class="pill pill-green">无明显问题</span>';
  return '<span class="pill pill-gray">其他</span>';
}

function tagColor(t) {
  var s = t.toLowerCase();
  if (s.indexOf('安全') !== -1 || s.indexOf('泄露') !== -1 || s.indexOf('幻觉') !== -1 || s.indexOf('准确') !== -1) return ' red';
  if (s.indexOf('门槛') !== -1 || s.indexOf('不会') !== -1 || s.indexOf('吃力') !== -1 || s.indexOf('困难') !== -1) return ' amber';
  if (s.indexOf('极大') !== -1 || s.indexOf('顺畅') !== -1 || s.indexOf('良好') !== -1) return ' green';
  return '';
}

function tagsHtml(arr) {
  if (!arr || arr.length === 0) return '<span class="info-value muted">(未填写)</span>';
  var h = '<div class="tag-row">';
  arr.forEach(function(t) { h += '<span class="tag-dot' + tagColor(t) + '">' + esc(t) + '</span>'; });
  h += '</div>';
  return h;
}

function textHtml(v) {
  if (!v) return '<span class="info-value muted">(未填写)</span>';
  return '<span class="info-value">' + esc(String(v)) + '</span>';
}

/* Section definitions */
var SECTIONS = [
  {
    label: '基础画像与工具',
    rows: [
      { label: 'AI 频率', render: function(r) { return freqPill(r.q3_frequency); } },
      { label: '成员覆盖', render: function(r) { return textHtml(r.q_coverage); } },
      { label: 'AI 工具', render: function(r) { return tagsHtml(r.q4_tools); } },
    ]
  },
  {
    label: '智能办公',
    rows: [
      { label: '工作内容', render: function(r) { return tagsHtml(r.q5_work_types); } },
      { label: '使用方式', render: function(r) { return tagsHtml(r.q_office_habits); } },
    ]
  },
  {
    label: '智能研发',
    rows: [
      { label: '研发工具', render: function(r) { return tagsHtml(r.q_rd_tools); } },
      { label: '研发领域', render: function(r) { return tagsHtml(r.q_rd_domains); } },
    ]
  },
  {
    label: '效果与能力',
    rows: [
      { label: '帮助程度', render: function(r) { return helpPill(r.q6_help_level); } },
      { label: '效率提升', render: function(r) { return textHtml(r.q7_efficiency); } },
      { label: '掌握程度', render: function(r) { return profPill(r.q_proficiency); } },
    ]
  },
  {
    label: '问题与痛点',
    rows: [
      { label: '核心问题', render: function(r) { return problemPill(r.q9_core_problem) + ' ' + tagsHtml(r.q9_core_problem); } },
      { label: '遇到的问题', render: function(r) { return tagsHtml(r.q8_problems); } },
      { label: '输出短板', render: function(r) { return tagsHtml(r.q10_weakness); } },
      { label: '减少使用', render: function(r) { return tagsHtml(r.q11_reduced); } },
      { label: '未尝试场景', render: function(r) { return textHtml(r.q12_untried_scenarios); } },
    ]
  },
  {
    label: '期望与建议',
    rows: [
      { label: '推广态度', render: function(r) { return attPill(r.q_attitude); } },
      { label: '期望场景', render: function(r) { return tagsHtml(r.q13_desired_scenarios); } },
      { label: '期望支持', render: function(r) { return tagsHtml(r.q14_support_needs); } },
      { label: '意见建议', render: function(r) { return textHtml(r.q15_suggestions); } },
    ]
  },
];

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
      '<div class="empty-state"><h3>暂无提交数据</h3><p>等待团队提交问卷后，这里将展示详细报告。</p></div>';
    return;
  }
  renderAll();
}

function renderAll() {
  var parts = [];
  allResponses.forEach(function(r, idx) {
    var h = '<div class="team-card">';
    h += '<div class="card-head">';
    h += '<span class="team-name">' + (idx + 1) + '. ' + esc(r.team) + '</span>';
    h += '<span class="team-meta">' + esc(r.submitter || '') + ' · ' + (r.created_at || '').substring(0, 10) + '</span>';
    h += '</div>';
    h += '<div class="card-body">';

    SECTIONS.forEach(function(sec) {
      h += '<div class="section-label">' + sec.label + '</div>';
      sec.rows.forEach(function(row) {
        h += '<div class="info-row">';
        h += '<span class="info-label">' + row.label + '</span>';
        h += row.render(r);
        h += '</div>';
      });
    });

    h += '</div></div>';
    parts.push(h);
  });
  document.getElementById('reportContent').innerHTML = '<div class="team-grid">' + parts.join('') + '</div>';
}

document.addEventListener('DOMContentLoaded', init);
