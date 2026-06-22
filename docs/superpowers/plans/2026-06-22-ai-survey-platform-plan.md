# AI Survey Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Flask + SQLite web app with multi-step survey form and data analysis dashboard for 11 IT ops teams.

**Architecture:** Single Flask app serving static HTML/CSS/JS frontend. SQLite for persistence with WAL mode. Vanilla JS with SVG charts — zero external frontend dependencies. All multi-select answers stored as JSON arrays in a single `responses` table.

**Tech Stack:** Python 3, Flask, SQLite, vanilla HTML/CSS/JS

---

### Task 1: Project Skeleton & Flask App

**Files:**
- Create: `E:\dev\AI使用情况问卷调查\requirements.txt`
- Create: `E:\dev\AI使用情况问卷调查\app.py`

- [ ] **Step 1: Write requirements.txt**

```
flask>=3.0
```

- [ ] **Step 2: Write app.py — Flask app with DB init and team list**

```python
"""AI Survey Platform — Flask Backend"""
import sqlite3
import json
import csv
import io
from datetime import datetime
from flask import Flask, request, jsonify, send_file, send_from_directory

app = Flask(__name__, static_folder='static', static_url_path='')

TEAMS = [
    "托管系统运维团队", "数据库运维组", "生产调度团队",
    "商务管理团队", "网络运维团队", "流程管理组",
    "运行监控团队", "运维平台支撑团队", "主机运维团队",
    "测试环境支持团队", "中间件运维团队"
]

DB_PATH = 'survey.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team TEXT NOT NULL UNIQUE,
                submitter TEXT NOT NULL,
                q3_frequency TEXT,
                q4_tools TEXT DEFAULT '[]',
                q5_work_types TEXT DEFAULT '[]',
                q6_help_level TEXT,
                q7_efficiency TEXT,
                q8_problems TEXT DEFAULT '[]',
                q9_core_problem TEXT DEFAULT '[]',
                q10_weakness TEXT DEFAULT '[]',
                q11_reduced TEXT DEFAULT '[]',
                q12_untried_scenarios TEXT DEFAULT '',
                q13_desired_scenarios TEXT DEFAULT '[]',
                q14_support_needs TEXT DEFAULT '[]',
                q15_suggestions TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

init_db()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/dashboard')
def dashboard():
    return send_from_directory('static', 'dashboard.html')
```

- [ ] **Step 3: Install dependencies and verify app starts**

```bash
cd "E:\dev\AI使用情况问卷调查" && pip install -r requirements.txt && python -c "from app import app; print('Flask app loaded OK')"
```

Expected: Prints "Flask app loaded OK"

- [ ] **Step 4: Commit**

```bash
git add requirements.txt app.py && git commit -m "feat: Flask skeleton with DB init"
```

---

### Task 2: API Endpoints

**Files:**
- Modify: `E:\dev\AI使用情况问卷调查\app.py` — append after dashboard route

- [ ] **Step 1: Add GET /api/teams endpoint**

```python
@app.route('/api/teams')
def api_teams():
    return jsonify(TEAMS)
```

- [ ] **Step 2: Add GET /api/submissions — list submitted team names**

```python
@app.route('/api/submissions')
def api_submissions():
    with get_db() as conn:
        rows = conn.execute('SELECT team FROM responses').fetchall()
    return jsonify([r['team'] for r in rows])
```

- [ ] **Step 3: Add POST /api/submit — create or update a response**

```python
@app.route('/api/submit', methods=['POST'])
def api_submit():
    data = request.get_json()
    if not data:
        return jsonify({'error': '请求数据为空'}), 400

    team = data.get('team', '').strip()
    if team not in TEAMS:
        return jsonify({'error': '无效的团队名称'}), 400

    submitter = data.get('submitter', '').strip()
    if not submitter:
        return jsonify({'error': '填写人不能为空'}), 400

    fields = {
        'team': team,
        'submitter': submitter,
        'q3_frequency': data.get('q3_frequency', ''),
        'q4_tools': json.dumps(data.get('q4_tools', []), ensure_ascii=False),
        'q5_work_types': json.dumps(data.get('q5_work_types', []), ensure_ascii=False),
        'q6_help_level': data.get('q6_help_level', ''),
        'q7_efficiency': data.get('q7_efficiency', ''),
        'q8_problems': json.dumps(data.get('q8_problems', []), ensure_ascii=False),
        'q9_core_problem': json.dumps(data.get('q9_core_problem', []), ensure_ascii=False),
        'q10_weakness': json.dumps(data.get('q10_weakness', []), ensure_ascii=False),
        'q11_reduced': json.dumps(data.get('q11_reduced', []), ensure_ascii=False),
        'q12_untried_scenarios': data.get('q12_untried_scenarios', ''),
        'q13_desired_scenarios': json.dumps(data.get('q13_desired_scenarios', []), ensure_ascii=False),
        'q14_support_needs': json.dumps(data.get('q14_support_needs', []), ensure_ascii=False),
        'q15_suggestions': data.get('q15_suggestions', ''),
    }

    with get_db() as conn:
        existing = conn.execute('SELECT id FROM responses WHERE team = ?', (team,)).fetchone()
        if existing:
            fields['updated_at'] = datetime.now().isoformat()
            placeholders = ', '.join(f'{k} = ?' for k in fields)
            values = list(fields.values()) + [team]
            conn.execute(f'UPDATE responses SET {placeholders} WHERE team = ?', values)
            is_new = False
        else:
            columns = ', '.join(fields.keys())
            placeholders = ', '.join('?' for _ in fields)
            conn.execute(f'INSERT INTO responses ({columns}) VALUES ({placeholders})', list(fields.values()))
            is_new = True

    return jsonify({
        'success': True,
        'is_new': is_new,
        'team': team,
        'message': '提交成功' if is_new else '更新成功'
    }), (201 if is_new else 200)
```

- [ ] **Step 4: Add GET /api/responses — all responses for dashboard**

```python
@app.route('/api/responses')
def api_responses():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM responses ORDER BY created_at DESC').fetchall()
    result = []
    for row in rows:
        r = dict(row)
        # Parse JSON fields
        for key in ['q4_tools', 'q5_work_types', 'q8_problems', 'q9_core_problem',
                     'q10_weakness', 'q11_reduced', 'q13_desired_scenarios', 'q14_support_needs']:
            try:
                r[key] = json.loads(r[key])
            except (json.JSONDecodeError, TypeError):
                r[key] = []
        result.append(r)
    return jsonify(result)
```

- [ ] **Step 5: Add GET /api/stats — pre-computed statistics**

```python
@app.route('/api/stats')
def api_stats():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM responses').fetchall()

    total_teams = len(TEAMS)
    submitted = len(rows)
    stats = {
        'total_teams': total_teams,
        'submitted': submitted,
        'unsubmitted': [t for t in TEAMS if not any(r['team'] == t for r in rows)],
        'frequencies': {},
        'help_levels': {},
        'efficiencies': {},
        'tools': {},
        'problems': {},
        'core_problems': {},
        'weaknesses': {},
        'desired_scenarios': {},
        'support_needs': {},
    }

    for row in rows:
        r = dict(row)
        # Count frequencies
        f = r.get('q3_frequency', '')
        if f:
            stats['frequencies'][f] = stats['frequencies'].get(f, 0) + 1

        h = r.get('q6_help_level', '')
        if h:
            stats['help_levels'][h] = stats['help_levels'].get(h, 0) + 1

        e = r.get('q7_efficiency', '')
        if e:
            stats['efficiencies'][e] = stats['efficiencies'].get(e, 0) + 1

        # Count multi-select fields
        for field, key in [('q4_tools', 'tools'), ('q8_problems', 'problems'),
                           ('q9_core_problem', 'core_problems'),
                           ('q10_weakness', 'weaknesses'),
                           ('q13_desired_scenarios', 'desired_scenarios'),
                           ('q14_support_needs', 'support_needs')]:
            try:
                items = json.loads(r.get(field, '[]'))
            except (json.JSONDecodeError, TypeError):
                items = []
            for item in items:
                stats[key][item] = stats[key].get(item, 0) + 1

    return jsonify(stats)
```

