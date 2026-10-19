# Guía de generación, trazabilidad y exportación JSON – PHS Fuerzas Sísmicas v0.5

## 1. Fuente, alcance y condición de esta documentación

Se revisó el código JavaScript incluido en `reference/phs_fuerzas_sismicas_v0_5.html`. Esta guía describe el **comportamiento implementado**, no una certificación de exactitud normativa de NCh2369:2025 ni de los artículos 87–88 del Anexo Técnico CNE. El HTML dice 'versión preliminar 0.5' y el objeto exportado declara `schemaVersion: '0.4'` y `preliminary: true`. Por lo tanto, distinguir **versión de la aplicación** de **versión del contrato**. No debe llamarse 'contrato 0.5' al esquema actual.

La app no lee ni genera geometría, coordenadas de pernos, uniones, dimensiones de losa, calidad de hormigón, adhesivos, diámetros, empotramientos, momentos de vuelco ni combinaciones gravitacionales. No genera reacciones por apoyo o perno.

## 2. Flujo de generación exacto

1. El usuario escoge `norm` (`2369`, `87` o `88`) e ingresa parámetros.
2. Eventos `input` de todos los controles llaman `calculate()` (directamente o mediante `show()`).
3. Si falta un dato o una condición del procedimiento falla, `fail()` borra `last`. Los botones de exportación no generan archivo mientras `last` sea `null`.
4. En `calculate()` se calcula peso `w`, coeficientes `chX`, `chY`, `cv`, multiplicador `anchMult`, fuerzas estructurales `hx`, `hy`, `v` y fuerzas de anclajes `ax`, `ay`, `av`.
5. Se construye `last = { schemaVersion, preliminary, standard, article, units, inputs, coefficients, seismic_demands, notes, limitations }`.
6. Botón `Exportar JSON`: `JSON.stringify(last,null,2)` y `download(...,'PHS_fuerzas_sismicas.json','application/json')`.
7. Los números JSON provienen de los cálculos sin redondeo de visualización; la función `fmt` solamente se emplea en la UI, reportes y algunas cadenas de `notes`.

Fuente código: funciones `calculate()` y `download()` y manejador `saveJson`.

## 3. Estructura exacta y semántica de cada campo

| Ruta JSON | Tipo | Obligatorio en la salida v0.5 | Significado / observaciones |
| --- | --- | --- | --- |
| `schemaVersion` | string | sí | Siempre `"0.4"`, distinto de v0.5 de la app |
| `preliminary` | boolean | sí | Siempre `true` |
| `standard` | string | sí | `NCh2369:2025` o `CNE Anexo Técnico Requisitos Sísmicos enero 2025` |
| `article` | string | sí | `7.2-7.3`, `87` o `88` |
| `units.force` | string | sí | Siempre `kgf` |
| `inputs.weight_kgf` | number | sí | Peso sísmico total del equipo |
| `inputs.*` | varios | según norma | Trazabilidad de entradas (ver §4–6) |
| `coefficients.structure.X` | number | sí | Coeficiente para demanda horizontal estructural X |
| `coefficients.structure.Y` | number | sí | Coeficiente para demanda horizontal estructural Y |
| `coefficients.structure.vertical` | number | sí | Coeficiente para demanda sísmica vertical |
| `coefficients.anchor_multiplier.horizontal` | number | sí | Factor adicional aplicado sobre estructura para anclajes horizontales |
| `coefficients.anchor_multiplier.vertical` | number | sí | Siempre `1` en esta versión |
| `seismic_demands.structure.Ex` | number | sí | Magnitud de fuerza sísmica estructural horizontal X, kgf |
| `seismic_demands.structure.Ey` | number | sí | Magnitud de fuerza sísmica estructural horizontal Y, kgf |
| `seismic_demands.structure.Ez_magnitude` | number | sí | Magnitud de fuerza sísmica vertical, kgf, **no lleva signo** |
| `seismic_demands.anchors.Ex` | number | sí | Magnitud de fuerza sísmica horizontal X ya preparada para la ruta anclajes |
| `seismic_demands.anchors.Ey` | number | sí | Magnitud de fuerza sísmica horizontal Y ya preparada para la ruta anclajes |
| `seismic_demands.anchors.Ez_magnitude` | number | sí | Magnitud vertical para anclajes; en el código coincide con la estructural |
| `notes` | string[] | sí | Textos explicativos; NO son datos numéricos autoritativos ni deben parsearse |
| `limitations` | string[] | sí | Advertencias del autor del HTML; no equivalen a validación técnica |

