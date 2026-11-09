import potrace
import numpy as np
from PIL import Image

# 1. Load the transparent dark logo
im = Image.open(r'apps\web\public\logo-dark.png')
r, g, b, a = im.split()

# 4x upscale for ultra-smooth bezier curves
SCALE = 4
a_up = a.resize((a.width * SCALE, a.height * SCALE), Image.Resampling.LANCZOS)
arr_a = np.array(a_up) > 128
w, h = a_up.size

# 2. Trace with potrace
bmp = potrace.Bitmap(arr_a)
path = bmp.trace(alphamax=1.0, opttolerance=0.2)

# Filter out the outer bounding canvas rectangle (4 segments along the outer border)
letter_curves = []
for c in path:
    if len(c.segments) == 4 and (c.start_point.x == 0 or c.start_point.y == 0 or c.start_point.x == w or c.start_point.y == h):
        continue
    letter_curves.append(c)

print(f"Total letter curves: {len(letter_curves)}")

# 3. Find bounding box of all letter curves to tighten viewBox
min_x, max_x = float('inf'), float('-inf')
min_y, max_y = float('inf'), float('-inf')

for curve in letter_curves:
    min_x = min(min_x, curve.start_point.x)
    max_x = max(max_x, curve.start_point.x)
    min_y = min(min_y, curve.start_point.y)
    max_y = max(max_y, curve.start_point.y)
    for seg in curve.segments:
        min_x = min(min_x, seg.end_point.x)
        max_x = max(max_x, seg.end_point.x)
        min_y = min(min_y, seg.end_point.y)
        max_y = max(max_y, seg.end_point.y)
        if seg.is_corner:
            min_x = min(min_x, seg.c.x)
            max_x = max(max_x, seg.c.x)
            min_y = min(min_y, seg.c.y)
            max_y = max(max_y, seg.c.y)
        else:
            min_x = min(min_x, seg.c1.x, seg.c2.x)
            max_x = max(max_x, seg.c1.x, seg.c2.x)
            min_y = min(min_y, seg.c1.y, seg.c2.y)
            max_y = max(max_y, seg.c1.y, seg.c2.y)

padding = 20
shift_x = min_x - padding
shift_y = min_y - padding
vb_w = round(max_x - min_x + padding * 2)
vb_h = round(max_y - min_y + padding * 2)

print(f"Tight viewBox: 0 0 {vb_w} {vb_h}")

# 4. Generate SVG path string with normalized coordinates
parts = []
for curve in letter_curves:
    start_x = curve.start_point.x - shift_x
    start_y = curve.start_point.y - shift_y
    part = [f"M {start_x:.2f} {start_y:.2f}"]
    for seg in curve.segments:
        if seg.is_corner:
            cx = seg.c.x - shift_x
            cy = seg.c.y - shift_y
            ex = seg.end_point.x - shift_x
            ey = seg.end_point.y - shift_y
            part.append(f"L {cx:.2f} {cy:.2f} L {ex:.2f} {ey:.2f}")
        else:
            c1x = seg.c1.x - shift_x
            c1y = seg.c1.y - shift_y
            c2x = seg.c2.x - shift_x
            c2y = seg.c2.y - shift_y
            ex = seg.end_point.x - shift_x
            ey = seg.end_point.y - shift_y
            part.append(f"C {c1x:.2f} {c1y:.2f} {c2x:.2f} {c2y:.2f} {ex:.2f} {ey:.2f}")
    part.append("Z")
    parts.append(" ".join(part))

d_attr = " ".join(parts)

# 5. Write public/logo.svg
svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w} {vb_h}" fill="currentColor" aria-label="Alam's Frame">
  <path fill-rule="evenodd" d="{d_attr}" />
</svg>
'''

with open(r'apps\web\public\logo.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print(r"Saved apps\web\public\logo.svg")

# 6. Write React component
react_component = f'''import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {{
  className?: string;
}}

export function AlamsFrameLogo({{ className = 'h-8 w-auto', ...props }}: LogoProps) {{
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 {vb_w} {vb_h}"
      fill="currentColor"
      aria-label="Alam's Frame"
      className={{className}}
      {{...props}}
    >
      <path fillRule="evenodd" d="{d_attr}" />
    </svg>
  );
}}
'''

with open(r'apps\web\components\brand\AlamsFrameLogo.tsx', 'w', encoding='utf-8') as f:
    f.write(react_component)

print(r"Saved apps\web\components\brand\AlamsFrameLogo.tsx")