- [ ] **Step 6: Add GET /api/export — CSV export**

```python
@app.route('/api/export')
def api_export():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM responses ORDER BY team').fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['团队', '填写人', 'AI使用频率', '使用工具', '工作内容',
                     '帮助程度', '效率提升', '遇到的问题', '核心问题',
                     '最大短板', '是否减少使用', '未尝试场景',
                     '期望场景', '期望支持', '意见建议', '提交时间'])

    for row in rows:
        r = dict(row)
        writer.writerow([
            r['team'], r['submitter'], r.get('q3_frequency', ''),
            r.get('q4_tools', ''), r.get('q5_work_types', ''),
            r.get('q6_help_level', ''), r.get('q7_efficiency', ''),
            r.get('q8_problems', ''), r.get('q9_core_problem', ''),
            r.get('q10_weakness', ''), r.get('q11_reduced', ''),
            r.get('q12_untried_scenarios', ''), r.get('q13_desired_scenarios', ''),
            r.get('q14_support_needs', ''), r.get('q15_suggestions', ''),
            r.get('created_at', '')
        ])

    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'survey-export-{datetime.now().strftime("%Y%m%d")}.csv'
    )
```

- [ ] **Step 7: Add DELETE /api/responses/<id> — admin delete**

```python
@app.route('/api/responses/<int:response_id>', methods=['DELETE'])
def api_delete(response_id):
    with get_db() as conn:
        conn.execute('DELETE FROM responses WHERE id = ?', (response_id,))
    return jsonify({'success': True, 'message': '已删除'})
```

- [ ] **Step 8: Add app.run() at bottom of app.py**

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

- [ ] **Step 9: Test API endpoints**

Start server in background, then test:
```bash
# Terminal 1
cd "E:\dev\AI使用情况问卷调查" && python app.py &

# Terminal 2
curl -s http://localhost:5000/api/teams | python -m json.tool
curl -s http://localhost:5000/api/submissions | python -m json.tool
curl -s -X POST http://localhost:5000/api/submit \
  -H "Content-Type: application/json" \
  -d '{"team":"数据库运维组","submitter":"测试","q3_frequency":"频繁使用"}' | python -m json.tool
curl -s http://localhost:5000/api/stats | python -m json.tool
```

- [ ] **Step 10: Commit**

```bash
git add app.py && git commit -m "feat: add all API endpoints"
```

---

### Task 3: Shared CSS Design System

**Files:**
- Create: `E:\dev\AI使用情况问卷调查\static\style.css`

- [ ] **Step 1: Write style.css — full design system**

