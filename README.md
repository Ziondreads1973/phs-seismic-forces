# PHS | Fuerzas sísmicas de diseño

Aplicación **independiente** para calcular fuerzas sísmicas de equipos y sus anclajes. Versión **0.6.0 funcional preliminar** (basada en v0.5). No implementa diseño resistente de anclajes y **no modifica** `phs-anchor-design`.

## Iniciar

Abrir `index.html` en un navegador moderno. No requiere servidor, instalación ni internet. El archivo fuente recibido se conserva sin modificaciones en `reference/phs_fuerzas_sismicas_v0_5.html`.

## Procedimientos implementados

- NCh2369:2025, capítulo 7 (ruta simplificada implementada en la versión de origen).
- Anexo Técnico CNE, artículo 87, procedimiento estático asociado al artículo 38.
- Anexo Técnico CNE, artículo 88, procedimiento asociado al artículo 39.

Resultados: fuerzas sísmicas de estructura y fuerzas sísmicas para anclajes, por dirección X/Y/Z, con exportaciones PDF (impresión del navegador), TXT y JSON.

**Importante:** la aplicación señala que sus resultados son preliminares. Se deben auditar las disposiciones normativas antes de su uso como demanda de diseño definitiva.

## Documentación y validación

- `docs/GUIA_COMPLETA.md`: descripción técnica exhaustiva del **JSON existente v0.4**, inputs, coeficientes y ecuaciones de cálculo.
- `schema/phs-forces-v0.4.schema.json`: esquema del JSON que exporta el HTML.
- `examples/*.json`: casos ilustrativos coherentes con las ecuaciones del código original (no constituyen certificación normativa).
- `tests/validate_export.py`: comprobación local de coherencia de los archivos JSON, sin dependencias externas.

```powershell
python tests/validate_export.py examples/nch2369_ground.json examples/art87_ground.json examples/art88_ground.json
```

## Límites de responsabilidad

Este repositorio **solo calcula cargas**. Los campos `seismic_demands.anchors` expresan acciones sísmicas globales con la amplificación propia del método seleccionado; **no** son esfuerzos por perno, combinaciones LRFD ni reacciones por apoyo. No se calculan geometrías de fijación, resistencias del hormigón ni verificaciones de conexiones. Cualquier uso del JSON por software externo es opcional y no forma parte de este desarrollo.

## Política de desarrollo

- Aplicación autónoma HTML/CSS/JavaScript.
- Mantener la trazabilidad normativa, sin ocultar hipótesis ni redondear internamente.
- Pruebas y auditorías locales.
- **No crear ni ejecutar GitHub Actions ni flujos CI/CD** sin autorización expresa.

## Cambios v0.6.0 (FS-01)

- Se bloquea la ruta automática `justified` de NCh2369: el cumplimiento de §8.5 no puede verificarse mediante un selector.
- Se mantienen advertencias preliminares en los resultados.
- Se rechazan salidas no finitas antes de permitir exportaciones.
- Se conserva el contrato JSON v0.4.
- Pruebas locales del motor: 8 escenarios ejecutados, además de 3 ejemplos JSON validados.

**Estado:** primera versión funcional preliminar, no aprobada para diseño normativo hasta completar la auditoría de las tres rutas.
