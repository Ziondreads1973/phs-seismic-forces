#!/usr/bin/env python3
"""Compila el HTML autónomo y verifica su reproducibilidad (sin dependencias)."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist" / "PHS Seismic Forces.html"
SOURCES = {
    "MOTOR": ROOT / "src" / "motor.js",
    "REPORT": ROOT / "src" / "report.js",
    "UI": ROOT / "src" / "ui.js",
}


def compile_html() -> str:
    result = (ROOT / "src" / "template.html").read_text(encoding="utf-8")
    for name, path in SOURCES.items():
        marker = f"/*__PHS_{name}__*/"
        if result.count(marker) != 1:
            raise ValueError(f"Marcador de compilación faltante o repetido: {marker}")
        source = path.read_text(encoding="utf-8")
        if "</script" in source.lower():
            raise ValueError(f"El script {path.name} contiene un cierre HTML no escapado")
        result = result.replace(marker, source)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Compilar/verificar PHS Seismic Forces")
    parser.add_argument("--check", action="store_true",
                        help="Comprobar que dist corresponde a src, sin escribir archivos")
    args = parser.parse_args()
    expected = compile_html()
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding="utf-8") != expected:
            print("ERROR: dist está ausente o desactualizado. Ejecuta: py tools/build.py", file=sys.stderr)
            return 1
        print(f"OK: {OUTPUT.relative_to(ROOT)} coincide con las fuentes.")
        return 0
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(expected, encoding="utf-8", newline="\n")
    print(f"HTML autónomo generado: {OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
