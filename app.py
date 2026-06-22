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
        );
    """
    )
    conn.commit()
    conn.close()


app = Flask(__name__)


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/dashboard")
def dashboard():
    return app.send_static_file("dashboard.html")


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000)
