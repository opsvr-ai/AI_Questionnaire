import sqlite3
import json
import csv
import io
from datetime import datetime

from flask import Flask, request, jsonify, send_file, send_from_directory

TEAMS = [
    "托管系统运维团队",
    "数据库运维组",
    "生产调度团队",
    "商务管理团队",
    "网络运维团队",
    "流程管理组",
    "运行监控团队",
    "运维平台支撑团队",
    "主机运维团队",
    "测试环境支持团队",
    "中间件运维团队",
]


def get_db():
    conn = sqlite3.connect("survey.db")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team TEXT NOT NULL UNIQUE,
            submitter TEXT NOT NULL,
            q3_frequency TEXT,
            q_coverage TEXT,
            q4_tools TEXT DEFAULT '[]',
            q5_work_types TEXT DEFAULT '[]',
            q6_help_level TEXT,
            q7_efficiency TEXT,
            q_proficiency TEXT,
            q8_problems TEXT DEFAULT '[]',
            q9_core_problem TEXT DEFAULT '[]',
            q10_weakness TEXT DEFAULT '[]',
            q11_reduced TEXT DEFAULT '[]',
            q12_untried_scenarios TEXT DEFAULT '',
            q13_desired_scenarios TEXT DEFAULT '[]',
            q14_support_needs TEXT DEFAULT '[]',
            q_attitude TEXT,
            q15_suggestions TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """
    )
    # Migrate: add new columns if they don't exist (for existing databases)
    for col in ['q_coverage', 'q_proficiency', 'q_attitude']:
        try:
            conn.execute(f"ALTER TABLE responses ADD COLUMN {col} TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists
    conn.commit()
    conn.close()


app = Flask(__name__)


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/dashboard")
def dashboard():
    return app.send_static_file("dashboard.html")


@app.route("/api/teams")
def api_teams():
    return jsonify(TEAMS)


@app.route("/api/submissions")
def api_submissions():
    with get_db() as conn:
        rows = conn.execute("SELECT team FROM responses").fetchall()
    return jsonify([r["team"] for r in rows])


@app.route("/api/submit", methods=["POST"])
def api_submit():
    data = request.get_json()
    if not data:
        return jsonify({"error": "请求数据为空"}), 400

    team = data.get("team", "").strip()
    if team not in TEAMS:
        return jsonify({"error": "无效的团队名称"}), 400

    submitter = data.get("submitter", "").strip()
    if not submitter:
        return jsonify({"error": "填写人不能为空"}), 400

    fields = {
        "team": team,
        "submitter": submitter,
        "q3_frequency": data.get("q3_frequency", ""),
        "q_coverage": data.get("q_coverage", ""),
        "q4_tools": json.dumps(data.get("q4_tools", []), ensure_ascii=False),
        "q5_work_types": json.dumps(data.get("q5_work_types", []), ensure_ascii=False),
        "q6_help_level": data.get("q6_help_level", ""),
        "q7_efficiency": data.get("q7_efficiency", ""),
        "q_proficiency": data.get("q_proficiency", ""),
        "q8_problems": json.dumps(data.get("q8_problems", []), ensure_ascii=False),
        "q9_core_problem": json.dumps(data.get("q9_core_problem", []), ensure_ascii=False),
        "q10_weakness": json.dumps(data.get("q10_weakness", []), ensure_ascii=False),
        "q11_reduced": json.dumps(data.get("q11_reduced", []), ensure_ascii=False),
        "q12_untried_scenarios": data.get("q12_untried_scenarios", ""),
        "q13_desired_scenarios": json.dumps(data.get("q13_desired_scenarios", []), ensure_ascii=False),
        "q14_support_needs": json.dumps(data.get("q14_support_needs", []), ensure_ascii=False),
        "q_attitude": data.get("q_attitude", ""),
        "q15_suggestions": data.get("q15_suggestions", ""),
    }

    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM responses WHERE team = ?", (team,)
        ).fetchone()
        if existing:
            fields["updated_at"] = datetime.now().isoformat()
            sets = ", ".join(f"{k} = ?" for k in fields)
            values = list(fields.values()) + [team]
            conn.execute(
                f"UPDATE responses SET {sets} WHERE team = ?", values
            )
            return jsonify({"success": True, "is_new": False, "team": team, "message": "更新成功"}), 200
        else:
            columns = ", ".join(fields.keys())
            placeholders = ", ".join("?" for _ in fields)
            conn.execute(
                f"INSERT INTO responses ({columns}) VALUES ({placeholders})",
                list(fields.values()),
            )
            return jsonify({"success": True, "is_new": True, "team": team, "message": "提交成功"}), 201


@app.route("/api/responses")
def api_responses():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM responses ORDER BY created_at DESC").fetchall()
    result = []
    json_fields = [
        "q4_tools", "q5_work_types", "q8_problems", "q9_core_problem",
        "q10_weakness", "q11_reduced", "q13_desired_scenarios", "q14_support_needs",
    ]
    for row in rows:
        r = dict(row)
        for key in json_fields:
            try:
                r[key] = json.loads(r[key])
            except (json.JSONDecodeError, TypeError):
                r[key] = []
        result.append(r)
    return jsonify(result)


@app.route("/api/stats")
def api_stats():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM responses").fetchall()

    stats = {
        "total_teams": len(TEAMS),
        "submitted": len(rows),
        "unsubmitted": [t for t in TEAMS if not any(r["team"] == t for r in rows)],
        "frequencies": {},
        "coverages": {},
        "help_levels": {},
        "efficiencies": {},
        "proficiencies": {},
        "attitudes": {},
        "tools": {},
        "problems": {},
        "core_problems": {},
        "weaknesses": {},
        "desired_scenarios": {},
        "support_needs": {},
    }

    for row in rows:
        r = dict(row)
        f = r.get("q3_frequency", "")
        if f:
            stats["frequencies"][f] = stats["frequencies"].get(f, 0) + 1
        cv = r.get("q_coverage", "")
        if cv:
            stats["coverages"][cv] = stats["coverages"].get(cv, 0) + 1
        h = r.get("q6_help_level", "")
        if h:
            stats["help_levels"][h] = stats["help_levels"].get(h, 0) + 1
        e = r.get("q7_efficiency", "")
        if e:
            stats["efficiencies"][e] = stats["efficiencies"].get(e, 0) + 1
        p = r.get("q_proficiency", "")
        if p:
            stats["proficiencies"][p] = stats["proficiencies"].get(p, 0) + 1
        a = r.get("q_attitude", "")
        if a:
            stats["attitudes"][a] = stats["attitudes"].get(a, 0) + 1

        multi_fields = [
            ("q4_tools", "tools"),
            ("q8_problems", "problems"),
            ("q9_core_problem", "core_problems"),
            ("q10_weakness", "weaknesses"),
            ("q13_desired_scenarios", "desired_scenarios"),
            ("q14_support_needs", "support_needs"),
        ]
        for field, key in multi_fields:
            try:
                items = json.loads(r.get(field, "[]"))
            except (json.JSONDecodeError, TypeError):
                items = []
            for item in items:
                stats[key][item] = stats[key].get(item, 0) + 1

    return jsonify(stats)


@app.route("/api/export")
def api_export():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM responses ORDER BY team").fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "团队", "填写人", "AI使用频率", "成员覆盖比例", "使用工具", "工作内容",
        "帮助程度", "效率提升", "掌握程度", "遇到的问题", "核心问题",
        "最大短板", "是否减少使用", "未尝试场景",
        "期望场景", "期望支持", "推广态度", "意见建议", "提交时间",
    ])

    for row in rows:
        r = dict(row)
        writer.writerow([
            r["team"], r["submitter"], r.get("q3_frequency", ""),
            r.get("q_coverage", ""),
            r.get("q4_tools", ""), r.get("q5_work_types", ""),
            r.get("q6_help_level", ""), r.get("q7_efficiency", ""),
            r.get("q_proficiency", ""),
            r.get("q8_problems", ""), r.get("q9_core_problem", ""),
            r.get("q10_weakness", ""), r.get("q11_reduced", ""),
            r.get("q12_untried_scenarios", ""), r.get("q13_desired_scenarios", ""),
            r.get("q14_support_needs", ""), r.get("q_attitude", ""),
            r.get("q15_suggestions", ""),
            r.get("created_at", ""),
        ])

    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"survey-export-{datetime.now().strftime('%Y%m%d')}.csv",
    )


@app.route("/api/responses/<int:response_id>", methods=["DELETE"])
def api_delete(response_id):
    with get_db() as conn:
        conn.execute("DELETE FROM responses WHERE id = ?", (response_id,))
    return jsonify({"success": True, "message": "已删除"})


@app.route("/api/reset", methods=["POST"])
def api_reset():
    data = request.get_json() or {}
    confirm = data.get("confirm", "").strip()
    if confirm != "确认重置":
        return jsonify({"error": "请输入 '确认重置' 以确认操作"}), 400

    with get_db() as conn:
        conn.execute("DROP TABLE IF EXISTS responses")
    init_db()
    return jsonify({"success": True, "message": "数据库已重新初始化，所有数据已清除"})


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000)
