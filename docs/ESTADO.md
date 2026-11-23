# Estado y validación — PHS Seismic Forces

**Estado:** candidata funcional; no se declara validación normativa integral ni liberación definitiva 1.0.0.

## Alcance implementado

- Tres motores independientes en `src/motor.js`: NCh2369:2025 capítulo 7, CNE Art. 87 y Art. 88.
- Pantalla e impresión PDF global A4; descarga TXT detallada. Resultados de motor compartidos sin recálculo en reportes.
- Art. 87: `IE=1` fijo de Tabla 4, `fX/fY` únicamente, `Kv=1` (interpretación FS-08); Art. 88: V1/V2 obligatorio; NCh2369: `Zk=0` válido con `H>0`.
- Interfaz explica cuándo se presentan las alturas `H` y `Zk`.
- Compilación reproducible sin dependencias mediante `tools/build.py`, entregable exclusivo `dist/PHS Seismic Forces.html`, modo `--check`.
- Código histórico de JSON y documentos de desarrollo de v0.4/v0.5 retirados de `main` (recuperables en Git).

## Validaciones

- Pruebas automatizadas de motor: ejemplos de referencia, límites, factores y entradas inválidas (`tests/motor.test.cjs`).
- Pruebas automatizadas de interfaz y reportes: invalidez y limpieza de resultados, precisión local, PDF/TXT, visibilidad H/Zk, ausencia de fZ (`tests/ui.test.cjs`).
- Prueba de integración del HTML compilado (`tests/smoke_dom.cjs`).
- Verificación reproducible: `py tools/build.py --check` compara el entregable con las fuentes.

## Pendientes para declarar versión estable

1. Ejecutar la suite completa de Node en estación local y verificar `py tools/build.py --check`.
2. Inspección manual de impresión PDF A4 y presentación en navegador.
3. Auditoría normativa con copia autorizada: tablas/coeficientes NCh2369, componente vertical §5.7, clasificación y aplicabilidad de las rutas, y alcance interpretativo del Art. 87.
4. La equivalencia de salidas frente a versiones anteriores es un control de regresión, **no** certificación de cumplimiento normativo.

No añadir comprobaciones ajenas al alcance sin acuerdo técnico. No se usan Actions, CI/CD remoto ni integración con PHS Anchor Design.
