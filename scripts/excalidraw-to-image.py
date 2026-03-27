"""
Excalidraw to PNG renderer.
Usage:
  python scripts/excalidraw-to-image.py <input.excalidraw> [output.png]
  python scripts/excalidraw-to-image.py --batch <directory>
  python scripts/excalidraw-to-image.py <input.excalidraw> --update-spec <spec.md>

Renders Excalidraw JSON to PNG using Pillow.
"""

import json
import sys
import os
import glob
import re
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow not installed. Run: pip install pillow")
    sys.exit(1)

# Font mapping (Windows)
FONT_MAP = {
    1: "segoeui.ttf",     # Virgil/hand-drawn -> Segoe UI
    2: "arial.ttf",        # Helvetica -> Arial
    3: "consola.ttf",      # Monospace -> Consolas
}

FONT_BOLD_MAP = {
    1: "segoeuib.ttf",
    2: "arialbd.ttf",
    3: "consolab.ttf",
}

def get_font(family=3, size=16, bold=False):
    """Get a PIL font, falling back gracefully."""
    fmap = FONT_BOLD_MAP if bold else FONT_MAP
    name = fmap.get(family, fmap[3])
    try:
        return ImageFont.truetype(name, size)
    except OSError:
        try:
            return ImageFont.truetype("arial.ttf", size)
        except OSError:
            return ImageFont.load_default()

def parse_color(color_str):
    """Parse hex color string to RGB tuple."""
    if not color_str or color_str == "transparent":
        return None
    color_str = color_str.strip()
    if color_str.startswith("#"):
        h = color_str.lstrip("#")
        if len(h) == 3:
            h = "".join([c*2 for c in h])
        if len(h) == 8:  # RGBA
            r, g, b, a = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16)
            return (r, g, b, a)
        if len(h) == 6:
            return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
    return None

def render_excalidraw(data, scale=1.0, padding=40):
    """Render Excalidraw JSON to a PIL Image."""
    elements = [e for e in data.get("elements", []) if not e.get("isDeleted", False)]

    if not elements:
        img = Image.new("RGB", (400, 400), "white")
        return img

    # Find bounding box
    min_x = min(e.get("x", 0) for e in elements)
    min_y = min(e.get("y", 0) for e in elements)
    max_x = max(e.get("x", 0) + e.get("width", 0) for e in elements)
    max_y = max(e.get("y", 0) + e.get("height", 0) for e in elements)

    w = int((max_x - min_x + padding * 2) * scale)
    h = int((max_y - min_y + padding * 2) * scale)

    bg_color = data.get("appState", {}).get("viewBackgroundColor", "#ffffff")
    bg = parse_color(bg_color) or (255, 255, 255)

    img = Image.new("RGBA", (w, h), bg + (255,) if len(bg) == 3 else bg)
    draw = ImageDraw.Draw(img)

    ox = -min_x + padding
    oy = -min_y + padding

    # Sort by type: rectangles first, then text on top
    rects = [e for e in elements if e.get("type") == "rectangle"]
    texts = [e for e in elements if e.get("type") == "text"]
    ellipses = [e for e in elements if e.get("type") == "ellipse"]
    lines = [e for e in elements if e.get("type") in ("line", "arrow")]

    # Draw rectangles
    for el in rects:
        x = int((el["x"] + ox) * scale)
        y = int((el["y"] + oy) * scale)
        ew = int(el.get("width", 0) * scale)
        eh = int(el.get("height", 0) * scale)
        opacity = el.get("opacity", 100) / 100.0

        bg_col = parse_color(el.get("backgroundColor", "transparent"))
        stroke_col = parse_color(el.get("strokeColor", "#000000"))
        sw = max(1, int(el.get("strokeWidth", 1) * scale))

        r_val = 0
        roundness = el.get("roundness")
        if roundness and isinstance(roundness, dict):
            r_val = int(roundness.get("value", 0) * scale)

        if bg_col and el.get("fillStyle") == "solid":
            if len(bg_col) == 3:
                bg_col = bg_col + (int(255 * opacity),)
            draw.rounded_rectangle([x, y, x + ew, y + eh], radius=r_val, fill=bg_col)

        if stroke_col and sw > 0 and el.get("strokeWidth", 1) > 0:
            if len(stroke_col) == 3:
                stroke_col = stroke_col + (int(255 * opacity),)
            draw.rounded_rectangle([x, y, x + ew, y + eh], radius=r_val, outline=stroke_col, width=sw)

    # Draw ellipses
    for el in ellipses:
        x = int((el["x"] + ox) * scale)
        y = int((el["y"] + oy) * scale)
        ew = int(el.get("width", 0) * scale)
        eh = int(el.get("height", 0) * scale)

        bg_col = parse_color(el.get("backgroundColor", "transparent"))
        stroke_col = parse_color(el.get("strokeColor", "#000000"))
        sw = max(1, int(el.get("strokeWidth", 1) * scale))

        fill = bg_col if bg_col and el.get("fillStyle") == "solid" else None
        outline = stroke_col if stroke_col else None
        draw.ellipse([x, y, x + ew, y + eh], fill=fill, outline=outline, width=sw)

    # Draw lines
    for el in lines:
        points = el.get("points", [])
        if len(points) < 2:
            continue
        stroke_col = parse_color(el.get("strokeColor", "#000000"))
        sw = max(1, int(el.get("strokeWidth", 1) * scale))
        base_x = int((el["x"] + ox) * scale)
        base_y = int((el["y"] + oy) * scale)

        pil_points = [(base_x + int(p[0] * scale), base_y + int(p[1] * scale)) for p in points]
        if stroke_col and len(pil_points) >= 2:
            draw.line(pil_points, fill=stroke_col, width=sw)

    # Draw text
    for el in texts:
        x = int((el["x"] + ox) * scale)
        y = int((el["y"] + oy) * scale)
        text_str = el.get("text", "")
        font_size = int(el.get("fontSize", 16) * scale)
        font_family = el.get("fontFamily", 3)
        color = parse_color(el.get("strokeColor", "#000000"))
        opacity = el.get("opacity", 100) / 100.0

        if not color:
            color = (0, 0, 0)
        if len(color) == 3:
            color = color + (int(255 * opacity),)

        font = get_font(font_family, font_size)

        for i, line in enumerate(text_str.split("\n")):
            line_y = y + int(i * font_size * 1.25)
            draw.text((x, line_y), line, fill=color, font=font)

    # Convert to RGB for PNG
    final = Image.new("RGB", img.size, (255, 255, 255))
    final.paste(img, mask=img.split()[3])
    return final

