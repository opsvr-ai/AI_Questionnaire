"""数据库重置脚本 — 仅管理员在服务器上直接运行"""
import os
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "survey.db")

print("=" * 50)
print("  数据库重置工具")
print("=" * 50)
print(f"  目标: {DB_PATH}")
print()

confirm = input("输入 '确认重置' 继续: ").strip()
if confirm != "确认重置":
    print("操作已取消。")
    sys.exit(0)

# Remove database files
for suffix in ["", "-shm", "-wal"]:
    path = DB_PATH + suffix
    if os.path.exists(path):
        os.remove(path)
        print(f"  已删除: {path}")

# Recreate via app import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import init_db
init_db()

print()
print("  数据库已重新初始化，所有问卷数据已清除。")
print("  可以重新启动 python app.py 开始新一轮调研。")