```css
/* === AI Survey Platform — Design System === */
/* Color tokens, typography, layout, shared components */

:root {
  --c-primary: #1E40AF;
  --c-primary-hover: #1E3A8A;
  --c-primary-light: #EFF6FF;
  --c-secondary: #3B82F6;
  --c-accent: #D97706;
  --c-accent-light: #FFFBEB;
  --c-bg: #F8FAFC;
  --c-surface: #FFFFFF;
  --c-text: #0F172A;
  --c-text-secondary: #64748B;
  --c-text-muted: #94A3B8;
  --c-border: #E2E8F0;
  --c-border-light: #F1F5F9;
  --c-error: #DC2626;
  --c-error-light: #FEF2F2;
  --c-success: #16A34A;
  --c-success-light: #F0FDF4;

  --font-mono: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  --font-sans: 'Fira Sans', 'Segoe UI', system-ui, -apple-system, sans-serif;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-full: 50%;
}

/* === Reset === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: var(--c-text);
  background: var(--c-bg);
  -webkit-font-smoothing: antialiased;
}

/* === Typography === */
.eyebrow {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--c-primary); font-weight: 600;
}
h1 { font-family: var(--font-mono); font-size: 22px; font-weight: 500; color: var(--c-text); }
h2 { font-family: var(--font-mono); font-size: 16px; font-weight: 500; color: var(--c-text); }
h3 { font-family: var(--font-mono); font-size: 13px; font-weight: 500; color: var(--c-text-secondary);
     text-transform: uppercase; letter-spacing: 0.04em; }
p { color: var(--c-text-secondary); }
a { color: var(--c-primary); text-decoration: none; }
a:hover { text-decoration: underline; }

/* === Layout === */
.container { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
.page-header { border-bottom: 1px solid var(--c-border); padding-bottom: 24px; margin-bottom: 40px; }
.page-header p { margin-top: 6px; max-width: 560px; line-height: 1.6; }
.section { margin-bottom: 36px; }
.section-header { border-left: 2px solid var(--c-primary); padding-left: 20px; margin-bottom: 20px; }
.section-header h3 { margin-bottom: 4px; }
.section-header .q-title { font-size: 15px; font-weight: 500; color: var(--c-text); line-height: 1.5; }

/* === Buttons === */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: var(--radius-md); font-size: 14px;
  font-weight: 500; font-family: var(--font-sans); cursor: pointer;
  transition: all 0.15s ease; border: 1px solid var(--c-border);
  background: var(--c-surface); color: var(--c-text-secondary);
}
.btn:hover { border-color: #CBD5E1; background: var(--c-bg); color: var(--c-text); }
.btn:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.btn-primary { background: var(--c-primary); color: #FFF; border-color: var(--c-primary); }
.btn-primary:hover { background: var(--c-primary-hover); border-color: var(--c-primary-hover); }
.btn-danger { color: var(--c-error); border-color: var(--c-error); }
.btn-danger:hover { background: var(--c-error-light); }
.btn-sm { padding: 6px 14px; font-size: 13px; }

/* === Form Controls === */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; color: var(--c-text-secondary); margin-bottom: 6px; }
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 10px 14px; border: 1px solid var(--c-border); border-radius: var(--radius-md);
  font-size: 14px; color: var(--c-text); background: var(--c-surface);
  font-family: var(--font-sans); transition: border-color 0.15s;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none; border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}
.form-textarea { min-height: 100px; resize: vertical; }
.form-hint { font-size: 12px; color: var(--c-text-muted); margin-top: 4px; }
.form-error { font-size: 12px; color: var(--c-error); margin-top: 4px; }

/* === Radio & Checkbox Cards === */
.option-group { display: flex; flex-direction: column; gap: 6px; }
.option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.option-card {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  border: 1px solid var(--c-border); border-radius: var(--radius-md);
  cursor: pointer; font-size: 14px; color: var(--c-text);
  transition: border-color 0.15s, background 0.15s; user-select: none;
}
.option-card:hover { border-color: #93C5FD; background: var(--c-bg); }
.option-card.selected { border-color: var(--c-primary); background: var(--c-primary-light); }
.option-card input[type="radio"], .option-card input[type="checkbox"] {
  accent-color: var(--c-primary); margin: 0; flex-shrink: 0;
}

/* === Tag Input === */
.tag-area {
  border: 1px solid var(--c-border); border-radius: var(--radius-lg);
  padding: 12px; background: var(--c-bg); margin-top: 12px;
}
.tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; min-height: 0; }
.tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: var(--radius-sm);
  font-size: 13px; background: var(--c-primary-light);
  border: 1px solid #BFDBFE; color: var(--c-primary);
  font-family: var(--font-mono);
}
.tag .tag-remove {
  cursor: pointer; color: var(--c-text-muted); font-size: 14px; line-height: 1;
  border: none; background: none; padding: 0;
}
.tag .tag-remove:hover { color: var(--c-error); }
.tag-input-row {
  display: flex; align-items: center; gap: 8px;
  border: 1px dashed #CBD5E1; border-radius: var(--radius-md);
  padding: 6px 12px; background: var(--c-surface);
}
.tag-input-row:focus-within { border-color: var(--c-primary); border-style: solid; }
.tag-input-row input {
  border: none; outline: none; flex: 1; font-size: 13px; color: var(--c-text);
  font-family: var(--font-mono); background: transparent;
}
.tag-input-row input::placeholder { color: var(--c-text-muted); }

/* === Step Progress === */
.step-progress { display: flex; margin-bottom: 40px; }
.step-progress .step {
  flex: 1; display: flex; align-items: center; gap: 10px; position: relative;
}
.step-progress .step::after {
  content: ''; flex: 1; height: 1px; background: var(--c-border); margin-left: 10px;
}
.step-progress .step:last-child::after { display: none; }
.step-progress .step-num {
  width: 28px; height: 28px; border-radius: var(--radius-full);
  border: 1px solid #CBD5E1; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 500; color: var(--c-text-muted);
  font-family: var(--font-mono); flex-shrink: 0; transition: all 0.2s;
}
.step-progress .step.active .step-num {
  background: var(--c-primary); border-color: var(--c-primary); color: #FFF;
}
.step-progress .step.done .step-num {
  background: var(--c-success-light); border-color: var(--c-success); color: var(--c-success);
}
.step-progress .step-label {
  font-size: 13px; color: var(--c-text-muted); font-weight: 400; white-space: nowrap;
}
.step-progress .step.active .step-label { color: var(--c-primary); font-weight: 500; }
.step-progress .step.done .step-label { color: var(--c-success); }

/* === Cards & Surface === */
.card {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: var(--radius-lg); padding: 24px;
}

/* === Stats === */
.stats-row {
  display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; margin-bottom: 32px;
}
.stat-hero {
  border: 1px solid var(--c-border); border-radius: var(--radius-lg);
  padding: 24px; background: var(--c-surface);
  display: flex; align-items: center; gap: 24px;
}
.stat-hero .stat-value { font-size: 28px; font-weight: 600; font-family: var(--font-mono); }
.stat-hero .stat-label { font-size: 13px; color: var(--c-text-secondary); }
.stat-card {
  border: 1px solid var(--c-border); border-radius: var(--radius-lg);
  padding: 20px; background: var(--c-surface);
  display: flex; flex-direction: column; justify-content: center;
}
.stat-card .stat-value { font-size: 26px; font-weight: 600; font-family: var(--font-mono); }
.stat-card .stat-label { font-size: 13px; color: var(--c-text-secondary); margin-top: 2px; }

/* === Chart === */
.chart-box {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: var(--radius-lg); padding: 20px;
}
.chart-box h3 { margin-bottom: 16px; }

/* === Table === */
.table-wrap {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: var(--radius-lg); overflow: hidden;
}
.table-wrap h3 {
  padding: 16px 20px; border-bottom: 1px solid var(--c-border); margin: 0;
}
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th {
  text-align: left; padding: 10px 20px; border-bottom: 1px solid var(--c-border);
  color: var(--c-text-muted); font-weight: 500; font-size: 11px;
  text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; user-select: none;
}
.data-table th:hover { color: var(--c-text-secondary); }
.data-table td { padding: 12px 20px; border-bottom: 1px solid var(--c-border-light); }
.data-table tr:hover td { background: var(--c-bg); }
.badge {
  display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 500;
}
.badge-red { background: var(--c-error-light); color: var(--c-error); }
.badge-amber { background: var(--c-accent-light); color: var(--c-accent); }
.badge-green { background: var(--c-success-light); color: var(--c-success); }
.badge-blue { background: var(--c-primary-light); color: var(--c-primary); }

/* === Toast & Messages === */
.toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 1000;
  padding: 14px 20px; border-radius: var(--radius-md);
  font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  animation: toast-in 0.3s ease; max-width: 400px;
}
.toast-success { background: var(--c-success); color: #FFF; }
.toast-error { background: var(--c-error); color: #FFF; }
@keyframes toast-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

/* === Utility === */
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.gap-12 { gap: 12px; }
.mt-16 { margin-top: 16px; }
.mt-24 { margin-top: 24px; }
.mb-16 { margin-bottom: 16px; }
.text-center { text-align: center; }
.text-muted { color: var(--c-text-muted); }
.text-sm { font-size: 13px; }

/* === Loading & Empty === */
.loading { display: flex; align-items: center; justify-content: center; padding: 48px; color: var(--c-text-muted); }
.loading::after { content: ''; width: 24px; height: 24px; border: 2px solid var(--c-border); border-top-color: var(--c-primary); border-radius: 50%; animation: spin 0.6s linear infinite; margin-left: 10px; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 64px 24px; color: var(--c-text-secondary); }
.empty-state h3 { margin-bottom: 8px; }

/* === Responsive === */
@media (max-width: 768px) {
  .container { padding: 20px 16px; }
  .stats-row { grid-template-columns: 1fr; }
  .option-grid { grid-template-columns: 1fr; }
  .step-progress .step-label { display: none; }
  .step-progress .step::after { margin-left: 4px; }
  .stat-hero { flex-direction: column; text-align: center; }
}
@media (max-width: 480px) {
  h1 { font-size: 18px; }
  .btn { padding: 8px 16px; font-size: 13px; }
}
```

- [ ] **Step 2: Commit**

```bash
git add static/style.css && git commit -m "feat: add shared CSS design system"
```

---

### Task 4: Survey Form Page (HTML + JS)

**Files:**
- Create: `E:\dev\AI使用情况问卷调查\static\index.html`
- Create: `E:\dev\AI使用情况问卷调查\static\form.js`

- [ ] **Step 1: Write index.html — form page structure**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 工具使用情况调研</title>
<link rel="stylesheet" href="/static/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body>
<div class="container" id="app">

  <!-- Header -->
  <header class="page-header">
    <div class="eyebrow">Internal Survey · 部门内部调研</div>
    <h1>AI 工具使用情况调研</h1>
    <p>请各组组长汇总本组实际情况后如实填写。每个团队限提交一份，提交前请仔细确认信息准确性。</p>
  </header>

  <!-- Step Progress -->
  <div class="step-progress" id="stepProgress">
    <div class="step active">
      <div class="step-num">1</div><span class="step-label">基础画像</span>
    </div>
    <div class="step">
      <div class="step-num">2</div><span class="step-label">应用现状</span>
    </div>
    <div class="step">
      <div class="step-num">3</div><span class="step-label">核心痛点</span>
    </div>
    <div class="step">
      <div class="step-num">4</div><span class="step-label">期望建议</span>
    </div>
  </div>

  <!-- Form Content (JS-rendered) -->
  <div id="formContent"></div>

  <!-- Submit Success -->
  <div id="successView" style="display:none;"></div>

