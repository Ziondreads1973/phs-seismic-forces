# Algoritmo de cálculo vigente — PHS Seismic Forces

**Fuente ejecutable:** `src/motor.js`. Entrada única de peso `W>0` [kgf]; salida de magnitudes `Ex`, `Ey`, `Ez` [kgf] para `structure` y `anchors`. Se calculan sin redondear resultados intermedios. No son combinaciones simultáneas ni fuerzas por perno.

## A. NCh2369:2025, capítulo 7 — procedimiento simplificado

**Datos de entrada:** categoría I–IV, zona 1–3, suelo A–E, clase de equipo, tipo de anclaje, ubicación y, si es elevada, `H` y `Zk`.

| Parámetro | Valores del motor |
| --- | --- |
| I por categoría I/II/III/IV | 0,8 / 1 / 1,2 / 1,2 |
| Ar/g por zona 1/2/3 | 0,28 / 0,42 / 0,56 |
| S para suelo A/B/C/D/E | 0,9 / 1 / 1,05 / 1 / 1 |
| kv para suelo A/B/C/D/E | 1,2 / 1,2 / 1,2 / 1,1 / 1 |
| Kp | 2,2 |
| Rp | 3 o 1,5 según clasificación de equipo y anclaje |

**Asignación de Rp:** equipo eléctrico/mecánico con anclaje dúctil → 3; equipo eléctrico/mecánico con anclaje no dúctil → 1,5; elemento secundario con componentes dúctiles → 3; elemento secundario no dúctil u otro no especificado → 1,5. La selección del usuario no acredita por sí sola ductilidad.

**Ubicación:** basal o sala modular con apoyo basal equivalente: `Zk=0`, `H` no solicitado; elevada: `H>0`, `0<=Zk<=H`.

**Desarrollo:**
1. `B = I · (Ar/g) · S`.
2. `ak/g = B` (basal), o `ak/g = B · (1 + 2 · Zk/H)` (elevada), ec. (21), §7.2.3.
3. `Cp = (ak/g) · Kp/Rp`, ec. (20), §7.2.2.
4. `Cmin = 0,7 B`; `Cmax = 3 B`; `Ch = min(Cmax, max(Cmin, Cp))`.
5. `Cv = kv B`, componente vertical según §5.7.1.
6. `Ex = Ey = Ch W`; `Ez = Cv W`.
7. Demanda de anclajes horizontales: `alpha=0,7 Rp` en ruta dúctil §7.3.2, o `alpha=Rp` en ruta no dúctil §7.3.3; `Ex,a = alpha Ex`, `Ey,a = alpha Ey`, `Ez,a = Ez`.

Fuera de alcance: análisis de la estructura principal (§7.2.2, ecuaciones basadas en análisis), alternativa independiente del §7.2.4, excepción §5.8, fuerzas locales y combinaciones.

## B. Anexo Técnico CNE, artículo 87 — banco de baterías estacionarias

Entradas: `W`, `fX`, `fY`, ubicación. `IE=1` fijo de Tabla 4 para equipo eléctrico general. `fX>=20 Hz`, `fY>=20 Hz`:
- `KhX=1,35` si `20<=fX<30`; `KhX=1` si `fX>=30`.
- `KhY=1,35` si `20<=fY<30`; `KhY=1` si `fY>=30`.
- `Kv=1` siempre; **no existe input ni verificación fZ** (criterio interpretativo del proyecto, ver `HIPOTESIS.md`).
- Ubicación basal o módulo basal equivalente: `Lh=Lv=1`; piso superior real hasta tres pisos cuando aplica Art. 83: `Lh=1,5`, `Lv=1,4`.

`Cx=0,60 IE KhX Lh`; `Cy=0,60 IE KhY Lh`; `Cv=0,36 IE Lv`.
`Ex=Cx W`, `Ey=Cy W`, `Ez=Cv W`; anclajes: `Ex,a=1,25 Ex`, `Ey,a=1,25 Ey`, `Ez,a=Ez`.

## C. Anexo Técnico CNE, artículo 88 — celda metálica autosoportada

Fijos: `IE=1`, `R=1` (equipo de Tabla 4), `A0/g=0,5`, `xi=2 %`.
`Fb=(3,21−0,68 ln(xi))/2,1156`; `Sa/g=2,12 · (A0/g) · Fb`.
Ubicación: factores `Lh,Lv` como Art. 87.

`Ch=1,20 IE (Sa/g) Lh/R`.
Modelo vertical (selección obligatoria, sin valor predeterminado):
- V1 rígido: `Cv=0,36 IE Lv`.
- V2 no rígido: `Cv=0,72 IE (Sa/g) Lv/R`.

`Ex=Ey=Ch W`; `Ez=Cv W`; anclajes: `Ex,a=1,5 Ex`, `Ey,a=1,5 Ey`, `Ez,a=Ez`.

## Reportes y validaciones

`src/report.js` consume el mismo objeto devuelto por el motor, más los **textos originales ingresados** para conservar sus decimales en PDF/TXT. Pantalla y PDF imprimen el mismo resumen. El TXT muestra entradas, parámetros, fórmula simbólica + resultado y tabla final; no recalcula ecuaciones. Intermedios calculados con máximo tres decimales solo en presentación; fuerzas con un decimal fijo en kgf.

Entrada no válida (peso no positivo, frecuencia horizontal Art. 87 menor de 20 Hz, clasificación/ubicación incompatible, V1/V2 sin elegir, `H<=0`, `Zk<0`, `Zk>H`) invalida resultados y deshabilita exportaciones. Las pruebas de regresión están en `tests/`.

**Fuentes de contraste:** NCh2369:2025 §§5.7, 7.2–7.3 y Tablas pertinentes; [Anexo Técnico CNE, arts. 19, 21, 38–39, 83, 87–88, 122.4.iii](https://www.cne.cl/wp-content/uploads/2025/01/AT-Requisitos-Sismo.pdf). La reproducción de una fórmula no equivale a certificar todos los requisitos de aplicabilidad.
