# PHS Seismic Forces

Calculadora autónoma de fuerzas sísmicas globales para equipos/elementos y demandas de anclajes. Tres rutas: **NCh2369:2025 capítulo 7**, **Anexo Técnico CNE artículo 87** y **artículo 88**.

## Ejecución
Abrir **`dist/PHS Seismic Forces.html`** en un navegador moderno; funciona offline y no requiere instalar dependencias.

## Compilación y validación
Requiere Python 3 para generar el entregable y Node.js únicamente para ejecutar la suite automatizada:

```powershell
py tools/build.py
py tools/build.py --check
node --test tests/*.test.cjs
node tests/smoke_dom.cjs
Start-Process ".\\dist\\PHS Seismic Forces.html"
```

**Fuente de verdad:** `src/motor.js` (cálculo), `src/report.js` (presentación y reportes), `src/ui.js` (interfaz), `src/template.html` (estructura visual). El compilador **reemplaza tres marcadores una sola vez** y genera el archivo listo para entregar. `--check` detecta modificaciones manuales o un `dist` desactualizado.

## Alcance
- NCh2369:2025: método simplificado del capítulo 7, sin análisis de edificio; coeficientes y fuerzas X/Y/Z para equipo y anclajes. Para apoyo basal `Zk=0`; al seleccionar «Estructura elevada» aparecen `H` y `Zk` (se admite `0<=Zk<=H`, `H>0`).
- Art. 87: banco de baterías sobre soporte; `IE=1` por Tabla 4. `fX` y `fY` fijan `KhX` y `KhY`; `Kv=1`. La decisión de **no solicitar frecuencia vertical** es una interpretación de ingeniería documentada en [HIPOTESIS.md](docs/HIPOTESIS.md).
- Art. 88: celda metálica autosoportada; `IE=R=1`, `A0=0.5g`, `xi=2 %`; obliga a seleccionar modelo vertical V1/V2.
- Reportes: resumen de pantalla = PDF global A4, TXT detallado con ecuación simbólica seguida del resultado, sin sustituciones. Un decimal fijo en kgf y hasta tres decimales en coeficientes calculados; motor sin redondeos intermedios.

**No** calcula reacciones individuales de pernos, análisis sísmico estructural global, combinaciones de carga ni resistencia de anclajes. Los resultados son magnitudes direccionales, no estados simultáneos.

## Documentación vigente
- [ALGORITMO.md](docs/ALGORITMO.md): expresiones, coeficientes y clasificación.
- [HIPOTESIS.md](docs/HIPOTESIS.md): condiciones de aplicación y decisiones interpretativas.
- [ESTADO.md](docs/ESTADO.md): alcance implementado, pruebas y limitaciones pendientes.

La documentación y ejemplos de versiones JSON 0.4/0.5 fueron retirados de la rama activa. Permanecen recuperables en el historial Git. No se utilizan GitHub Actions ni servicios externos.