</div>

<!-- Pre-submit Review Modal -->
<div id="reviewModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:100;align-items:center;justify-content:center;">
  <div style="background:#fff;border-radius:8px;max-width:640px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;">
    <h2>确认提交</h2>
    <p style="margin-bottom:20px;">请核对以下信息，提交后将无法自行修改。</p>
    <div id="reviewContent" style="font-size:13px;"></div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;padding-top:20px;border-top:1px solid var(--c-border);">
      <button class="btn" onclick="closeReview()">返回修改</button>
      <button class="btn btn-primary" id="confirmSubmit">确认提交</button>
    </div>
  </div>
</div>

<script src="/static/form.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write form.js — survey form logic**

The form.js will be a single file containing:
- Question definitions (15 questions organized in 4 steps)
- Step rendering with progress tracking
- TagInput component (custom elements with Enter-to-add, Backspace-to-remove, ×-to-delete)
- Form validation per step
- Review modal before submit
- API submission with fetch()

Write it in chunks:

**[form.js — Part 1: Constants & State]**
```javascript
// === AI Survey Form ===

const TEAM_NAMES = [
  "托管系统运维团队", "数据库运维组", "生产调度团队",
  "商务管理团队", "网络运维团队", "流程管理组",
  "运行监控团队", "运维平台支撑团队", "主机运维团队",
  "测试环境支持团队", "中间件运维团队"
];

// Form data
const formData = {
  team: '',
  submitter: '',
  q3_frequency: '',
  q4_tools: [],
  q5_work_types: [],
  q6_help_level: '',
  q7_efficiency: '',
  q8_problems: [],
  q9_core_problem: [],
  q10_weakness: [],
  q11_reduced: [],
  q12_untried_scenarios: '',
  q13_desired_scenarios: [],
  q14_support_needs: [],
  q15_suggestions: '',
};

let currentStep = 0;

// Track which teams have already submitted
let submittedTeams = [];
```

**[form.js — Part 2: Question Definitions (4 steps)]**
```javascript
const STEPS = [
  { // Step 1: 基础画像
    title: '基础画像',
    questions: [
      {
        id: 'team', type: 'select', label: '所属团队', required: true,
        options: TEAM_NAMES,
        placeholder: '请选择团队…'
      },
      {
        id: 'submitter', type: 'text', label: '填写人姓名', required: true,
        placeholder: '组长姓名'
      },
      {
        id: 'q3_frequency', type: 'radio', label: '团队使用 AI 工具的频率是？', required: true,
        options: ['频繁使用 — 每日都会用到', '经常使用 — 每周多次', '偶尔使用 — 每周 1-3 次', '极少使用 — 每月偶尔用', '从不使用']
      },
      {
        id: 'q4_tools', type: 'checkbox-tags', label: '团队目前使用的 AI 工具有哪些？', required: false,
        options: ['AI 对话（通用AI对话）', 'Claude Code（终端编码Agent）', 'Hermes-Agent（自进化通用智能体）',
                  'OpenClaw（AI工作流自动化助手）', '通义灵码（智能编码助手）', 'OpenCode（终端编码Agent）'],
        tagPlaceholder: '输入工具名称，Enter 添加…'
      },
    ]
  },
  { // Step 2: 应用现状
    title: '应用现状',
    questions: [
      {
        id: 'q5_work_types', type: 'checkbox-tags', label: 'AI 工具主要帮团队完成了哪些工作内容？', required: false,
        options: ['文案工作：总结、汇报、方案、通知等撰写修改', '办公处理：排版润色、翻译、长文本总结',
                  '数据工作：整理、计算、报表、分析、复盘', '展示物料：PPT生成、海报/配图素材',
                  '沟通工作：对外话术、答疑模板', '学习提升：业务答疑、方法学习',
                  '功能开发：前端设计、开发、测试', '日常运维：脚本、告警分析、知识问答',
                  '流程管理：变更评审、流程管理', '创新工作：活动策划、思路构思'],
        tagPlaceholder: '输入其他工作内容，Enter 添加…'
      },
      {
        id: 'q6_help_level', type: 'radio', label: 'AI 工具对团队工作的帮助程度如何？', required: true,
        options: ['极大提升 — 大幅节省时间、提升质量、降低压力', '有效提升 — 对部分工作有明显辅助',
                  '一般 — 偶尔有帮助，不明显', '几乎无帮助 — 实用性低', '完全无帮助']
      },
      {
        id: 'q7_efficiency', type: 'radio', label: '使用 AI 后，团队工作效率提升幅度？', required: true,
        options: ['提升 50% 以上', '提升 30%-50%', '提升 10%-30%', '提升不足 10%', '无明显提升']
      },
      {
        id: 'q8_problems', type: 'checkbox-tags', label: '团队在使用 AI 工具时遇到过哪些问题？', required: false,
        options: ['内容准确性不足：输出存在错误偏差，需要大量核对', '专业性不足：内容通用化、不落地',
                  '信息安全顾虑：担心涉密内容和业务数据泄露', '时效性不足：生成速度慢',
                  '安装问题：安装门槛高，内网环境困难', '操作门槛问题：不会精准提问、调教内容',
                  '工具繁杂混乱：工具太多、切换繁琐', '无明显问题，使用顺畅'],
        tagPlaceholder: '输入其他问题，Enter 添加…'
      },
    ]
  },
  { // Step 3: 核心痛点
    title: '核心痛点',
    questions: [
      {
        id: 'q9_core_problem', type: 'radio-tags', label: '遇到的最大核心问题是？', required: false,
        options: ['专业能力不足，无法适配岗位业务场景', '输出幻觉高（内容虚构、数据错误）',
                  '响应/输出速度慢，影响办公效率', '内网安装困难，安装门槛高',
                  '存在数据安全、涉密泄露风险隐患', '无明显核心问题，整体使用良好'],
        tagPlaceholder: '输入其他核心问题，Enter 添加…'
      },
      {
        id: 'q10_weakness', type: 'radio-tags', label: '当前 AI 输出内容最大的短板是？', required: false,
        options: ['专业深度不够', '准确性不可靠', '响应速度慢',
                  '无法理解复杂指令', '缺乏业务上下文', '格式/排版质量差'],
        tagPlaceholder: '输入其他短板，Enter 添加…'
      },
      {
        id: 'q11_reduced', type: 'checkbox-tags', label: '是否因为各类问题，主动减少或放弃使用 AI 工具？', required: false,
        options: ['因信息安全顾虑减少使用', '因输出质量不可靠减少使用',
                  '因响应速度慢减少使用', '因操作门槛高减少使用',
                  '没有减少，持续使用', '从未大量使用过'],
        tagPlaceholder: '输入其他原因，Enter 添加…'
      },
      {
        id: 'q12_untried_scenarios', type: 'textarea', label: '团队有没有 AI 可以解决但尚未尝试的工作难点？', required: false,
        placeholder: '请简要说明…', rows: 3
      },
    ]
  },
  { // Step 4: 期望建议
    title: '期望建议',
    questions: [
      {
        id: 'q13_desired_scenarios', type: 'checkbox-tags', label: '最希望用 AI 赋能哪些未落地的工作场景？', required: false,
        options: ['高频文案批量生成（周报/月报/复盘/汇报等）', '业务数据智能分析、自动复盘、问题总结',
                  '标准化模板生成（公文/方案/PPT/话术等）', '工作问题智能答疑、业务知识快速查询',
                  '运维脚本开发、分析', '告警诊断', '功能开发设计、平台优化',
                  '日常巡检、系统分析', '变更评审、变更方案分析、变更风险分析',
                  '素材、配图、可视化展示内容生成', '工作流程优化、创新方案策划辅助', '知识管理'],
        tagPlaceholder: '输入其他场景，Enter 添加…'
      },
      {
        id: 'q14_support_needs', type: 'checkbox-tags', label: '希望部门提供哪些 AI 相关支持？', required: false,
        options: ['统一推荐适配部门业务的优质AI工具（合规工具清单）', '开展AI使用技巧、高效提问、场景化应用培训',
                  '搭建部门内部AI共享工具/平台，保障数据安全', '不需要额外支持，自主使用即可'],
        tagPlaceholder: '输入其他支持需求，Enter 添加…'
      },
      {
        id: 'q15_suggestions', type: 'textarea', label: '对部门 AI 工具应用、优化、推广有哪些宝贵的意见和建议？', required: false,
        placeholder: '请畅所欲言…', rows: 4
      },
    ]
  }
];
```

