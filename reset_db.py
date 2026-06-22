"""数据库重置脚本 — 仅管理员在服务器上直接运行

使用方法：
  1. 先停止 Flask：Ctrl+C 终止 python app.py
  2. 再运行本脚本：python reset_db.py
  3. 重新启动：python app.py
"""
import os
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "survey.db")

print("=" * 50)
print("  数据库重置工具")
print("=" * 50)
print(f"  目标: {DB_PATH}")
print()
print("  注意: 请先停止 python app.py 再运行此脚本。")
print()

confirm = input("输入 '确认重置' 继续: ").strip()
if confirm != "确认重置":
    print("操作已取消。")
    sys.exit(0)

removed = 0
failed = []

for suffix in ["", "-shm", "-wal"]:
    path = DB_PATH + suffix
    if os.path.exists(path):
        try:
            os.remove(path)
            print(f"  已删除: {os.path.basename(path)}")
            removed += 1
        except PermissionError:
            failed.append(path)

if failed:
    print()
    print("=" * 50)
    print("  删除失败 — 文件被占用")
    print("=" * 50)
    print("  以下文件无法删除，可能原因：")
    print("  1. python app.py 仍在运行，占用了数据库")
    print("  2. 其他程序打开了该文件")
    print()
    print("  解决方法：")
    print("  1. 在 app.py 的终端窗口按 Ctrl+C 停止 Flask")
    print("  2. 确认没有其他程序打开 survey.db")
    print("  3. 重新运行 python reset_db.py")
    sys.exit(1)

# Recreate via app import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import init_db
init_db()

print()
print("  数据库已重新初始化，所有问卷数据已清除。")
print("  执行 python app.py 启动服务。")
