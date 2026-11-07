"""Builds a single self-contained HTML file (images inlined) for easy sharing."""
import base64
import pathlib

root = pathlib.Path("/usr/local/google/home/duynguyenn/.gemini/jetski/scratch/protehome-lab")
html = (root / "index.html").read_text(encoding="utf-8")
for name in ("hero.webp", "writing.webp"):
    data = base64.b64encode((root / "assets" / name).read_bytes()).decode()
    html = html.replace(f"assets/{name}", f"data:image/webp;base64,{data}")
out = root / "dist" / "Nguyen-Atom-Protehome-Lab-v1.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(out, out.stat().st_size)
