# Estado y validación — PHS Seismic Forces

**Estado tras auditoría técnica de 2026-11-23:** motor numérico contrastado favorablemente dentro de su alcance, con **aprobación normativa integral retenida** por reservas de aplicabilidad e interpretación enumeradas abajo. No declarar liberación definitiva 1.0.0.

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

1. **Pruebas locales realizadas el 23-11-2026:** el usuario ejecutó `py tools/build.py`, `py tools/build.py --check`, `node --test tests/*.test.cjs` y `node tests/smoke_dom.cjs`: **38/38 pruebas aprobadas** (antes de ampliar las pruebas con esta auditoría); build coherente y smoke satisfactorio.
2. Pendiente **inspección visual PDF A4** y revisión de presentación en navegador; abrir el HTML no acredita paginación.
3. Pendiente **contraste final NCh2369 con copia autorizada** y resolución de los hallazgos de interpretación y aplicabilidad siguientes.
4. La equivalencia de salidas y aprobación de tests **no constituyen certificación normativa integral**.

No añadir comprobaciones ajenas al alcance sin acuerdo técnico. No se usan Actions, CI/CD remoto ni integración con PHS Anchor Design.

## Auditoría técnica final realizada el 23-11-2026

**Dictamen:** fórmulas del motor correctas para las hipótesis implementadas; **no se autoriza afirmar conformidad normativa global ni uso indiscriminado**. No se alteraron ecuaciones. Se revisaron `src/motor.js`, `src/report.js`, pruebas y documentación, con contraste de NCh2369:2025 (reproducción de texto no oficial) y [CNE Anexo Técnico enero 2025](https://www.cne.cl/wp-content/uploads/2025/01/AT-Requisitos-Sismo.pdf) (texto oficial).

| ID | Comprobación | Evidencia | Dictamen |
| --- | --- | --- | --- |
| AU-01 | NCh2369: I, Ar/g, S, Kv | §4.3.2; Tablas 3 y 6; §5.7.1 | Coinciden |
| AU-02 | NCh2369: Rp, Kp, ak, Cp, piso/máximo | Tabla 8; §§7.2.2–7.2.5 | Coinciden dentro del método (20) |
| AU-03 | NCh2369: horizontales de anclajes | §§7.3.2–7.3.3 | Factores 0,7Rp y Rp reproducidos |
| AU-04 | CNE 87: 0,6/0,36, IE, Kh, Kv, anclajes | Arts. 21 (Tabla 4), 38 y 87 (p. 127) | Coinciden con interpretación FS-08 |
| AU-05 | CNE 88: IE/R, A0, ξ, Fb, Sa, V1/V2, anclajes | Arts. 17, 19, 21, 39 y 88 (pp. 28–33, 51, 128) | Coinciden |
| AU-06 | CNE: piso superior hasta 3 pisos | Art. 83 (p. 123) | Kh=1,5, Kv=1,4 correctos |
| AU-07 | Unidades, límites y reportes | src/motor.js; src/report.js; pruebas de interfaz | Coherentes, sin redondeo en el cálculo |

### Reservas pendientes de cierre

- **AU-R1 — Prioridad alta, selección del procedimiento NCh2369:** §5.8 impone expresamente **Kp=1,0** y **Fv=0,7 Fh** para equipos rígidos apoyados en suelo (T<0,06 s), mientras que la ruta implementada utiliza **Kp=2,2** y **Cv de §5.7.1**. §5.8 fue deliberadamente excluido, pero la interfaz permite ubicación basal sin distinguir equipo rígido en suelo. No presentar los resultados de esta ruta como aplicables a dichos equipos sin evaluar primero §5.8; la elección del método queda bajo responsabilidad del diseñador. **No es un error aritmético de la ruta §7.2: es riesgo de aplicar un método inaplicable.**
- **AU-R2 — Prioridad alta, componente vertical de anclajes NCh2369:** §§7.3.2–7.3.3 hablan de amplificar las «fuerzas sísmicas establecidas en 7.2», mientras que §7.2 incluye la componente vertical de §5.7 por remisión. El motor amplifica únicamente Ex/Ey y deja `Ez,a=Ez`, criterio aprobado anteriormente. La literalidad deja abierta si el factor también corresponde a Ez; **no se pudo acreditar su exclusión como exigencia explícita de la norma**. Resolver con copia autorizada/criterio normativo antes de declarar validadas las demandas verticales de anclajes NCh2369.
- **AU-R3 — Prioridad media, interpretación FS-08 CNE:** artículo 87 exige frecuencia equivalente >=20 Hz «en cualquier dirección» y remite a masa/rigidez lateral del Art. 122.4.iii. Se adopta X/Y solamente, sin fZ, como **interpretación técnica del proyecto**, no equivalencia textual acreditada. No afirmar cumplimiento normativo integral basado solo en fX/fY.
- **AU-R4 — Prioridad media, frecuencias de batería:** artículo 87 exige **masa de las celdas distribuida en sus bases de apoyo** al determinar la frecuencia equivalente, matiz específico frente a la descripción general de masa concentrada en el tope de Art. 122.4.iii. La app recibe fX/fY, **no los calcula ni verifica su modelo de masa**. Referencia Art. 87, p. 127.
- **AU-R5 — Prioridad media, suelo CNE:** el espectro fijo del Art. 19 es válido para **suelos A–D**; Art. 20 exige espectro de sitio en condiciones fuera de esa clasificación. La app no consulta tipo de suelo; corresponde comprobarlo externamente antes de aplicar las fuerzas Art. 88.
- **AU-R6 — Prioridad media, límite de alcance:** NCh2369 §7.1 distingue elementos/equipos secundarios de un equipo cuya estructura sismorresistente es parte integral de él (debe tratarse según cláusula 5). La ruta de capítulo 7 no diseña una sala estructural completa. La clasificación y aplicabilidad las resuelve el ingeniero, no la app.
- **AU-R7 — Evidencia:** para cerrar formalmente trazabilidad NCh2369 se requiere contraste final con copia oficial autorizada; la reproducción consultada no constituye fuente normativa certificada. Inspección visual de PDF continúa pendiente.

**Decisión de alcance:** esta auditoría no extiende el motor a §5.8, no impone fZ, no cambia la amplificación vertical de anclajes sin criterio validado y no introduce campos o bloqueos nuevos. Se documentan riesgos y se preserva el algoritmo actual hasta resolver los puntos normativos.