**Regla fundamental:** las fuerzas `Ex/Ey/Ez_magnitude` son magnitudes positivas independientes. No representan combinaciones simultáneas, signos, fuerzas por perno, un conjunto de seis componentes, ni un esfuerzo de reacción en una placa base.

## 4. NCh2369:2025 – datos de entrada y cálculo tal como está implementado

Parámetros: `inputs.category` (`I`, `II`, `III`, `IV`), `seismic_zone` (`1`,`2`,`3`), `soil` (`A`–`E`), `Rp` (interfaz: `1.5` o `3`), `height_m` (`H>0`), `level_m` (`0≤Zk≤H`), `anchor_route` (`duct`, `brittle`, `justified`).

Tablas **codificadas en el HTML**: `I={I:0.8, II:1, III:1.2, IV:1.2}`; `Ar={1:0.28, 2:0.42, 3:0.56}`; `S={A:0.9,B:1,C:1.05,D:1,E:1}`; `Kv={A:1.2,B:1.2,C:1.2,D:1.1,E:1}`. Son datos del programa original, que requieren auditoría normativa independiente.

Cálculo realizado:

```
ak/g = I * (Ar/g) * S * (1 + 2*Zk/H)
Cp = (ak/g) * 2.2 / Rp
Cx = Cy = min(3*I*(Ar/g)*S, max(0.7*I*(Ar/g)*S, Cp))
Cv = Kv_suelo * I * (Ar/g) * S
Fstruct_X = Cx * W; Fstruct_Y = Cy * W; Fstruct_Z = Cv * W
alpha_anchor = (anchor_route == 'brittle') ? Rp : (anchor_route == 'duct') ? 0.7*Rp : 1
Fanchor_X = alpha_anchor * Fstruct_X
Fanchor_Y = alpha_anchor * Fstruct_Y
Fanchor_Z = Fstruct_Z
```

**Precaución:** ruta `justified` establece multiplicador `1.0` a partir de la selección de UI, pero el JSON **no incluye prueba** de que se haya satisfecho §8.5. Nunca darla por acreditada automáticamente. El código indica que la ruta NCh2369 queda pendiente de auditoría integral.

## 5. NTSyCS / Anexo Técnico – Artículo 87 (comportamiento implementado)

Campos adicionales: `inputs.IE`, `frequency_Hz.X`, `frequency_Hz.Y`, `vertical_frequency_check` (literal `fuera_de_alcance`), `location`, `location_factors.Kh`, `.Kv`, `floor_verified`, `anchor_type`. El programa calcula `ra` según el tipo de anclaje, pero **no lo exporta para Art.87**; solo lo agrega en notas informativas.

El usuario debe ingresar `fX>0` y `fY>0`; si alguna es menor que 20 Hz, la aplicación bloquea el cálculo. **No solicita ni verifica fZ**, pese a mostrar advertencia normativa de verificación por separado. Selección horizontal en código: `KhX = 1.35` si `20≤fX<30`; en caso contrario `1.00`. Idéntico en Y.

```
Cx = 0.60 * IE * KhX * Kh_location
Cy = 0.60 * IE * KhY * Kh_location
Cv = 0.36 * IE * Kv_location
alpha_anchor = 1.25
Fanchor_X/Y = 1.25 * Fstruct_X/Y
Fanchor_Z = Fstruct_Z
```

El factor `R` del selector `anchor_type` **no interviene** en el cálculo del Art.87. Si la ubicación es `floor`, se requieren confirmación explícita `floor_verified=true` y factores `Kh=1.5`, `Kv=1.4`. Si ubicación es `ground`, factores 1.0. Para `special` se bloquea.

## 6. NTSyCS / Anexo Técnico – Artículo 88 (comportamiento implementado)

Campos específicos: `IE`, `R_structure`, `R_anchor_reference`, `Sa_over_g`, `A0_g`, `damping_pct`, `spectrum_mode`, `location`, `location_factors`, `floor_verified`, `vertical_model`, `anchor_type`.

Validaciones actuales: `R_structure>0`, `A0_g>0`, `0<damping_pct≤20`; en modo manual `Sa_over_g>0`.

