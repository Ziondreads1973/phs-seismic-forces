"""Pruebas del compilador y de la preferencia decimal del usuario de Windows."""
import importlib.util
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / "tools" / "build.py"
spec = importlib.util.spec_from_file_location("phs_build", MODULE)
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class FakeKey:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


class DecimalBuildTests(unittest.TestCase):
    def test_compile_for_both_decimal_preferences(self):
        for value in (".", ","):
            with self.subTest(value=value):
                html = build.compile_html(value)
                self.assertIn(f'PHSSeismicReport.setDecimalSeparator("{value}");', html)
                self.assertNotIn('id="decimalFormat"', html)
                self.assertNotIn("/*__PHS_DECIMAL__*/", html)
                self.assertEqual(html.count("<script>"), 4)

    def test_reads_windows_user_override_in_registry(self):
        for value in (".", ","):
            with self.subTest(value=value):
                winreg = SimpleNamespace(
                    HKEY_CURRENT_USER=object(),
                    OpenKey=lambda _hive, _key: FakeKey(),
                    QueryValueEx=lambda _key, _value: (value, 1),
                )
                with patch.object(build.sys, "platform", "win32"), patch.dict(sys.modules, {"winreg": winreg}):
                    self.assertEqual(build.system_decimal_separator(), value)

    def test_rejects_unknown_separator(self):
        winreg = SimpleNamespace(
            HKEY_CURRENT_USER=object(),
            OpenKey=lambda _hive, _key: FakeKey(),
            QueryValueEx=lambda _key, _value: (";", 1),
        )
        with patch.object(build.sys, "platform", "win32"), patch.dict(sys.modules, {"winreg": winreg}):
            with self.assertRaises(RuntimeError):
                build.system_decimal_separator()


if __name__ == "__main__":
    unittest.main()
