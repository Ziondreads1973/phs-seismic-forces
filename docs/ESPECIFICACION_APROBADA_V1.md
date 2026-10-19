# ESPECIFICACIÓN FUNCIONAL APROBADA — PHS FUERZAS SÍSMICAS

**Fecha de cierre de criterios:** 2026-10-19  
**Alcance:** aplicación HTML autónoma y offline de cálculo de fuerzas sísmicas para **estructura/equipo** y **anclajes**, sin diseño resistente ni combinaciones.  
**Estado:** criterios aprobados; NO confundir con funciones implementadas en `main` v0.6.0.

## Política de implementación

- Cambios exclusivamente sobre `main` cuando se implementen; no habilitar GitHub Actions, workflows CI/CD ni servicios externos.
- Hipótesis adicionales, cambios de método y criterios normativos no aprobados requieren consultar al usuario ANTES de modificar el código.
- Auditoría normativa separada de operación del programa. No generar advertencias de «auditoría pendiente» en pantalla o reportes ni bloquear por ese único motivo.
- Los datos inválidos, resultados no finitos y condiciones expresamente fuera del alcance SÍ bloquean cálculo/exportación.
- Mantener exactitud completa durante el motor y aplicar redondeo únicamente al visualizar y exportar reportes (fuerza: 1 decimal, sin separadores de miles).
- Reutilizar la misma estructura de resultados para pantalla, PDF y TXT, evitando recalcular en los exportadores.

## FS-01 — NCh2369:2025, capítulo 7 (C01–C15)

1. Solo procedimiento simplificado sin análisis de la estructura principal; no se solicita aceleración obtenida de análisis dinámico.
2. Equipos a nivel basal: `Zk=0` automático. Equipos elevados: ingresar `H` y `Zk`, `H>0`, `0<Zk<=H`. Zócalo propio no equivale a piso superior.
3. Clasificar el equipo, asignar automáticamente `Rp` según norma; no ingreso numérico libre.
4. Asignación de `Rp` desde categorías normativas sin casilla adicional de confirmación de ductilidad.
5. Clasificación del equipo y del sistema de anclajes como conceptos independientes, combinados cuando corresponda.
6. Componente vertical según §5.7.1, sin amplificación horizontal `Rp` o `0.7Rp`; resultado de magnitud positiva.
7. Fuerza horizontal calculada con `ak/g = I(Ar/g)S(1+2Zk/H)` si elevada o `I(Ar/g)S` si basal; `Fp = (ak/g)(Kp/Rp)Pp`; aplicar `max(0.7 I(Ar/g)SPp, min(Fp, 3 I(Ar/g)SPp))` antes de amplificación de anclajes.
8. Clasificación conjunta cuando condiciones de tabla la requieran.
9. `I`, `Ar/g`, `S` y `Kp` automáticos desde norma; no ingreso manual.
10. `Pp>0` manual en kgf, único peso sísmico total; desglose no obligatorio.
11. Entregar `Ex`, `Ey`, `Ez` para estructura y anclajes; magnitudes positivas, no combinaciones LRFD/ASD; 1 decimal de salida.
12. PDF y TXT con datos suficientes para reproducir las ecuaciones principales; se sustituyó posteriormente exportación JSON por PDF/TXT exclusivamente.
13. Bloquear entradas inválidas, clasificaciones no admitidas o resultados no finitos. Invalidar resultado anterior. No bloquear por auditoría normativa pendiente.
14. La auditoría normativa no controla la habilitación de cálculos ni genera advertencias de revisión pendiente; sí atender errores matemáticos demostrados.
15. Pruebas independientes de referencia, casos límite y coherencia de resultados/exportaciones.
16. **FS-05-C06/C07/C08 prevalecen:** `Rp=3` para equipo eléctrico o mecánico con sistema de anclaje dúctil; `Rp=1.5` sin este; elementos secundarios según clasificación aprobada, otros especificados como «no especificados» 1.5. Dúctil §7.3.2: amplificación horizontal `0.7Rp`; no dúctil §7.3.3: `Rp`; vertical nunca recibe estas amplificaciones. Para basal no solicitar `H`; vertical `kv={A:1.2,B:1.2,C:1.2,D:1.1,E:1.0}`.
17. **FS-05-C01:** NO implementar excepción del §5.8. El ámbito del método simplificado no se expande a ella.

