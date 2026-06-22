/* === AI Survey Dashboard === */

var allResponses = [];
var stats = null;

async function init() {
  try {
    var r1 = await fetch('/api/responses');
    var r2 = await fetch('/api/stats');
    if (!r1.ok || !r2.ok) throw new Error('API error');
    allResponses = await r1.json();
    stats = await r2.json();
  } catch (e) {
    document.querySelector('.container').innerHTML =
      '<div class="empty-state"><h3>加载失败</h3><p>无法连接到服务器，请确认服务已启动。</p><a href="/" class="btn mt-24">返回填报页</a></div>';
    return;
  }

  document.getElementById('updateTime').textContent = new Date().toLocaleString('zh-CN');
  document.getElementById('submitCount').textContent = stats.submitted;
  document.getElementById('totalCount').textContent = stats.total_teams;

  renderOverview();
  renderSection('智能办公', [
    hbarChart('办公工作内容', stats.work_types || {}, topKeys(stats.work_types || {}, 12), C.office),
    hbarChart('办公使用方式', stats.office_habits || {}, topKeys(stats.office_habits || {}, 12), C.office),
  ]);
  renderSection('智能研发', [
    hbarChart('研发 AI 工具', stats.rd_tools || {}, topKeys(stats.rd_tools || {}, 10), C.rd),
    hbarChart('研发涉及领域', stats.rd_domains || {}, topKeys(stats.rd_domains || {}, 12), C.domain),
  ]);
  renderSection('画像分析', [
    hbarChart('AI 使用频率', stats.frequencies || {}, FREQ_LABELS, C.freq),
    hbarChart('成员覆盖比例', stats.coverages || {}, COV_LABELS, C.cov),
    hbarChart('掌握程度', stats.proficiencies || {}, PROF_LABELS, C.prof),
    hbarChart('推广态度', stats.attitudes || {}, ATT_LABELS, C.att),
  ]);
  renderSection('效果评估', [
    hbarChart('帮助程度', stats.help_levels || {}, HELP_LABELS, C.help),
    hbarChart('效率提升幅度', stats.efficiencies || {}, EFF_LABELS, C.eff),
  ]);
  renderSection('问题与痛点', [
    hbarChart('遇到的问题', stats.problems || {}, topKeys(stats.problems || {}, 10), C.problem),
    hbarChart('最大核心问题', stats.core_problems || {}, topKeys(stats.core_problems || {}, 8), C.core),
    hbarChart('输出内容短板', stats.weaknesses || {}, topKeys(stats.weaknesses || {}, 8), C.weak),
  ]);
  renderSection('期望与需求', [
    hbarChart('期望赋能的场景', stats.desired_scenarios || {}, topKeys(stats.desired_scenarios || {}, 10), C.desire),
    hbarChart('期望的部门支持', stats.support_needs || {}, topKeys(stats.support_needs || {}, 6), C.support),
  ]);
  renderTeamTable();
  bindActions();
}

// === Labels ===
var FREQ_LABELS = ['频繁使用 — 每日都会用到', '经常使用 — 每周多次', '偶尔使用 — 每周 1-3 次', '极少使用 — 每月偶尔用', '从不使用'];
var COV_LABELS  = ['绝大多数（80% 以上）', '超过一半（50%-80%）', '约一半（30%-50%）', '少部分（10%-30%）', '极少数（不足 10%）', '完全没有人使用'];
var PROF_LABELS = ['非常熟练 — 能自主开发工作流、调教出高质量输出', '比较熟练 — 能高效提问、持续优化结果', '一般 — 基本使用没问题，但不会高级技巧', '入门 — 只会简单提问，经常得不到想要的结果', '很吃力 — 不知道怎么用，需要大量指导'];
var ATT_LABELS  = ['非常支持 — 愿意积极参与试点和推广', '支持 — 有需要时会配合使用', '中立 — 观望中，看其他团队效果再说', '不太支持 — 担心影响现有工作节奏', '反对 — 认为不适合团队实际情况'];
var HELP_LABELS = ['极大提升 — 大幅节省时间、提升质量、降低压力', '有效提升 — 对部分工作有明显辅助', '一般 — 偶尔有帮助，不明显', '几乎无帮助 — 实用性低', '完全无帮助'];
var EFF_LABELS  = ['提升 50% 以上', '提升 30%-50%', '提升 10%-30%', '提升不足 10%', '无明显提升'];