**[form.js — Part 3: Initialization]**
```javascript
async function init() {
  // Fetch submitted teams to prevent duplicate submissions
  try {
    const res = await fetch('/api/submissions');
    submittedTeams = await res.json();
  } catch (e) {
    console.error('Failed to fetch submissions:', e);
  }
  renderStep(0);
}

function renderStep(stepIndex) {
  currentStep = stepIndex;
  const step = STEPS[stepIndex];
  const container = document.getElementById('formContent');

  let html = `<div class="section-header"><h3>${String(stepIndex + 1).padStart(2, '0')} · ${step.title}</h3></div>`;

  step.questions.forEach((q, qi) => {
    const value = formData[q.id];
    html += `<div class="section"><div class="section-header"><h3>Q${qi + 1}</h3><p class="q-title">${q.label}${q.required ? ' <span style="color:var(--c-error)">*</span>' : ''}</p></div>`;

    if (q.type === 'select') {
      html += renderSelect(q, value);
    } else if (q.type === 'text') {
      html += renderText(q, value);
    } else if (q.type === 'radio') {
      html += renderRadio(q, value);
    } else if (q.type === 'checkbox-tags') {
      html += renderCheckboxTags(q, value);
    } else if (q.type === 'radio-tags') {
      html += renderRadioTags(q, value);
    } else if (q.type === 'textarea') {
      html += renderTextarea(q, value);
    }

    html += '</div>';
  });

  // Navigation buttons
  html += '<div class="flex-between" style="border-top:1px solid var(--c-border);padding-top:24px;margin-top:32px;">';
  html += stepIndex > 0
    ? '<button class="btn" onclick="prevStep()">← 上一步</button>'
    : '<span></span>';
  html += `<span class="text-sm text-muted">第 ${stepIndex + 1} 步，共 ${STEPS.length} 步</span>`;
  if (stepIndex < STEPS.length - 1) {
    html += '<button class="btn btn-primary" onclick="nextStep()">下一步 →</button>';
  } else {
    html += '<button class="btn btn-primary" onclick="previewSubmit()">预览并提交</button>';
  }
  html += '</div>';

  container.innerHTML = html;
  updateProgress(stepIndex);

  // Bind tag input events after render
  setTimeout(bindTagInputs, 50);

  // Scroll to top
  window.scrollTo(0, 0);
}
```

**[form.js — Part 4: Render helpers]**
```javascript
function renderSelect(q, value) {
  let h = `<select class="form-select" id="${q.id}" onchange="updateField('${q.id}', this.value)">`;
  h += `<option value="">${q.placeholder || '请选择…'}</option>`;
  q.options.forEach(opt => {
    const disabled = q.id === 'team' && submittedTeams.includes(opt);
    h += `<option value="${opt}" ${value === opt ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${opt}${disabled ? ' (已提交)' : ''}</option>`;
  });
  h += '</select>';
  return h;
}

function renderText(q, value) {
  return `<input class="form-input" id="${q.id}" type="text" placeholder="${q.placeholder || ''}" value="${escapeHtml(value || '')}" onchange="updateField('${q.id}', this.value)">`;
}

function renderRadio(q, value) {
  let h = '<div class="option-group">';
  q.options.forEach(opt => {
    const selected = value === opt;
    h += `<label class="option-card${selected ? ' selected' : ''}" onclick="selectRadio('${q.id}', '${escapeAttr(opt)}', this)">`;
    h += `<input type="radio" name="${q.id}" value="${escapeAttr(opt)}" ${selected ? 'checked' : ''}>`;
    h += escapeHtml(opt);
    h += '</label>';
  });
  h += '</div>';
  return h;
}

function renderCheckboxTags(q, value) {
  const arr = Array.isArray(value) ? value : [];
  const selectedOptions = arr.filter(v => q.options.includes(v));
  const customTags = arr.filter(v => !q.options.includes(v));

  let h = '<div class="option-grid">';
  q.options.forEach(opt => {
    const checked = selectedOptions.includes(opt);
    h += `<label class="option-card${checked ? ' selected' : ''}" onclick="toggleCheckbox('${q.id}', '${escapeAttr(opt)}', this)">`;
    h += `<input type="checkbox" value="${escapeAttr(opt)}" ${checked ? 'checked' : ''}>`;
    h += escapeHtml(opt);
    h += '</label>';
  });
  h += '</div>';

  // Tag area for custom entries
  h += `<div class="tag-area" data-field="${q.id}">`;
  h += '<div class="tag-list">';
  customTags.forEach(tag => {
    h += `<span class="tag">${escapeHtml(tag)}<button class="tag-remove" onclick="removeCustomTag('${q.id}', '${escapeAttr(tag)}')">&times;</button></span>`;
  });
  h += '</div>';
  h += '<div class="tag-input-row">';
  h += `<input type="text" placeholder="${q.tagPlaceholder || '输入后按 Enter 添加…'}" onkeydown="handleTagKey(event, '${q.id}')">`;
  h += '<span class="tag-hint">Enter ↵</span>';
  h += '</div></div>';

  return h;
}

function renderRadioTags(q, value) {
  const arr = Array.isArray(value) ? value : [];
  const selectedOption = arr.find(v => q.options.includes(v)) || '';
  const customTags = arr.filter(v => !q.options.includes(v));

  let h = '<div class="option-group">';
  q.options.forEach(opt => {
    const selected = selectedOption === opt;
    h += `<label class="option-card${selected ? ' selected' : ''}" onclick="selectRadioTag('${q.id}', '${escapeAttr(opt)}', this)">`;
    h += `<input type="radio" name="${q.id}" value="${escapeAttr(opt)}" ${selected ? 'checked' : ''}>`;
    h += escapeHtml(opt);
    h += '</label>';
  });
  h += '</div>';

  // Tag area for custom entries (multi custom tags allowed for radio-tags type)
  h += `<div class="tag-area" data-field="${q.id}">`;
  h += '<div class="tag-list">';
  customTags.forEach(tag => {
    h += `<span class="tag">${escapeHtml(tag)}<button class="tag-remove" onclick="removeCustomTag('${q.id}', '${escapeAttr(tag)}')">&times;</button></span>`;
  });
  h += '</div>';
  h += '<div class="tag-input-row">';
  h += `<input type="text" placeholder="${q.tagPlaceholder || '输入后按 Enter 添加…'}" onkeydown="handleTagKey(event, '${q.id}')">`;
  h += '<span class="tag-hint">Enter ↵</span>';
  h += '</div></div>';

  return h;
}

function renderTextarea(q, value) {
  return `<textarea class="form-textarea" id="${q.id}" placeholder="${q.placeholder || ''}" onchange="updateField('${q.id}', this.value)">${escapeHtml(value || '')}</textarea>`;
}
```

**[form.js — Part 5: Interaction handlers]**
```javascript
function updateField(id, value) {
  formData[id] = value;
}

function selectRadio(id, value, el) {
  formData[id] = value;
  el.parentElement.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
}

function selectRadioTag(id, value, el) {
  const arr = Array.isArray(formData[id]) ? [...formData[id]] : [];
  // Remove existing option selections
  const optionValues = STEPS.flatMap(s => s.questions).find(q => q.id === id)?.options || [];
  const filtered = arr.filter(v => !optionValues.includes(v));
  formData[id] = [...filtered, value];
  el.parentElement.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
}

function toggleCheckbox(id, value, el) {
  let arr = Array.isArray(formData[id]) ? [...formData[id]] : [];
  if (arr.includes(value)) {
    arr = arr.filter(v => v !== value);
    el.classList.remove('selected');
    el.querySelector('input').checked = false;
  } else {
    arr.push(value);
    el.classList.add('selected');
    el.querySelector('input').checked = true;
  }
  formData[id] = arr;
}

function handleTagKey(event, fieldId) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const value = event.target.value.trim();
    if (!value) return;

    let arr = Array.isArray(formData[fieldId]) ? [...formData[fieldId]] : [];
    if (!arr.includes(value)) {
      arr.push(value);
      formData[fieldId] = arr;
    }
    event.target.value = '';
    renderStep(currentStep);
  } else if (event.key === 'Backspace' && event.target.value === '') {
    // Remove last custom tag on Backspace when input is empty
    const options = STEPS.flatMap(s => s.questions).find(q => q.id === fieldId)?.options || [];
    let arr = Array.isArray(formData[fieldId]) ? [...formData[fieldId]] : [];
    const customTags = arr.filter(v => !options.includes(v));
    if (customTags.length > 0) {
      arr = arr.filter(v => v !== customTags[customTags.length - 1]);
      formData[fieldId] = arr;
      renderStep(currentStep);
    }
  }
}

function removeCustomTag(fieldId, tag) {
  let arr = Array.isArray(formData[fieldId]) ? [...formData[fieldId]] : [];
  formData[fieldId] = arr.filter(v => v !== tag);
  renderStep(currentStep);
}

function bindTagInputs() {
  // Tag inputs are already bound via inline onkeydown
  // This function exists for any post-render initialization
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

**[form.js — Part 6: Navigation & Validation]**
```javascript
function updateProgress(stepIndex) {
  const steps = document.querySelectorAll('#stepProgress .step');
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < stepIndex) s.classList.add('done');
    else if (i === stepIndex) s.classList.add('active');
  });
}