## FS-02 — Anexo Técnico CNE Art. 87 (C01–C10)

1. Solo bancos de baterías estacionarias sobre estructuras de soporte; método estático Art. 38.
2. Ingresar `fX,fY` (Hz); bloquear si cualquiera <20 Hz. `Kh=1.35` si `20<=f<30`; `Kh=1` si `f>=30`. No solicitar fZ; `Kv=1`.
3. `W>0` manual; `IE=1` por defecto, editable `>0`; `Ex=0.60 IE W KhX Kh_ubicación`, `Ey=0.60 IE W KhY Kh_ubicación`, `Ez=0.36 IE W Kv_ubicación`.
4. No utilizar `R` ni `Sa` en el procedimiento Art. 38; retirar selector de R para Art. 87.
5. Anclajes: `Ex,a=1.25 Ex`, `Ey,a=1.25 Ey`, `Ez,a=Ez`.
6. Ubicación basal, incluso sala modular basal equivalente: `Kh_ubicación=Kv_ubicación=1`; piso superior real hasta 3 pisos cuando aplica Art. 83: `Kh_ubicación=1.5`, `Kv_ubicación=1.4`; otros casos fuera del cálculo automático. Zócalo propio no es piso superior.
7. Aplicar ubicación antes de multiplicador de anclajes, sin doble amplificación.
8. Reportes contienen peso, `IE`, frecuencias, coeficientes, ubicación y resultados. Se eliminó el requerimiento JSON.
9. Bloquear inputs inválidos; `f=20` adopta 1.35, `f=30` adopta 1.0; invalidar resultados anteriores.
10. Pruebas: W=1000, IE=1, basal fX=fY=35 => anclajes 750/750/360 kgf; 25/35 => 1012.5/750/360; piso 25/25 => 1518.75/1518.75/504.

## FS-03 — Anexo Técnico CNE Arts. 88 y Art. 39 (C01–C10)

1. Celdas metálicas autosoportadas del Art. 88, basal, salas modulares basales equivalentes o pisos superiores hasta tres pisos (si aplica Art. 83); zócalo propio no implica piso superior.
2. `A0=0.5g` fijo para equipos/anclajes (FS-05-C03 prevalece), `xi=2%` fijo, `Sa_max` automático, no f fundamental ni Sa manual. `Fb=(3.21-0.68 ln(2))/2.1156`, `Sa_max/g=2.12*0.5*Fb≈1.3721778749538622`. Es resultado de la fórmula actualmente aprobada, no sustituto de auditoría de Art. 19.
3. Tabla 4 como referencia; **FS-05-C02 prevalece:** celda eléctrica autosoportada `IE=1`, `R=1` sin uso de R de soportes/anclajes como reducción del equipo.
4. Separar factor R del elemento de la clasificación del sistema de anclajes (informativa), sin aplicar R dos veces.
5. Horizontal: `Ex=Ey=1.2 IE (Sa_max/g)/R * W * Kh_ubicación`.
6. Vertical: elegir modelo V1 rígido `Ez=0.36 IE W Kv_ubicación` o V2 no rígido `Ez=0.72 IE (Sa_max/g)/R W Kv_ubicación`; magnitud positiva.
7. Anclajes: `Ex,a=1.5 Ex`, `Ey,a=1.5 Ey`, `Ez,a=Ez`. Ubicación: basal Kh=Kv=1; piso superior Art.83 Kh=1.5, Kv=1.4.
8. Bloquear peso y clasificación inválidos, ubicación fuera de alcance y resultados no finitos; invalidar resultados anteriores; no bloquear por auditoría pendiente.
9. Pruebas de unidades con `W=1000, IE=R=1, Sa/g=1.5` por inyección controlada de datos: estructura 1800/1800/360 (V1) o 1800/1800/1080 (V2); anclajes 2700/2700/360 o 2700/2700/1080. Pruebas de integración usan `Sa` calculada automáticamente.
10. PDF y TXT global/detallado; sin JSON ni Excel.
11. **FS-05-C04:** artículo 89 BESS sobre piso sin diafragma rígido EXCLUIDO. No introducir sus factores propios en artículo 88.

