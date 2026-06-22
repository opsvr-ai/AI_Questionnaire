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

  renderStats();
  renderCharts();
  renderTeamTable();
  bindActions();
}

function renderStats() {
  var pct = stats.total_teams > 0 ? Math.round((stats.submitted / stats.total_teams) * 100) : 0;
  var eff = (stats.help_levels['极大提升 — 大幅节省时间、提升质量、降低压力'] || 0)
    + (stats.help_levels['有效提升 — 对部分工作有明显辅助'] || 0);
  var effPct = stats.submitted > 0 ? Math.round((eff / stats.submitted) * 100) : 0;
  var toolCount = Object.keys(stats.tools).length;

  document.getElementById('statsRow').innerHTML =
    '<div class="stat-hero">' +
      ringSVG(pct) +
      '<div><div class="stat-value">' + stats.submitted + ' / ' + stats.total_teams + '</div>' +
      '<div class="stat-label">已完成提交的团队</div>' +
      (stats.unsubmitted.length > 0
        ? '<p class="text-sm text-muted" style="margin-top:4px;">剩余：' + stats.unsubmitted.join('、') + '</p>'
        : '<p class="text-sm" style="color:var(--c-success);margin-top:4px;">全部团队已完成提交</p>') +
      '</div></div>' +
    '<div class="stat-card">' +
      '<div class="stat-value" style="color:var(--c-accent);">' + effPct + '%</div>' +
      '<div class="stat-label">认为有效 / 极大提升</div></div>' +
    '<div class="stat-card">' +
      '<div class="stat-value">' + toolCount + ' 类</div>' +
      '<div class="stat-label">使用的 AI 工具</div></div>';
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

function renderCharts() {
  var c = document.getElementById('chartsRow');
  c.innerHTML = '';

  var freqLabels = ['频繁使用 — 每日都会用到', '经常使用 — 每周多次', '偶尔使用 — 每周 1-3 次', '极少使用 — 每月偶尔用', '从不使用'];
  var freqColors = ['#1E40AF', '#3B82F6', '#93C5FD', '#DBEAFE', '#E2E8F0'];
  c.appendChild(hbarChart('使用频率分布', stats.frequencies, freqLabels, freqColors));

  var problemKeys = Object.keys(stats.problems).sort(function(a, b) { return (stats.problems[b] || 0) - (stats.problems[a] || 0); });
  var problemColors = ['#DC2626', '#D97706', '#1E40AF', '#8B5CF6', '#06B6D4', '#16A34A', '#64748B', '#94A3B8'];
  c.appendChild(hbarChart('遇到的问题（多选）', stats.problems, problemKeys, problemColors));

  var helpLabels = ['极大提升 — 大幅节省时间、提升质量、降低压力', '有效提升 — 对部分工作有明显辅助', '一般 — 偶尔有帮助，不明显', '几乎无帮助 — 实用性低', '完全无帮助'];
  var helpColors = ['#16A34A', '#3B82F6', '#D97706', '#DC2626', '#94A3B8'];
  c.appendChild(hbarChart('帮助程度', stats.help_levels, helpLabels, helpColors));

  var supportKeys = Object.keys(stats.support_needs).sort(function(a, b) { return (stats.support_needs[b] || 0) - (stats.support_needs[a] || 0); });
  var supportColors = ['#1E40AF', '#3B82F6', '#06B6D4', '#8B5CF6', '#16A34A'];
  c.appendChild(hbarChart('期望的部门支持（多选）', stats.support_needs, supportKeys, supportColors));
}

function hbarChart(title, data, labels, colors) {
  var box = document.createElement('div');
  box.className = 'chart-box';
  box.innerHTML = '<h3>' + title + '</h3><div class="hbar"></div>';
  var hbar = box.querySelector('.hbar');
  var maxV = 1;
  var vals = Object.values(data);
  for (var i = 0; i < vals.length; i++) { if (vals[i] > maxV) maxV = vals[i]; }

  for (var i = 0; i < labels.length; i++) {
    var label = labels[i];
    var v = data[label] || 0;
    var w = Math.round((v / maxV) * 100);
    var short = label.length > 30 ? label.substring(0, 28) + '...' : label;
    var row = document.createElement('div');
    row.className = 'hbar-row';
    row.innerHTML = '<span class="hbar-label" title="' + label + '">' + short + '</span>' +
      '<div class="hbar-track"><div class="hbar-fill" style="width:' + w + '%;background:' + colors[i % colors.length] + ';"></div></div>' +
      '<span class="hbar-count">' + v + '</span>';
    hbar.appendChild(row);
  }

  if (labels.length === 0) {
    var valsAll = Object.values(data);
    var allZero = true;
    for (var j = 0; j < valsAll.length; j++) { if (valsAll[j] !== 0) { allZero = false; break; } }
    if (allZero) {
      hbar.innerHTML = '<p class="text-muted text-sm" style="padding:16px;text-align:center;">暂无数据</p>';
    }
  }
  return box;
}

function renderTeamTable() {
  var div = document.getElementById('teamTable');
  if (allResponses.length === 0) {
    div.innerHTML = '<div class="empty-state"><h3>暂无提交数据</h3><p>等待团队提交问卷后，这里将展示团队对比分析。</p></div>';
    return;
  }

  var h = '<table class="data-table"><thead><tr>';
  ['团队', '填写人', '使用频率', '工具数', '帮助程度', '核心问题', '期望支持', '提交时间'].forEach(function(hd) { h += '<th>' + hd + '</th>'; });
  h += '</tr></thead><tbody>';

  allResponses.forEach(function(r) {
    var tools = Array.isArray(r.q4_tools) ? r.q4_tools : [];
    var supports = Array.isArray(r.q14_support_needs) ? r.q14_support_needs : [];
    var cpArr = Array.isArray(r.q9_core_problem) ? r.q9_core_problem : [];
    var cp = cpArr.join('；');

    var fb = '', hb = '', pb = '';
    if ((r.q3_frequency || '').indexOf('频繁') !== -1) fb = '<span class="badge badge-green">频繁</span>';
    else if ((r.q3_frequency || '').indexOf('经常') !== -1) fb = '<span class="badge badge-blue">经常</span>';
    else if ((r.q3_frequency || '').indexOf('偶尔') !== -1) fb = '<span class="badge badge-amber">偶尔</span>';
    else fb = '<span class="badge badge-red">极少</span>';

    if ((r.q6_help_level || '').indexOf('极大') !== -1) hb = '<span class="badge badge-green">极大提升</span>';
    else if ((r.q6_help_level || '').indexOf('有效') !== -1) hb = '<span class="badge badge-blue">有效提升</span>';
    else hb = '<span class="badge badge-amber">一般</span>';

    var cpl = cp.toLowerCase();
    if (cpl.indexOf('安全') !== -1 || cpl.indexOf('泄露') !== -1) pb = '<span class="badge badge-red">安全风险</span>';
    else if (cpl.indexOf('专业') !== -1 || cpl.indexOf('幻觉') !== -1 || cpl.indexOf('准确') !== -1) pb = '<span class="badge badge-amber">质量问题</span>';
    else if (cpl.indexOf('速度') !== -1 || cpl.indexOf('响应') !== -1) pb = '<span class="badge badge-amber">效率问题</span>';
    else if (cpl.indexOf('安装') !== -1 || cpl.indexOf('门槛') !== -1) pb = '<span class="badge badge-blue">门槛问题</span>';
    else if (cpl.indexOf('良好') !== -1 || cpl.indexOf('无') !== -1) pb = '<span class="badge badge-green">无问题</span>';

    h += '<tr>';
    h += '<td style="font-weight:500;">' + r.team + '</td>';
    h += '<td>' + (r.submitter || '') + '</td>';
    h += '<td>' + fb + '</td>';
    h += '<td style="font-family:var(--font-mono);">' + tools.length + ' 个</td>';
    h += '<td>' + hb + '</td>';
    h += '<td>' + pb + ' ' + (cp ? '<span class="text-sm text-muted">' + cp.substring(0, 15) + (cp.length > 15 ? '...' : '') + '</span>' : '') + '</td>';
    h += '<td class="text-sm">' + supports.slice(0, 2).join('；') + (supports.length > 2 ? '...' : '') + '</td>';
    h += '<td class="text-sm text-muted">' + (r.created_at || '').substring(0, 10) + '</td>';
    h += '</tr>';
  });

  h += '</tbody></table>';
  div.innerHTML = h;
}

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

async function resetDatabase() {
  var confirmed = confirm('确认重置数据库？\n\n此操作将删除所有已提交的问卷数据，且不可恢复。');
  if (!confirmed) return;
  var doubleCheck = prompt('请输入 "确认重置" 以确认操作：');
  if (doubleCheck !== '确认重置') {
    alert('输入不匹配，操作已取消。');
    return;
  }
  try {
    var resp = await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: '确认重置' })
    });
    var data = await resp.json();
    if (resp.ok) {
      alert(data.message);
      location.reload();
    } else {
      alert('重置失败: ' + (data.error || '未知错误'));
    }
  } catch (e) {
    alert('网络错误，无法连接到服务器。');
  }
}

function exportCSV() { window.location.href = '/api/export'; }

document.addEventListener('DOMContentLoaded', init);