var C = {
  freq:    ['#1E40AF','#3B82F6','#93C5FD','#DBEAFE','#E2E8F0'],
  cov:     ['#1E40AF','#3B82F6','#93C5FD','#DBEAFE','#CBD5E1','#E2E8F0'],
  prof:    ['#16A34A','#3B82F6','#D97706','#F59E0B','#DC2626'],
  att:     ['#16A34A','#3B82F6','#D97706','#F59E0B','#DC2626'],
  help:    ['#16A34A','#3B82F6','#D97706','#DC2626','#94A3B8'],
  eff:     ['#16A34A','#3B82F6','#D97706','#F59E0B','#94A3B8'],
  office:  ['#1E40AF','#3B82F6','#6366F1','#8B5CF6','#06B6D4','#0EA5E9','#14B8A6','#10B981','#2563EB','#7C3AED'],
  rd:      ['#DC2626','#EA580C','#D97706','#F59E0B','#16A34A','#059669','#0284C7','#2563EB','#7C3AED','#C026D3'],
  domain:  ['#2563EB','#7C3AED','#DC2626','#EA580C','#16A34A','#0EA5E9','#D97706','#059669','#6366F1','#0891B2','#C026D3','#4F46E5'],
  problem: ['#DC2626','#EA580C','#D97706','#F59E0B','#8B5CF6','#3B82F6','#64748B','#94A3B8'],
  core:    ['#DC2626','#EA580C','#D97706','#8B5CF6','#3B82F6','#16A34A','#64748B','#94A3B8'],
  weak:    ['#DC2626','#EA580C','#D97706','#F59E0B','#8B5CF6','#3B82F6','#64748B','#94A3B8'],
  desire:  ['#1E40AF','#3B82F6','#6366F1','#8B5CF6','#06B6D4','#0EA5E9','#14B8A6','#10B981','#2563EB','#7C3AED'],
  support: ['#1E40AF','#3B82F6','#06B6D4','#8B5CF6','#16A34A','#94A3B8'],
};

function topKeys(obj, n) {
  return Object.keys(obj).sort(function(a,b){ return (obj[b]||0) - (obj[a]||0); }).slice(0, n);
}

// === Overview Cards ===
function renderOverview() {
  var pct = stats.total_teams > 0 ? Math.round((stats.submitted / stats.total_teams) * 100) : 0;
  var eff = (stats.help_levels[HELP_LABELS[0]] || 0) + (stats.help_levels[HELP_LABELS[1]] || 0);
  var effPct = stats.submitted > 0 ? Math.round((eff / stats.submitted) * 100) : 0;
  var rdCount = Object.keys(stats.rd_tools || {}).filter(function(k){ return (stats.rd_tools[k] || 0) > 0 && k.indexOf('未涉及') === -1; }).length;
  var profTop = (stats.proficiencies[PROF_LABELS[0]] || 0) + (stats.proficiencies[PROF_LABELS[1]] || 0);
  var profPct = stats.submitted > 0 ? Math.round((profTop / stats.submitted) * 100) : 0;

  document.getElementById('statsRow').innerHTML =
    '<div class="stat-hero">' + ringSVG(pct) +
      '<div><div class="stat-value">' + stats.submitted + ' / ' + stats.total_teams + '</div>' +
      '<div class="stat-label">已完成提交的团队</div>' +
      (stats.unsubmitted.length > 0
        ? '<p class="text-sm text-muted" style="margin-top:4px;">剩余：' + stats.unsubmitted.join('、') + '</p>'
        : '<p class="text-sm" style="color:var(--c-success);margin-top:4px;">全部团队已完成提交</p>') +
      '</div></div>' +
    '<div class="stat-card"><div class="stat-value" style="color:var(--c-accent);">' + effPct + '%</div><div class="stat-label">认为有效 / 极大提升</div></div>' +
    '<div class="stat-card"><div class="stat-value">' + rdCount + ' 种</div><div class="stat-label">研发 AI 工具</div></div>' +
    '<div class="stat-card"><div class="stat-value" style="color:#16A34A;">' + profPct + '%</div><div class="stat-label">掌握程度熟练以上</div></div>';
}