def update_spec(spec_path, old_ref, new_ref):
    """Update image reference in a markdown spec file."""
    with open(spec_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace(old_ref, new_ref)
    with open(spec_path, "w", encoding="utf-8") as f:
        f.write(content)

def convert_file(input_path, output_path=None, scale=1.0, padding=40, fmt="png"):
    """Convert a single Excalidraw file to image."""
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if output_path is None:
        output_path = str(Path(input_path).with_suffix(f".{fmt}"))

    img = render_excalidraw(data, scale=scale, padding=padding)
    img.save(output_path, fmt.upper())
    return output_path

def batch_convert(directory, scale=1.0, padding=40, fmt="png"):
    """Recursively convert all .excalidraw files in a directory."""
    pattern = os.path.join(directory, "**", "*.excalidraw")
    files = glob.glob(pattern, recursive=True)
    results = []
    for f in files:
        try:
            out = convert_file(f, scale=scale, padding=padding, fmt=fmt)
            print(f"  Exported: {out}")
            results.append(out)
        except Exception as e:
            print(f"  FAILED {f}: {e}")
    return results

if __name__ == "__main__":
    args = sys.argv[1:]

    if not args:
        print(__doc__)
        sys.exit(0)

    scale = 1.0
    padding = 40
    fmt = "png"
    update_spec_file = None
    batch_dir = None
    input_file = None
    output_file = None

    i = 0
    while i < len(args):
        if args[i] == "--scale" and i + 1 < len(args):
            scale = float(args[i + 1])
            i += 2
        elif args[i] == "--padding" and i + 1 < len(args):
            padding = int(args[i + 1])
            i += 2
        elif args[i] == "--format" and i + 1 < len(args):
            fmt = args[i + 1]
            i += 2
        elif args[i] == "--update-spec" and i + 1 < len(args):
            update_spec_file = args[i + 1]
            i += 2
        elif args[i] == "--batch" and i + 1 < len(args):
            batch_dir = args[i + 1]
            i += 2
        elif input_file is None:
            input_file = args[i]
            i += 1
        else:
            output_file = args[i]
            i += 1

    if batch_dir:
        print(f"Batch converting: {batch_dir}")
        results = batch_convert(batch_dir, scale=scale, padding=padding, fmt=fmt)
        print(f"\n{len(results)} files exported.")
    elif input_file:
        out = convert_file(input_file, output_file, scale=scale, padding=padding, fmt=fmt)
        print(f"Exported: {out}")

        if update_spec_file:
            excalidraw_name = Path(input_file).name
            png_name = Path(out).name
            update_spec(update_spec_file, excalidraw_name, png_name)
            print(f"Updated spec: {update_spec_file}")
    else:
        print("No input file or --batch directory specified.")
        sys.exit(1)
