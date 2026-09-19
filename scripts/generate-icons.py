#!/usr/bin/env python3
"""
アプリアイコン（PNG / SVG）を生成する。

外部ライブラリを使わず Python 標準ライブラリだけで PNG を書き出すため、
どのPCでも `python3 scripts/generate-icons.py` だけで再生成できる。

生成物:
    public/icons/icon-192.png            Android / PWA
    public/icons/icon-512.png            Android / PWA
    public/icons/icon-maskable-512.png   Android のマスク表示用（余白を広く取る）
    public/icons/apple-touch-icon.png    iPad / iPhone のホーム画面（180x180）
    public/icons/icon.svg                ベクター版

デザイン: ブランド色のグラデーション角丸 + 白いマップピン。
"""

import math
import struct
import zlib
from pathlib import Path

# ブランド色（tailwind.config.js の ekicho.primary / ekicho.accent と揃える）
PRIMARY = (0xFF, 0x4E, 0x4E)
ACCENT = (0xFF, 0x9F, 0x1C)

SS = 4  # スーパーサンプリング倍率（角丸とピンの縁を滑らかにする）

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "icons"


def lerp(a: int, b: int, t: float) -> int:
    return int(round(a + (b - a) * t))


def gradient_at(x: float, y: float, size: float) -> tuple:
    """左上→右下の対角グラデーション。"""
    t = max(0.0, min(1.0, (x + y) / (2.0 * size)))
    return (lerp(PRIMARY[0], ACCENT[0], t),
            lerp(PRIMARY[1], ACCENT[1], t),
            lerp(PRIMARY[2], ACCENT[2], t))


def in_rounded_rect(x: float, y: float, size: float, radius: float) -> bool:
    if radius <= 0:
        return True
    # 角の外側に出ているかだけ判定すればよい
    cx = min(max(x, radius), size - radius)
    cy = min(max(y, radius), size - radius)
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2


def in_pin(x: float, y: float, size: float, pad: float) -> bool:
    """マップピン（頭の円 + 下に伸びる三角）の内側か。"""
    inner = size - pad * 2
    cx = size / 2.0
    head_r = inner * 0.26
    head_cy = pad + inner * 0.34
    if (x - cx) ** 2 + (y - head_cy) ** 2 <= head_r ** 2:
        return True
    tip_y = pad + inner * 0.94
    if y < head_cy or y > tip_y:
        return False
    # 円の中心から先端に向かって線形に細くなる三角
    t = (y - head_cy) / (tip_y - head_cy)
    half = head_r * 0.92 * (1.0 - t)
    return abs(x - cx) <= half


def in_pin_hole(x: float, y: float, size: float, pad: float) -> bool:
    inner = size - pad * 2
    cx = size / 2.0
    head_cy = pad + inner * 0.34
    hole_r = inner * 0.105
    return (x - cx) ** 2 + (y - head_cy) ** 2 <= hole_r ** 2


def render(size: int, maskable: bool = False) -> bytes:
    """RGBA のピクセル列を返す。"""
    radius = 0.0 if maskable else size * 0.22
    # maskable は端が切り取られるため、ピンを内側に寄せる
    pin_pad = size * (0.28 if maskable else 0.20)

    rows = []
    for py in range(size):
        row = bytearray()
        for px in range(size):
            acc_r = acc_g = acc_b = acc_a = 0
            for sy in range(SS):
                for sx in range(SS):
                    x = px + (sx + 0.5) / SS
                    y = py + (sy + 0.5) / SS
                    if not in_rounded_rect(x, y, size, radius):
                        continue  # 透明
                    if in_pin(x, y, size, pin_pad) and not in_pin_hole(x, y, size, pin_pad):
                        r, g, b = 0xFF, 0xFF, 0xFF
                    else:
                        r, g, b = gradient_at(x, y, size)
                    acc_r += r
                    acc_g += g
                    acc_b += b
                    acc_a += 255
            n = SS * SS
            a = acc_a // n
            if a == 0:
                row += bytes((0, 0, 0, 0))
            else:
                # 不透明部分の平均色（透明部分を混ぜて暗くならないようにする）
                covered = acc_a // 255
                row += bytes((acc_r // covered, acc_g // covered, acc_b // covered, a))
        rows.append(bytes(row))
    return rows


def write_png(path: Path, size: int, rows) -> None:
    raw = b"".join(b"\x00" + r for r in rows)  # 各行のフィルタタイプは 0(None)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))  # 8bit RGBA
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)
    print(f"  {path.relative_to(ROOT)}  ({size}x{size}, {len(png):,} bytes)")


SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="EKICHO">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF4E4E"/>
      <stop offset="100%" stop-color="#FF9F1C"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="113" ry="113" fill="url(#bg)"/>
  <path d="M256 102
           a80 80 0 0 1 80 80
           c0 54-80 148-80 148
           s-80-94-80-148
           a80 80 0 0 1 80-80 z"
        fill="#FFFFFF"/>
  <circle cx="256" cy="182" r="32" fill="url(#bg)"/>
</svg>
"""


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("アイコンを生成します:")

    for name, size, maskable in [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable-512.png", 512, True),
        ("apple-touch-icon.png", 180, False),
    ]:
        write_png(OUT_DIR / name, size, render(size, maskable))

    svg_path = OUT_DIR / "icon.svg"
    svg_path.write_text(SVG, encoding="utf-8")
    print(f"  {svg_path.relative_to(ROOT)}  (ベクター)")
    print("完了。")


if __name__ == "__main__":
    main()
