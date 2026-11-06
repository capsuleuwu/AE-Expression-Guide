"""把 src/ 內的檔案組合成單一 index.html：python3 build.py"""
from pathlib import Path
root = Path(__file__).parent
html = (root / "src/shell.html").read_text(encoding="utf-8")
for key, name in [("ENGINE", "engine.js"), ("EXAMPLES", "examples.js"), ("UI", "ui.js")]:
    html = html.replace(f"/*{key}*/", (root / "src" / name).read_text(encoding="utf-8"))
(root / "index.html").write_text(html, encoding="utf-8")
print("已輸出 index.html")
