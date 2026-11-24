@echo off
setlocal
pushd "%~dp0" || exit /b 1
py tools\build.py
if errorlevel 1 (
  echo.
  echo ERROR: no se pudo generar el HTML. Compruebe Python y la configuracion regional.
  pause
  popd
  exit /b 1
)
start "" "%CD%\dist\PHS Seismic Forces.html"
popd
exit /b 0
