"""Build a small GIF from real local-browser captures of the empty and sample states."""
from pathlib import Path
from PIL import Image

docs = Path(__file__).resolve().parents[1] / "docs"
frames = []
for name in ("desktop.png", "editor-example.png"):
    with Image.open(docs / name) as source:
        frames.append(source.convert("RGB").resize((800, 500), Image.Resampling.LANCZOS).quantize(colors=96))
frames[0].save(docs / "demo.gif", save_all=True, append_images=frames[1:], duration=[1000, 2400], loop=0, optimize=True)
