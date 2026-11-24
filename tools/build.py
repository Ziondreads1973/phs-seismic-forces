#!/usr/bin/env python3
"""Compila el HTML autónomo y verifica su reproducibilidad (sin dependencias)."""
from __future__ import annotations

import argparse
import json
import locale
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist" / "PHS Seismic Forces.html"
SOURCES = {
    "MOTOR": ROOT / "src" / "motor.js",
    "ASSISTANT": ROOT / "src" / "anchor_assistant.js",
    "REPORT": ROOT / "src" / "report.js",
    "UI": ROOT / "src" / "ui.js",
}


def system_decimal_separator() -> str:
    """Read the signed-in Windows user's actual decimal preference, not browser locale."""
    if sys.platform == "win32":
        try:
            import winreg

            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Control Panel\\International") as key:
                decimal, _ = winreg.QueryValueEx(key, "sDecimal")
        except OSError as exc:
            raise RuntimeError(
                "No se pudo leer el separador decimal de Windows (HKCU\\Control Panel\\International\\sDecimal)"
            ) from exc
    else:
        locale.setlocale(locale.LC_NUMERIC, "")
        decimal = locale.localeconv().get("decimal_point", ".")
    if decimal not in (".", ","):
        raise RuntimeError(f"Separador decimal no compatible: {decimal!r}. Se requiere punto o coma.")
    return decimal


def compile_html(decimal_separator: str | None = None) -> str:
    if decimal_separator is None:
        decimal_separator = system_decimal_separator()
    if decimal_separator not in (".", ","):
        raise ValueError("Separador decimal no válido")
    result = (ROOT / "src" / "template.html").read_text(encoding="utf-8")
    for name, path in SOURCES.items():
        marker = f"/*__PHS_{name}__*/"
        if result.count(marker) != 1:
            raise ValueError(f"Marcador de compilación faltante o repetido: {marker}")
        source = path.read_text(encoding="utf-8")
        if "</script" in source.lower():
            raise ValueError(f"El script {path.name} contiene un cierre HTML no escapado")
        result = result.replace(marker, source)
    decimal_marker = "/*__PHS_DECIMAL__*/"
    if result.count(decimal_marker) != 1:
        raise ValueError("Marcador de separador decimal faltante o repetido")
    result = result.replace(decimal_marker, json.dumps(decimal_separator))
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Compilar/verificar PHS Seismic Forces")
    parser.add_argument("--check", action="store_true",
                        help="Comprobar que dist corresponde a src, sin escribir archivos")
    args = parser.parse_args()
    try:
        decimal = system_decimal_separator()
        expected = compile_html(decimal)
    except (RuntimeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding="utf-8") != expected:
            print("ERROR: dist está ausente o desactualizado. Ejecuta: py tools/build.py", file=sys.stderr)
            return 1
        print(f"OK: {OUTPUT.relative_to(ROOT)} coincide con las fuentes.")
        return 0
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(expected, encoding="utf-8", newline="\n")
    print(f"HTML autónomo generado: {OUTPUT.relative_to(ROOT)} | decimal del sistema: {decimal!r}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