function validateStep(stepIndex) {
  const step = STEPS[stepIndex];
  const errors = [];
  step.questions.forEach(q => {
    if (!q.required) return;
    const val = formData[q.id];
    if (!val || (Array.isArray(val) && val.length === 0)) {
      errors.push(`"${q.label}" 为必填项`);
    }
  });
  if (errors.length > 0) {
    showToast(errors.join('<br>'), 'error');
    return false;
  }
  return true;
}

function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < STEPS.length - 1) {
    renderStep(currentStep + 1);
  }
}

function prevStep() {
  if (currentStep > 0) {
    renderStep(currentStep - 1);
  }
}

function previewSubmit() {
  if (!validateStep(currentStep)) return;

  // Build review HTML
  let html = '';
  STEPS.forEach((step, si) => {
    html += `<h3 style="margin-top:16px;">${si + 1}. ${step.title}</h3>`;
    step.questions.forEach(q => {
      const val = formData[q.id];
      const display = Array.isArray(val) ? val.join('、') || '(未填写)' : (val || '(未填写)');
      html += `<p style="margin:4px 0;"><strong>${q.label}</strong><br><span style="color:var(--c-text-secondary);">${escapeHtml(display)}</span></p>`;
    });
  });

  document.getElementById('reviewContent').innerHTML = html;
  document.getElementById('reviewModal').style.display = 'flex';

  document.getElementById('confirmSubmit').onclick = async () => {
    await submitForm();
    document.getElementById('reviewModal').style.display = 'none';
  };
}

function closeReview() {
  document.getElementById('reviewModal').style.display = 'none';
}
```

**[form.js — Part 7: Submission]**
```javascript
async function submitForm() {
  const btn = document.getElementById('confirmSubmit');
  btn.disabled = true;
  btn.textContent = '提交中…';

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();

    if (res.ok) {
      showSuccess();
    } else {
      showToast(data.error || '提交失败，请重试', 'error');
    }
  } catch (e) {
    showToast('网络错误，请检查连接后重试', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '确认提交';
  }
}

function showSuccess() {
  document.getElementById('formContent').style.display = 'none';
  document.getElementById('stepProgress').style.display = 'none';
  document.querySelector('.page-header p').style.display = 'none';

  const view = document.getElementById('successView');
  view.style.display = 'block';
  view.innerHTML = `
    <div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 64 64" style="margin-bottom:16px;">
        <circle cx="32" cy="32" r="30" fill="none" stroke="var(--c-success)" stroke-width="2"/>
        <path d="M20 32 L28 40 L44 24" fill="none" stroke="var(--c-success)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h2 style="color:var(--c-success);">提交成功</h2>
      <p>团队「${formData.team}」的调研数据已保存。</p>
      <p class="text-sm text-muted mt-16">如需修改数据，请联系管理员重新提交。</p>
      <a href="/dashboard" class="btn btn-primary mt-24" style="display:inline-flex;">查看数据分析 →</a>
    </div>
  `;
  window.scrollTo(0, 0);
}

function showToast(message, type) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
```

- [ ] **Step 3: Add init() call at end of form.js**

```javascript
// Boot
document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 4: Commit**

```bash
git add static/index.html static/form.js && git commit -m "feat: add survey form page with multi-step and tag-input"
```

---

### Task 5: Dashboard Page

**Files:**
- Create: `E:\dev\AI使用情况问卷调查\static\dashboard.html`
- Create: `E:\dev\AI使用情况问卷调查\static\dashboard.js`

- [ ] **Step 1: Write dashboard.html — layout structure**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>数据分析 — AI 工具使用情况调研</title>
<link rel="stylesheet" href="/static/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body>
<div class="container">

  <header class="page-header flex-between">
    <div>
      <div class="eyebrow">Dashboard · 数据分析</div>
      <h1>AI 工具使用情况</h1>
    </div>
    <div class="text-sm text-muted" style="text-align:right;">
      数据截止 <strong id="updateTime" style="color:var(--c-primary);">--</strong><br>
      已提交 <strong id="submitCount" style="color:var(--c-primary);">--</strong> / <span id="totalCount">--</span> 个团队
    </div>
  </header>

  <!-- Stats Row -->
  <div class="stats-row" id="statsRow"></div>

  <!-- Charts Row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px;" id="chartsRow"></div>

  <!-- Team Table -->
  <div class="table-wrap" style="margin-bottom:32px;">
    <h3>团队对比视图</h3>
    <div style="overflow-x:auto;" id="teamTable"></div>
  </div>

  <!-- Action Bar -->
  <div class="flex-between gap-12" style="flex-wrap:wrap;">
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="exportCSV()">导出 CSV 报告</button>
      <button class="btn" onclick="window.print()">打印页面</button>
      <button class="btn" id="toggleRaw">查看原始数据</button>
    </div>
    <a href="/" class="btn">← 返回填报页</a>
  </div>

  <!-- Raw Data Section (hidden by default) -->
  <div id="rawData" style="display:none;margin-top:24px;"></div>