```
Fb = (3.21 - 0.68*ln(damping_pct)) / 2.1156
Sa_over_g_auto = 2.12 * A0_g * Fb
Sa_over_g_used = (spectrum_mode == 'auto') ? Sa_over_g_auto : manualSa
Cx = Cy = 1.20 * IE * Sa_over_g_used / R_structure * Kh_location
Cv (vertical_model='rigid') = 0.36 * IE * Kv_location
Cv (vertical_model='flex') = 0.72 * IE * Sa_over_g_used / R_structure * Kv_location
alpha_anchor = 1.50
Fanchor_X/Y = 1.50 * Fstruct_X/Y
Fanchor_Z = Fstruct_Z
```

El `R_anchor_reference` se exporta para trazabilidad, pero **no altera** los cálculos efectuados. Modo `manual` no exporta procedencia, identificación o versión del espectro; eso debe complementarse en un contrato futuro.

## 7. Factor por ubicación (solo Art.87/88)

- `ground`: `Kh=1`, `Kv=1`.
- `floor`: `Kh=1.5`, `Kv=1.4`, exige que usuario confirme `floor_verified`.
- `special`: no se permite exportar un cálculo nuevo; condiciones especiales quedan fuera.

NCh2369 utiliza `H` y `Zk`, y **no utiliza** este selector de ubicación.

## 8. La propiedad más importante: no amplificar de nuevo

PHS Anchor importará **solo** `seismic_demands.anchors`, nunca `seismic_demands.structure` para diseñar anclajes, salvo un modo explícito distinto que no se propone aquí. Los multiplicadores exportados en `coefficients.anchor_multiplier` sirven para **auditar la procedencia**, no para aplicarlos otra vez. Por ejemplo, si Ex estructura = 1000 kgf y multiplicador = 1.25, Ex anclajes = 1250 kgf: la entrada para PHS Anchor es **1250 kgf**, no 1562.5 kgf.

La regla anterior NO implica que PHS Anchor pueda hacer diseño directamente con esa fuerza. Debe conocer la ubicación de la resultante, geometría, centros de masa/rigidez, momentos, excentricidad, número de apoyos y/o las acciones locales calculadas externamente.

## 9. Cargas vs combinaciones vs reacciones locales

**Etapa A (PHS Fuerzas Sísmicas):** entrega magnitudes globales Ex, Ey y |Ez|. **Etapa B (modelo mecánico externo o módulo futuro):** genera combinaciones de cargas, signos, momentos de vuelco y distribuciones; obtiene para cada apoyo `(N, Vx, Vy, Mx, My, Mz)` con sistema de ejes y unidades acordados. **Etapa C (PHS Anchor):** verifica la resistencia de los anclajes frente a las solicitaciones **locales** ya combinadas y amplificadas.

Si PHS Anchor recibe solo el JSON v0.4, puede importar datos como **antecedentes sísmicos**, pero no debe declarar completado el diseño de anclajes. La aplicación de origen no entrega `D`, momentos ni reacciones de pernos.

Evitar mezclar dos estrategias: (i) importar fuerzas globales y generar combinaciones/distribución en una etapa intermedia, o (ii) importar **acciones locales LRFD ya combinadas** y diseñar directamente. Para un diseño de anclajes sin duplicar lógica, la estrategia (ii) es preferible, dejando este JSON como antecedente y evidencia de procedencia.

## 10. Conversiones y conservación de datos

- En JSON un número se codifica con punto decimal: `1234.56`; **no utilizar** `"1.234,56"`, `"1234,56"` ni cadenas con unidades.
- Mantener valores `number` y precisión binaria original; NO serializar valores redondeados de los reportes.
- Unidad del exportador: `kgf`. Si el importador requiere kN, convertir mediante `1 kgf = 0.00980665 kN` (factor físico convencional). La conversión debe quedar trazada.
- Las magnitudes de fuerza vertical **no tienen signo**. No interpretar `Ez_magnitude` como vertical ascendente por defecto.
- `notes` y `limitations` son textos libres que pueden variar; no depender de su orden ni extraer coeficientes de ellos.

## 11. Verificaciones al recibir archivos