function ringSVG(pct) {
  var r = 34, circ = 2 * Math.PI * r, off = circ - (pct / 100) * circ;
  return '<svg width="80" height="80" viewBox="0 0 80 80" style="flex-shrink:0;">' +
    '<circle cx="40" cy="40" r="' + r + '" fill="none" stroke="var(--c-border)" stroke-width="6"/>' +
    '<circle cx="40" cy="40" r="' + r + '" fill="none" stroke="var(--c-primary)" stroke-width="6"' +
    ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + off + '" stroke-linecap="round" transform="rotate(-90 40 40)"/>' +
    '<text x="40" y="38" text-anchor="middle" font-size="18" font-weight="600" fill="var(--c-text)" font-family="var(--font-mono)">' + pct + '%</text>' +
    '<text x="40" y="52" text-anchor="middle" font-size="9" fill="var(--c-text-muted)">完成率</text></svg>';
}

// === Section Renderer ===
function renderSection(title, charts) {
  var section = document.createElement('div');
  section.style.cssText = 'margin-bottom:32px;';

  var h3 = document.createElement('h3');
  h3.style.cssText = 'margin-bottom:12px;';
  h3.textContent = title;
  section.appendChild(h3);

  var grid = document.createElement('div');
  grid.className = 'charts-grid';
  charts.forEach(function(c) { if (c) grid.appendChild(c); });
  section.appendChild(grid);

  document.getElementById('statsRow').parentNode.insertBefore(section, document.getElementById('teamTable').parentNode);
}

// === HBar Chart ===
function hbarChart(title, data, labels, colors) {
  var box = document.createElement('div');
  box.className = 'chart-box';
  box.innerHTML = '<h3>' + title + '</h3><div class="hbar"></div>';
  var hbar = box.querySelector('.hbar');

  if (!data || labels.length === 0) {
    hbar.innerHTML = '<p class="text-muted text-sm" style="padding:16px;text-align:center;">暂无数据</p>';
    return box;
  }

  var maxV = 1;
  labels.forEach(function(l) { var v = data[l] || 0; if (v > maxV) maxV = v; });
  if (maxV === 0) {
    hbar.innerHTML = '<p class="text-muted text-sm" style="padding:16px;text-align:center;">暂无数据</p>';
    return box;
  }

  labels.forEach(function(label, i) {
    var v = data[label] || 0;
    var w = Math.round((v / maxV) * 100);
    var short = label.length > 30 ? label.substring(0, 28) + '...' : label;
    var row = document.createElement('div');
    row.className = 'hbar-row';
    row.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:10px;';
    row.innerHTML =
      '<span class="hbar-label" title="' + label + '">' + short + '</span>' +
      '<div class="hbar-track"><div class="hbar-fill" style="width:' + w + '%;background:' + colors[i % colors.length] + ';"></div></div>' +
      '<span class="hbar-count">' + v + '</span>';
    hbar.appendChild(row);
  });
  return box;
}