## FS-04 — Reportes (C01–C04)

- PDF y TXT cada uno con selector independiente de `global` o `detallado`.
- **Global:** identificación del método, inputs principales y tabla Ex/Ey/Ez estructura vs anclajes.
- **Detallado:** antecedentes, clasificación, factores, ecuaciones principales con sustitución, cálculo y tabla final. No detallar cada operación intermedia.
- PDF A4 vía impresión del navegador; TXT descarga UTF-8. Sin dependencias/red. La función de impresión no puede forzar nombre final de archivo.
- Fuerzas como magnitudes, sin signos/combinaciones gravitacionales, sin estado «cumple/no cumple» (no se calcula capacidad resistente).
- PDF/TXT y pantalla desde un único modelo de resultados; 1 decimal en kgf, sin separador de miles, cálculo interno sin redondear.
- No exportar JSON, Excel ni habilitar integración con `phs-anchor-design`.

## FS-05 — Cierre de hipótesis (C01–C09)

- C01: excluir NCh2369 §5.8.
- C02: aplicar Tabla 4 por elemento; en Art. 88 celda IE=1 y R=1, sin modificar mediante R de soportes/anclajes.
- C03: A0=0.50g fijo para Art. 88 (equipo/anclajes), no solicitar zona.
- C04: excluir Art. 89 de primera versión.
- C05: distinguir basal / sala modular basal / piso superior, sin clasificar automáticamente bastidor o zócalo como piso superior.
- C06: asignación automática Rp/α según clasificación NCh2369 acordada.
- C07: basal Zk=0 sin altura H; elevado H/Zk obligatorios.
- C08: vertical estática equivalente NCh2369 §5.7.1.
- C09: pruebas independientes (referencia, bordes, invalidaciones y salida), de los tres motores y reportes.

## Plan de implementación / aceptación

1. Separar motor puro de presentación, por ruta; una fuente de datos para pantalla y reportes.
2. Implementar controles y validaciones acordados, retirar exportación JSON.
3. Implementar reportes global/detallado de PDF/TXT con selección independiente.
4. Ejecutar suites locales automatizadas para ecuaciones, bordes y exportaciones; verificar PDF A4 manualmente mediante navegador.
5. Solo etiquetar versión estable cuando los cálculos y pruebas funcionales estén efectivamente ejecutados. La auditoría normativa queda como documentación técnica independiente, no control de uso.

## Documentación histórica

`docs/GUIA_COMPLETA.md`, `schema/`, `examples/` y `tests/validate_export.py` describen **la exportación JSON de la versión 0.5**. Se conservan como material histórico de referencia, pero **no especifican la versión objetivo**. No activarlos ni mostrarlos en UI.

**Precedencia documental:** prevalecen las decisiones más recientes del usuario sobre cualquier criterio anterior contradictorio. Este documento resume decisiones del diálogo; no reemplaza la comprobación de aplicabilidad normativa del ingeniero.

## FS-06 — Presentación de factores y reportes (aprobado posteriormente)

**Esta decisión reemplaza cualquier opción de formato global/detallado de FS-03/FS-04 y las opciones inicialmente descritas en este documento.**