</div>
<script src="/static/dashboard.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write dashboard.js — Part 1 (Data Fetching & Stats)**

```javascript
// === AI Survey Dashboard ===

let allResponses = [];
let stats = null;

async function init() {
  try {
    const [resRes, statsRes] = await Promise.all([
      fetch('/api/responses'),
      fetch('/api/stats')
    ]);
    allResponses = await resRes.json();
    stats = await statsRes.json();
  } catch (e) {
    document.body.innerHTML = '<div class="empty-state"><h3>加载失败</h3><p>无法连接到服务器，请确认服务已启动。</p></div>';
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
  const pct = stats.total_teams > 0 ? Math.round((stats.submitted / stats.total_teams) * 100) : 0;

  // Calculate "effective" percentage
  const effective = stats.help_levels['极大提升 — 大幅节省时间、提升质量、降低压力'] || 0
    + (stats.help_levels['有效提升 — 对部分工作有明显辅助'] || 0);
  const effPct = stats.submitted > 0 ? Math.round((effective / stats.submitted) * 100) : 0;

  // Count unique tool categories used
  const toolCount = Object.keys(stats.tools).length;

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-hero">
      ${renderRingSVG(pct)}
      <div>
        <div class="stat-value">${stats.submitted} / ${stats.total_teams}</div>
        <div class="stat-label">已完成提交的团队</div>
        ${stats.unsubmitted.length > 0 ? `<p class="text-sm text-muted" style="margin-top:4px;">剩余：${stats.unsubmitted.join('、')}</p>` : '<p class="text-sm" style="color:var(--c-success);margin-top:4px;">全部团队已完成提交 ✓</p>'}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:var(--c-accent);">${effPct}%</div>
      <div class="stat-label">认为有效 / 极大提升</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${toolCount} 类</div>
      <div class="stat-label">使用的 AI 工具</div>
    </div>
  `;
}

function renderRingSVG(pct) {
  const r = 34, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return `<svg width="80" height="80" viewBox="0 0 80 80" style="flex-shrink:0;">
    <circle cx="40" cy="40" r="${r}" fill="none" stroke="var(--c-border)" stroke-width="6"/>
    <circle cx="40" cy="40" r="${r}" fill="none" stroke="var(--c-primary)" stroke-width="6"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
      stroke-linecap="round" transform="rotate(-90 40 40)"/>
    <text x="40" y="38" text-anchor="middle" font-size="18" font-weight="600" fill="var(--c-text)" font-family="var(--font-mono)">${pct}%</text>
    <text x="40" y="52" text-anchor="middle" font-size="9" fill="var(--c-text-muted)">完成率</text>
  </svg>`;
}
```

**[dashboard.js — Part 2: Charts]**
```javascript
function renderCharts() {
  const container = document.getElementById('chartsRow');
  container.innerHTML = '';

  // Chart 1: Usage Frequency
  container.appendChild(createHBarChart('使用频率分布', stats.frequencies, [
    '频繁使用 — 每日都会用到', '经常使用 — 每周多次',
    '偶尔使用 — 每周 1-3 次', '极少使用 — 每月偶尔用', '从不使用'
  ], ['#1E40AF', '#3B82F6', '#93C5FD', '#DBEAFE', '#E2E8F0']));

  // Chart 2: Problems encountered
  container.appendChild(createHBarChart('遇到的问题（多选）', stats.problems,
    Object.keys(stats.problems).sort((a, b) => (stats.problems[b] || 0) - (stats.problems[a] || 0)),
    ['#DC2626', '#D97706', '#1E40AF', '#8B5CF6', '#06B6D4', '#16A34A', '#64748B', '#94A3B8']));

  // Chart 3: Help Level
  container.appendChild(createHBarChart('帮助程度', stats.help_levels, [
    '极大提升 — 大幅节省时间、提升质量、降低压力',
    '有效提升 — 对部分工作有明显辅助',
    '一般 — 偶尔有帮助，不明显',
    '几乎无帮助 — 实用性低',
    '完全无帮助'
  ], ['#16A34A', '#3B82F6', '#D97706', '#DC2626', '#94A3B8']));

  // Chart 4: Desired Support
  container.appendChild(createHBarChart('期望的部门支持（多选）', stats.support_needs,
    Object.keys(stats.support_needs).sort((a, b) => (stats.support_needs[b] || 0) - (stats.support_needs[a] || 0)),
    ['#1E40AF', '#3B82F6', '#06B6D4', '#8B5CF6', '#16A34A']));
}

