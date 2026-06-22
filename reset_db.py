"""数据库重置脚本 — 仅管理员在服务器上直接运行

使用方法：
  1. 确保 python app.py 未运行（或正在运行也可以）
  2. python reset_db.py
  3. 输入 '确认重置' 完成
"""
import os
import sys
import sqlite3

DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DIR, "survey.db")

print("=" * 50)
print("  数据库重置工具")
print("=" * 50)
print(f"  目标: {DB_PATH}")
print()

confirm = input("输入 '确认重置' 继续: ").strip()
if confirm != "确认重置":
    print("操作已取消。")
    sys.exit(0)

try:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=DELETE")  # 关闭 WAL，释放 -wal/-shm
    conn.execute("DROP TABLE IF EXISTS responses")
    conn.commit()
    conn.close()
    print("  已清除 responses 表。")
except Exception as e:
    print(f"  操作失败: {e}")
    print("  请确保 python app.py 已停止后重试。")
    sys.exit(1)

# 清理可能残留的 WAL 文件
for suffix in ["-wal", "-shm"]:
    path = DB_PATH + suffix
    if os.path.exists(path):
        try:
            os.remove(path)
            print(f"  已清理: {os.path.basename(path)}")
        except OSError:
            pass

# 重建表结构
from app import init_db
init_db()

# 验证
conn = sqlite3.connect(DB_PATH)
count = conn.execute("SELECT COUNT(*) FROM responses").fetchone()[0]
conn.close()

print()
print(f"  数据库已重新初始化，当前记录数: {count}")
print("  执行 python app.py 启动服务。")