1. Parsear JSON estricto; rechazar archivos corruptos, `NaN`, `Infinity`, tipos incorrectos o tamaños excesivos.
2. Verificar `schemaVersion=='0.4'`, `preliminary` y `units.force=='kgf'`.
3. Aplicar el esquema y verificar correspondencia de norma con artículo.
4. Validar `weight_kgf>0`; coeficientes y demandas numéricas, finitas y no negativas.
5. Comprobar con tolerancia numérica que `structure.Ex = weight * coefficients.structure.X`, idem Y y Z; y `anchors.Ex = structure.Ex*horizontal`, idem Y; `anchors.Ez_magnitude=structure.Ez_magnitude*vertical`.
6. Reconstruir, cuando se requiera auditoría de origen, los cálculos **según versión**; no confiar solo en `notes`.
7. Registrar nombre, versión de contrato, hash SHA-256 del archivo importado, fecha de importación y aprobación técnica externa.
8. Bloquear diseño automático si `preliminary:true` hasta tener aprobación humana explícita de acciones y clasificación; tal aprobación **no** certifica los algoritmos fuente.
9. Rechazar futuro cambio de `schemaVersion` desconocido, en lugar de interpretar silenciosamente campos nuevos.
10. No interpolar ni asumir simultaneidad Ex/Ey/Ez; requerir un conjunto de acciones de diseño local o el procedimiento documentado para producirlo.

## 12. Riesgos y observaciones de auditoría técnica

- El HTML incluye tres procedimientos normativos pero no contiene sus fuentes oficiales ni una matriz de auditoría caso por caso; los factores **deben contrastarse contra norma** antes de uso para diseño.
- Para Art.87 no se verifica rigidez vertical `fZ`; por decisión de alcance se advierte expresamente.
- Para Art.88 `Sa_over_g` automático se obtiene de una ecuación programada; validar hipótesis de espectro y campo de validez; en manual falta procedencia documental.
- `preliminary:true` siempre, incluso cuando la UI pinta un estado visual verde: ese color no representa una certificación.
- No existe `analysis_id`, `calculated_at`, `generator_version`, identificación de caso, revisiones ni huella de la fuente en el archivo exportado.
- `article:'7.2-7.3'` no identifica la selección exacta de ruta de anclaje, que sí viene en `inputs.anchor_route`.
- El HTML acepta modificar entradas y recalcula, pero no hay una firma de integridad criptográfica sobre el JSON.
- No existe orientación de ejes ni punto de aplicación de fuerzas. No es seguro traducirlas automáticamente en `Tu`, `Vu,x`, `Vu,y` o momentos locales.

## 13. Plan de implementación recomendado

**Fase 1 – Documentar y congelar el exportador 0.4:** esta carpeta, esquema, ejemplos y validación local. **Fase 2 – Importador seguro:** leer 0.4 como `antecedente sísmico`, mostrar Ex/Ey/|Ez| de anclajes y estado preliminar, sin diseñar todavía. **Fase 3 – Transformación de acciones:** incorporar los casos locales combinados ya proporcionados por el usuario o provenientes de un modelo mecánico auditado, sin duplicar amplificaciones. **Fase 4 – Contrato futuro:** agregar metadatos, ejes, origen, aprobación y referencia al conjunto de cargas para PHS Anchor. **Fase 5 – Pruebas cruzadas:** fixtures para cada norma, campos ausentes, signos, unidades, doble amplificación, cambios de versión y casos no aptos.

## 14. Criterios de aceptación para integrar con PHS Anchor

- [ ] El archivo v0.4 se identifica y puede cargarse como **antecedente**, sin alterar demandas.
- [ ] `preliminary:true` se refleja visiblemente y no habilita diseño automático sin revisión.
- [ ] No existe multiplicación por `anchor_multiplier` en el importador.
- [ ] Ex/Ey/|Ez| son magnitudes, no combinaciones LRFD ni acciones por placa.
- [ ] Se especifican y respetan unidades, ejes, signos, revisiones y procedencia.
- [ ] Un modelo o archivo separado entrega acciones locales completas `(Nu, Vu,x, Vu,y, Mu,x, Mu,y, Mu,z)` cuando corresponda.
- [ ] Se valida peso, coeficientes y coherencia entre fuerzas de estructura y anclajes.
- [ ] Existen pruebas negativas para schemaVersion desconocida y archivos adulterados.
- [ ] Se cierran observaciones de auditoría normativa antes de usar como fuente aprobada de diseño.