- Para el artículo 88, mostrar la **Tabla 4 completa de `IE` y `R`** en el panel de antecedentes, no detrás de un desplegable, con la fila aplicable al equipo eléctrico destacada. Tabla de **referencia**, no selector que afecte el cálculo.
- Visualizar los **resultados globales directamente en pantalla**, como un único bloque con antecedentes y factores esenciales y tabla Ex/Ey/Ez para equipo y anclajes. Debe ser **exactamente el mismo contenido que se imprime en PDF**.
- **PDF: solo global**, generado de ese bloque mediante impresión A4; eliminar su selector de detalle y la vista previa duplicada.
- **TXT: solo detallado**, con antecedentes, coeficientes, ecuaciones principales y fuerzas finales; eliminar su selector de detalle.
- Mantener formato decimal de la configuración regional, sin agrupación de miles, para tablas y reportes. No cambiar precisión interna del motor.
- No expandir la aplicación a diseño resistente ni alterar los tres motores de cálculo por este cambio de interfaz.

### FS-06-C02 — Simplificación posterior aprobada

**Este criterio es posterior y prevalece sobre la descripción anterior de FS-06 (incluida la exigencia de ecuaciones o intermediarios en TXT), sobre FS-04 y sobre las partes contradictorias de este documento.**

- Pantalla, PDF global y TXT entregarán **únicamente datos de entrada, factores automáticos esenciales y fuerzas finales para equipo y anclajes**. Se eliminan de los reportes todas las ecuaciones y operaciones intermedias; el TXT continúa en formato textual estructurado.
- Entradas numéricas: mantener la precisión escrita por el usuario sin agregar ceros (e.g. 25 Hz, 29,99 Hz, 2,50 m si se ingresó con dos decimales). El separador decimal se localiza según navegador/sistema.
- Factores tabulados o normativos esenciales: precisión pertinente al valor, sin ceros innecesarios. La Tabla 4 visible es informativa y también evita ceros añadidos.
- Fuerzas finales: **un decimal fijo en kgf**, independientemente de la precisión del dato de entrada. Sin agrupación de miles en ningún valor presentado.
- Los algoritmos del motor y su precisión interna no se alteran. Los reportes no incluyen validaciones resistentes ni combinaciones LRFD/ASD.
- Salida TXT con sufijo `_resultados.txt` (reemplaza sufijo histórico `_detallado.txt`).

### FS-06-C03 — Rectificación explícita del TXT (aprobado por usuario)

**Esta decisión posterior PREVALECE sobre FS-06-C02 únicamente en lo referido al TXT.** La simplificación de FS-06-C02 para la **pantalla y el PDF global** se conserva.

- PDF: entradas y resultados resumidos, factores esenciales; sin ecuaciones ni intermedios. Se imprime el mismo bloque visible en pantalla.
- **TXT: reporte auditable detallado**, recuperando datos ingresados, todos los factores de cálculo pertinentes, expresiones normativas del motor, sustitución numérica, límites/coeficientes cuando aplican y fuerzas independientes de estructura/equipo y anclajes, para NCh2369:2025 capítulo 7, artículo 87 y artículo 88 (V1/V2).
- NCh2369: cálculo de `ak/g`, `Cp`, límites mínimo/máximo, coeficiente horizontal adoptado, coeficiente vertical, fuerzas y amplificación de anclajes.
- Art. 87: `Kh,X`, `Kh,Y` en función de las frecuencias, coeficientes de ubicación y fuerzas horizontal/vertical y de anclajes.
- Art. 88: `Fb`, `Sa,máx/g`, ubicación, fuerzas horizontal/vertical V1 o V2 y amplificación de anclajes.
- Valores calculados se muestran con hasta 12 decimales y las fuerzas finales a 1 decimal, con separador decimal regional y sin separador de miles. Las expresiones se evalúan en el **motor sin redondear intermedios**. En el TXT, los coeficientes impresos son una representación redondeada; el valor final corresponde siempre al resultado del motor, no a recalcular desde la cadena.
- No crear un motor paralelo de reportes ni modificar métodos normativos; los factores y fuerzas provienen del objeto de resultados del motor. El TXT usa `*_detallado.txt`.
- No se incluyen verificaciones resistentes de anclajes, combinaciones LRFD/ASD ni el ámbito excluido de §5.8 o artículo 89.