function createHBarChart(title, data, labels, colors) {
  const box = document.createElement('div');
  box.className = 'chart-box';
  box.innerHTML = `<h3>${title}</h3><div class="hbar"></div>`;
  const hbar = box.querySelector('.hbar');

  const maxVal = Math.max(1, ...Object.values(data));

  labels.forEach((label, i) => {
    const val = data[label] || 0;
    const w = Math.max(0, Math.round((val / maxVal) * 100));
    const color = colors[i % colors.length];

    const row = document.createElement('div');
    row.className = 'row';
    row.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:10px;';

    // Handle long labels
    const shortLabel = label.length > 30 ? label.substring(0, 28) + '…' : label;

    row.innerHTML = `
      <span style="width:160px;font-size:13px;color:var(--c-text-secondary);text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${label}">${shortLabel}</span>
      <div style="flex:1;height:8px;background:var(--c-border-light);border-radius:4px;overflow:hidden;">
        <div style="width:${w}%;height:100%;background:${color};border-radius:4px;transition:width 0.4s ease;"></div>
      </div>
      <span style="font-size:12px;color:var(--c-text-muted);width:24px;font-family:var(--font-mono);">${val}</span>
    `;
    hbar.appendChild(row);
  });

  // No data state
  if (labels.length === 0 || Object.values(data).every(v => v === 0)) {
    hbar.innerHTML = '<p class="text-muted text-sm" style="padding:16px;text-align:center;">暂无数据</p>';
  }

  return box;
}
```

**[dashboard.js — Part 3: Team Table]**
```javascript
function renderTeamTable() {
  const tableDiv = document.getElementById('teamTable');

  if (allResponses.length === 0) {
    tableDiv.innerHTML = '<div class="empty-state"><h3>暂无提交数据</h3><p>等待团队提交问卷后，这里将展示团队对比分析。</p></div>';
    return;
  }

  const rows = allResponses.map(r => {
    const tools = Array.isArray(r.q4_tools) ? r.q4_tools : [];
    const problems = Array.isArray(r.q8_problems) ? r.q8_problems : [];
    const coreProblem = Array.isArray(r.q9_core_problem) ? r.q9_core_problem.join('；') : '';
    const supportNeeds = Array.isArray(r.q14_support_needs) ? r.q14_support_needs : [];

    let freqBadge = '', helpBadge = '';
    if ((r.q3_frequency || '').includes('频繁')) freqBadge = '<span class="badge badge-green">频繁</span>';
    else if ((r.q3_frequency || '').includes('经常')) freqBadge = '<span class="badge badge-blue">经常</span>';
    else if ((r.q3_frequency || '').includes('偶尔')) freqBadge = '<span class="badge badge-amber">偶尔</span>';
    else freqBadge = '<span class="badge badge-red">极少</span>';

    if ((r.q6_help_level || '').includes('极大')) helpBadge = '<span class="badge badge-green">极大提升</span>';
    else if ((r.q6_help_level || '').includes('有效')) helpBadge = '<span class="badge badge-blue">有效提升</span>';
    else helpBadge = '<span class="badge badge-amber">一般</span>';

    // Detect severity of core problem
    let problemBadge = '';
    const cp = coreProblem.toLowerCase();
    if (cp.includes('安全') || cp.includes('泄露')) problemBadge = '<span class="badge badge-red">安全风险</span>';
    else if (cp.includes('专业') || cp.includes('幻觉') || cp.includes('准确')) problemBadge = '<span class="badge badge-amber">质量问题</span>';
    else if (cp.includes('速度') || cp.includes('响应')) problemBadge = '<span class="badge badge-amber">效率问题</span>';
    else if (cp.includes('安装') || cp.includes('门槛')) problemBadge = '<span class="badge badge-blue">门槛问题</span>';
    else if (cp.includes('良好') || cp.includes('无')) problemBadge = '<span class="badge badge-green">无问题</span>';

    return { r, tools, supportNeeds, freqBadge, helpBadge, problemBadge, coreProblem };
  });

  let html = '<table class="data-table"><thead><tr>';
  ['团队', '填写人', '使用频率', '工具数', '帮助程度', '核心问题', '期望支持', '提交时间'].forEach(h => {
    html += `<th>${h}</th>`;
  });
  html += '</tr></thead><tbody>';

  rows.forEach(({ r, tools, supportNeeds, freqBadge, helpBadge, problemBadge, coreProblem }) => {
    html += '<tr>';
    html += `<td style="font-weight:500;">${r.team}</td>`;
    html += `<td>${r.submitter || ''}</td>`;
    html += `<td>${freqBadge}</td>`;
    html += `<td style="font-family:var(--font-mono);">${tools.length} 个</td>`;
    html += `<td>${helpBadge}</td>`;
    html += `<td>${problemBadge} ${coreProblem ? '<span class="text-sm text-muted">' + coreProblem.substring(0, 15) + (coreProblem.length > 15 ? '…' : '') + '</span>' : ''}</td>`;
    html += `<td class="text-sm">${supportNeeds.slice(0, 2).join('；')}${supportNeeds.length > 2 ? '…' : ''}</td>`;
    html += `<td class="text-sm text-muted">${(r.created_at || '').substring(0, 10)}</td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  tableDiv.innerHTML = html;
}
```

**[dashboard.js — Part 4: Export & Actions]**
```javascript
function bindActions() {
  document.getElementById('toggleRaw').onclick = toggleRawData;
}

function toggleRawData() {
  const div = document.getElementById('rawData');
  if (div.style.display === 'none') {
    div.style.display = 'block';
    div.innerHTML = `<div class="table-wrap"><h3>原始数据</h3>
      <pre style="padding:20px;font-size:12px;overflow-x:auto;font-family:var(--font-mono);">${JSON.stringify(allResponses, null, 2)}</pre>
    </div>`;
    document.getElementById('toggleRaw').textContent = '隐藏原始数据';
  } else {
    div.style.display = 'none';
    document.getElementById('toggleRaw').textContent = '查看原始数据';
  }
}

function exportCSV() {
  window.location.href = '/api/export';
}
```

- [ ] **Step 3: Add init() call at end of dashboard.js**

```javascript
document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 4: Commit**

```bash
git add static/dashboard.html static/dashboard.js && git commit -m "feat: add data analysis dashboard with SVG charts and team table"
```

---

### Task 6: Verify & Test End-to-End

- [ ] **Step 1: Start server and verify all pages load**

```bash
cd "E:\dev\AI使用情况问卷调查" && python app.py
```

Open browser and verify:
- `http://localhost:5000/` — Form page loads with 4-step progress
- `http://localhost:5000/dashboard` — Dashboard loads (empty state OK)
- `http://localhost:5000/api/teams` — Returns 11 teams JSON

- [ ] **Step 2: Submit a test survey via form**

In the browser form:
1. Select team "数据库运维组"
2. Fill name
3. Navigate through all 4 steps, filling required fields
4. Test tag-input: type "cursor", press Enter → should create tag
5. Preview and submit
6. Verify success page appears

- [ ] **Step 3: Verify dashboard shows data**

Navigate to `http://localhost:5000/dashboard`:
- Stats cards show 1/11 submitted
- Charts render with the test data
- Team table shows the submitted entry
- Export CSV works

- [ ] **Step 4: Test edge cases**

```bash
# Test duplicate team update
curl -s -X POST http://localhost:5000/api/submit -H "Content-Type: application/json" -d '{"team":"数据库运维组","submitter":"测试2","q3_frequency":"偶尔使用"}' | python -m json.tool
# Expected: "is_new": false, "message": "更新成功"

# Test validation
curl -s -X POST http://localhost:5000/api/submit -H "Content-Type: application/json" -d '{"team":"","submitter":""}' | python -m json.tool
# Expected: error response with 400

# Test deletion
curl -s -X DELETE http://localhost:5000/api/responses/1 | python -m json.tool
```

- [ ] **Step 5: Commit any final fixes and tag release**

```bash
git add -A && git commit -m "chore: final adjustments after testing"
```

---

### Task 7 (Optional): Import Existing Excel Data

If the user wants to seed the database with existing survey data from the Excel file.

- [ ] **Step 1: Create import script** `import_data.py`

```python
"""Import existing survey data from Excel to SQLite"""
import json
import sqlite3
import sys

# Add path for app imports
sys.path.insert(0, '.')
from app import TEAMS, get_db, init_db

# Manual mapping of existing data rows to format
# (This would need exact mapping based on the Excel columns)
# For now, provide the framework — actual data mapping depends on the Excel structure

def import_row(conn, data):
    """Insert or update a single response row"""
    conn.execute('''
        INSERT OR REPLACE INTO responses
        (team, submitter, q3_frequency, q4_tools, q5_work_types,
         q6_help_level, q7_efficiency, q8_problems, q9_core_problem,
         q10_weakness, q11_reduced, q12_untried_scenarios,
         q13_desired_scenarios, q14_support_needs, q15_suggestions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', data)

if __name__ == '__main__':
    init_db()
    with get_db() as conn:
        # Import each team's data here
        pass
    print('Import complete.')
```

- [ ] **Step 2: Run import**

```bash
cd "E:\dev\AI使用情况问卷调查" && python import_data.py
```

---

## Summary

**Files Created:**
1. `requirements.txt` — Flask dependency
2. `app.py` — Flask backend (DB init, 7 API routes, static serving)
3. `static/style.css` — Complete design system (~250 lines)
4. `static/index.html` — Survey form page shell
5. `static/form.js` — Multi-step form logic (~400 lines)
6. `static/dashboard.html` — Dashboard page shell
7. `static/dashboard.js` — Dashboard charts + table logic (~250 lines)

**Total: ~7 files, ~1000 lines of code**