// === Team Table ===
function renderTeamTable() {
  var wrap = document.getElementById('teamTable').parentNode;
  var div = document.getElementById('teamTable');
  if (allResponses.length === 0) {
    div.innerHTML = '<div class="empty-state"><h3>暂无提交数据</h3><p>等待团队提交问卷后，这里将展示团队对比分析。</p></div>';
    return;
  }

  var h = '<table class="data-table"><thead><tr>';
  ['团队', '填写人', '使用频率', '覆盖率', '掌握程度', '帮助程度', '研发领域', '核心问题', '推广态度', '提交时间'].forEach(function(hd) { h += '<th>' + hd + '</th>'; });
  h += '</tr></thead><tbody>';

  allResponses.forEach(function(r) {
    var rdDomains = Array.isArray(r.q_rd_domains) ? r.q_rd_domains.filter(function(d){ return d.indexOf('未涉及') === -1; }) : [];
    var cpArr = Array.isArray(r.q9_core_problem) ? r.q9_core_problem : [];
    var cp = cpArr.join('；');

    var fb = badge(r.q3_frequency || '', {'频繁':'green','经常':'blue','偶尔':'amber'}, 'red');
    var cb = badge(r.q_coverage || '', {'绝大多数':'green','超过一半':'blue','约一半':'amber'}, 'red');
    var pb = badge(r.q_proficiency || '', {'非常熟练':'green','比较熟练':'blue','一般':'amber'}, 'red');
    var hb = badge(r.q6_help_level || '', {'极大':'green','有效':'blue'}, 'amber');
    var ab = badge(r.q_attitude || '', {'非常支持':'green','支持':'blue','中立':'amber'}, 'red');

    var cpl = cp.toLowerCase();
    var pbb = '';
    if (cpl.indexOf('安全') !== -1 || cpl.indexOf('泄露') !== -1) pbb = '<span class="badge badge-red">安全风险</span>';
    else if (cpl.indexOf('专业') !== -1 || cpl.indexOf('幻觉') !== -1 || cpl.indexOf('准确') !== -1) pbb = '<span class="badge badge-amber">质量问题</span>';
    else if (cpl.indexOf('速度') !== -1 || cpl.indexOf('响应') !== -1) pbb = '<span class="badge badge-amber">效率问题</span>';
    else if (cpl.indexOf('安装') !== -1 || cpl.indexOf('门槛') !== -1) pbb = '<span class="badge badge-blue">门槛问题</span>';
    else if (cpl.indexOf('良好') !== -1 || cpl.indexOf('无') !== -1) pbb = '<span class="badge badge-green">无问题</span>';

    h += '<tr>';
    h += '<td style="font-weight:500;">' + r.team + '</td>';
    h += '<td class="text-sm">' + (r.submitter || '') + '</td>';
    h += '<td>' + fb + '</td>';
    h += '<td>' + cb + '</td>';
    h += '<td>' + pb + '</td>';
    h += '<td>' + hb + '</td>';
    h += '<td class="text-sm">' + (rdDomains.length > 0 ? rdDomains.slice(0,2).join('；') + (rdDomains.length > 2 ? '…' : '') : '—') + '</td>';
    h += '<td>' + pbb + (cp ? ' <span class="text-sm text-muted">' + cp.substring(0,12) + (cp.length > 12 ? '…' : '') + '</span>' : '') + '</td>';
    h += '<td>' + ab + '</td>';
    h += '<td class="text-sm text-muted">' + (r.created_at || '').substring(0, 10) + '</td>';
    h += '</tr>';
  });

  h += '</tbody></table>';
  div.innerHTML = h;
}

function badge(val, map, def) {
  var cls = def || 'red';
  Object.keys(map).forEach(function(k) { if (val.indexOf(k) !== -1) cls = map[k]; });
  var labels = {green:'', blue:'', amber:'', red:''};
  var name = val.substring(0, 8);
  if (cls === 'green') name = val.replace(/ —.*/,'');
  return '<span class="badge badge-' + cls + '">' + name + '</span>';
}

// === Actions ===
function bindActions() {
  document.getElementById('toggleRaw').onclick = function() {
    var div = document.getElementById('rawData');
    var btn = document.getElementById('toggleRaw');
    if (div.style.display === 'none') {
      div.style.display = 'block';
      div.innerHTML = '<div class="table-wrap"><h3>原始数据</h3>' +
        '<pre style="padding:20px;font-size:12px;overflow-x:auto;font-family:var(--font-mono);white-space:pre-wrap;">' +
        JSON.stringify(allResponses, null, 2) + '</pre></div>';
      btn.textContent = '隐藏原始数据';
    } else { div.style.display = 'none'; btn.textContent = '查看原始数据'; }
  };
}

function exportCSV() { window.location.href = '/api/export'; }

document.addEventListener('DOMContentLoaded', init);
