# PHS | Fuerzas sísmicas de diseño

Aplicación independiente para calcular **fuerzas sísmicas globales de equipos/estructuras y demandas para anclajes**, de acuerdo con los procedimientos simplificados definidos en el proyecto.

## Estado

**Versión candidata funcional (integración FS-01 a FS-05 en main).** El HTML implementa el alcance acordado; para liberar una versión 1.0.0 estable quedan por ejecutar las pruebas locales completas con Node y una inspección visual de los PDF A4 generados por navegador.

Los 48 criterios aprobados se encuentran en [docs/ESPECIFICACION_APROBADA_V1.md](docs/ESPECIFICACION_APROBADA_V1.md). Ese documento prevalece sobre la documentación histórica v0.5.

## Uso

Abrir **`index.html`** directamente en un navegador moderno. No requiere instalar paquetes, ejecutar servidores ni disponer de internet.

Permite calcular:
- **NCh2369:2025 capítulo 7:** método simplificado sin análisis de la estructura principal, clasificación automática de `Rp`, fuerzas horizontales y verticales y amplificación de anclajes. No incluye §5.8.
- **Anexo Técnico CNE artículo 87:** banco de baterías estacionarias sobre soporte, método Art. 38, IE=1 por defecto editable, frecuencias horizontales y factores propios de anclajes.
- **Anexo Técnico CNE artículo 88:** celdas metálicas autosoportadas, método Art. 39, IE=1 y R=1 para la celda, A0=0,50g, amortiguamiento 2 %, modelos verticales V1/V2 y ubicación.
- Instalación basal, sala modular con apoyo basal equivalente y ubicaciones adicionales expresamente consideradas por cada procedimiento.

Los resultados son magnitudes por dirección `Ex`, `Ey` y `Ez`, separadas para estructura/equipo y anclajes. **No son reacciones individuales por perno, combinaciones de carga ni verificaciones resistentes.**

## Reportes

**Formato numérico:** el separador decimal sigue la configuración regional del navegador, **sin separador de miles**. Las entradas conservan los decimales efectivamente ingresados (por ejemplo, 25 Hz no se presenta como 25,00 Hz); los factores normativos automáticos se muestran sin ceros decimales superfluos y las fuerzas finales con **un decimal fijo en kgf**. Los cálculos internos conservan precisión completa.

Se exportan **únicamente PDF global y TXT detallado**, sin selectores de nivel:
- **Pantalla y PDF global:** exactamente el mismo bloque, compuesto solo por datos de entrada, factores normativos esenciales y fuerzas Ex/Ey/Ez para equipo/estructura y anclajes. El PDF lo imprime en A4.
- **TXT detallado:** datos de entrada y parámetros normativos; ecuación simbólica inmediatamente seguida de su resultado, coeficientes intermedios relevantes y tabla final de fuerzas para los tres procedimientos. **No incluye sustituciones numéricas.** Los coeficientes calculados se presentan con precisión decimal adaptativa respecto del peso y la demanda (sin ceros innecesarios), sin redondeo interno del motor. UTF-8, archivo `*_detallado.txt`. No incorpora verificaciones resistentes ni combinaciones de carga.
- **Artículo 88:** Tabla 4 de IE/R visible como referencia, con la fila del equipo eléctrico destacada. No modifica el R del equipo calculado.

No hay salida JSON, Excel ni integración con PHS Anchor Design.

## Arquitectura

- `src/motor.js`: motor de cálculo puro con tres procedimientos.
- `src/ui.js`: interfaz, validaciones de presentación y reportes.
- `src/template.html`: diseño de pantalla y reporte.
- `scripts/build.cjs`: genera `index.html` autónomo, incrustando los dos módulos.
- `tests/motor.test.cjs`: pruebas de referencia, frecuencia límite y entradas inválidas.
- `tests/ui.test.cjs`: pruebas de comportamiento HTML y reportes simulados.
- `tests/smoke_dom.cjs`: verificación básica del HTML entregable.
- `reference/` y documentación `schema/`, `examples/`, `docs/GUIA_COMPLETA.md`: **histórico de v0.5**. No forman parte del producto actual ni habilitan salida JSON.

## Comandos locales (Node.js, sin dependencias externas)

```powershell
node scripts/build.cjs
node --test tests/*.test.cjs
node tests/smoke_dom.cjs
Start-Process (Resolve-Path ".\index.html")
```

Las pruebas numéricas automatizadas verifican los resultados de referencia acordados. La inspección de paginación y aspecto del PDF mediante el navegador es un control adicional **necesario para cerrar la versión estable**.

## Restricciones

- No crear, habilitar ni ejecutar GitHub Actions, pipelines CI/CD ni automatizaciones de pago.
- No modificar `phs-anchor-design`.
- Pruebas locales; no se bloquean cálculos por existencia de auditorías normativas pendientes.
- No utilizar resultados numéricamente inválidos ni extrapolar procedimientos fuera del alcance expresamente acordado.
