"""Generate installable raster PWA icons from the project's geometric logo."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "icons"
for size in (192, 512):
    scale = size / 512
    image = Image.new("RGBA", (size, size), "#d8fb75")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(108 * scale), fill="#d8fb75")
    draw.polygon([(int(128 * scale), int(334 * scale)), (int(256 * scale), int(112 * scale)), (int(384 * scale), int(334 * scale))], fill="#11151b")
    draw.polygon([(int(213 * scale), int(296 * scale)), (int(256 * scale), int(221 * scale)), (int(299 * scale), int(296 * scale))], fill="#d8fb75")
    image.save(ROOT / f"icon-{size}.png", optimize=True)
