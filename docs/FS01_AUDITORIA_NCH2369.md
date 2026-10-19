# FS-01 | Auditoría inicial NCh2369:2025, capítulo 7

Estado: **parcial; NO constituye aprobación normativa global**. Revisión 2026-10-19.

## Alcance real de la aplicación
El motor utiliza la ecuación (20), sin análisis del edificio, y la aproximación de aceleración del nivel k de §7.2.3 (ecuación 21). No representa los procedimientos (16) y (17) basados en análisis del edificio. La ruta alternativa del §7.2.4 (altura y características desconocidas) no se ofrece por separado. El peso sísmico de entrada corresponde al equipo, no a las reacciones de cada apoyo.

## Trazabilidad verificada
- §7.2.2, ecuación (20): coeficiente horizontal = (ak/g) Kp/Rp, limitado superiormente a 3 I (Ar/g) S.
- §7.2.3, ecuación (21): ak/g = I (Ar/g) S (1 + 2 Zk/H).
- §7.2.5: cota inferior horizontal 0,7 I (Ar/g) S.
- §7.3.2: amplificación para anclajes dúctiles que no cumplen §8.5 de 0,7 Rp.
- §7.3.3: amplificación para anclajes no dúctiles Rp.
- Tabla 8: Rp máximo según clasificación. Las opciones del HTML (1,5 y 3,0) no sustituyen la clasificación del equipo.
- §7.2: la componente vertical remite a §5.7, y la simultaneidad direccional a §4.5.2. **La ecuación vertical incorporada en el HTML requiere auditoría separada frente a §5.7; no aprobarla por inferencia desde §7.2.**

## Restricciones y pendientes críticos
1. Verificar tablas I, Ar, S y Kv y cómo se seleccionan según el proyecto.
2. Verificar §5.7 para componente vertical, incluidos efectos locales.
3. Confirmar la aplicabilidad de las expresiones (20) y (21) cuando se conoce el nivel de apoyo.
4. No permitir que `duct` se interprete como prueba automática de ductilidad. La selección necesita justificación externa §8.2.
5. El usuario debe comprobar la simultaneidad y combinaciones fuera de la aplicación; JSON contiene magnitudes independientes.
6. No declarar cumplimiento del capítulo 7 de forma integral mientras subsistan estos pendientes.

## Fuente de contraste
Reproducción consultada de NCh2369:2025, §§7.1–7.3, en:
https://studylib.net/doc/29014850/1010289005-nch-2369-2025-diseno-sismico-de-estructuras-e-...

Debe contrastarse finalmente con la copia normativa autorizada del proyecto.

## Criterio de cierre
Cerrar FS-01 exclusivamente al acreditar todas las expresiones y tablas, además de pruebas numéricas de casos independientes para fuerzas horizontal y vertical. Hasta entonces, v0.6.x es funcional **preliminar**, no aprobada para memoria de cálculo final.