### FS-06-C04 — Maqueta TXT aprobada: ecuación y resultado, sin sustitución

**Esta especificación es posterior y sustituye las partes contradictorias de FS-06-C02 y FS-06-C03 relativas al TXT.** El PDF y la pantalla global no cambian.

- El TXT mostrará los **inputs reales**, la clasificación y los factores normativos adoptados, con los decimales ingresados por el usuario.
- Cada fórmula principal o intermedia se presenta **seguida inmediatamente por la línea de su resultado**, con el mismo identificador (`ak/g = I · (Ar/g) · S`, salto de línea, `ak/g = 0,5292`). **No hay líneas de sustitución numérica** ni recálculo con valores previamente redondeados.
- NCh2369: mostrar `ak/g`, `Cp`, `Cmin`, `Cmax`, `Ch`, condición controlante, `Cv`, fuerzas de equipo y amplificación de anclajes; usar rama basal o elevada según inputs y ruta dúctil/no dúctil elegida.
- Art. 87: mostrar factores direccionales por frecuencia, coeficientes horizontales y vertical, fuerzas de estructura, demanda de anclajes.
- Art. 88: mostrar `Fb`, `Sa,máx/g`, `Ch`, `Cv` (V1 o V2), fuerzas de estructura y anclajes.
- Dígitos significativos: coeficientes tabulados sin ceros añadidos; coeficientes calculados con al menos cuatro cifras significativas y precisión decimal adaptada para que la cota aproximada de error de representación sobre el peso/amplificación del caso sea como máximo 0,01 kgf (hasta 15 decimales). Esto es una **política de presentación**, no una tolerancia de cálculo. Las fuerzas finales mantienen un decimal fijo en kgf.
- Separador decimal según configuración regional del navegador, sin agrupación de miles.
- Estructura del TXT: `1. ANTECEDENTES`, `2. CÁLCULO DE FUERZAS SÍSMICAS`, `3. FUERZAS PARA ANCLAJES`, `4. RESUMEN DE RESULTADOS`.
- Conservar el motor independiente sin ninguna modificación y mantener el PDF global existente.

### FS-06-C05 — Redondeo simplificado del TXT (último criterio aprobado)

**Prevalece sobre la precisión adaptativa de FS-06-C04**, únicamente en la presentación de los coeficientes calculados del TXT.

- Coeficientes/resultados intermedios calculados: **máximo 3 decimales**; redondeo decimal convencional del formateador regional (`Intl.NumberFormat`) y sin ceros decimales innecesarios. Ejemplo del caso basal NCh2369: `ak/g=0,529`, `Cp=0,388`, `Cmin=0,37`, `Cmax=1,588`, `Ch=0,388` en región de coma decimal.
- El límite de 3 decimales no se aplica a los **inputs introducidos por el usuario** (se conservan tal como se ingresaron) ni a los **factores normativos tabulados** (se muestran con su precisión normativa, sin ceros añadidos).
- Las **fuerzas finales** se muestran a 1 decimal fijo en kgf.
- Este es un límite de presentación, **no de precisión de cálculo**. El motor conserva todos sus valores internos y los reportes no recalculan fuerzas con coeficientes redondeados. Se acepta que al multiplicar manualmente un coeficiente visible por W se obtenga una fuerza ligeramente distinta de la fuerza final presentada.
- Separador decimal según configuración regional del navegador, sin separador de miles.
- Se mantiene el esquema fórmula simbólica seguida inmediatamente por su resultado; sin sustituciones numéricas. El PDF y el resumen en pantalla no cambian.
